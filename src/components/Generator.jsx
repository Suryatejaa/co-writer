// Update src/components/Generator.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getOrGenerateBatchScripts, convertToCeltxFormat, testApiKey } from "../services/aiService";
import { db, analytics, withFirestoreErrorHandling } from "../firebase";
import { doc, getDoc, setDoc, increment, collection, query, where, getDocs } from "firebase/firestore";
import { logEvent } from "firebase/analytics";
// Fallback data imports
import defaultDialogues from "../../public/data/dialogues.json";
import defaultMemes from "../../public/data/memes.json";
import defaultTrends from "../../public/data/trends.json";
// Import the new relevance utility
import { findRelevantItems } from "../utils/relevance";
import Input from "./ui/Input";
import Button from "./ui/Button";


// Cache to store generated script batches
const scriptCache = [];

export default function Generator() {
  const [topic, setTopic] = useState("");
  const [scripts, setScripts] = useState([]); // batch scripts
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGenerated, setIsGenerated] = useState(false);
  const [script, setScript] = useState(null); // Currently displayed script
  const [loading, setLoading] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [datasets, setDatasets] = useState({
    dialogues: defaultDialogues,
    memes: defaultMemes,
    trends: defaultTrends
  });

  // Log component re-renders
  useEffect(() => {
    console.log("🔄 Component re-rendered with state:", { topic, scripts, currentIndex, isGenerated, script, loading });
  });

  // Log whenever the script state changes
  useEffect(() => {
    console.log("🔍 Script state updated:", script);
  }, [script]);

  // Log whenever the scripts array state changes
  useEffect(() => {
    console.log("📚 Scripts array updated:", scripts);
  }, [scripts]);

  // Log whenever the datasets state changes
  useEffect(() => {
    console.log("📚 Datasets updated:", datasets);
  }, [datasets]);

  // Load settings and datasets from Firestore with enhanced error handling
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load AI mode setting with fallback
        const aiSetting = await withFirestoreErrorHandling(
          async () => {
            const settingsDoc = await getDoc(doc(db, "settings", "generator"));
            return settingsDoc.exists() ? settingsDoc.data().useAI : true;
          },
          true // fallback to AI mode
        );
        setUseAI(aiSetting);

        // Load datasets from Firestore contentItems collection
        const collections = ['dialogue', 'meme', 'trend'];
        const newDatasets = {
          dialogues: defaultDialogues,
          memes: defaultMemes,
          trends: defaultTrends
        };

        // Fetch data from contentItems collection
        for (const type of collections) {
          const collectionData = await withFirestoreErrorHandling(
            async () => {
              const q = query(collection(db, "contentItems"), where("type", "==", type));
              const querySnapshot = await getDocs(q);
              return querySnapshot.docs.map(doc => {
                const data = doc.data();
                // Map Firestore data to the expected format
                return {
                  dialogue: data.dialogue,
                  situation: data.situation,
                  type: data.type,
                  tags: data.tags || [],
                  createdAt: data.createdAt
                };
              });
            },
            [] // fallback to empty array
          );

          // Update the appropriate dataset
          if (type === 'dialogue') {
            newDatasets.dialogues = collectionData.length > 0 ? collectionData : defaultDialogues;
          } else if (type === 'meme') {
            newDatasets.memes = collectionData.length > 0 ? collectionData : defaultMemes;
          } else if (type === 'trend') {
            newDatasets.trends = collectionData.length > 0 ? collectionData : defaultTrends;
          }
        }

        console.log("📚 Loaded datasets from Firestore:", newDatasets);
        setDatasets(newDatasets);
      } catch (error) {
        console.log("Using default settings and data");
        // Keep defaults - no need to show error to user
      }
    };

    loadData();
  }, []);

  // Test API key on component mount
  useEffect(() => {
    const testApi = async () => {
      try {
        const isValid = await testApiKey();
        console.log("🔑 API key test result:", isValid);
      } catch (error) {
        console.error("❌ API key test failed:", error);
      }
    };

    testApi();
  }, []);

  // 🛡️ Script validation - Harvard-engineer level quality control
  const validateScript = (script, topic) => {
    const requiredSections = ['Hook:', 'Context:', 'Punchline:', 'Instagram Caption:'];
    const missingSections = requiredSections.filter(section => !script.includes(section));

    if (missingSections.length > 0) {
      throw new Error(`Script missing required sections: ${missingSections.join(', ')}`);
    }

    // Check if topic is mentioned
    if (!script.toLowerCase().includes(topic.toLowerCase())) {
      console.warn('Script may not be well-connected to the topic');
    }

    return true;
  };

  // 🛡️ JSON Script validation for new structured format
  const validateJSONScript = (scriptObj, topic) => {
    const requiredFields = ['hook', 'context', 'punchline', 'caption'];
    const missingFields = requiredFields.filter(field => !scriptObj[field]);

    if (missingFields.length > 0) {
      throw new Error(`Script missing required fields: ${missingFields.join(', ')}`);
    }

    // Check if topic is mentioned in any field
    const allContent = Object.values(scriptObj).join(' ').toLowerCase();
    if (!allContent.includes(topic.toLowerCase())) {
      console.warn('Script may not be well-connected to the topic');
    }

    return true;
  };

  const generateRuleBasedScript = (topic, dialogues, memes, trends) => {
    // 🛡️ Rule-based generation with same JSON structure as AI

    // Simple keyword extraction
    const extractKeywords = (topic) => {
      return topic.toLowerCase().split(/\s+/); // split by spaces
    };

    // Match score = count of overlapping keywords
    const matchScore = (topicKeywords, item) => {
      const itemKeywords = (item.relevance || []).map(k => k.toLowerCase());
      return topicKeywords.filter(k => itemKeywords.includes(k)).length;
    };

    // Smart selector
    const selectRelevantItems = (dataset, topic, max = 2) => {
      const keywords = extractKeywords(topic);

      // Rank items by score
      const ranked = dataset
        .map(item => ({ ...item, score: matchScore(keywords, item) }))
        .sort((a, b) => b.score - a.score);

      // If no relevant, fallback to random shuffle
      if (ranked[0].score === 0) {
        // Shuffle array
        const shuffled = [...dataset];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, max);
      }

      return ranked.slice(0, max);
    };

    // Select relevant items
    const selectedDialogues = selectRelevantItems(dialogues, topic, 2);
    const selectedMemes = selectRelevantItems(memes, topic, 1);
    const selectedTrends = selectRelevantItems(trends, topic, 1);

    const selectedDialogue = selectedDialogues[0]; // Pick first from shuffled
    const selectedMeme = selectedMemes[0]; // Pick first from shuffled
    const selectedTrend = selectedTrends[0]; // Pick first from shuffled

    // Return structured JSON object matching AI format
    return {
      hook: `"${selectedDialogue.text}" - ${selectedDialogue.actor} style se ${topic} gurinchi matladina!`,
      context: `${selectedTrend.headline} - ee news vinnaka ${topic} gurinchi alochinchadam start chesanu.`,
      punchline: `${selectedMeme.caption} - exactly ila react ayyanu ${topic} gurinchi!`,
      caption: `${topic} ante ila untadi ra! 😅\n#TeluguReels #${selectedMeme.tags?.[0] || 'funny'} #${selectedTrend.tags?.[0] || 'trending'}`,
      usedDataset: true // Rule-based always uses dataset
    };
  };

  const updateAnalytics = async (topic, mode, scriptObj) => {
    try {
      // Log to Firebase Analytics with enhanced tracking
      if (analytics) {
        await withFirestoreErrorHandling(
          async () => {
            logEvent(analytics, 'script_generated', {
              topic: topic,
              mode: mode,
              usedDataset: scriptObj?.usedDataset || false,
              datasetRelevance: scriptObj?.usedDataset ? 'relevant' : 'irrelevant'
            });
          },
          null // No fallback needed for analytics
        );
      }

      // Update Firestore metrics with dataset usage tracking
      await withFirestoreErrorHandling(
        async () => {
          const metricsRef = doc(db, "analytics", "metrics");
          const updateData = {
            scriptsGenerated: increment(1),
            [mode === 'ai' ? 'aiModeUsage' : 'ruleModeUsage']: increment(1),
            lastUpdated: new Date().toISOString()
          };

          // Track dataset usage for AI mode
          if (mode === 'ai' && scriptObj?.usedDataset !== undefined) {
            updateData[scriptObj.usedDataset ? 'datasetHits' : 'datasetMisses'] = increment(1);
          }

          await setDoc(metricsRef, updateData, { merge: true });

          // Update popular topics
          const topicsRef = doc(db, "analytics", "topics");
          await setDoc(topicsRef, {
            [topic.toLowerCase()]: increment(1)
          }, { merge: true });
        },
        null // No fallback needed for analytics
      );

    } catch (error) {
      console.log("Analytics update failed:", error.message);
      // Don't show error to user for analytics
    }
  };

  const handleTopicChange = (e) => {
    const newTopic = e.target.value;
    console.log("📝 Topic changing from", topic, "to", newTopic);
    setTopic(newTopic);

    // Only reset state when topic actually changes
    if (newTopic !== topic) {
      console.log("📝 Topic changed from", topic, "to", newTopic);
      // Reset state when topic changes
      setIsGenerated(false);
      setScripts([]);
      setCurrentIndex(0);
      setScript(null);
      console.log("🔄 State reset due to topic change");
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      alert("Please enter a topic!");
      return;
    }

    console.log("🔄 handleGenerate called with topic:", topic);
    console.log("🔍 Datasets being used:", {
      dialoguesLength: datasets.dialogues?.length,
      memesLength: datasets.memes?.length,
      trendsLength: datasets.trends?.length
    });

    // Validate datasets
    if (!datasets.dialogues || !datasets.memes || !datasets.trends) {
      console.error("❌ Datasets not properly loaded:", datasets);
      alert("Datasets not loaded properly. Please try again.");
      return;
    }

    if (datasets.dialogues.length === 0 || datasets.memes.length === 0 || datasets.trends.length === 0) {
      console.error("❌ Datasets are empty:", datasets);
      alert("Datasets are empty. Please try again.");
      return;
    }

    setLoading(true);
    try {
      if (!isGenerated) {
        // First time → API call with caching
        console.log("🚀 Generating new batch for topic:", topic);

        // Use relevance matching to find relevant items
        const relevantDialogues = findRelevantItems(topic, datasets.dialogues, "dialogue", 2);
        const relevantMemes = findRelevantItems(topic, datasets.memes, "meme", 1);
        const relevantTrends = findRelevantItems(topic, datasets.trends, "trend", 1);

        console.log("🔍 Relevant items found:", { relevantDialogues, relevantMemes, relevantTrends });

        const batch = await getOrGenerateBatchScripts(
          topic,
          relevantDialogues,
          relevantMemes,
          relevantTrends
        );

        console.log("📦 Received batch:", batch); // Debug batch content

        if (batch.length > 0) {
          // Ensure each script in the batch has the required fields
          const validatedBatch = batch.map(script => ({
            hook: script.hook || "No hook generated",
            context: script.context || "No context generated",
            punchline: script.punchline || "No punchline generated",
            caption: script.caption || "No caption generated",
            usedDataset: script.usedDataset !== undefined ? script.usedDataset : false
          }));

          console.log("✅ Validated batch:", validatedBatch); // Debug validated batch

          setScripts(validatedBatch);
          setCurrentIndex(0);
          setScript(validatedBatch[0]);
          setIsGenerated(true);

          console.log("🔄 State updated - Scripts:", validatedBatch); // Debug state update
          console.log("🔄 State updated - Current script:", validatedBatch[0]); // Debug current script
          console.log("🔄 State updated - isGenerated:", true); // Debug isGenerated state

          // Update analytics
          await updateAnalytics(topic, useAI ? 'ai' : 'rule', validatedBatch[0]);
        } else {
          // Handle error case
          const errorScript = {
            hook: "Error generating script. Please try again.",
            context: "There was a technical issue.",
            punchline: "System error occurred.",
            caption: "Oops! Something went wrong 😔",
            error: "generation_failed"
          };
          setScript(errorScript);
          console.log("❌ Error script set:", errorScript); // Debug error script
        }
      } else {
        // Re-generate → pick next from batch
        console.log("🔄 Cycling to next script. Current index:", currentIndex, "Scripts length:", scripts.length);
        if (currentIndex + 1 < scripts.length) {
          const nextIndex = currentIndex + 1;
          setCurrentIndex(nextIndex);
          setScript(scripts[nextIndex]);

          console.log("🔄 Cycling to next script:", scripts[nextIndex]); // Debug script cycling

          // Update analytics
          await updateAnalytics(topic, useAI ? 'ai' : 'rule', scripts[nextIndex]);
        } else {
          // If batch is exhausted, generate a new batch
          console.log("🔄 Batch exhausted, generating new batch");

          // Use relevance matching to find relevant items
          const relevantDialogues = findRelevantItems(topic, datasets.dialogues, "dialogue", 2);
          const relevantMemes = findRelevantItems(topic, datasets.memes, "meme", 1);
          const relevantTrends = findRelevantItems(topic, datasets.trends, "trend", 1);

          console.log("🔍 Relevant items found:", { relevantDialogues, relevantMemes, relevantTrends });

          const batch = await getOrGenerateBatchScripts(
            topic,
            relevantDialogues,
            relevantMemes,
            relevantTrends
          );

          console.log("📦 Received new batch:", batch); // Debug new batch content

          if (batch.length > 0) {
            // Ensure each script in the batch has the required fields
            const validatedBatch = batch.map(script => ({
              hook: script.hook || "No hook generated",
              context: script.context || "No context generated",
              punchline: script.punchline || "No punchline generated",
              caption: script.caption || "No caption generated",
              usedDataset: script.usedDataset !== undefined ? script.usedDataset : false
            }));

            console.log("✅ Validated new batch:", validatedBatch); // Debug validated new batch

            setScripts(validatedBatch);
            setCurrentIndex(0);
            setScript(validatedBatch[0]);

            console.log("🔄 New state updated - Scripts:", validatedBatch); // Debug new state update
            console.log("🔄 New state updated - Current script:", validatedBatch[0]); // Debug new current script

            // Update analytics
            await updateAnalytics(topic, useAI ? 'ai' : 'rule', validatedBatch[0]);
          } else {
            // Handle error case
            const errorScript = {
              hook: "Error generating script. Please try again.",
              context: "There was a technical issue.",
              punchline: "System error occurred.",
              caption: "Oops! Something went wrong 😔",
              error: "generation_failed"
            };
            setScript(errorScript);
            console.log("❌ Error script set:", errorScript); // Debug error script
          }
        }
      }
    } catch (error) {
      console.error("Error generating script:", error);
      const errorScript = {
        hook: "Error generating script. Please try again.",
        context: "There was a technical issue.",
        punchline: "System error occurred.",
        caption: "Oops! Something went wrong 😔",
        error: "generation_failed"
      };
      setScript(errorScript);
      console.log("❌ Error script set:", errorScript); // Debug error script
    }
    setLoading(false);
    console.log("🔄 handleGenerate finished. Loading state:", false);
  };

  const toggleAI = async () => {
    const newValue = !useAI;
    setUseAI(newValue);

    // Reset state when switching between AI and rule-based
    setIsGenerated(false);
    setScripts([]);
    setCurrentIndex(0);
    setScript(null);

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
      console.log(`✅ AI Mode ${newValue ? 'enabled' : 'disabled'}`);
    } else {
      console.log(`⚠️ AI setting updated locally but not synced to cloud`);
    }
  };

  return (
    <div className="contribute-container">
      {/* Header - Professional style with retro cyberpunk vibe */}
      <motion.div
        className="flex flex-col gap-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1>Telugu Script Generator</h1>
        <div className="px-3 py-1 bg-white/30 text-gray-700 rounded-full text-sm font-medium w-fit">
          {useAI ? "AI" : "RULE"}
        </div>
      </motion.div>

      {/* Input Section - Professional style with neon accents */}
      <motion.div
        className="space-y-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <div className="form-group">
          <label htmlFor="topic" className="form-label">Topic *</label>
          <Input
            id="topic"
            name="topic"
            value={topic}
            onChange={handleTopicChange}
            placeholder="Enter topic..."
            required
            className="w-full"
          />
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="form-button"
            variant="primary"
            size="md"
          >
            {loading ? "Generating..." : (isGenerated ? "Re-generate" : "Generate")}
          </Button>
          <Button
            onClick={toggleAI}
            className="form-button"
            variant="secondary"
            size="md"
          >
            {useAI ? "AI" : "RULE"}
          </Button>
        </div>
      </motion.div>

      {/* Script Output - Mobile optimized with glass-card panels */}
      {(script || isGenerated) && (
        <motion.div
          className="contribute-form"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {console.log("🔄 Rendering script output. Script:", script, "isGenerated:", isGenerated)}
          {script && script.error && (
            <div className="form-success-message">
              ⚠ {script.error}
            </div>
          )}

          <h3 className="text-lg font-semibold text-gray-800 border-b border-white/30 pb-2">
            ▶ Generated Telugu Script
          </h3>

          {/* Show message if script is null but isGenerated is true */}
          {!script && isGenerated && (
            <div className="form-success-message">
              ⚠ Script data not available. Please try generating again.
            </div>
          )}

          {/* Dataset Usage Indicator */}
          {script && "usedDataset" in script && (
            <div className="form-success-message">
              {script.usedDataset ? "✓ DATASET" : "· AI GEN"}
            </div>
          )}

          {/* Hook Section - Glass card panel */}
          <div className="form-group">
            <label className="form-label">• Hook</label>
            <div className="form-control">
              {script ? (script.hook || "No hook generated") : "Loading..."}
            </div>
          </div>

          {/* Context Section - Glass card panel */}
          <div className="form-group">
            <label className="form-label">• Context</label>
            <div className="form-control">
              {script ? (script.context || "No context generated") : "Loading..."}
            </div>
          </div>

          {/* Punchline Section - Glass card panel */}
          <div className="form-group">
            <label className="form-label">• Punchline</label>
            <div className="form-control">
              {script ? (script.punchline || "No punchline generated") : "Loading..."}
            </div>
          </div>

          {/* Instagram Caption Section - Glass card panel */}
          <div className="form-group">
            <label className="form-label">• Caption</label>
            <div className="form-control">
              {script ? (script.caption || "No caption generated") : "Loading..."}
            </div>
          </div>

          {/* Copy Button with neon hover effect */}
          <Button
            onClick={() => {
              const fullScript = `Hook: ${script.hook}

Context: ${script.context}

Punchline: ${script.punchline}

Caption: ${script.caption}`;
              navigator.clipboard.writeText(fullScript);
              alert('Script copied to clipboard!');
            }}
            className="form-button"
            variant="primary"
            size="md"
          >
            ⧉ Copy Script
          </Button>

          {/* Export to Celtx Button with neon hover effect */}
          <Button
            onClick={() => {
              const celtxScript = convertToCeltxFormat(script);
              const blob = new Blob([celtxScript], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `telugu-reel-${topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.celtx`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              alert('Celtx format script downloaded!');
            }}
            className="form-button"
            variant="secondary"
            size="md"
          >
            ⬇ Export Celtx Format
          </Button>
        </motion.div>
      )}

      {/* Info Panel - Mobile optimized with glass-card styling */}
      <motion.div
        className="contribute-form"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        <div className="text-center font-semibold text-gray-800 mb-2">
          ▪ System Info
        </div>

        <div className="grid gap-1 text-xs text-gray-600">
          <div>• JSON output enforced</div>
          <div>• 4-section validation</div>
          <div>• Dataset content only</div>
          <div>• Max 2 dialogues, 1 meme, 1 trend</div>
          <div>• Actor style preserved</div>
          <div>• PG-13 Telugu-English humor</div>
        </div>

        <div className="text-xs italic mt-2 text-center text-gray-500">
          Data: {datasets.dialogues === defaultDialogues ? 'local' : 'firestore'}
        </div>
      </motion.div>
    </div>
  );
}