import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import App from './App';

vi.mock('./hooks/useGameState', () => ({
    useGameState: () => ({
        puzzle: { letters: 'ABCDE'.repeat(5).split(''), centerLetter: 'A' },
        currentInput: '',
        submissions: ['ABCDE', 'FGHIJ', 'KLMNO', 'PQRST', 'UVWXY'], // 5 submissions
        displayLetters: 'ABCDE'.repeat(5).split('').map((c, i) => ({ char: c, status: 'consumed', id: i })),
        gameState: { isComplete: true, score: 5, capturedCounts: {} }, // Complete!
        handleTileClick: vi.fn(),
        clearSelection: vi.fn(),
        submitWord: vi.fn(),
        resetProgress: vi.fn(),
        gameMode: 'standard',
        toggleGameMode: vi.fn(),
        selectedIndices: [],
        isLoading: false,
        shuffleBoard: vi.fn()
    })
}));

describe('App UI - Standard Mode - Batch 4 (Completion)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // TEST 32 - Score check
    it('does NOT show final score in standard mode', () => {
        render(<App />);
        expect(screen.queryByText(/SCORE:/)).toBeNull();
    });

    // TEST 34


    // TEST 35
    it('renders PERF! in InputRow on completion', () => {
        // This test relies on the top-level mock of useGameState which sets isComplete: true
        // and currentInput: '' (which is then overridden by the "PERF!" logic in InputRow).
        render(<App />);
        expect(screen.getAllByText('P').length).toBeGreaterThan(0);
        expect(screen.getAllByText('E').length).toBeGreaterThan(0);
        expect(screen.getAllByText('R').length).toBeGreaterThan(0);
        expect(screen.getAllByText('F').length).toBeGreaterThan(0);
        expect(screen.getAllByText('!').length).toBeGreaterThan(0);
    });

    // TEST 36
    it('hides Clear button', async () => {
        vi.useFakeTimers();
        render(<App />);
        act(() => {
            vi.advanceTimersByTime(2000);
        });
        expect(screen.queryByText('Clear')).toBeNull();
        vi.useRealTimers();
    });



});
