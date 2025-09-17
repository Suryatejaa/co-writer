import { useState, useEffect } from "react";
import { db, withFirestoreErrorHandling } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import stringSimilarity from "string-similarity";

// 🔥 Smart Content-Based Merge Configuration
const SIMILARITY_THRESHOLD = 0.85; // 85% similarity threshold

// Telugu text normalization helper
function normalizeText(text) {
  if (!text) return "";
  return text
    .toLowerCase()
    .trim()
    .replace(/[\u200c\u200d]/g, '') // Remove zero-width characters
    .replace(/[!@#$%^&*(),.?":{}|<>]/g, ' ') // Replace punctuation with spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}

// 🔥 Smart Merge Engine - Content-Based Duplicate Detection
function smartContentMerge(existing, incoming, collection) {
  const merged = [...existing];
  let duplicatesSkipped = 0;
  let newItemsAdded = 0;

  incoming.forEach((newItem) => {
    // Get the main text field based on collection type
    let newText = "";
    if (collection === "dialogues") {
      newText = newItem.text || "";
    } else if (collection === "memes") {
      newText = newItem.caption || "";
    } else if (collection === "trends") {
      newText = newItem.headline || "";
    }

    const normalizedNewText = normalizeText(newText);

    // Check against all existing items
    const isDuplicate = existing.some((oldItem) => {
      let oldText = "";
      if (collection === "dialogues") {
        oldText = oldItem.text || "";
      } else if (collection === "memes") {
        oldText = oldItem.caption || "";
      } else if (collection === "trends") {
        oldText = oldItem.headline || "";
      }

      const normalizedOldText = normalizeText(oldText);

      // Skip if either text is empty
      if (!normalizedNewText || !normalizedOldText) return false;

      const similarity = stringSimilarity.compareTwoStrings(
        normalizedOldText,
        normalizedNewText
      );

      return similarity >= SIMILARITY_THRESHOLD;
    });

    if (!isDuplicate) {
      // Generate a unique ID if not present
      if (!newItem.id) {
        const prefix = collection === "dialogues" ? "dlg" : collection === "memes" ? "meme" : "trend";
        newItem.id = `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      merged.push(newItem);
      newItemsAdded++;
    } else {
      duplicatesSkipped++;
    }
  });

  return {
    data: merged,
    stats: {
      totalItems: merged.length,
      newItemsAdded,
      duplicatesSkipped,
      inputItems: incoming.length
    }
  };
}

export default function AdminPanel() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [jsonData, setJsonData] = useState("");
  const [collection, setCollection] = useState("dialogues");
  const [useAI, setUseAI] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [saveMode, setSaveMode] = useState("smart"); // Default to smart merge, only safe options
  const [currentDataInfo, setCurrentDataInfo] = useState({ count: 0, lastUpdated: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load current AI setting on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, "settings", "generator"));
        if (settingsDoc.exists()) {
          setUseAI(settingsDoc.data().useAI || true);
        }
      } catch (error) {
        console.warn("Failed to load settings from Firebase, using defaults:", error);
        // Keep default values
      }
    };
    loadSettings();
  }, []);

  // Load current dataset info when collection changes with enhanced error handling
  useEffect(() => {
    const loadDatasetInfo = async () => {
      const datasetInfo = await withFirestoreErrorHandling(
        async () => {
          const dataDoc = await getDoc(doc(db, "datasets", collection));
          if (dataDoc.exists()) {
            const data = dataDoc.data();
            return {
              count: data.data ? data.data.length : 0,
              lastUpdated: data.updatedAt || null
            };
          } else {
            return { count: 0, lastUpdated: null };
          }
        },
        { count: 0, lastUpdated: null } // fallback
      );

      setCurrentDataInfo(datasetInfo);
    };

    loadDatasetInfo();
  }, [collection]);

  if (authLoading) {
    return (
      <div style={{
        padding: "4px",
        textAlign: "center",
        backgroundColor: "#fff",
        border: "1px solid #000",
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace"
      }}>
        <div style={{ fontSize: "11px", color: "#000" }}>⟳ Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{
        padding: "4px",
        textAlign: "center",
        backgroundColor: "#fff",
        border: "1px solid #000",
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace"
      }}>
        <div style={{ fontSize: "11px", color: "#000", marginBottom: "4px" }}>
          ✕ Authentication Required
        </div>
        <div style={{ fontSize: "10px", color: "#666" }}>
          Signing in anonymously...
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{
        padding: "4px",
        textAlign: "center",
        backgroundColor: "#fff",
        border: "1px solid #000",
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace"
      }}>
        <div style={{ fontSize: "11px", color: "#000", marginBottom: "4px" }}>
          ✕ Admin Access Required
        </div>
        <div style={{ fontSize: "10px", color: "#000", marginBottom: "4px" }}>
          UID: <code style={{ backgroundColor: "#f0f0f0", padding: "1px 2px" }}>{user.uid.slice(0, 12)}...</code>
        </div>
        <div style={{ fontSize: "9px", color: "#666" }}>
          Contact administrator to add UID to admins collection.
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    // Prevent double submissions
    if (isSubmitting || loading) {
      return;
    }

    if (!jsonData.trim()) {
      setMessage("Please enter JSON data");
      return;
    }

    setIsSubmitting(true);
    setLoading(true);
    setMessage("");

    try {
      console.log('🚀 Starting save process for collection:', collection);
      const parsed = JSON.parse(jsonData);
      console.log('📋 Parsed data:', parsed.length, 'items');

      // Validate that it's an array
      if (!Array.isArray(parsed)) {
        throw new Error("Data must be an array");
      }

      let finalData, successMessage;

      // Get existing data from Firestore with enhanced error handling
      console.log('🔍 Loading existing data from Firestore...');
      const existingData = await withFirestoreErrorHandling(
        async () => {
          const existingDoc = await getDoc(doc(db, "datasets", collection));
          const data = existingDoc.exists() ? existingDoc.data().data || [] : [];
          console.log('📊 Existing data:', data.length, 'items');
          return data;
        },
        [] // fallback to empty array
      );

      if (saveMode === "append") {
        // Simple append mode - adds everything without duplicate checking
        finalData = [...existingData, ...parsed];
        successMessage = `✅ ${parsed.length} new items appended to ${collection}! Total: ${finalData.length} items`;
        console.log('📦 Append mode: Adding', parsed.length, 'items. Total:', finalData.length);
      } else {
        // 🔥 Smart Content-Based Merge (default)
        console.log('🧠 Running smart merge...');
        const mergeResult = smartContentMerge(existingData, parsed, collection);
        finalData = mergeResult.data;
        const { newItemsAdded, duplicatesSkipped, inputItems } = mergeResult.stats;
        console.log('📈 Merge result:', { newItemsAdded, duplicatesSkipped, inputItems, totalAfter: finalData.length });

        successMessage = `🔥 Smart merge completed!
• Input items: ${inputItems}
• New items added: ${newItemsAdded}
• Duplicates detected & skipped: ${duplicatesSkipped}
• Total dataset: ${finalData.length} items

Duplicate detection based on ${Math.round(SIMILARITY_THRESHOLD * 100)}% content similarity.`;
      }

      // Save to Firestore with enhanced error handling
      console.log('💾 Saving to Firestore...', finalData.length, 'items');
      const saveSuccess = await withFirestoreErrorHandling(
        async () => {
          await setDoc(doc(db, "datasets", collection), {
            data: finalData,
            updatedAt: new Date().toISOString(),
            totalItems: finalData.length,
            lastMergeMode: saveMode
          });
          console.log('✅ Successfully saved to Firestore!');
          return true;
        },
        false // fallback to false indicating save failed
      );

      if (!saveSuccess) {
        successMessage += "\n\n⚠️ Note: Data processed successfully but not synced to cloud due to connection issues.";
        console.warn('⚠️ Save to Firestore failed, using local data only');
      }

      // Update local info display
      setCurrentDataInfo({
        count: finalData.length,
        lastUpdated: new Date().toISOString()
      });

      // Clear the form data after successful submission
      setJsonData("");
      setMessage(successMessage);
      console.log('✅ Save process completed successfully!');

      // Auto-clear success message after 8 seconds (longer for smart merge details)
      setTimeout(() => {
        setMessage("");
      }, 8000);

    } catch (err) {
      console.error("❌ Error saving data:", err);
      setMessage(`❌ Error: ${err.message}`);

      // Auto-clear error message after 8 seconds
      setTimeout(() => {
        setMessage("");
      }, 8000);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const toggleAI = async () => {
    const newValue = !useAI;
    setUseAI(newValue);

    // Save to Firestore with enhanced error handling
    const saveSuccess = await withFirestoreErrorHandling(
      async () => {
        await setDoc(doc(db, "settings", "generator"), {
          useAI: newValue,
          updatedAt: new Date().toISOString()
        });
        return true;
      },
      false // fallback to false indicating save failed
    );

    if (saveSuccess) {
      setMessage(`✅ AI Mode ${newValue ? 'enabled' : 'disabled'}`);
    } else {
      setMessage(`⚠️ AI setting updated locally but not synced to cloud`);
    }
  };

  const sampleData = {
    dialogues: `[
  {
    "id": "dlg_new",
    "text": "New dialogue text",
    "actor": "Actor Name",
    "movie": "Movie Name",
    "year": 2024,
    "tags": ["funny", "popular"]
  }
]`,
    memes: `[
  {
    "id": "meme_new",
    "template": "template-name.png",
    "caption": "Caption text",
    "tags": ["funny", "reaction"]
  }
]`,
    trends: `[
  {
    "id": "trend_new",
    "headline": "News headline",
    "source": "News Source",
    "date": "2024-01-01",
    "tags": ["trending", "news"]
  }
]`
  };

  const loadSample = () => {
    setJsonData(sampleData[collection]);
  };

  return (
    <div style={{
      padding: "4px",
      border: "1px solid #000",
      backgroundColor: "#fff",
      width: "100%",
      boxSizing: "border-box",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace"
    }}>
      {/* Admin User Info */}
      <div style={{
        padding: "4px",
        backgroundColor: "#fff",
        border: "1px solid #000",
        marginBottom: "4px",
        fontSize: "10px",
        color: "#000",
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace"
      }}>
        <div style={{ fontWeight: "400", marginBottom: "2px" }}>
          ▪ Admin Access
        </div>
        <div>UID: <code style={{ backgroundColor: "#f0f0f0", padding: "1px 2px" }}>{user.uid.slice(0, 8)}...</code></div>
      </div>

      <h2 style={{
        fontSize: "14px",
        fontWeight: "400",
        marginBottom: "4px",
        color: "#000",
        textAlign: "left",
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace"
      }}>
        ▶ Dataset Management
      </h2>

      <div style={{ marginBottom: "4px" }}>
        <label style={{
          display: "block",
          marginBottom: "2px",
          fontWeight: "400",
          color: "#000",
          fontSize: "11px",
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace"
        }}>
          Dataset:
        </label>
        <select
          value={collection}
          onChange={(e) => setCollection(e.target.value)}
          style={{
            width: "100%",
            padding: "4px",
            border: "1px solid #000",
            fontSize: "11px",
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            backgroundColor: "#fff",
            color: "#000"
          }}
        >
          <option value="dialogues">dialogues</option>
          <option value="memes">memes</option>
          <option value="trends">trends</option>
        </select>
      </div>

      {/* Save Mode Selection */}
      <div style={{ marginBottom: "4px" }}>
        <label style={{
          display: "block",
          marginBottom: "2px",
          fontWeight: "400",
          color: "#000",
          fontSize: "11px",
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace"
        }}>
          Mode:
        </label>
        <select
          value={saveMode}
          onChange={(e) => setSaveMode(e.target.value)}
          style={{
            width: "100%",
            padding: "4px",
            border: "1px solid #000",
            fontSize: "11px",
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            backgroundColor: "#fff",
            color: "#000"
          }}
        >
          <option value="smart">smart-merge</option>
          <option value="append">append</option>
        </select>

        <div style={{
          fontSize: "9px",
          color: "#666",
          marginTop: "2px",
          padding: "2px",
          backgroundColor: "#f8f8f8",
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace"
        }}>
          {saveMode === 'append' && "adds all items (may create duplicates)"}
          {saveMode === 'smart' && "detects content duplicates using 85% similarity"}
        </div>
      </div>

      {/* Current Dataset Info */}
      <div style={{
        padding: "4px",
        backgroundColor: "#fff",
        border: "1px solid #000",
        marginBottom: "4px",
        fontSize: "10px",
        color: "#000",
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace"
      }}>
        <strong>Current {collection}:</strong> {currentDataInfo.count} items
        <br />Updated: {currentDataInfo.lastUpdated ? new Date(currentDataInfo.lastUpdated).toLocaleDateString() : 'never'}
      </div>

      {/* JSON Input */}
      <div style={{ marginBottom: "4px" }}>
        <label style={{
          display: "block",
          marginBottom: "2px",
          fontWeight: "400",
          color: "#000",
          fontSize: "11px",
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace"
        }}>
          JSON Data:
        </label>
        <textarea
          value={jsonData}
          onChange={(e) => setJsonData(e.target.value)}
          placeholder={`Enter ${collection} JSON array...`}
          style={{
            width: "100%",
            height: "120px",
            padding: "4px",
            border: "1px solid #000",
            fontSize: "10px",
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            resize: "vertical",
            boxSizing: "border-box",
            backgroundColor: "#fff",
            color: "#000"
          }}
        />
        <button
          onClick={loadSample}
          style={{
            marginTop: "2px",
            padding: "2px 4px",
            backgroundColor: "#666",
            color: "#fff",
            border: "1px solid #000",
            fontSize: "10px",
            cursor: "pointer",
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace"
          }}
        >
          load sample
        </button>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: "flex",
        gap: "4px",
        marginBottom: "4px"
      }}>
        <button
          onClick={handleSave}
          disabled={loading || isSubmitting}
          style={{
            flex: 1,
            padding: "4px",
            backgroundColor: loading || isSubmitting ? "#ccc" : "#000",
            color: "#fff",
            border: "1px solid #000",
            fontSize: "11px",
            cursor: loading || isSubmitting ? "not-allowed" : "pointer",
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace"
          }}
        >
          {loading ? "saving..." : `save ${collection}`}
        </button>
        <button
          onClick={toggleAI}
          style={{
            padding: "4px",
            backgroundColor: useAI ? "#000" : "#666",
            color: "#fff",
            border: "1px solid #000",
            fontSize: "11px",
            cursor: "pointer",
            minWidth: "60px",
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace"
          }}
        >
          {useAI ? "AI" : "RULE"}
        </button>
      </div>

      {/* Message Display */}
      {message && (
        <div style={{
          padding: "4px",
          backgroundColor: message.includes("❌") ? "#fff" : "#fff",
          color: "#000",
          border: "1px solid #000",
          fontSize: "10px",
          whiteSpace: "pre-line",
          marginTop: "4px",
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace"
        }}>
          {message}
        </div>
      )}
    </div>
  );
}

