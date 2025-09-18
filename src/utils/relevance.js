import Fuse from "fuse.js";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

/**
 * Get relevant items from Firestore with genre awareness
 * @param {string} userPrompt - the user's prompt
 * @param {string} genre - selected genre (Comedy, Cinematic, Romantic, Emotional, Satire)
 * @returns {Promise<{ dialogues: Array, memes: Array, trends: Array }>}
 */
export async function getRelevantItems(userPrompt, genre) {
    // Step 1: Fetch all content items
    const snapshot = await getDocs(collection(db, "contentItems"));
    const allItems = snapshot.docs.map(doc => doc.data());

    if (!allItems.length) return { dialogues: [], memes: [], trends: [] };

    // Step 2: Setup Fuse.js for fuzzy matching
    const options = {
        includeScore: true,
        threshold: 0.4,
        keys: ["dialogue", "situation", "tags", "text", "headline", "caption"]
    };

    const fuse = new Fuse(allItems, options);

    // Step 3: Perform fuzzy search
    let results = fuse.search(userPrompt).map(res => res.item);

    // Step 4: Genre filter boost
    if (genre) {
        results = results.sort((a, b) => {
            const aMatch = a.tags?.some(tag =>
                tag.toLowerCase().includes(genre.toLowerCase())
            );
            const bMatch = b.tags?.some(tag =>
                tag.toLowerCase().includes(genre.toLowerCase())
            );
            return bMatch - aMatch; // push genre-matching items higher
        });
    }

    // Step 5: Split into categories
    const dialogues = results.filter(item => item.type === "dialogue").slice(0, 2);
    const memes = results.filter(item => item.type === "meme").slice(0, 1);
    const trends = results.filter(item => item.type === "trend").slice(0, 1);

    return { dialogues, memes, trends };
}

// Find top N relevant items from dataset with genre awareness
export function findRelevantItems(userPrompt, dataset, type, limit = 3, genre = null) {
    // Only filter dialogues/memes/trends based on type (if type field exists)
    // If type field doesn't exist, assume the dataset is already filtered
    const filtered = type ? dataset.filter(item => item.type === type) : dataset;

    // Setup fuzzy search with keys that might exist in either data structure
    const fuse = new Fuse(filtered, {
        keys: ["situation", "dialogue", "tags", "text", "relevance", "headline", "caption"], // fields to search
        threshold: 0.4, // lower = stricter match
    });

    // Search dataset with user prompt
    const results = fuse.search(userPrompt);

    // If genre is provided, boost items that match the genre
    let sortedResults = results.map(r => r.item);
    if (genre) {
        sortedResults = sortedResults.sort((a, b) => {
            const aMatch = a.tags?.some(tag =>
                tag.toLowerCase().includes(genre.toLowerCase())
            );
            const bMatch = b.tags?.some(tag =>
                tag.toLowerCase().includes(genre.toLowerCase())
            );
            return bMatch - aMatch; // push genre-matching items higher
        });
    }

    // If no relevant items found, return a random sample from the filtered dataset
    if (sortedResults.length === 0 && filtered.length > 0) {
        // Shuffle the filtered dataset and return up to 'limit' items
        const shuffled = [...filtered].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(limit, shuffled.length));
    }

    // Return top matches
    return sortedResults.slice(0, limit);
}