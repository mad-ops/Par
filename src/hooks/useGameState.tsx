import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { generatePuzzle, validateSubmission } from '../lib/gameLogic';
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
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }
    }, [submissions, submissionIndices, puzzle, today]);

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

        if (selectedIndices.includes(targetIndex)) {
            if (targetIndex === selectedIndices[selectedIndices.length - 1]) {
                setSelectedIndices(prev => prev.slice(0, -1));
            }
        } else {
            if (selectedIndices.length < 5) {
                setSelectedIndices(prev => [...prev, targetIndex]);
            }
        }
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

        // Calculate usage based on INDICES now
        // Flatten all submitted indices
        const allConsumedIndices = new Set(submissionIndices.flat());

        // Calculate score: Total letters submitted
        // Each submission is 5 letters.
        const score = submissions.length * 5;
        // Or strictly submissions.reduce((acc, w) => acc + w.length, 0);

        // Completion: have we consumed all 25 generic slots?
        // Wait, "consume a grid of 25 letters". 
        // Does "consume" mean we touched index 0, index 1, ... index 24?
        // YES. If we map 1:1, then completion is when allIndices.size === 25.
        const isComplete = allConsumedIndices.size === 25;

        return {
            isComplete,
            score,
            // capturedCounts is less relevant for logic now, but maybe for display?
            // Actually display logic will use indices directly.
            // We can keep a dummy capturedCounts if needed for compatibility or remove it.
            capturedCounts: {}
        };
    }, [puzzle, submissions, submissionIndices]);

    const displayLetters = useMemo(() => {
        if (!puzzle) return [];

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
    }, [puzzle, submissionIndices, shuffleSeed]);

    const resetProgress = () => {
        setSubmissions([]);
        setSubmissionIndices([]);
        setSelectedIndices([]);
        setShuffleSeed(0);
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
        isLoading: !puzzle
    };
};
