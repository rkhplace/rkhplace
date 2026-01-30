import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, HelpCircle, Grid } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';

const WalletItem = ({ name, icon, badge, badgeColor = "bg-[#1a1a1c] text-[#6dda97]", count, onClick }) => (
    <button
        onClick={onClick}
        className="group flex w-full items-center justify-between rounded-xl border border-[#27272a] bg-transparent p-3.5 transition-all hover:bg-[#6dda97] hover:border-[#6dda97] mb-2.5"
    >
        <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-transparent">
                {typeof icon === 'string' ? (
                    <img src={icon} alt={name} className="h-10 w-10 rounded-xl object-contain" />
                ) : (
                    icon
                )}
            </div>
            <span className="text-[17px] font-bold text-gray-100 group-hover:text-white transition-colors">{name}</span>
        </div>
        {badge && (
            <span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-[#1a1a1c] text-[#6dda97] group-hover:bg-white/20 group-hover:text-white transition-colors`}>
                {badge}
            </span>
        )}
        {count && (
            <span className="flex h-6 w-8 items-center justify-center rounded-md bg-[#1a1a1c] text-xs font-medium text-gray-400 group-hover:bg-white/20 group-hover:text-white transition-colors">
                {count}
            </span>
        )}
    </button>
);

export default function WalletSelectorModal({ onClose }) {
    const { select, connect, wallet, connected, wallets } = useWallet();
    const [connectingWallet, setConnectingWallet] = useState(null);

    const handleConnect = async (walletName) => {
        try {
            select(walletName);

            // Find the adapter and connect directly to preserve user interaction
            const selectedWallet = wallets.find(w => w.adapter.name === walletName);
            if (selectedWallet) {
                await selectedWallet.adapter.connect();
            } else {
                setConnectingWallet(walletName);
            }
        } catch (err) {
            console.error("Connection error in selector:", err);
        }
    };

    useEffect(() => {
        if (connectingWallet && wallet && wallet.adapter.name === connectingWallet && !connected) {
            connect().then(() => setConnectingWallet(null)).catch(() => setConnectingWallet(null));
        }
    }, [connectingWallet, wallet, connected, connect]);

    return (
        <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-[380px] overflow-hidden rounded-xl border border-white bg-[#0c0c0e] shadow-2xl"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-2">
                <button className="text-gray-400 hover:text-white transition-colors">
                    <HelpCircle size={20} strokeWidth={2} />
                </button>
                <h2 className="text-[17px] font-medium text-gray-100">Connect Wallet</h2>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors"
                >
                    <X size={20} strokeWidth={2} />
                </button>
            </div>

            {/* List */}
            <div className="px-6 pt-4 pb-6 h-[400px] overflow-y-auto custom-scrollbar">
                <WalletItem
                    name="Phantom"
                    icon="/phantom.png"
                    badge="POPULAR"
                    onClick={() => handleConnect('Phantom')}
                />
                <WalletItem
                    name="Solflare"
                    icon="/solflare.png"
                    badge="POPULAR"
                    onClick={() => handleConnect('Solflare')}
                />
                <WalletItem
                    name="Jupiter"
                    icon="/jupiter.png"
                    onClick={() => handleConnect('Jupiter')}
                />
                <WalletItem
                    name="Coin98"
                    icon="/coin98-c98-logo.png"
                    onClick={() => handleConnect('Coin98')}
                />
                <WalletItem
                    name="MathWallet"
                    icon="/MathWallet-logo.png"
                    onClick={() => handleConnect('MathWallet')}
                />
                <WalletItem
                    name="TokenPocket"
                    icon="/TokenPocket-wallet-logo.png"
                    onClick={() => handleConnect('TokenPocket')}
                />
                <WalletItem
                    name="Clover"
                    icon="/colverwallet.1df4312d.png"
                    onClick={() => handleConnect('Clover')}
                />
                <WalletItem
                    name="Ledger"
                    icon="/ledger.jpg"
                    badge="HARDWARE"
                    onClick={() => handleConnect('Ledger')}
                />
            </div>

            {/* Footer */}
            <div className="pb-6 text-center">
                <p className="text-[13px] text-gray-500">
                    Haven't got a wallet? <a href="#" className="font-semibold text-[#6dda97] hover:underline">Get started</a>
                </p>
            </div>
        </motion.div>
    );
}
