import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { generatePuzzle, validateSubmission, calculateLetterUsage } from '../lib/gameLogic';
import { loadDictionary } from '../lib/dictionary';
import { createInitialBoard, swapRowsForSubmission, type BoardState } from '../lib/boardState'; // Import new logic
import type { DailyPuzzle } from '../types';

const STORAGE_KEY = 'par_game_state';

interface PersistedState {
    date: string;
    submissions: string[];
    submissionIndices: number[][]; // Track exact indices for each submission
    boardState?: BoardState; // New persisted state
}

export const useGameState = () => {
    const [dictionary, setDictionary] = useState<Set<string>>(new Set());
    const [commonWords, setCommonWords] = useState<string[]>([]);
    const [submissions, setSubmissions] = useState<string[]>([]);
    const [submissionIndices, setSubmissionIndices] = useState<number[][]>([]);
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
    const [puzzle, setPuzzle] = useState<DailyPuzzle | null>(null);
    const [shuffleSeed, setShuffleSeed] = useState(0);

    // Board State (Standard Mode)
    // Initialize with empty until puzzle loads
    const [boardState, setBoardState] = useState<BoardState | null>(null);

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
            let stateLoaded = false;

            if (saved) {
                try {
                    const parsed: PersistedState = JSON.parse(saved);
                    if (parsed.date === today) {
                        setSubmissions(parsed.submissions);

                        if (parsed.submissionIndices && parsed.submissionIndices.length === parsed.submissions.length) {
                            setSubmissionIndices(parsed.submissionIndices);

                            // Load board state or create initial if missing (migration)
                            if (parsed.boardState) {
                                setBoardState(parsed.boardState);
                            } else {
                                // If no saved board state but we have progress, we might be in trouble since old progress assumes old static board.
                                // For robustness, if migrating, we might just have to reset or try to reconstruct.
                                // Simplest: Start fresh board. Visuals might be weird if letters moved, but functional.
                                setBoardState(createInitialBoard(p.letters));
                            }

                            const all = new Set(parsed.submissionIndices.flat());
                            if (all.size === 25 && parsed.submissionIndices.length > 0) {
                                setSelectedIndices(parsed.submissionIndices[parsed.submissionIndices.length - 1]);
                            }
                        } else {
                            // Version mismatch reset
                            setSubmissions([]);
                            setSubmissionIndices([]);
                            setBoardState(createInitialBoard(p.letters));
                        }
                        stateLoaded = true;
                    } else {
                        localStorage.removeItem(STORAGE_KEY);
                    }
                } catch (e) {
                    console.error("Failed to parse saved state", e);
                }
            }

            if (!stateLoaded) {
                setBoardState(createInitialBoard(p.letters));
            }
        }
    }, [commonWords, today]);

    // Persist
    useEffect(() => {
        if (puzzle && boardState) {
            const state: PersistedState = {
                date: today,
                submissions,
                submissionIndices,
                boardState
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }
    }, [submissions, submissionIndices, puzzle, today, boardState]);

    const toggleGameMode = () => {
        if (!puzzle) return;

        if (gameMode === 'hard') {
            setHardModeBoard([]);
            setSwapCount(0);

            // Standard Reset
            setSubmissions([]);
            setSubmissionIndices([]);
            setSelectedIndices([]);
            setShuffleSeed(0);
            setBoardState(createInitialBoard(puzzle.letters));
            setGameMode('standard');
        } else {
            setGameMode('hard');
            setHardModeBoard([...puzzle.letters]);

            setSwapCount(0);
            setSelectedIndices([]);
            setSubmissions([]);
            setSubmissionIndices([]);
            // Board state for Standard irrelevant in Hard, but we keep it sync logic separate ? 
            // Actually hard mode doesn't use boardState, it uses hardModeBoard.
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
        if (!puzzle || !boardState) return;

        // Use boardState.letters for current word construction
        const word = selectedIndices.map(idx => boardState.letters[idx]).join('').toUpperCase();

        if (word.length !== 5) return { error: 'Too short' };
        if (!dictionary.has(word)) return { error: 'Not in dictionary' };
        if (submissions.includes(word)) return { error: 'Already used' };

        const validation = validateSubmission(word, boardState.letters);
        if (validation.error) return validation;

        // Perform Board Swap Logic
        const targetRow = submissions.length; // 0, 1, 2, 3, 4

        const { newBoard, newSubmissionIndices } = swapRowsForSubmission(
            boardState,
            selectedIndices, // Current indices of the word letters
            targetRow
        );

        setBoardState(newBoard);
        setSubmissions(prev => [...prev, word]);

        // We accumulate the NEW static indices for this word
        setSubmissionIndices(prev => [...prev, newSubmissionIndices]);

        // Also update selection to match the new positions so UI doesn't jump
        // Wait, UI will re-render. We probably want to clear selection or update it?
        // App logic might clear it later.

        const previouslyConsumed = new Set(submissionIndices.flat());
        newSubmissionIndices.forEach(idx => previouslyConsumed.add(idx));

        const isNowComplete = previouslyConsumed.size === 25;

        return { success: true, isComplete: isNowComplete };
    };

    const handleTileClick = (index: number, shouldReset = false) => {
        if (gameState.isComplete) return;

        if (gameMode === 'hard') {
            if (selectedIndices.length === 0) {
                setSelectedIndices([index]);
            } else {
                const firstIndex = selectedIndices[0];
                if (firstIndex === index) {
                    setSelectedIndices([]);
                } else {
                    setSelectedIndices([firstIndex, index]);
                    setTimeout(() => {
                        switchTiles(firstIndex, index);
                        setSelectedIndices([]);
                    }, 500);
                }
            }
            return;
        }

        // Standard Mode Click
        if (gameState.isComplete) return;

        // Check if consumed (locked)
        // Consumed indices are strictly those in submissionIndices
        const flattenedConsumed = new Set(submissionIndices.flat());
        if (flattenedConsumed.has(index)) {
            // Block click on consumed tile
            return;
        }

        // Smart Selection Logic (Simplified since we can't move consumed tiles)
        let targetIndex = index;

        // Auto-select unconsumed duplicates? 
        // User said: "User should not be able to select a consumed letter anymore".
        // So we definitely don't auto-jump FROM a consumed letter because you can't click it.
        // But what if we click an Available letter, do we jump?
        // Basic selection logic applies.

        if (shouldReset) {
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

    const resetProgress = () => {
        setSubmissions([]);
        setSubmissionIndices([]);
        setSelectedIndices([]);
        setShuffleSeed(0);
        setGameMode('standard');
        setHardModeBoard([]);
        setSwapCount(0);

        // Reset board to initial puzzle state
        if (puzzle) {
            setBoardState(createInitialBoard(puzzle.letters));
        }
        localStorage.removeItem(STORAGE_KEY);
    };

    // Derived state
    const gameState = useMemo(() => {
        if (!puzzle || !boardState) return { isComplete: false, capturedCounts: {}, score: 0 };

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
        const allConsumedIndices = new Set(submissionIndices.flat());
        const isComplete = allConsumedIndices.size === 25;

        // Use boardState letters
        const currentWord = selectedIndices.map(idx => boardState.letters[idx]).join('');
        const allWordsToScore = (currentWord && !isComplete) ? [...submissions, currentWord] : submissions;

        // We use puzzle.letters for scoring reference? Or boardState?
        // Scoring should be consistent. puzzle.letters is the "bag". boardState is just rearrangement.
        // calculateLetterUsage uses counts. Counts are invariant under swap.
        const logicState = calculateLetterUsage(puzzle.letters, allWordsToScore);

        return {
            isComplete,
            score: logicState.score,
            capturedCounts: logicState.capturedCounts
        };
    }, [puzzle, submissions, submissionIndices, selectedIndices, gameMode, hardModeBoard, swapCount, dictionary, boardState]);

    const displayLetters = useMemo(() => {
        if (!puzzle || !boardState) return [];

        if (gameMode === 'hard') {
            // Hard Mode Display Logic (unchanged from original except for vars)
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
            return hardModeBoard.map((char, index) => ({
                char,
                status: (validIndices.has(index) ? 'consumed' : 'available') as 'consumed' | 'available',
                id: index
            }));
        }

        // Standard Mode - Use BoardState
        const consumedSet = new Set(submissionIndices.flat());

        // We only shuffle AVAILABLE tiles.
        // Map 0..24 to their items.
        let items = boardState.letters.map((char, index) => {
            let status: 'available' | 'consumed' = 'available';
            if (consumedSet.has(index)) {
                status = 'consumed';
            }
            return { char, status, id: index };
        });

        if (shuffleSeed > 0) {
            // Only sort items that are available? 
            // If we sort all, the grid jumps around.
            // Consumed items (rows 0, 1, 2...) should stay FIXED.
            // Unconsumed items can shuffle among themselves.

            // Separate
            const fixedItems = items.filter(item => item.status === 'consumed');
            const shuffleItems = items.filter(item => item.status === 'available');

            const seedRandom = (i: number) => {
                const x = Math.sin(shuffleSeed + i) * 10000;
                return x - Math.floor(x);
            };

            // Shuffle the available items
            // But waiting, their IDs MUST enable mapping back to handleTileClick logic.
            // ID = Board Index.
            // If we visual-shuffle, does ID stay tied to the visual slot?
            // "ID" usually means "Index in the primary state array".
            // DisplayLetters usually maps to the grid slots in order.
            // If we sort the ARRAY, we change which tile appears in slot X.
            // E.g. Slot 24 might show Tile 10.
            // If user clicks Slot 24, they expect to click Tile 10.
            // UI usually iterates displayLetters and renders.
            // The Key/ID passed to onClick is `item.id`.

            // So if we shuffle the array passed to GameBoard:
            // GameBoard maps `displayLetters.map(...)`.
            // So visual order follows array order.

            // We want FIXED items to stay in their slots.
            // We want AVAILABLE items to move around into AVAILABLE slots.

            // Complex shuffle for partial board:
            // 1. Get indices of available slots.
            // 2. Shuffle those indices? No, shuffle the ITEMS into those slots.

            const availableSlots = items
                .map((item, idx) => ({ item, originalIdx: idx }))
                .filter(x => x.item.status === 'available');

            // Sort these available items/slots based on randomized criteria
            const shuffledAvailable = [...availableSlots].sort((a, b) => seedRandom(a.item.id) - seedRandom(b.item.id));

            // Reconstruct the full list
            // Create a sparse array or map?

            // Better: Just map available slots one-to-one to the shuffled items.
            // The available items occupy specific INDICES in the main array.
            // We want to permute contents among those indices.

            // Let's create a copy
            const finalItems = [...items];

            // For each available slot (in original order), place the next item from shuffled list
            for (let i = 0; i < availableSlots.length; i++) {
                const targetSlotIndex = availableSlots[i].originalIdx;
                const itemToPlace = shuffledAvailable[i].item;
                finalItems[targetSlotIndex] = itemToPlace;
            }

            items = finalItems;
        }

        return items;
    }, [puzzle, submissionIndices, shuffleSeed, gameMode, hardModeBoard, dictionary, boardState]);

    const currentInput = selectedIndices.map(idx => boardState?.letters[idx] || '').join('');

    return {
        puzzle,
        submissions,
        currentInput,
        selectedIndices,
        handleTileClick,
        clearSelection,
        backspace,
        submitWord,
        shuffleBoard,
        resetProgress,
        gameState,
        displayLetters,
        isLoading: !puzzle || !boardState,
        gameMode,
        toggleGameMode,
        switchTiles,
        swapCount,
        hardModeBoard,
        dictionary
    };
};
