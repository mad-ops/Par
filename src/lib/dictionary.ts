export interface DictionaryData {
    allWords: Set<string>;
    commonWords: string[];
}

export const loadDictionary = async (): Promise<DictionaryData> => {
    try {
        const response = await fetch('/dictionary.txt');
        const text = await response.text();
        // Assume file is sorted by frequency (common first)
        const sortedWords = text.split(/\r?\n/)
            .map(w => w.trim().toUpperCase())
            .filter(w => w.length === 5 && /^[A-Z]{5}$/.test(w));

        console.log(`Dictionary loaded: ${sortedWords.length} words`);

        // 1. Top 25%
        const cutoff = Math.ceil(sortedWords.length * 0.25);
        let commonWords = sortedWords.slice(0, cutoff);
        const remainder = sortedWords.slice(cutoff);

        // 2. Ensure A-Z coverage
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
        const presentLetters = new Set<string>();

        commonWords.forEach(w => w.split('').forEach(char => presentLetters.add(char)));

        const missing = alphabet.filter(char => !presentLetters.has(char));

        if (missing.length > 0) {
            console.log("Common subset missing letters:", missing, "- Backfilling...");
            // For each missing letter, find the first (most common) word in remainder that has it
            for (const char of missing) {
                const found = remainder.find(w => w.includes(char));
                if (found) {
                    commonWords.push(found);
                    console.log(`Added ${found} to cover ${char}`);
                }
            }
        }

        return {
            allWords: new Set(sortedWords),
            commonWords
        };
    } catch (e) {
        console.error("Failed to load dictionary", e);
        return { allWords: new Set(), commonWords: [] };
    }
};
