import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Wallet, User, X } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';

export default function ConnectWalletModal({ onOpenWalletSelector }) {
    const { select, connect, wallet, connected, wallets } = useWallet();
    const [shouldConnect, setShouldConnect] = useState(false);
    const [error, setError] = useState(null);
    const [isPending, setIsPending] = useState(false);

    // Reset isPending if it takes too long (stuck)
    useEffect(() => {
        let timer;
        if (isPending) {
            timer = setTimeout(() => {
                if (!connected) {
                    setIsPending(false);
                    setError("Connection timed out. Please refresh or try again.");
                }
            }, 10000); // 10 second timeout
        }
        return () => clearTimeout(timer);
    }, [isPending, connected]);

    const isMobileDevice = () => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(navigator.userAgent);
    };

    const handlePhantomClick = async () => {
        setError(null);
        setIsPending(true);

        // Detect injected provider
        const solana = window?.solana;
        const isPhantomInstalled = solana?.isPhantom;

        console.log("Mobile detection:", isMobileDevice());
        console.log("Provider detected:", !!solana, "IsPhantom:", !!isPhantomInstalled);

        // If not in Phantom browser and on mobile, deep link
        if (isMobileDevice() && !isPhantomInstalled) {
            const dappUrl = window.location.href;
            const encodedUrl = encodeURIComponent(dappUrl);
            const deepLink = `https://phantom.app/ul/browse/${encodedUrl}?ref=${encodedUrl}`;
            console.log("Redirecting to deep link...");
            window.location.href = deepLink;
            return;
        }

        try {
            // Priority 1: Direct injected connection (Best for mobile)
            if (isPhantomInstalled && solana.connect) {
                console.log("Injected Phantom detected. Connecting directly...");
                await solana.connect();
                await select('Phantom');
                // Context should now see it as connected
            } else {
                // Priority 2: Standard Adapter Flow
                console.log("Using standard adapter flow...");
                await select('Phantom');
                setShouldConnect(true);
            }
        } catch (err) {
            console.error("Connection failed:", err);
            if (err.name !== 'WalletConnectionError' || !err.message.includes('User rejected')) {
                setError(err.message || "Connection failed. Please use HTTPS.");
            }
            setIsPending(false);
        }
    };

    useEffect(() => {
        if (shouldConnect && wallet && !connected) {
            connect().then(() => {
                setShouldConnect(false);
                setIsPending(false);
            }).catch(err => {
                console.error("Effect connect failed:", err);
                setShouldConnect(false);
                setIsPending(false);
            });
        } else if (connected) {
            setShouldConnect(false);
            setIsPending(false);
        }
    }, [shouldConnect, wallet, connected, connect]);

    return (
        <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-[380px] overflow-hidden rounded-xl border border-white bg-[#0c0c0e] shadow-2xl p-[1px]"
            style={{ fontFamily: '-apple-system, BlinkMacMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
        >
            <div className="rounded-[11px] bg-[#0c0c0e] w-full h-full">
                {/* Header */}
                <div className="relative flex items-center justify-center pt-5 pb-2">
                    <h2 className="text-[17px] font-normal text-gray-100 tracking-normal antialiased">connect or create wallet</h2>
                    <button className="absolute right-5 top-5 flex h-6 w-6 items-center justify-center rounded-full bg-[#1e1e20] text-gray-400 hover:bg-[#2e2e30] hover:text-white transition-colors">
                        <X size={12} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 pb-6">
                    {/* Pill Image */}
                    <div className="flex justify-center py-7">
                        <img
                            src="/pill.png"
                            alt="Pill"
                            className="w-16 h-16 object-contain"
                        />
                    </div>

                    <div className="space-y-3">
                        {/* Main Login Option */}
                        <button className="group flex w-full items-center justify-between rounded-xl border border-[#27272a] bg-[#121214] py-3.5 px-4 text-left transition-all hover:bg-[#1a1a1c] hover:border-gray-500 active:scale-[0.98]">
                            <div className="flex items-center gap-3.5">
                                <User className="h-5 w-5 text-[#71717a]" strokeWidth={1.5} />
                                <div className="flex flex-col">
                                    <span className="text-[15px] font-normal text-gray-100 leading-tight">login with email or socials</span>
                                    <span className="text-[12px] font-normal text-[#71717a] mt-0.5">zero confirmation trading</span>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-500 font-normal" strokeWidth={2.5} />
                        </button>

                        {/* Divider */}
                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-[#27272a]"></div>
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-[#0c0c0e] px-2 text-[13px] text-[#52525b]">or</span>
                            </div>
                        </div>

                        {/* Wallet Options */}
                        <button
                            onClick={handlePhantomClick}
                            disabled={isPending}
                            className={`group flex w-full items-center gap-3.5 rounded-xl border border-[#27272a] bg-transparent py-3.5 px-4 text-left text-[15px] font-normal text-gray-100 transition-colors ${isPending ? 'opacity-50 cursor-wait' : 'hover:bg-[#6dda97] hover:border-[#6dda97] hover:text-white'}`}
                        >
                            <img
                                src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTA4IiBoZWlnaHQ9IjEwOCIgdmlld0JveD0iMCAwIDEwOCAxMDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDgiIGhlaWdodD0iMTA4IiByeD0iMjYiIGZpbGw9IiNBQjlGRjIiLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik00Ni41MjY3IDY5LjkyMjlDNDIuMDA1NCA3Ni44NTA5IDM0LjQyOTIgODUuNjE4MiAyNC4zNDggODUuNjE4MkMxOS41ODI0IDg1LjYxODIgMTUgODMuNjU2MyAxNSA3NS4xMzQyQzE1IDUzLjQzMDUgNDQuNjMyNiAxOS44MzI3IDcyLjEyNjggMTkuODMyN0M4Ny43NjggMTkuODMyNyA5NCAzMC42ODQ2IDk0IDQzLjAwNzlDOTQgNTguODI1OCA4My43MzU1IDc2LjkxMjIgNzMuNTMyMSA3Ni45MTIyQzcwLjI5MzkgNzYuOTEyMiA2OC43MDUzIDc1LjEzNDIgNjguNzA1MyA3Mi4zMTRDNjguNzA1MyA3MS41NzgzIDY4LjgyNzUgNzAuNzgxMiA2OS4wNzE5IDY5LjkyMjlDNjUuNTg5MyA3NS44Njk5IDU4Ljg2ODUgODEuMzg3OCA1Mi41NzU0IDgxLjM4NzhDNDcuOTkzIDgxLjM4NzggNDUuNjcxMyA3OC41MDYzIDQ1LjY3MTMgNzQuNDU5OEM0NS42NzEzIDcyLjk4ODQgNDUuOTc2OCA3MS40NTU2IDQ2LjUyNjcgNjkuOTIyOVpNODMuNjc2MSA0Mi41Nzk0QzgzLjY3NjEgNDYuMTcwNCA4MS41NTc1IDQ3Ljk2NTggNzkuMTg3NSA0Ny45NjU4Qzc2Ljc4MTYgNDcuOTY1OCA3NC42OTg5IDQ2LjE3MDQgNzQuNjk4OSA0Mi41Nzk0Qzc0LjY5ODkgMzguOTg4NSA3Ni43ODE2IDM3LjE5MzEgNzkuMTg3NSAzNy4xOTMxQzgxLjU1NzUgMzcuMTkzMSA4My42NzYxIDM4Ljk4ODUgODMuNjc2MSA0Mi41Nzk0Wk03MC4yMTAzIDQyLjU3OTVDNzAuMjEwMyA0Ni4xNzA0IDY4LjA5MTYgNDcuOTY1OCA2NS43MjE2IDQ3Ljk2NThDNjMuMzE1NyA0Ny45NjU4IDYxLjIzMyA0Ni4xNzA0IDYxLjIzMyA0Mi41Nzk1QzYxLjIzMyAzOC45ODg1IDYzLjMxNTcgMzcuMTkzMSA2NS43MjE2IDM3LjE5MzFDNjguMDkxNiAzNy4xOTMxIDcwLjIxMDMgMzguOTg4NSA3MC4yMTAzIDQyLjU3OTVaIiBmaWxsPSIjRkZGREY4Ii8+Cjwvc3ZnPgo="
                                alt="Phantom"
                                className="w-7 h-7 rounded-sm"
                            />
                            {isPending ? 'Connecting...' : 'Phantom'}
                        </button>

                        {error && (
                            <p className="text-red-500 text-[12px] font-normal text-center mt-2 bg-red-500/10 p-2 rounded-lg">
                                {error}
                            </p>
                        )}

                        <button
                            onClick={onOpenWalletSelector}
                            className="group flex w-full items-center gap-3.5 rounded-xl border border-[#27272a] bg-transparent py-3.5 px-4 text-left text-[15px] font-normal text-gray-100 transition-colors hover:bg-[#6dda97] hover:border-[#6dda97] hover:text-white"
                        >
                            <Wallet className="h-6 w-6 text-[#71717a] group-hover:text-white" strokeWidth={1.5} />
                            more wallets
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
