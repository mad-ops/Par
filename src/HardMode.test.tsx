import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGameState } from './hooks/useGameState';

// Mock dependencies
vi.mock('./lib/dictionary', () => ({
    loadDictionary: async () => ({
        allWords: new Set(['ABCDE', 'FGHIJ', 'KLMNO']),
        commonWords: ['ABCDE']
    })
}));

vi.mock('./lib/gameLogic', () => ({
    generatePuzzle: () => ({
        letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y'],
        centerLetter: 'A'
    }),
    calculateLetterUsage: (_letters: string[], submissions: string[]) => ({
        score: submissions.length,
        capturedCounts: {},
        isComplete: false
    }),
    validateSubmission: (word: string) => {
        if (word === 'ABCDE') return { success: true };
        return { error: 'Not in dictionary' };
    }
}));

describe('Hard Mode Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('starts in standard mode by default', () => {
        const { result } = renderHook(() => useGameState());
        expect(result.current.gameMode).toBe('standard');
    });

    it('switches to hard mode when toggleGameMode is called', async () => {
        const { result } = renderHook(() => useGameState());
        await waitFor(() => { expect(result.current.puzzle).toBeTruthy(); });
        act(() => {
            result.current.toggleGameMode();
        });
        expect(result.current.gameMode).toBe('hard');
    });

    it('initializes hard mode board with puzzle letters', async () => {
        const { result } = renderHook(() => useGameState());
        // Wait for puzzle init
        await waitFor(() => {
            expect(result.current.puzzle).toBeTruthy();
        }, { timeout: 1000 });

        // Ensure puzzle is loaded
        if (!result.current.puzzle) {
            console.error('Puzzle not loaded in test');
        }

        act(() => {
            result.current.toggleGameMode();
        });

        expect(result.current.hardModeBoard).toHaveLength(25);
        expect(result.current.hardModeBoard[0]).toBe('A');
    });

    it('swaps tiles correctly', async () => {
        const { result } = renderHook(() => useGameState());
        await waitFor(() => { expect(result.current.puzzle).toBeTruthy(); });

        act(() => {
            result.current.toggleGameMode();
        });



        // Swap index 0 with index 1
        vi.useFakeTimers();

        act(() => {
            result.current.handleTileClick(0); // Select first
        });

        act(() => {
            result.current.handleTileClick(1); // Select second (trigger delayed swap)
        });

        // Immediately should be both selected, no swap yet
        expect(result.current.selectedIndices).toEqual([0, 1]);
        expect(result.current.hardModeBoard[0]).toBe('A');
        expect(result.current.hardModeBoard[1]).toBe('B');

        // Advance time
        act(() => {
            vi.advanceTimersByTime(500);
        });

        // Now swapped and cleared
        expect(result.current.hardModeBoard[0]).toBe('B');
        expect(result.current.hardModeBoard[1]).toBe('A');
        expect(result.current.swapCount).toBe(1);
        expect(result.current.selectedIndices).toEqual([]);

        vi.useRealTimers();
    });

    it('deselects if clicking same tile', async () => {
        const { result } = renderHook(() => useGameState());
        await waitFor(() => { expect(result.current.puzzle).toBeTruthy(); });

        act(() => {
            result.current.toggleGameMode();
        });

        act(() => {
            result.current.handleTileClick(0);
        });
        expect(result.current.selectedIndices).toEqual([0]);

        act(() => {
            result.current.handleTileClick(0);
        });
        expect(result.current.selectedIndices).toEqual([]);
    });
    it('toggles back to standard mode', async () => {
        const { result } = renderHook(() => useGameState());
        await waitFor(() => { expect(result.current.puzzle).toBeTruthy(); });

        // Toggle to Hard
        act(() => { result.current.toggleGameMode(); });
        expect(result.current.gameMode).toBe('hard');

        // Toggle back to Standard
        act(() => { result.current.toggleGameMode(); });
        expect(result.current.gameMode).toBe('standard');
    });
});
