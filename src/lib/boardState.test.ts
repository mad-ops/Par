import { describe, it, expect } from 'vitest';
import { createInitialBoard, swapRowsForSubmission, BoardState } from './boardState';

describe('swapRowsForSubmission', () => {
    it('swaps row 0 with scattered submission correctly', () => {
        // Setup a simple board: 25 letters "ABCDE FGHIJ ..."
        const letters = Array.from({ length: 25 }, (_, i) => String.fromCharCode(65 + i)); // A..Y
        const board = createInitialBoard(letters);
        // Board: 
        // 0:A, 1:B, 2:C, 3:D, 4:E
        // 5:F, 6:G, 7:H, 8:I, 9:J ...

        // Submission: Word using indices from scattered places.
        // Let's say word is "FGHIJ" from row 1.
        // Indices: 5, 6, 7, 8, 9.
        // Target: Row 0 (0, 1, 2, 3, 4).

        const submissionIndices = [5, 6, 7, 8, 9];
        const targetRow = 0;

        const result = swapRowsForSubmission(board, submissionIndices, targetRow);

        // Expected:
        // Position 0..4 should now contain contents of 5..9 => F, G, H, I, J
        // Position 5..9 should now contain evicted contents of 0..4 => A, B, C, D, E.

        const newL = result.newBoard.letters;
        expect(newL.slice(0, 5)).toEqual(['F', 'G', 'H', 'I', 'J']);
        expect(newL.slice(5, 10)).toEqual(['A', 'B', 'C', 'D', 'E']);

        // Indices should update to target
        expect(result.newSubmissionIndices).toEqual([0, 1, 2, 3, 4]);
    });

    it('handles overlaps (swapping with self)', () => {
        const letters = Array.from({ length: 25 }, (_, i) => String.fromCharCode(65 + i));
        const board = createInitialBoard(letters);

        // Submission "AB C D E".
        // A is at 0. B is at 1. C at 2...
        // Indices: 0, 1, 2, 3, 4.
        // Target: 0.

        const submissionIndices = [0, 1, 2, 3, 4];
        const result = swapRowsForSubmission(board, submissionIndices, 0);

        const newL = result.newBoard.letters;
        // Should be unchanged
        expect(newL.slice(0, 5)).toEqual(['A', 'B', 'C', 'D', 'E']);
        expect(result.newSubmissionIndices).toEqual([0, 1, 2, 3, 4]);
    });

    it('handles partial overlaps (complex swap)', () => {
        const letters = Array.from({ length: 25 }, (_, i) => String.fromCharCode(65 + i));
        const board = createInitialBoard(letters);

        // Target Row 0: [A, B, C, D, E] (Indices 0..4)
        // Submission: uses A(0), G(6), C(2), I(8), E(4).
        // Word: "A G C I E"
        // Indices: [0, 6, 2, 8, 4]

        // Target: 0 (0, 1, 2, 3, 4)
        // Overlap: 0, 2, 4.
        // Incomers: 6(G), 8(I). (At target slots 1 and 3).
        // Evictees: 1(B), 3(D). (Must go to slots 6 and 8).

        const submissionIndices = [0, 6, 2, 8, 4];
        const result = swapRowsForSubmission(board, submissionIndices, 0);
        const newL = result.newBoard.letters;

        // Check Target Row (0..4): Should be A G C I E
        expect(newL[0]).toBe('A');
        expect(newL[1]).toBe('G');
        expect(newL[2]).toBe('C');
        expect(newL[3]).toBe('I');
        expect(newL[4]).toBe('E');

        // Check Evictees move to source slots
        // B (was at 1) -> moves to where G was (6)
        expect(newL[6]).toBe('B');

        // D (was at 3) -> moves to where I was (8)
        expect(newL[8]).toBe('D');
    });
});
