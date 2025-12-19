import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGameState } from './hooks/useGameState';

// Standard Mock
vi.mock('./lib/dictionary', () => ({
    loadDictionary: async () => ({
        allWords: new Set(['ABCDE', 'FGHIJ', 'KLMNO', 'PQRST', 'UVWXY']),
        commonWords: ['ABCDE']
    })
}));

vi.mock('./lib/gameLogic', () => ({
    generatePuzzle: () => ({
        letters: Array.from({ length: 25 }, (_, i) => String.fromCharCode(65 + i)), // A-Y
        centerLetter: 'A'
    }),
    calculateLetterUsage: (_letters: string[], submissions: string[]) => ({
        score: submissions.length,
        capturedCounts: {},
        isComplete: submissions.length === 5
    }),
    validateSubmission: (word: string) => {
        if (word.length !== 5) return { error: 'Too short' };
        return { success: true };
    }
}));

describe('Standard Mode Logic - Basic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    // TEST 1
    it('initializes with empty state', () => {
        const { result } = renderHook(() => useGameState());
        expect(result.current.submissions).toEqual([]);
    });

    // TEST 2
    it('selects a tile on click', () => {
        const { result } = renderHook(() => useGameState());
        act(() => result.current.handleTileClick(0));
        expect(result.current.selectedIndices).toEqual([0]);
    });

    // TEST 3
    it('deselects the last tile if clicked again', () => {
        const { result } = renderHook(() => useGameState());
        act(() => result.current.handleTileClick(0));
        act(() => result.current.handleTileClick(0));
        expect(result.current.selectedIndices).toEqual([]);
    });

    // TEST 4
    it('adds consecutive selections', () => {
        const { result } = renderHook(() => useGameState());
        act(() => {
            result.current.handleTileClick(0);
            result.current.handleTileClick(1);
        });
        expect(result.current.selectedIndices).toEqual([0, 1]);
    });

    // TEST 5
    it('ignores clicks when 5 tiles selected', () => {
        const { result } = renderHook(() => useGameState());
        act(() => {
            [0, 1, 2, 3, 4].forEach(i => result.current.handleTileClick(i));
        });
        expect(result.current.selectedIndices).toHaveLength(5);
        act(() => result.current.handleTileClick(5));
        expect(result.current.selectedIndices).toHaveLength(5);
    });

    // TEST 6
    it('clears selection', () => {
        const { result } = renderHook(() => useGameState());
        act(() => result.current.handleTileClick(0));
        act(() => result.current.clearSelection());
        expect(result.current.selectedIndices).toEqual([]);
    });

    // TEST 7
    it('removes last char on backspace', () => {
        const { result } = renderHook(() => useGameState());
        act(() => {
            result.current.handleTileClick(0);
            result.current.handleTileClick(1);
        });
        act(() => result.current.backspace());
        expect(result.current.selectedIndices).toEqual([0]);
    });

    // TEST 8
    it('submits a valid word', async () => {
        const { result } = renderHook(() => useGameState());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        act(() => {
            [0, 1, 2, 3, 4].forEach(i => result.current.handleTileClick(i));
        });
        act(() => {
            result.current.submitWord();
        });
        expect(result.current.submissions).toHaveLength(1);
    });

    // TEST 9
    it('does not submit incomplete word', async () => {
        const { result } = renderHook(() => useGameState());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        act(() => {
            [0, 1, 2, 3].forEach(i => result.current.handleTileClick(i));
        });
        act(() => {
            result.current.submitWord();
        });
        expect(result.current.submissions).toHaveLength(0);
    });

    // TEST 10
    it('prevents selecting consumed tiles', async () => {
        const { result } = renderHook(() => useGameState());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        act(() => {
            [0, 1, 2, 3, 4].forEach(i => result.current.handleTileClick(i));
        });
        act(() => result.current.submitWord());
        act(() => result.current.clearSelection());

        // Try to select same tiles again
        act(() => {
            [0, 1, 2, 3, 4].forEach(i => result.current.handleTileClick(i));
        });
        // Should ignore clicks on consumed tiles
        expect(result.current.selectedIndices).toEqual([]);

        // Submitting now would result in 'Too short'
        const res = result.current.submitWord();
        expect(res).toEqual({ error: 'Too short' });
    });
});
