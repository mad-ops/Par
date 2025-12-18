import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HardBoard } from './HardBoard';
import type { LetterState } from '../types';

describe('HardBoard Visuals', () => {
    const mockLetters: LetterState[] = Array(25).fill(null).map((_, i) => ({
        id: i,
        char: String.fromCharCode(65 + i), // A-Y
        status: 'available'
    }));

    it('applies correct vertical spacing class', () => {
        render(
            <HardBoard
                letters={mockLetters}
                selectedIndices={[]}
                onTileClick={vi.fn()}
            />
        );

        // Find the grid container (first div)
        // We can find it by looking for the parent of a tile, or just the first div in the render
        const tiles = screen.getAllByTestId(/board-tile-/);
        const gridContainer = tiles[0].parentElement;


        expect(gridContainer?.style.rowGap).toBe('8px');
        expect(gridContainer?.style.columnGap).toBe('4px');
        expect(gridContainer?.className).not.toContain('aspect-square');
    });

    it('renders all 25 tiles', () => {
        render(
            <HardBoard
                letters={mockLetters}
                selectedIndices={[]}
                onTileClick={vi.fn()}
            />
        );
        expect(screen.getAllByTestId(/board-tile-/)).toHaveLength(25);
    });
});
