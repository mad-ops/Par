import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGameState } from './hooks/useGameState';

vi.mock('./lib/dictionary', () => ({
    loadDictionary: async () => ({
        allWords: new Set(['ABCDE', 'FGHIJ', 'KLMNO']),
        commonWords: ['ABCDE']
    })
}));

vi.mock('./lib/gameLogic', () => ({
    generatePuzzle: () => ({
        letters: Array.from({ length: 25 }, (_, i) => String.fromCharCode(65 + i)),
        centerLetter: 'A'
    }),
    calculateLetterUsage: (_letters: string[], submissions: string[]) => ({
        score: submissions.length,
        capturedCounts: {},
        isComplete: false
    }),
    validateSubmission: (_word: string) => {
        return { success: true };
    }
}));

describe('Standard Mode Logic - Batch 5 (Final)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    // TEST 41
    it('selectedIndices are valid numbers', async () => {
        const { result } = renderHook(() => useGameState());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        act(() => result.current.handleTileClick(0));
        expect(typeof result.current.selectedIndices[0]).toBe('number');
    });

    // TEST 42
    it('submissions are strings', async () => {
        const { result } = renderHook(() => useGameState());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        act(() => { [0, 1, 2, 3, 4].forEach(i => result.current.handleTileClick(i)); });
        act(() => result.current.submitWord());
        expect(typeof result.current.submissions[0]).toBe('string');
    });

    // TEST 43
    it('displayLetters returns 25 items', async () => {
        const { result } = renderHook(() => useGameState());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.displayLetters).toHaveLength(25);
    });

    // TEST 44
    it('currentInput matches selection chars', async () => {
        const { result } = renderHook(() => useGameState());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        act(() => result.current.handleTileClick(0));
        expect(result.current.currentInput).toBe('A');
    });

    // TEST 45
    it('swapping modes resets standard progress', async () => {
        const { result } = renderHook(() => useGameState());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        act(() => result.current.handleTileClick(0));
        act(() => result.current.toggleGameMode());
        expect(result.current.selectedIndices).toEqual([]);
    });

    // TEST 46
    it('hard mode is initially false', () => {
        const { result } = renderHook(() => useGameState());
        expect(result.current.gameMode).toBe('standard');
    });

    // TEST 47
    it('swapCount is 0 initially', () => {
        const { result } = renderHook(() => useGameState());
        expect(result.current.swapCount).toBe(0);
    });

    // TEST 48
    it('displayLetters have IDs', async () => {
        const { result } = renderHook(() => useGameState());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.displayLetters[0]).toHaveProperty('id');
    });

    // TEST 49
    it('displayLetters have Status', async () => {
        const { result } = renderHook(() => useGameState());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.displayLetters[0]).toHaveProperty('status');
    });

    // TEST 50
    it('displayLetters have Chars', async () => {
        const { result } = renderHook(() => useGameState());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.displayLetters[0]).toHaveProperty('char');
    });
});
