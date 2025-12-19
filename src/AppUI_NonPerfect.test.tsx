import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import App from './App';

import { useGameState } from './hooks/useGameState';

// Mock hook with default values
const mockResetProgress = vi.fn();

const mockGameState = {
    puzzle: { letters: 'ABCDE'.repeat(5).split(''), centerLetter: 'A' },
    currentInput: '',
    submissions: ['ABCDE', 'FGHIJ', 'KLMNO', 'PQRST', 'UVWXY', 'ZZZZZ'],
    displayLetters: 'ABCDE'.repeat(5).split('').map((c, i) => ({ char: c, status: 'consumed', id: i })),
    gameState: { isComplete: true, score: 6, capturedCounts: {} },
    handleTileClick: vi.fn(),
    clearSelection: vi.fn(),
    submitWord: vi.fn(),
    resetProgress: mockResetProgress,
    gameMode: 'standard',
    toggleGameMode: vi.fn(),
    selectedIndices: [],
    isLoading: false,
    shuffleBoard: vi.fn()
};

vi.mock('./hooks/useGameState', () => ({
    useGameState: vi.fn(() => mockGameState)
}));

describe('App UI - Standard Mode - Imperfect Completion', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset the mock implementation for useGameState before each test
        vi.mocked(useGameState).mockReturnValue(mockGameState);
    });

    it('completes the game and shows PERF!', async () => {
        // Mock complete state (imperfect score but complete)
        vi.mocked(useGameState).mockReturnValue({
            ...mockGameState,
            gameState: { isComplete: true, score: 6 },
            submissions: Array(6).fill('ABCDE'),
        });

        const { getByText } = render(<App />);
        expect(getByText('P')).toBeTruthy();
        expect(getByText('!')).toBeTruthy();
    });

    it('clicking AGAIN triggers resetProgress', () => {
        vi.mocked(useGameState).mockReturnValue({
            ...mockGameState,
            gameState: { isComplete: true, score: 6 },
            resetProgress: mockResetProgress
        });

        const { getByText } = render(<App />);
        fireEvent.click(getByText('AGAIN'));
        expect(mockResetProgress).toHaveBeenCalled();
    });
});
