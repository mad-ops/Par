import seedrandom from 'seedrandom';
import type { DailyPuzzle } from '../types';

export const generatePuzzle = (dateString: string, commonWords: string[]): DailyPuzzle => {
    // Seed using date
    const rng = seedrandom(dateString);
    const words = commonWords;

    if (words.length < 5) {
        // Fallback if dictionary not loaded
        return { id: dateString, letters: Array(25).fill('A'), targetWords: [] };
    }

    const selectedWords: string[] = [];
    while (selectedWords.length < 5) {
        const word = words[Math.floor(rng() * words.length)];
        selectedWords.push(word);
    }

    // Flatten to letters
    let letters: string[] = [];
    selectedWords.forEach(w => letters.push(...w.split('')));

    // Shuffle letters
    // Fisher-Yates shuffle with seeded rng
    for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
    }

    return {
        id: dateString,
        letters,
        targetWords: selectedWords
    };
};

export const calculateLetterUsage = (puzzleLetters: string[], submissions: string[]) => {
    // Count available letters in puzzle
    const puzzleCounts: Record<string, number> = {};
    puzzleLetters.forEach(l => {
        puzzleCounts[l] = (puzzleCounts[l] || 0) + 1;
    });

    // Track usage
    const usedCounts: Record<string, number> = {};


    // Detailed matching logic to highlight SPECIFIC grid cells?
    // The spec says: "Shuffle button rearranges visual grid only".
    // "Board letters highlight when consumed".
    // This implies we need to track WHICH instance of 'A' is consumed.

    // Heuristic: Auto-consume the first available instance.
    // When shuffling, we probably just change the display order, not the underlying logic?
    // Or does shuffle change which 'A' is used? Actually index doesn't matter, just count.
    // But visually we need to dim specific cells.

    // Let's just track counts of used vs available.

    let totalUsed = 0;

    // Reset usage
    submissions.forEach(word => {
        word.split('').forEach(char => {
            usedCounts[char] = (usedCounts[char] || 0) + 1;
        });
        totalUsed += word.length;
    });

    // Determine completion
    // Game complete when sum(values) == 25?
    // Wait, execution pack says: "Game complete when sum(letterUsed.values) == 25" AND "For each accepted word... If letterUsed[c] < letterCounts[c]: letterUsed[c] += 1".
    // So over-usage is allowed but doesn't count towards the 25 limit?
    // "If letterUsed[c] < letterCounts[c]: letterUsed[c] += 1 Else: allow usage but do not affect completion"
    // This means we only capture up to the limit.

    const capturedCounts: Record<string, number> = {};
    Object.keys(usedCounts).forEach(char => {
        const available = puzzleCounts[char] || 0;
        const used = usedCounts[char];
        capturedCounts[char] = Math.min(used, available);
    });

    const totalCaptured = Object.values(capturedCounts).reduce((a, b) => a + b, 0);
    const isComplete = totalCaptured === 25;

    return {
        puzzleCounts,
        usedCounts,
        capturedCounts,
        isComplete,
        score: totalUsed // Lower is better
    };
};

export function validateSubmission(word: string, boardLetters: string[]): { error?: string } {
    const boardCounts: Record<string, number> = {};
    for (const char of boardLetters) {
        boardCounts[char] = (boardCounts[char] || 0) + 1;
    }

    const wordCounts: Record<string, number> = {};
    for (const char of word) {
        wordCounts[char] = (wordCounts[char] || 0) + 1;
    }

    for (const char in wordCounts) {
        if (!boardCounts[char] || wordCounts[char] > boardCounts[char]) {
            const err = `Board missing ${char} (Need ${wordCounts[char]}, Have ${boardCounts[char] || 0})`;
            console.log("Validation Failed:", err);
            return { error: err };
        }
    }
    return {};
}
