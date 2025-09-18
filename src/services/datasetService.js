// src/services/datasetService.js
import { db } from "../firebase";
import { collection, getDocs, getDoc, doc, query, where } from "firebase/firestore";

// In-memory cache to store datasets
let datasetCache = {
  dialogues: null,
  memes: null,
  trends: null,
  lastFetched: 0,
};

const CACHE_LIFETIME = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Validates the structure of a single data item.
 * @param {object} item - The data item to validate.
 * @returns {boolean} True if the item is valid, false otherwise.
 */
const validateDataItem = (item) => {
  return item && typeof item.id === 'string' && (typeof item.text === 'string' || typeof item.dialogue === 'string');
};

/**
 * Fetches all content items from the unified contentItems collection and groups them by type.
 * @returns {object} An object containing dialogues, memes, and trends.
 */
const fetchAllContentItems = async () => {
  console.log("📡 Fetching all content items from Firestore contentItems collection...");

  try {
    const q = query(collection(db, "contentItems"));
    const snapshot = await getDocs(q);

    // Initialize empty arrays for each type
    const dialogues = [];
    const memes = [];
    const trends = [];

    // Process each document and categorize by type
    snapshot.docs.forEach(doc => {
      const docData = doc.data();
      const item = {
        id: doc.id,
        ...docData
      };

      // Categorize based on type field and ensure consistent structure
      switch (docData.type) {
        case 'dialogue':
          dialogues.push({
            ...item,
            dialogue: docData.dialogue,
            situation: docData.situation || '',
            type: docData.type,
            tags: docData.tags || [],
            text: docData.dialogue, // For backward compatibility
            relevance: docData.tags || [] // For backward compatibility
          });
          break;
        case 'meme':
          memes.push({
            ...item,
            dialogue: docData.dialogue,
            situation: docData.situation || '',
            type: docData.type,
            tags: docData.tags || [],
            text: docData.dialogue, // For backward compatibility
            relevance: docData.tags || [] // For backward compatibility
          });
          break;
        case 'trend':
          trends.push({
            ...item,
            dialogue: docData.dialogue,
            situation: docData.situation || '',
            type: docData.type,
            tags: docData.tags || [],
            text: docData.dialogue, // For backward compatibility
            relevance: docData.tags || [] // For backward compatibility
          });
          break;
      }
    });

    // Basic validation to ensure data integrity
    const validatedDialogues = dialogues.filter(validateDataItem);
    const validatedMemes = memes.filter(validateDataItem);
    const validatedTrends = trends.filter(validateDataItem);

    if (validatedDialogues.length !== dialogues.length) {
      console.warn(`⚠️ Warning: Some dialogue documents were invalid and have been filtered out.`);
    }

    if (validatedMemes.length !== memes.length) {
      console.warn(`⚠️ Warning: Some meme documents were invalid and have been filtered out.`);
    }

    if (validatedTrends.length !== trends.length) {
      console.warn(`⚠️ Warning: Some trend documents were invalid and have been filtered out.`);
    }

    console.log(`✅ Fetched ${validatedDialogues.length} dialogues, ${validatedMemes.length} memes, and ${validatedTrends.length} trends from contentItems collection.`);

    return {
      dialogues: validatedDialogues,
      memes: validatedMemes,
      trends: validatedTrends
    };
  } catch (error) {
    console.error("❌ Error fetching content items:", error);
    return {
      dialogues: [],
      memes: [],
      trends: []
    };
  }
};

/**
 * Fetches a specific document by its ID from the contentItems collection.
 * @param {string} docId - The ID of the document to fetch.
 * @returns {Object|null} The document data, or null if not found.
 */
export const getDocumentById = async (docId) => {
  try {
    const docRef = doc(db, "contentItems", docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        dialogue: data.dialogue,
        situation: data.situation || '',
        type: data.type,
        tags: data.tags || [],
        text: data.dialogue, // For backward compatibility
        relevance: data.tags || [] // For backward compatibility
      };
    } else {
      console.warn(`⚠️ No such document: ${docId} in contentItems collection`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error fetching document ${docId}:`, error);
    return null;
  }
};

/**
 * Fetches all datasets with caching logic from the unified contentItems collection.
 * @returns {object} An object containing dialogues, memes, and trends.
 */
export const getAllDatasets = async () => {
  const now = Date.now();

  // Check if cache is still valid
  if (datasetCache.dialogues && (now - datasetCache.lastFetched < CACHE_LIFETIME)) {
    console.log("Using cached datasets.");
    return {
      dialogues: datasetCache.dialogues,
      memes: datasetCache.memes,
      trends: datasetCache.trends,
    };
  }

  console.log("Cache expired or empty. Fetching new datasets from contentItems collection...");
  try {
    const datasets = await fetchAllContentItems();

    // Update cache
    datasetCache = {
      dialogues: datasets.dialogues,
      memes: datasets.memes,
      trends: datasets.trends,
      lastFetched: now,
    };

    return datasets;
  } catch (error) {
    console.error("❌ Failed to fetch all datasets:", error);
    return { dialogues: [], memes: [], trends: [] }; // Return empty arrays on error
  }
};