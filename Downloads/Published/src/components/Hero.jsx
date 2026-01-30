import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';
import LiveCounter from './LiveCounter';

export default function Hero() {
    return (
        <div className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-14 lg:px-8">
            {/* Background gradients */}
            <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(#222_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
            <div className="absolute top-0 -z-10 h-[500px] w-[500px] rounded-full bg-green-500/20 blur-[100px] filter" />

            <div className="mx-auto max-w-2xl py-12 sm:py-24 lg:py-32 text-center">
                <div className="mb-8 flex justify-center">
                    <LiveCounter />
                </div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-gradient-to-br from-white to-white/50 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-7xl"
                >
                    Launch your coin <br />
                    <span className="text-green-500">instantly.</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-6 text-lg leading-8 text-gray-400"
                >
                    The fastest way to launch and trade memecoins on Solana.
                    Zero presale, zero team allocation, 100% fair launch.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="mt-10 flex items-center justify-center gap-x-6"
                >
                    <a
                        href="#"
                        className="group relative flex items-center gap-2 rounded-lg bg-green-500 px-8 py-3.5 text-base font-bold text-black shadow-lg shadow-green-500/20 transition-all hover:scale-105 hover:bg-green-400"
                    >
                        Start Trading
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        <div className="absolute inset-0 rounded-lg ring-2 ring-white/20" />
                    </a>
                    <a href="#" className="flex items-center gap-2 text-sm font-semibold leading-6 text-white transition-colors hover:text-green-400">
                        How it works <Zap className="h-4 w-4" />
                    </a>
                </motion.div>
            </div>

            {/* Floating Elements Animation */}
            <motion.div
                animate={{
                    y: [0, -20, 0],
                    rotate: [0, 5, 0]
                }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute bottom-20 right-20 hidden lg:block"
            >
                <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-gray-800 to-black p-4 ring-1 ring-white/10 backdrop-blur-xl">
                    <div className="h-full w-full rounded-full bg-green-500/20 flex items-center justify-center">
                        <span className="text-2xl">💊</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
