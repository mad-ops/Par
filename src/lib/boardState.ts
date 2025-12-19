export type BoardState = {
    letters: string[]; // Current sequence of 25 letters
    originalIndices: number[]; // Maps current position to original puzzle index (for tracking)
};

/**
 * Creates initial board state from puzzle letters.
 */
export const createInitialBoard = (letters: string[]): BoardState => {
    return {
        letters: [...letters],
        originalIndices: letters.map((_, i) => i)
    };
};

/**
 * Performs the row-swap logic for a submission.
 * 
 * Rules:
 * 1. Move the submission words to the target row (0-4, 5-9, etc).
 * 2. The letters currently AT the target row must be evacuated.
 * 3. Evacuation Strategy: Swap them to the positions vacated by the submission.
 * 
 * @param currentBoard Current state of the board
 * @param submissionIndices Indices (on current board) of the letters being consumed
 * @param targetRowIndex Index of the row (0, 1, 2, 3, 4) to fill
 */
export const swapRowsForSubmission = (
    currentBoard: BoardState,
    submissionIndices: number[],
    targetRowIndex: number
): { newBoard: BoardState, newSubmissionIndices: number[] } => {

    // Copy state
    const newLetters = [...currentBoard.letters];
    const newOriginalIndices = [...currentBoard.originalIndices];

    const targetStartIndex = targetRowIndex * 5;
    const targetIndices = Array.from({ length: 5 }, (_, i) => targetStartIndex + i);

    // Check if any submission index IS ALREADY in the target row?
    // If so, it stays put (conceptually)? No, user says "replace the row with that word".
    // "Move all unconsumed letters that are there back into the board where the consumed letters were".
    // This implies a direct SWAP of sets.

    // Set A: Indices of the submission (e.g. 10, 12, 24, 2, 3)
    // Set B: Indices of the target row (e.g. 0, 1, 2, 3, 4)

    // We want content at Set A to move to Set B.
    // Content at Set B (if unconsumed) move to Set A.

    // Collision handling: What if Set A overlaps Set B?
    // e.g. Target is 0-4. Submission uses index 2.
    // Content at 2 is part of submission. It should stay at 2 (or move to its slot in the word order).
    // Actually, order matters. The word "HELLO" needs to appear at 0,1,2,3,4.
    // H (at 10) -> 0
    // E (at 12) -> 1
    // L (at 2) -> 2
    // L (at 24) -> 3
    // O (at 3) -> 4

    // Displaced content:
    // Slot 0 (was 'X') -> moves to 10
    // Slot 1 (was 'Y') -> moves to 12
    // Slot 2 (was 'L') -> This was used! So it effectively stays (or swap logic handles it naturally?)
    // Wait, if I swap 2 with 2, it stays. Perfect.

    // Algorithm:
    // Iterate 0 to 4.
    // For each position i in target (0..4):
    //   Source index s = submissionIndices[i] (where letter i of word is currently)
    //   Target index t = targetIndices[i]
    //   Swap content at s and t.
    //
    // Note: If we just swap one by one, we might shuffle things around incorrectly if overlaps occur.
    // Example: Word "AB" at indices [1, 0]. Target [0, 1].
    // i=0: Source 1 ('A'), Target 0 ('B'). Swap. new board: ['A', 'B'].
    // i=1: Source 0 ('B' - wait, changed!), Target 1. 
    // We need to work with VALUES/SNAPSHOTS or manage updates carefully.

    // Better Approach:
    // Create mapping of New Index -> Old Index.
    // Then reconstruct.

    // Map:
    // Target Indices [0,1,2,3,4] take content from [s0, s1, s2, s3, s4].
    // Source Indices [s0, s1...] take content from [t0, t1...].
    // Everything else stays equal.

    // But wait, s0 might equal t0.
    // s0 might equal t1? No, logic is just "put word here".
    // Overlapping sets logic:
    // Let Permutation P be defined such that:
    // P[t_i] = s_i  (Target gets content from Source)
    // P[s_i] = t_i  (Source gets content from Target)
    // P[x] = x      (Others unchanged)

    // Checks for conflict:
    // If s_i is also a t_j.
    // Example: Target [0,1]. Submission indices [1, 5]. Word "HI".
    // 1 ('H') needs to go to 0. old 0 ('X') needs to go to 1?
    // 5 ('I') needs to go to 1. old 1 ('H') needs to go to 5?
    // Result expected:
    // 0: 'H'
    // 1: 'I'
    // 5: 'X' (from old 0).
    // 1? It was overwritten by 'I'.

    // So it's a cyclic permutation group?
    // Let's create a temporary buffer.

    const bufferLetters = [...newLetters];
    const bufferIndices = [...newOriginalIndices];

    // 1. Snapshot values at Source lines.
    const submissionContent = submissionIndices.map(idx => ({
        char: bufferLetters[idx],
        origIdx: bufferIndices[idx]
    }));

    // 2. Snapshot values at Target lines.
    // (We iterate using targetIndices directly in loops below, so explicit snapshot of this not strictly needed unused var removed)

    // 3. Write Submission Content into Target Indices
    for (let i = 0; i < 5; i++) {
        const tIdx = targetIndices[i];
        newLetters[tIdx] = submissionContent[i].char;
        newOriginalIndices[tIdx] = submissionContent[i].origIdx;
    }

    // 4. Write Displaced Content into Source Indices
    // Crucial: A Source Index might ALSO be a Target Index.
    // If s_i was in target range, we just overwrote it in step 3.
    // BUT we shouldn't put displaced content there?
    // Wait, if s_i is in target range, it means the letter was already in the row.
    // Example: Word at [0, 5, 2]. Target [0, 1, 2].
    // 0 is s_0 and t_0.
    // 2 is s_2 and t_2.
    // 5 is s_1, t_1 is 1.
    //
    // Op:
    // Write s_0(val) to t_0. (Same).
    // Write s_1(val) to t_1. (val at 5 goes to 1).
    // Write s_2(val) to t_2. (Same).
    //
    // Now Displaced:
    // Content from t_0(val) goes to s_0. (Same).
    // Content from t_1(val) goes to s_1 (val at 1 goes to 5).
    // Content from t_2(val) goes to s_2. (Same).

    // IMPORTANT CORNER CASE:
    // What if s_i != t_i, but s_i is in target set?
    // e.g. Target [0, 1]. Source [1, 5]. Word "AB".
    // Board: [X, A, Y, Z, Z, B]
    // 0: X, 1: A, 5: B.
    // Wanted:
    // 0: A
    // 1: B
    // 5: X (the displaced letter)
    // What happened to Y (old val at 2)? It stays.
    // What happened to A (old val at 1)? It moved to 0.
    // What happened to X (old val at 0)? It moved to [1]? NO, 1 is filled by B.
    // X needs to go to where B came from (5).

    // Actually, we can model this as a rotation if we sort it right?
    // No, simplest logic:
    // "Move all unconsumed letters that are there back into the board where the consumed letters were."
    // Means: For every i in 0..4:
    //   Value at targetIndices[i] moves to submissionIndices[i].
    //   Value at submissionIndices[i] moves to targetIndices[i].
    //
    // If targetIndices[i] == submissionIndices[i], nothing happens.
    //
    // Does this handle overlaps correctly?
    // Case [1, 5] -> [0, 1].
    // Pair 0: Swap content of 1 and 0.
    //    Board: [A, X, ..., B]
    //    Indices involved: 0, 1. (s=1, t=0).
    //    Result: [A, X] at positions 0, 1? No.
    //    Swap(0, 1) -> Board[0]=A, Board[1]=X.
    // Pair 1: Swap content of 5 and 1.
    //    Current Board at 1 is 'X' (previously at 0).
    //    Board at 5 is 'B'.
    //    Swap(1, 5) -> Board[1]=B, Board[5]=X.
    // Final Board: 0:A, 1:B, 5:X.
    // THIS WORKS!
    // Simply iterating and executing SWAPS will propagate the changes correctly 
    // IF and ONLY IF the cyclic dependency allows serial swaps.

    // Wait, serial swaps might fail if complex cycles.
    // Let's verify [1, 0] -> [0, 1]. Word "AB". (A at 1, B at 0).
    // Pair 0: s=1, t=0. Swap(1, 0).
    //    Board: [A, B] -> [A, B] (swapped A and B). Now 0 is A, 1 is B.
    // Pair 1: s=0, t=1. Swap(0, 1).
    //    Board: [B, A].
    //    Result: Back to original. WRONG.
    //    Desired: A at 0, B at 1.
    //    We had it after first swap! The second swap reverted it because s=0 is now t=1's target.

    // Correct Logic:
    // We are establishing a set of moves.
    // Content(S_i) -> T_i
    // Content(T_i) -> S_i
    //
    // If S_i and T_j overlap, it gets tricky.
    // Ideally, we treat it as "unconsumed letters...". 
    // Any letter in Target Row that is NOT part of the submission should face eviction.
    // Any letter in Target Row that IS part of submission stays (conceptually).

    // Let's categorize:
    // 1. Tiles in Target Row that are part of submission (Stay put or shuffle within row).
    // 2. Tiles in Target Row that are NOT part of submission (Must be evicted).
    // 3. Tiles in Source (Submission) that are NOT in Target Row (Incomers).

    // Evictees must go to the seats vacated by Incomers.

    // Algorithm 2:
    // 1. Identify Incomers (Submission indices NOT in target row).
    // 2. Identify Evictees (Target indices NOT in submission).
    // 3. Identify Stayers (Target indices IN submission).
    //
    // Note: Count of Incomers MUST equal count of Evictees?
    // Size(Target) = 5. Size(Submission) = 5.
    // Overlap = K.
    // Incomers = 5 - K.
    // Evictees = 5 - K.
    // Yes.

    // Step 1: Write Stayers and Incomers into Target Row (forming the word).
    // Step 2: Write Evictees into the spots vacated by Incomers.

    // Example: [1, 0] -> [0, 1]. Word "AB".
    // 0 is in submission. 1 is in submission.
    // All are Stayers.
    // Incomers: None. Evictees: None.
    // Move: Just write A to 0, B to 1.
    // Since 0 and 1 are the source spots, we just shuffle them.
    // Result: A at 0, B at 1. Correct.

    // Example: [1, 5] -> [0, 1]. Word "AB".
    // Target: 0, 1. Submission: 1, 5.
    // Overlap: 1.
    // Stayer: 1. (It is in target and submission).
    // Incomer: 5. (In submission, not target).
    // Evictee: 0. (In target, not submission).
    //
    // Action:
    // Target 0 gets 'A' (from 1).
    // Target 1 gets 'B' (from 5).
    //
    // Spot 1 (vacated by A) is overwritten by B.
    // Spot 5 (vacated by B) usually gets Evictee.
    // But wait, Spot 1 was a TARGET.
    // Spot 5 is pure source.
    // Spot 0 is pure eviction.
    //
    // So Evictee (val at 0) goes to Vacated Source (5).
    // Value at 0 -> 5.
    // Value at 1 -> 0.
    // Value at 5 -> 1.
    //
    // Check:
    // 0 gets 1's val (A).
    // 1 gets 5's val (B).
    // 5 gets 0's val (X).
    // Result: 0:A, 1:B, 5:X. Correct.

    // Generalized Algo:
    // 1. Read all values from board into a temporary map/array to avoid partial overwrite issues.
    // 2. Write Submission chars to Target 0..4.
    // 3. Collect the "Evicted Values" (values that were at Target indices but weren't part of submission? No, simplified:
    //    Just take the values at Target indices that are NOT in the Stayer set?
    //    Actually, "unconsumed letters".
    //    The letters at Target Row are EITHER:
    //      a) Part of the word (Consumed)
    //      b) Not part of the word (Unconsumed)
    //    So we take the set of Unconsumed letters at Target Row.
    //    We move them to the Source positions that were NOT in Target Row.

    const incomerIndices = submissionIndices.filter(idx => !targetIndices.includes(idx));
    const evicteeIndices = targetIndices.filter(idx => !submissionIndices.includes(idx));

    // We also need to handle the word construction correctly.
    // We can't just move sets. We must place the word letters in order 0,1,2,3,4.

    // 1. Snapshot entire board content (to safely read old values).
    const snapshotLetters = [...currentBoard.letters];
    const snapshotOrig = [...currentBoard.originalIndices];

    // 2. Place Word: For i=0..4, TargetIndices[i] gets SubmissionIndices[i]'s content.
    for (let i = 0; i < 5; i++) {
        const t = targetIndices[i];
        const s = submissionIndices[i];

        newLetters[t] = snapshotLetters[s];
        newOriginalIndices[t] = snapshotOrig[s];
    }

    // 3. Place Evictees: Move content from Evictee Indices to Incomer Indices.
    // We map 1-to-1. Order doesn't strictly matter for "unconsumed letters", tracking is preserved by index.
    // But to be deterministic, let's zip them.
    for (let i = 0; i < evicteeIndices.length; i++) {
        const evictionSource = evicteeIndices[i];
        const evictionDest = incomerIndices[i];

        newLetters[evictionDest] = snapshotLetters[evictionSource];
        newOriginalIndices[evictionDest] = snapshotOrig[evictionSource];
    }

    // Return new state and the new indices for the submitted word (which are just targetIndices)
    return {
        newBoard: {
            letters: newLetters,
            originalIndices: newOriginalIndices
        },
        newSubmissionIndices: targetIndices
    };
};
