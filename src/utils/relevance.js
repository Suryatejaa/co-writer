import Fuse from "fuse.js";

// Find top N relevant items from dataset
export function findRelevantItems(userPrompt, dataset, type, limit = 3) {
    // Only filter dialogues/memes/trends based on type
    const filtered = dataset.filter(item => item.type === type);

    // Setup fuzzy search
    const fuse = new Fuse(filtered, {
        keys: ["situation", "dialogue", "tags"], // fields to search
        threshold: 0.4, // lower = stricter match
    });

    // Search dataset with user prompt
    const results = fuse.search(userPrompt);

    // Return top matches
    return results.slice(0, limit).map(r => r.item);
}