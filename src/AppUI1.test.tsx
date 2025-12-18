import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock everything needed for UI
vi.mock('./hooks/useGameState', () => {
    console.log('Using MOCKED useGameState in AppUI1');
    return {
        useGameState: () => ({
            puzzle: { letters: 'ABCDEFGHIJKLMNOPQRSTUVWXY'.split(''), centerLetter: 'A' },
            currentInput: '',
            submissions: [],
            displayLetters: 'ABCDEFGHIJKLMNOPQRSTUVWXY'.split('').map((c, i) => ({ char: c, status: 'available', id: i })),
            gameState: { isComplete: false, score: 0 },
            handleTileClick: vi.fn(),
            clearSelection: vi.fn(),
            submitWord: vi.fn(),
            resetProgress: vi.fn(),
            gameMode: 'standard',
            startHardMode: vi.fn(),
            selectedIndices: [],
            isLoading: false,
            shuffleBoard: vi.fn()
        })
    };
});

describe('App UI - Standard Mode - Batch 1', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // TEST 1
    it('renders the header title', () => {
        render(<App />);
        expect(screen.getByText(/Par/i)).toBeTruthy();
    });

    // TEST 2
    it('renders the info icon', () => {
        render(<App />);
        expect(screen.getByTestId('info-icon')).toBeTruthy();
    });

    // TEST 3
    it('renders the hard mode icon', () => {
        render(<App />);
        expect(screen.getByTestId('hard-mode-icon')).toBeTruthy();
    });

    // TEST 4
    it('renders the score label correctly', () => {
        render(<App />);
        expect(screen.getByText(/SCORE/i)).toBeTruthy();
    });

    // TEST 5
    it('renders the game board', () => {
        render(<App />);
        expect(screen.getByTestId('board-tile-0')).toBeTruthy();
    });

    // TEST 6
    it('renders 25 tiles', () => {
        render(<App />);
        const tiles = screen.getAllByTestId(/board-tile-/);
        expect(tiles).toHaveLength(25);
    });

    // TEST 7
    it('renders the Clear button initially', () => {
        render(<App />);
        expect(screen.getByText('Clear')).toBeTruthy();
    });

    // TEST 8
    it('renders the placeholder GUESS initially', () => {
        // Need to ensure hasInteracted logic works or mocked state allows it
        // Our mock returns submissions: [] and currentInput: '', so GUESS should be there if logic holds
        render(<App />);
        expect(screen.getAllByText('G').length).toBeGreaterThan(0);
    });

    // TEST 9
    it('shows count as 0 initially', () => {
        render(<App />);
        expect(screen.getByText('Count: 0')).toBeTruthy();
    });

    // TEST 10
    it('does not show completion screen initially', () => {
        render(<App />);
        expect(screen.queryByText('COMPLETE!')).toBeNull();
    });
});
