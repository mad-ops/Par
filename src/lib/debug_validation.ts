
import { validateSubmission } from './gameLogic';
import { loadDictionary } from './dictionary';
import { generatePuzzle } from './gameLogic';
import { format } from 'date-fns';

async function testValidation() {
    console.log("Loading dictionary...");
    const data = await loadDictionary();
    const dict = data.allWords;
    console.log(`Dictionary size: ${dict.size}`);

    const today = format(new Date(), 'yyyy-MM-dd');
    const puzzle = generatePuzzle(today, data.commonWords);

    console.log("Puzzle Letters:", puzzle.letters.join(''));

    // Pick a valid target word
    if (puzzle.targetWords.length > 0) {
        const target = puzzle.targetWords[0];
        console.log(`Testing with target word: ${target}`);

        const res = validateSubmission(target, puzzle.letters);
        console.log(`Validation result for ${target}:`, res);

        if (res.error) {
            console.error("FAIL: Target word rejected!");
        } else {
            console.log("PASS: Target word accepted.");
        }
    } else {
        console.log("No target words found in puzzle (dictionary issue?)");
    }
}

testValidation();
