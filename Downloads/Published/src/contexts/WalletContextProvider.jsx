import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
    TrustWalletAdapter,
    Coin98WalletAdapter,
    MathWalletAdapter,
    TokenPocketWalletAdapter,
    CloverWalletAdapter,
    LedgerWalletAdapter
} from '@solana/wallet-adapter-wallets';

import { clusterApiUrl } from '@solana/web3.js';

// Default styles not needed as we use custom UI

export const WalletContextProvider = ({ children }) => {
    // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
    const network = WalletAdapterNetwork.Mainnet;

    // You can also provide a custom RPC endpoint.
    // Custom Syndica RPC endpoint provided via environment variables
    const endpoint = import.meta.env.VITE_RPC_URL || clusterApiUrl('mainnet-beta');

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
            new TrustWalletAdapter(),
            new Coin98WalletAdapter(),
            new MathWalletAdapter(),
            new TokenPocketWalletAdapter(),
            new CloverWalletAdapter(),
            new LedgerWalletAdapter(),
        ],
        [network]
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                {children}
            </WalletProvider>
        </ConnectionProvider>
    );
};
