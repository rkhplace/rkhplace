import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from 'lucide-react';

export default function LiveCounter() {
    const [count, setCount] = useState(12845);

    useEffect(() => {
        const interval = setInterval(() => {
            setCount((prev) => prev + Math.floor(Math.random() * 5));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center gap-3 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-1.5 backdrop-blur-sm">
            <Activity className="h-4 w-4 text-green-500 animate-pulse" />
            <div className="flex items-baseline gap-1">
                <span className="text-sm font-semibold text-green-400">Live Trades:</span>
                <AnimatePresence mode="popLayout">
                    <motion.span
                        key={count}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="text-sm font-bold text-white tabular-nums"
                    >
                        {count.toLocaleString()}
                    </motion.span>
                </AnimatePresence>
            </div>
        </div>
    );
}
