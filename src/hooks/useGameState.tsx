import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { generatePuzzle, validateSubmission, calculateLetterUsage } from '../lib/gameLogic';
import { loadDictionary } from '../lib/dictionary';
import type { DailyPuzzle } from '../types';

const STORAGE_KEY = 'par_game_state';

interface PersistedState {
    date: string;
    submissions: string[];
    submissionIndices: number[][]; // Track exact indices for each submission
}

export const useGameState = () => {
    const [dictionary, setDictionary] = useState<Set<string>>(new Set());
    const [commonWords, setCommonWords] = useState<string[]>([]);
    const [submissions, setSubmissions] = useState<string[]>([]);
    const [submissionIndices, setSubmissionIndices] = useState<number[][]>([]); // New state
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
    const [puzzle, setPuzzle] = useState<DailyPuzzle | null>(null);
    const [shuffleSeed, setShuffleSeed] = useState(0);

    // Hard Mode State
    const [gameMode, setGameMode] = useState<'standard' | 'hard'>('standard');
    const [hardModeBoard, setHardModeBoard] = useState<string[]>([]);
    const [swapCount, setSwapCount] = useState(0);

    // Initialize
    useEffect(() => {
        loadDictionary().then(data => {
            setDictionary(data.allWords);
            setCommonWords(data.commonWords);
        });
    }, []);

    // Set puzzle based on date
    const today = format(new Date(), 'yyyy-MM-dd');

    useEffect(() => {
        if (commonWords.length > 0) {
            const p = generatePuzzle(today, commonWords);
            setPuzzle(p);

            // Load saved state
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    const parsed: PersistedState = JSON.parse(saved);
                    if (parsed.date === today) {
                        setSubmissions(parsed.submissions);
                        // Backwards compatibility: if submissionIndices missing, we can't recover exact tiles effortlessly.
                        // Ideally we'd reset or just accept we lose visual precision for old saves.
                        // For this implementation, let's default to empty if missing, but that desyncs submissions.
                        // Better: If missing, we might want to reset locally to avoid issues, or try to reconstruct (hard).
                        // Let's assume reset if version mismatch (missing indices).
                        if (parsed.submissionIndices && parsed.submissionIndices.length === parsed.submissions.length) {
                            setSubmissionIndices(parsed.submissionIndices);

                            // Check if game is complete to restore last selection state
                            // Flatten all to check count
                            const all = new Set(parsed.submissionIndices.flat());
                            if (all.size === 25 && parsed.submissionIndices.length > 0) {
                                // Restore last selection for visual continuity
                                setSelectedIndices(parsed.submissionIndices[parsed.submissionIndices.length - 1]);
                            }
                        } else {
                            // If we have submissions but no indices (legacy save), best to reset to avoid "ghost" consumption.
                            setSubmissions([]);
                            setSubmissionIndices([]);
                        }
                    } else {
                        localStorage.removeItem(STORAGE_KEY);
                    }
                } catch (e) {
                    console.error("Failed to parse saved state", e);
                }
            }
        }
    }, [commonWords, today]);

    // Persist
    useEffect(() => {
        if (puzzle) {
            const state: PersistedState = { date: today, submissions, submissionIndices };
            // TODO: Persist hard mode state? For now, transient.
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }
    }, [submissions, submissionIndices, puzzle, today]);

    const toggleGameMode = () => {
        if (!puzzle) return;

        if (gameMode === 'hard') {
            // Switch back to standard
            // Reset hard mode state
            setHardModeBoard([]);
            setSwapCount(0);
            // Reset standard progress as well to start fresh? 
            // Current "resetProgress" does full wipe.
            // Let's do a partial reset similar to resetProgress but keeping puzzle
            setSubmissions([]);
            setSubmissionIndices([]);
            setSelectedIndices([]);
            setShuffleSeed(0);
            setGameMode('standard');
        } else {
            // Start Hard Mode
            setGameMode('hard');
            setHardModeBoard([...puzzle.letters]); // Copy initial state

            setSwapCount(0);
            setSelectedIndices([]); // Clear standard selection
            // Reset standard progress? User said "new game".
            setSubmissions([]);
            setSubmissionIndices([]);
        }
    };

    const switchTiles = (indexA: number, indexB: number) => {
        setHardModeBoard(prev => {
            const newBoard = [...prev];
            [newBoard[indexA], newBoard[indexB]] = [newBoard[indexB], newBoard[indexA]];
            return newBoard;
        });
        setSwapCount(prev => prev + 1);
    };

    const submitWord = () => {
        if (!puzzle) return;

        const word = selectedIndices.map(idx => puzzle.letters[idx]).join('').toUpperCase();

        if (word.length !== 5) return { error: 'Too short' };
        if (!dictionary.has(word)) return { error: 'Not in dictionary' };
        if (submissions.includes(word)) return { error: 'Already used' };

        // Validate against board - implicitly valid if built from board indices

        // Additional check: Ensure we aren't using already consumed tiles?
        // Game rule: "Duplicate letters fully consumed" -> "Letters on the board highlight when consumed".
        // Can we reuse a consumed tile? "Over-usage allowed but inefficient".
        // Use case: I have 2 'E's. I use one. It turns green. Can I use it again?
        // If I use it again, I'm just increasing my score (bad) without gaining new coverage.
        // It is ALLOWED. So no check against previous indices needed.

        // Final check just in case
        const validation = validateSubmission(word, puzzle.letters);
        if (validation.error) return validation;

        // Check if this submission completes the game
        const previouslyConsumed = new Set(submissionIndices.flat());
        // Add new indices
        selectedIndices.forEach(idx => previouslyConsumed.add(idx));
        const isNowComplete = previouslyConsumed.size === 25;

        setSubmissions(prev => [...prev, word]);
        setSubmissionIndices(prev => [...prev, [...selectedIndices]]); // Save indices

        // Note: We no longer clear selection here to allow UI to show success state first.
        return { success: true, isComplete: isNowComplete };
    };

    const handleTileClick = (index: number, shouldReset = false) => {
        if (gameState.isComplete) return;

        if (gameMode === 'hard') {
            // Hard Mode Interaction: Swap
            if (selectedIndices.length === 0) {
                // Select first tile
                setSelectedIndices([index]);
            } else {
                const firstIndex = selectedIndices[0];
                if (firstIndex === index) {
                    // Deselect if same
                    setSelectedIndices([]);
                } else {
                    // Highlight both
                    setSelectedIndices([firstIndex, index]);

                    // Delayed Swap
                    setTimeout(() => {
                        switchTiles(firstIndex, index);
                        setSelectedIndices([]);
                    }, 500);
                }
            }
            return;
        }
        if (gameState.isComplete) return;

        // Smart Selection Logic
        let targetIndex = index;
        const clickedLetter = displayLetters.find(l => l.id === index);

        // If clicking a consumed tile, try to find an available one of same letter
        if (clickedLetter?.status === 'consumed') {
            const availableInstance = displayLetters.find(l =>
                l.char === clickedLetter.char &&
                l.status === 'available' &&
                // If resetting, ignore current selection check. Otherwise check if not selected.
                (shouldReset || !selectedIndices.includes(l.id))
            );
            if (availableInstance) {
                targetIndex = availableInstance.id;
            }
        }

        if (shouldReset) {
            // Force selection to just this tile
            setSelectedIndices([targetIndex]);
            return;
        }

        setSelectedIndices(prev => {
            if (prev.includes(targetIndex)) {
                if (targetIndex === prev[prev.length - 1]) {
                    return prev.slice(0, -1);
                }
                return prev;
            } else {
                if (prev.length < 5) {
                    return [...prev, targetIndex];
                }
                return prev;
            }
        });
    };

    const clearSelection = () => {
        setSelectedIndices([]);
    };

    const backspace = () => {
        setSelectedIndices(prev => prev.slice(0, -1));
    };

    const shuffleBoard = () => {
        setShuffleSeed(s => s + 1);
    };

    // Derived state
    const gameState = useMemo(() => {
        if (!puzzle) return { isComplete: false, capturedCounts: {}, score: 0 };

        if (gameMode === 'hard') {
            let isComplete = false;
            if (hardModeBoard.length > 0) {
                isComplete = true;
                for (let row = 0; row < 5; row++) {
                    const word = hardModeBoard.slice(row * 5, row * 5 + 5).join('').toUpperCase();
                    if (!dictionary.has(word)) {
                        isComplete = false;
                        break;
                    }
                }
            }
            return {
                isComplete,
                score: swapCount,
                capturedCounts: {}
            };
        }

        // Standard Logic
        // Check completion based on indices coverage (which tracks visual state)
        const allConsumedIndices = new Set(submissionIndices.flat());
        const isComplete = allConsumedIndices.size === 25;

        // Construct current partial word from selected indices
        const currentWord = selectedIndices.map(idx => puzzle.letters[idx]).join('');

        // Include current (partial) word in the calc to show live score
        const allWordsToScore = (currentWord && !isComplete) ? [...submissions, currentWord] : submissions;

        // Use centralized logic from gameLogic.ts to ensure consistency
        const logicState = calculateLetterUsage(puzzle.letters, allWordsToScore);

        return {
            isComplete,
            score: logicState.score,
            capturedCounts: logicState.capturedCounts
        };
    }, [puzzle, submissions, submissionIndices, selectedIndices, gameMode, hardModeBoard, swapCount, dictionary]);

    const displayLetters = useMemo(() => {
        if (!puzzle) return [];

        if (gameMode === 'hard') {
            // Hard Mode Logic
            // 1. Identify valid rows
            const validIndices = new Set<number>();
            let validRowCount = 0;

            for (let row = 0; row < 5; row++) {
                const startIndex = row * 5;
                const rowLetters = hardModeBoard.slice(startIndex, startIndex + 5);
                const word = rowLetters.join('').toUpperCase();

                if (dictionary.has(word)) {
                    validRowCount++;
                    for (let i = 0; i < 5; i++) {
                        validIndices.add(startIndex + i);
                    }
                }
            }

            // 2. Map to items
            return hardModeBoard.map((char, index) => ({
                char,
                status: (validIndices.has(index) ? 'consumed' : 'available') as 'consumed' | 'available',
                id: index
            }));
        }

        // Standard Logic
        // Flatten consumed indices for O(1) lookup
        const consumedSet = new Set(submissionIndices.flat());

        let items = puzzle.letters.map((char, index) => {
            let status: 'available' | 'consumed' = 'available';

            if (consumedSet.has(index)) {
                status = 'consumed';
            }
            return { char, status, id: index };
        });

        if (shuffleSeed > 0) {
            // Seeded random sort
            const seedRandom = (i: number) => {
                const x = Math.sin(shuffleSeed + i) * 10000;
                return x - Math.floor(x);
            };
            items = [...items].sort((a, b) => seedRandom(a.id) - seedRandom(b.id));
        }

        return items;
    }, [puzzle, submissionIndices, shuffleSeed, gameMode, hardModeBoard, dictionary]);



    const resetProgress = () => {
        setSubmissions([]);
        setSubmissionIndices([]);
        setSelectedIndices([]);
        setShuffleSeed(0);
        setGameMode('standard'); // partial reset
        setHardModeBoard([]);
        setSwapCount(0);
        localStorage.removeItem(STORAGE_KEY);
    };

    // Derived current input string for display
    const currentInput = selectedIndices.map(idx => puzzle?.letters[idx] || '').join('');

    return {
        puzzle,
        submissions,
        currentInput, // Kept for compatibility with InputRow
        selectedIndices, // New
        handleTileClick, // New
        clearSelection, // New
        backspace, // New
        submitWord,
        shuffleBoard,
        resetProgress,
        gameState,
        displayLetters,
        isLoading: !puzzle,
        gameMode,
        toggleGameMode,
        switchTiles,
        swapCount,
        hardModeBoard,
        dictionary // Export dict for validation check in App/hook
    };
};
