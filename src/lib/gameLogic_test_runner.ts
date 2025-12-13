
import { generatePuzzle } from './gameLogic';
import { format } from 'date-fns';


// Mock dictionary
const mockDict = ['HELLO', 'WORLD', 'GAMES', 'TESTS', 'CODING'];

// Generate for today
const today = format(new Date(), 'yyyy-MM-dd');
const puzzle = generatePuzzle(today, mockDict);

console.log(`Board for ${today}:`);
for (let i = 0; i < 5; i++) {
    console.log(puzzle.letters.slice(i * 5, (i + 1) * 5).join(' '));
}
console.log('\nTarget Words:', puzzle.targetWords.join(', '));
