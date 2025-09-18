import Fuse from "fuse.js";

// Find top N relevant items from dataset
export function findRelevantItems(userPrompt, dataset, type, limit = 3) {
    // Only filter dialogues/memes/trends based on type (if type field exists)
    // If type field doesn't exist, assume the dataset is already filtered
    const filtered = type ? dataset.filter(item => item.type === type) : dataset;

    // Setup fuzzy search with keys that might exist in either data structure
    const fuse = new Fuse(filtered, {
        keys: ["situation", "dialogue", "tags", "text", "relevance"], // fields to search
        threshold: 0.4, // lower = stricter match
    });

    // Search dataset with user prompt
    const results = fuse.search(userPrompt);

    // If no relevant items found, return a random sample from the filtered dataset
    if (results.length === 0 && filtered.length > 0) {
        // Shuffle the filtered dataset and return up to 'limit' items
        const shuffled = [...filtered].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(limit, shuffled.length));
    }

    // Return top matches
    return results.slice(0, limit).map(r => r.item);
}