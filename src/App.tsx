
import { useState, useEffect, useRef } from 'react';
import { useGameState } from './hooks/useGameState';
import { GameBoard } from './components/GameBoard';
import { InputRow } from './components/InputRow';
import { Header } from './components/Header';

function App() {
  const {
    puzzle,
    currentInput,
    submitWord,
    resetProgress: originalResetProgress,
    gameState,
    submissions,
    displayLetters,
    isLoading,
    selectedIndices,
    handleTileClick,
    clearSelection,
    gameMode, // New export
    toggleGameMode // New export
  } = useGameState();

  const resetProgress = () => {
    setHasInteracted(false);
    originalResetProgress();
  };

  const [errorShake, setErrorShake] = useState(false);
  const [successPop, setSuccessPop] = useState(false);
  const [warningShake, setWarningShake] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [frozenInput, setFrozenInput] = useState(''); // New state to hold input during success animation

  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-Submit Logic
  useEffect(() => {
    if (currentInput.length === 5 && !isProcessing && !gameState.isComplete) {
      setIsProcessing(true);

      const res = submitWord();

      if (res && 'success' in res && res.success) {
        // Success: Green flash -> Clear
        setFrozenInput(currentInput); // Capture valid word before board swap render update
        setSuccessPop(true);
        clearSelection(); // Clear selection immediately to remove board styling

        feedbackTimerRef.current = setTimeout(() => {
          setSuccessPop(false);
          setFrozenInput(''); // Clear frozen input after animation

          // Only clear if the game is NOT complete (actually already cleared above)
          setIsProcessing(false);
          feedbackTimerRef.current = null;
        }, 2000); // 2 seconds green
      } else if (res && 'error' in res && res.error === 'Already used') {
        // Warning: Yellow flash -> Clear (Longer duration)
        setWarningShake(true);
        feedbackTimerRef.current = setTimeout(() => {
          setWarningShake(false);
          clearSelection();
          setIsProcessing(false);
          feedbackTimerRef.current = null;
        }, 2000); // 2 seconds yellow
      } else {
        // Error: Red flash -> Clear
        setErrorShake(true);
        feedbackTimerRef.current = setTimeout(() => {
          setErrorShake(false);
          clearSelection(); // Auto-clear on error too
          setIsProcessing(false);
          feedbackTimerRef.current = null;
        }, 1000); // 1 second red
      }
    }

    // NO cleanup here to avoid cancelling timer on dependency changes (like submissions update)
  }, [currentInput, isProcessing, submitWord, clearSelection, gameState.isComplete, submissions.length]);

  // Track interaction for placeholder logic (keyboard support)
  useEffect(() => {
    if (currentInput.length > 0 && !hasInteracted) {
      setHasInteracted(true);
    }
  }, [currentInput, hasInteracted]);

  // Cleanup timer on component unmount only
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);


  // Completion Delay Removed - Immediate In-Place Feedback


  if (isLoading || !puzzle) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  // Wrap handleTileClick to support instant clearing on interaction
  const onTileClickWrapped = (index: number) => {
    // If we are in a feedback state (Success/Error/Warning), clear immediately
    if (successPop || errorShake || warningShake) {
      // Cancel the pending auto-clear timer!
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = null;
      }

      setSuccessPop(false);
      setErrorShake(false);
      setWarningShake(false);
      setFrozenInput(''); // Clear frozen input
      clearSelection();
      // Allow processing to stop so we can interact again immediately
      setIsProcessing(false);

      // Override default selection logic to force a fresh start
      handleTileClick(index, true);
      return;
    }

    // Pass through to game logic
    if (!hasInteracted) setHasInteracted(true);
    handleTileClick(index);
  };

  return (
    <div className="min-h-screen bg-par-bg flex flex-col items-center relative overflow-hidden">
      {/* Completion Overlay */}
      {/* Completion Overlay Removed - Replaced by PERF! state */}

      {/* Header */}

      <Header
        onInfoClick={() => { }} // Disabled modal info click for now? Or restore modal? User said "Do not show modal on completion". Info click usually shows instructions.
        onHardModeClick={toggleGameMode}

        score={gameState.score}
        label={gameMode === 'hard' ? 'SWAPS' : 'SCORE'}
        showScore={gameMode === 'hard'}
      />

      <main className="flex-1 w-full max-w-lg px-4 py-2 flex flex-col">
        {/* Main Content Area */}
        <div className="flex flex-col items-center justify-start gap-2 flex-grow">

          {gameMode !== 'hard' && (
            <InputRow
              currentInput={gameState.isComplete ? 'PERF!' : (frozenInput || currentInput)}
              isError={errorShake}
              isSuccess={successPop}
              isWarning={warningShake}
              isComplete={gameState.isComplete}
              placeholder={(!hasInteracted && gameMode !== 'hard') ? 'GUESS' : undefined}
            />
          )}

          <GameBoard
            letters={displayLetters}
            selectedIndices={selectedIndices}
            onTileClick={onTileClickWrapped}
            isHardMode={gameMode === 'hard'}
          />



          {/* Control Bar - Dynamic based on state */}
          {gameMode !== 'hard' && (
            <div className="flex justify-center gap-2 w-full max-w-[400px] z-10" style={{ gap: '8px', marginTop: '4px' }}>
              {gameState.isComplete ? (
                <>
                  <button
                    onClick={resetProgress}
                    className="flex-1 !h-12 min-h-[48px] bg-slate-200 rounded-xl flex items-center justify-center shadow hover:bg-slate-300 active:bg-slate-400 active:scale-95 transition-all uppercase font-black text-sm tracking-wide text-slate-700 shrink-0"
                    style={{ height: '48px' }}
                  >
                    AGAIN
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      clearSelection();
                      setHasInteracted(true);
                    }}
                    className="flex-1 !h-12 min-h-[48px] bg-slate-200 rounded-xl flex items-center justify-center shadow hover:bg-slate-300 active:bg-slate-400 active:scale-95 transition-all uppercase font-black text-sm tracking-wide text-slate-700 shrink-0"
                    style={{ height: '48px' }}
                    aria-label="Clear Selection"
                    disabled={isProcessing}
                  >
                    Clear
                  </button>
                  <button
                    onClick={resetProgress}
                    className="flex-1 !h-12 min-h-[48px] bg-slate-200 rounded-xl flex items-center justify-center shadow hover:bg-slate-300 active:bg-slate-400 active:scale-95 transition-all uppercase font-black text-sm tracking-wide text-slate-700 shrink-0"
                    style={{ height: '48px' }}
                  >
                    RESET
                  </button>
                </>
              )}
            </div>
          )}

        </div>
      </main >
    </div >
  );
}

export default App;
