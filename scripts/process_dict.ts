
import fs from 'fs';
import path from 'path';

const RAW_PATH = 'raw_source_dict.txt';
const OUT_PATH = 'public/dictionary.txt';

try {
    const raw = fs.readFileSync(RAW_PATH, 'utf-8');
    const lines = raw.split('\n');

    console.log(`Raw lines: ${lines.length}`);

    const words: string[] = [];

    for (const line of lines) {
        if (!line.trim()) continue;
        const [word] = line.trim().split('\t');

        if (word && word.length === 5 && /^[a-zA-Z]{5}$/.test(word)) {
            words.push(word.toUpperCase());
        }
    }

    console.log(`Filtered 5-letter words: ${words.length}`);

    // Write to file
    fs.writeFileSync(OUT_PATH, words.join('\n'));
    console.log(`Wrote to ${OUT_PATH}`);

} catch (e) {
    console.error("Error processing dictionary:", e);
}
