import OpenAI from "openai";
import { logUsage } from "./usageTracker";

// 🔧 Utility function for exponential backoff
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 🎬 Function to convert script to Celtx format
export const convertToCeltxFormat = (script) => {
  if (!script || typeof script !== 'object') {
    return "Invalid script format";
  }

  // Extract a title from the caption or create a generic one
  const title = script.caption ?
    script.caption.split('\n')[0].replace(/[#@].*/g, '').trim() || 'Untitled Reel' :
    'Untitled Reel';

  // Format dialogues if they contain quotes and character names
  const formatDialogue = (text) => {
    // Check if text is in "dialogue" - character format
    if (text && text.includes('"') && text.includes('-')) {
      const parts = text.split(' - ');
      if (parts.length >= 2) {
        const dialogue = parts[0].trim();
        const character = parts[1].trim();
        return `${character}\n${dialogue}`;
      }
    }
    return text;
  };

  // Celtx format template for reels
  return `TITLE: ${title}

FADE IN:

SCENE: INT. SOCIAL MEDIA REEL - DAY

HOOK:
${formatDialogue(script.hook) || ''}

CONTEXT:
${formatDialogue(script.context) || ''}

PUNCHLINE:
${formatDialogue(script.punchline) || ''}

CAPTION (Social Media):
${script.caption || ''}

FADE OUT.`;
};

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_KEY,
  dangerouslyAllowBrowser: true
});

// Add a function to test the API key
export const testApiKey = async () => {
  try {
    console.log("🔍 Testing API key...");
    // Simple test request
    const testResponse = await client.models.list();
    console.log("✅ API key is valid");
    return true;
  } catch (error) {
    console.error("❌ API key test failed:", error);
    return false;
  }
};

export const generateCeltxScript = async (topic, tone = "Humorous Telugu-English mix", length = 30) => {
  const prompt = `
You are a professional Celtx-format screenwriter. For every request, return only plain text in Celtx-style screenplay format using the template:
SLUGLINE, DURATION, ACTION, SHOT, SFX/MUSIC, DIALOGUE (CHARACTER and optional parenthetical), VISUAL CUE, TRANSITION.
Keep lines short and reel-optimized. Do not include commentary, JSON, or extra explanation. Each beat should include approximate duration in mm:ss. Total runtime must sum to the reel length requested.

Topic: ${topic}
Tone: ${tone}
Reel length: ${length} seconds
Deliverable: Return only Celtx-style screenplay. Include ~4 beats, total ~${length}s, and a punchline.
`;

  try {
    const res = await client.chat.completions.create({
      model: "gpt-5-nano",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    // Log the raw response from the API
    console.log("Raw API Response:", res);

    // Check for errors in the response
    if (res.error) {
      console.error("API Error:", res.error);
      return [];
    }

    // 🔥 Log token usage
    const usageInfo = res.usage || { prompt_tokens: 0, completion_tokens: 0 };
    logUsage(usageInfo.prompt_tokens, usageInfo.completion_tokens);

    // Parse JSON
    let scripts = [];
    try {
      scripts = JSON.parse(res.choices[0].message.content);
      if (!Array.isArray(scripts)) scripts = [scripts]; // Ensure array
    } catch (err) {
      console.error("❌ JSON parse failed:", err);
      return [];
    }

    // Validate the generated scripts
    const validatedScripts = scripts.map(script => ({
      hook: script.hook || "No hook generated",
      context: script.context || "No context generated",
      punchline: script.punchline || "No punchline generated",
      caption: script.caption || "No caption generated",
      usedDataset: script.usedDataset !== undefined ? script.usedDataset : false
    }));

    console.log("Validated Scripts:", validatedScripts);

    // Save to Firestore
    await addDoc(collection(db, "scripts"), {
      topic,
      batch: validatedScripts,
      createdAt: Date.now(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days later
    });

    console.log("✅ Batch saved:", validatedScripts);
    return validatedScripts;
  } catch (error) {
    console.error("❌ Failed to generate batch:", error);
    return [];
  }
};

export const generateScript = async (topic, dialogues, memes, trends) => {
  // 🛡️ Input validation - Harvard-engineer level guardrails
  if (!topic || !dialogues?.length || !memes?.length || !trends?.length) {
    throw new Error('Missing required data: topic, dialogues, memes, or trends');
  }

  // 🎯 Use Fuse.js to find relevant items instead of custom selection logic
  const { findRelevantItems } = await import("../utils/relevance");

  // Find top relevant items using Fuse.js
  const selectedDialogues = findRelevantItems(topic, dialogues, "dialogue", 2);
  const selectedMemes = findRelevantItems(topic, memes, "meme", 1);
  const selectedTrends = findRelevantItems(topic, trends, "trend", 1);

  console.log("Selected items:", selectedDialogues, selectedMemes, selectedTrends);
  console.log('Topic:', topic);

  // 🔥 Upgraded prompt with strict topic grounding and dataset intelligence
  const prompt = `Your task is to generate a short Gen-Z Telugu-friendly script for a reel or sketch centered strictly on the given TOPIC, following these explicit requirements:

- Stay strictly on the **TOPIC**. Every part—Hook, Context, Punchline, Caption—must directly reference the TOPIC.
- Always output a single JSON object in this schema:
  {
    "hook": "[engaging opening that connects to TOPIC]",
    "context": "[develop the TOPIC, use trend if relevant]",
    "punchline": "[funny conclusion about TOPIC, use meme if relevant]",
    "caption": "[short Telugu-English mix caption about TOPIC]",
    "usedDataset": true/false
  }
- STRICT DATASET RULES:
    1. If *any* of the provided Dialogues, Memes, or Trends are relevant to the TOPIC:
        - Insert exactly 1–2 dialogues, 1 meme, and 1 trend from the relevant lists.
        - Select these items **randomly** (do not always pick the first option).
        - Use them exactly as provided (no paraphrasing).
        - Set \`"usedDataset": true\`.
    2. If NONE of the dataset entries are relevant to the TOPIC:
        - Compose original, naturally TOPIC-suited content that remains strictly on-topic and creatively executed.
        - Maintain a funny, relatable, PG-13 tone targeting a Gen-Z Telugu audience.
        - Set \`"usedDataset": false\`.
- The script must have four parts:
    1. **Hook**: Engaging opening strictly about the TOPIC. Should be suitable for a reel hook.
    2. **Context**: Develops the TOPIC; use trend if relevant. Should provide background for the reel.
    3. **Punchline**: Funny closing about the TOPIC; use meme if relevant. Should be the climax/moment of the reel.
    4. **Caption**: Short, Instagram-ready, in a Telugu-English mix, referencing the TOPIC. Should work as a social media caption.
- Do not drift from the TOPIC or copy irrelevant material. Do not recycle unrelated events.
- Each API call **must** vary the dataset selection if re-run on the same input (do not always pick the same options).
- Tone must be PG-13, directly relatable to the Gen-Z Telugu audience.
- For dialogues from the dataset, format them as "DIALOGUE TEXT" - CHARACTER NAME style when possible.
- Keep each section concise and suitable for short-form video content (reels).

DATASET (for possible inclusion if relevant):
- Dialogues:
${JSON.stringify(selectedDialogues, null, 2)}
- Memes:
${JSON.stringify(selectedMemes, null, 2)}
- Trends:
${JSON.stringify(selectedTrends, null, 2)}

TOPIC: "${topic}"

# Steps
1. Determine whether any dataset dialogue, meme, or trend is relevant to the TOPIC.
2. If yes, select the required number of each by random from the relevant entries, and use them verbatim. Set "usedDataset" to true.
3. If not, ignore the dataset and create all sections yourself, keeping tone and style requirements.
4. Compose four sections (hook, context, punchline, caption), each directly referencing the TOPIC.
5. Output **only** a valid JSON object matching the schema.

# Output Format

- Output must be a strict JSON object (never screenplay or explanatory text).
- JSON fields: "hook", "context", "punchline", "caption" (Telugu-English mix), "usedDataset".
- Do not wrap JSON in code blocks or prepend/append any extra text.

# Examples

Example when dataset applicable (realistic content should use placeholders below and fit requirements):

{
  "hook": "Ever wondered what happens when you bring [TOPIC] to college?",
  "context": "It's the same as the trending '[TREND_PLACEHOLDER]' everyone is doing this week.",
  "punchline": "Just like the meme—[MEME_PLACEHOLDER]—total disaster!",
  "caption": "ఏమైంది నీ [TOPIC] dreams? Insta-viral ayipothayi bro! 😂🔥",
  "usedDataset": true
}

Example when dataset not applicable (realistic content should use longer/shorter custom content as appropriate):

{
  "hook": "When [TOPIC] happens, every Telugu Amma reacts the same.",
  "context": "First they panic, then they ask for a TikTok tutorial.",
  "punchline": "Finally, they just blame the neighbours. Typical!",
  "caption": "[TOPIC] vibes only, Telugu moms edition! #relatable 😅💯",
  "usedDataset": false
}

# Notes

- Always stick rigidly to the TOPIC.
- Never include explanations, reasoning, or extra text; output pure JSON only.
- Ensure all selected dataset items are randomly chosen—do NOT default to first items.
- All generated script parts must be relatable, PG-13, and Gen-Z Telugu-audience friendly.
- Do not paraphrase or alter dataset items if used.
- Content should be suitable for conversion to Celtx screenplay format.

**Reminder:**  
Stay strictly on-topic, use the dataset only if relevant (and only as specified), and output only a valid, schema-compliant JSON object each time.`;

  // 🔧 Retry logic with exponential backoff for rate limit handling
  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await client.chat.completions.create({
        model: "gpt-5-nano", // cheap & good
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }, // ✅ guarantees JSON output
      });

      // 🔥 Log token usage
      const usageInfo = res.usage || { prompt_tokens: 0, completion_tokens: 0 };
      logUsage(usageInfo.prompt_tokens, usageInfo.completion_tokens);

      const scriptJson = JSON.parse(res.choices[0].message.content);
      return scriptJson;
    } catch (error) {
      console.error("Failed to generate script with relevance:", error);

      // If we hit a 429 error, wait with exponential backoff before retrying
      if (error.status === 429) {
        const waitTime = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s
        console.warn(`429 rate limit hit, retrying in ${waitTime}ms...`);
        await delay(waitTime);
      } else {
        // For non-rate limit errors, re-throw immediately
        throw error;
      }
    }
  }
};

/**
 * Generate a Telugu reel script with relevance extraction.
 * @param {string} topic - User's input topic
 * @param {Array} dialogues - Array of dialogues dataset
 * @param {Array} memes - Array of memes dataset
 * @param {Array} trends - Array of trends dataset
 * @returns {Object} JSON with keywords, selected items, and script
 */

/**
 * Generate a batch of 10 Telugu reel scripts for caching.
 * @param {string} topic - User's input topic
 * @param {Array} dialogues - Array of dialogues dataset
 * @param {Array} memes - Array of memes dataset
 * @param {Array} trends - Array of trends dataset
 * @returns {Array} Array of 10 script objects
 */
export const generateScriptBatch = async (topic, dialogues, memes, trends) => {
  const prompt = `
You are a Telugu reel script generator. 
You will receive a TOPIC and DATASETS (dialogues, memes, trends).

TASK:
1. Generate 10 unique Celtx-style reel scripts on the given TOPIC.
2. Each script should use items from the provided DATASETS when relevant.
3. STRICT RULES:
   - Each script must use exactly 1-2 dialogues, 1 meme, and 1 trend.
   - Do not invent or paraphrase outside dataset items.
   - If no strong matches exist, fallback to random dataset items.
   - Must return in JSON array format only.

Return JSON array in this format:
[
  {
    "keywords": ["keyword1","keyword2"],
    "selected": {
      "dialogues": ["dialogue1", "dialogue2"],
      "memes": ["meme1"],
      "trends": ["trend1"]
    },
    "script": {
      "hook": "...",
      "context": "...",
      "punchline": "...",
      "caption": "..."
    }
  },
  ...
]

TOPIC: "${topic}"

DATASETS:
Dialogues: ${JSON.stringify(dialogues)}
Memes: ${JSON.stringify(memes)}
Trends: ${JSON.stringify(trends)}
`;

  try {
    const res = await client.chat.completions.create({
      model: "gpt-5-nano",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }, // ✅ guarantees JSON output
    });

    console.log("AI raw response:", res);

    // 🔥 Log token usage
    const usageInfo = res.usage || { prompt_tokens: 0, completion_tokens: 0 };
    logUsage(usageInfo.prompt_tokens, usageInfo.completion_tokens);

    const batchJson = JSON.parse(res.choices[0].message.content);

    // Process each item in the batch to add fallback support
    const processedBatch = Array.isArray(batchJson) ? batchJson : [batchJson];

    for (let i = 0; i < processedBatch.length; i++) {
      const item = processedBatch[i];

      // 🔹 If nothing was selected → fallback prompt
      if (
        item.selected &&
        item.selected.dialogues &&
        item.selected.memes &&
        item.selected.trends &&
        item.selected.dialogues.length === 0 &&
        item.selected.memes.length === 0 &&
        item.selected.trends.length === 0
      ) {
        console.log(`No relevant dataset items found for batch item ${i}, using fallback prompt`);

        const fallbackPrompt = `
You are a Telugu reel scriptwriter. 
Generate a short reel script based only on the TOPIC and CONTEXT.

Return JSON in this format:
{
  "hook": "...",
  "context": "...",
  "punchline": "...",
  "caption": "..."
}

TOPIC: "${topic}"
CONTEXT: "General Telugu culture, humor, and trending reel style"
`;

        const fallbackRes = await client.chat.completions.create({
          model: "gpt-5-nano",
          messages: [{ role: "user", content: fallbackPrompt }],
          response_format: { type: "json_object" },
        });

        console.log("AI fallback response:", fallbackRes);

        // 🔥 Log token usage for fallback
        const fallbackUsageInfo = fallbackRes.usage || { prompt_tokens: 0, completion_tokens: 0 };
        logUsage(fallbackUsageInfo.prompt_tokens, fallbackUsageInfo.completion_tokens);

        const fallbackResult = JSON.parse(fallbackRes.choices[0].message.content);

        // Replace the item with fallback result
        processedBatch[i] = {
          keywords: [],
          selected: { dialogues: [], memes: [], trends: [] },
          script: fallbackResult,
          usedDataset: false,
          fallback: true
        };
      } else {
        // Add flags to indicate dataset was used
        item.usedDataset = true;
        item.fallback = false;
      }
    }

    return processedBatch;
  } catch (error) {
    console.error("Failed to generate script batch:", error);
    return [{
      keywords: [],
      selected: { dialogues: [], memes: [], trends: [] },
      script: {
        hook: "Error generating script batch.",
        context: "Please try again.",
        punchline: "Server error.",
        caption: "Oops! Something went wrong 😔",
      },
      usedDataset: false,
      fallback: true,
      error: true
    }];
  }
};

/**
 * Generate a batch of 3 Telugu reel scripts for a topic with caching
 * @param {string} topic - User's input topic
 * @param {Array} dialogues - Array of dialogues dataset
 * @param {Array} memes - Array of memes dataset
 * @param {Array} trends - Array of trends dataset
 * @returns {Array} Array of script objects
 */
export const generateBatchScripts = async (topic, dialogues, memes, trends, genre = "Comedy") => {
  console.log("🔍 generateBatchScripts called with:", { topic, dialoguesLength: dialogues?.length, memesLength: memes?.length, trendsLength: trends?.length, genre });

  // Validate input data
  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    console.error("❌ Invalid topic:", topic);
    return [];
  }

  // Note: We no longer validate that arrays must be non-empty because findRelevantItems 
  // now provides a fallback mechanism that may return empty arrays when no relevant items are found
  // Instead, we handle empty arrays gracefully in the prompt generation

  // Use relevance matching to find relevant items
  const { findRelevantItems } = await import("../utils/relevance");
  const selectedDialogues = findRelevantItems(topic, dialogues, "dialogue", 2);
  const selectedMemes = findRelevantItems(topic, memes, "meme", 1);
  const selectedTrends = findRelevantItems(topic, trends, "trend", 1);

  // Find the most relevant item to use as punchline suggestion
  const allItems = [...selectedDialogues, ...selectedMemes, ...selectedTrends];
  let punchlineSuggestion = null;

  if (allItems.length > 0) {
    // Sort by relevance score if available, otherwise use first item
    const sortedItems = allItems.sort((a, b) => (b.score || 0) - (a.score || 0));
    punchlineSuggestion = sortedItems[0];
  }

  console.log("🔍 Selected items:", {
    selectedDialogues: selectedDialogues.map(d => d.id),
    selectedMemes: selectedMemes.map(m => m.id),
    selectedTrends: selectedTrends.map(t => t.id),
    punchlineSuggestion: punchlineSuggestion?.id
  });
  console.log("🔍 Selected dialogues details:", selectedDialogues);
  console.log("🔍 Selected memes details:", selectedMemes);
  console.log("🔍 Selected trends details:", selectedTrends);

  // Create a prompt that generates Celtx screenplay format with controlled creativity
  let prompt = `
You are a Telugu-English Celtx screenplay writer for Instagram reels.  
Your job is to generate a short screenplay (20–30s) based strictly on the TOPIC and GENRE.

RULES:
1. Use **exactly one dialogue** from the provided DATASET (don't use more than one).  
2. Do not list multiple dataset items; just pick one that fits naturally.  
3. Build a **proper HOOK** in the first 5 seconds that makes it Instagram-viral (relatable, funny, emotional, or shocking depending on GENRE).  
4. Context must develop the situation. Punchline should land hard. Caption should be short, Gen-Z, Telugu-English mix.  
5. Use Celtx screenplay structure only. No JSON.
6. Include proper scene descriptions, character actions, and timing.
7. If a PUNCHLINE SUGGESTION is provided, consider using it as the punchline as it's highly relevant to the topic.

GENRE: ${genre}
TOPIC: "${topic}"
`;

  // Add punchline suggestion if available
  if (punchlineSuggestion) {
    prompt += `PUNCHLINE SUGGESTION (highly relevant to topic): ${JSON.stringify(punchlineSuggestion)}\n\n`;
  }

  // Add datasets to prompt only if they contain items
  if (selectedDialogues.length > 0) {
    prompt += `DATASET (choose 1 dialogue ONLY):\n${JSON.stringify(selectedDialogues, null, 2)}\n`;
  }

  // Add example format that matches the user's request exactly
  prompt += `
EXAMPLE OUTPUT:
TITLE: Paisa Pelliko Reel

FADE IN:

SLUGLINE
INT. LIVING ROOM – EVENING

HOOK (00:00–00:05)
RAJU
"Nuvvoka pani chey"

CONTEXT (00:06–00:15)
ANU
"Family family upma thini bathikesthunnara"

MOM
"Naaa savu nen sastha neekenduku"

PUNCHLINE (00:16–00:25)
ANU
"Nuv oka pani chay"

CAPTION (SOCIAL MEDIA)
"Sibling money fights in 30 seconds with Telugu memes! #TeluguReels #SiblingLove #MoneyTalk"

FADE OUT.

Generate exactly 3 different screenplay variations for the topic "${topic}" with genre "${genre}".
Each screenplay should be separated by "---" and follow the exact format above.
Use only one dialogue from the dataset in each screenplay.
`;

  try {
    console.log("🚀 Sending request to OpenAI API...");
    // Remove response_format to allow plain text output instead of JSON
    const res = await client.chat.completions.create({
      model: "gpt-5-nano",
      messages: [{ role: "user", content: prompt }],
    });

    console.log("✅ Received response from OpenAI API:", res);
    console.log(" Raw content:", res.choices[0].message.content);

    // 🔥 Log token usage
    const usageInfo = res.usage || { prompt_tokens: 0, completion_tokens: 0 };
    logUsage(usageInfo.prompt_tokens, usageInfo.completion_tokens);

    // Parse the plain text response into separate screenplays
    const rawContent = res.choices[0].message.content;
    console.log(" Raw content type:", typeof rawContent);
    console.log(" Raw content length:", rawContent.length);

    // Split by "---" to get individual screenplays
    const screenplaySections = rawContent.split('---');
    console.log("📦 Parsed screenplay sections:", screenplaySections.length);

    // Convert each section to a structured format
    const validatedScripts = screenplaySections
      .filter(section => section.trim().length > 0)
      .map((section, index) => {
        // Log each section for debugging
        console.log(`📄 Generated screenplay ${index}:`, section);

        // Create a safe punchline suggestion object for Firestore
        let safePunchlineSuggestion = null;
        if (punchlineSuggestion) {
          safePunchlineSuggestion = {
            id: punchlineSuggestion.id || null,
            text: punchlineSuggestion.text || punchlineSuggestion.dialogue || punchlineSuggestion.caption || punchlineSuggestion.headline || "",
            situation: punchlineSuggestion.situation || "",
            type: punchlineSuggestion.type || "dialogue"
          };

          // Remove any undefined values
          Object.keys(safePunchlineSuggestion).forEach(key => {
            if (safePunchlineSuggestion[key] === undefined) {
              safePunchlineSuggestion[key] = null;
            }
          });
        }

        return {
          screenplay: section.trim(),
          usedDataset: (selectedDialogues.length > 0 || selectedMemes.length > 0 || selectedTrends.length > 0),
          punchlineSuggestion: safePunchlineSuggestion
        };
      });

    // Save to Firestore with safe objects
    const batchToSave = validatedScripts.map(script => {
      // Create a Firestore-safe object
      const firestoreScript = {
        screenplay: script.screenplay,
        usedDataset: script.usedDataset
      };

      // Only add punchlineSuggestion if it exists and is not null
      if (script.punchlineSuggestion) {
        firestoreScript.punchlineSuggestion = script.punchlineSuggestion;
      }

      return firestoreScript;
    });

    await addDoc(collection(db, "scripts"), {
      topic,
      genre,
      batch: batchToSave,
      createdAt: Date.now(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days later
    });

    console.log("✅ Batch saved:", validatedScripts);
    return validatedScripts;
  } catch (error) {
    console.error("❌ Failed to generate batch:", error);
    // Log specific error details
    if (error.response) {
      console.error(" Response data:", error.response.data);
      console.error(" Response status:", error.response.status);
      console.error(" Response headers:", error.response.headers);
    } else if (error.request) {
      console.error(" Request data:", error.request);
    } else {
      console.error(" Error message:", error.message);
    }
    return [];
  }
};

// ✅ Check Firestore before hitting OpenAI
export const getOrGenerateBatchScripts = async (topic, dialogues, memes, trends, genre = "Comedy") => {
  try {
    console.log("🔍 getOrGenerateBatchScripts called with:", { topic, dialoguesLength: dialogues?.length, memesLength: memes?.length, trendsLength: trends?.length, genre });

    // 🔎 Query DB for existing batch with same topic and genre
    const q = query(
      collection(db, "scripts"),
      where("topic", "==", topic),
      where("genre", "==", genre)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      console.log("📂 Found existing batch in Firestore");

      // Check if batch is expired
      const doc = snapshot.docs[0];
      const data = doc.data();

      if (data.expiresAt && data.expiresAt.toMillis() < Date.now()) {
        console.log("🗑️ Batch expired, deleting...");
        await deleteDoc(doc.ref);
      } else {
        console.log("📤 Returning stored batch:", data.batch); // Debug stored batch

        // Validate and ensure each script in the batch has the required fields
        let validatedBatch = [];
        if (Array.isArray(data.batch)) {
          validatedBatch = data.batch.map((script, index) => {
            // Log each script for debugging
            console.log(`📄 Script ${index}:`, script);

            // Ensure script is an object
            if (typeof script !== 'object' || script === null) {
              console.warn(`⚠️ Script ${index} is not an object, creating fallback`);
              return {
                screenplay: "Error generating script. Please try again.\nThere was a technical issue.\nSystem error occurred.",
                usedDataset: false,
                punchlineSuggestion: null
              };
            }

            // Create a safe punchline suggestion object
            let safePunchlineSuggestion = null;
            if (script.punchlineSuggestion) {
              safePunchlineSuggestion = {
                id: script.punchlineSuggestion.id || null,
                text: script.punchlineSuggestion.text || "",
                situation: script.punchlineSuggestion.situation || "",
                type: script.punchlineSuggestion.type || "dialogue"
              };

              // Remove any undefined values
              Object.keys(safePunchlineSuggestion).forEach(key => {
                if (safePunchlineSuggestion[key] === undefined) {
                  safePunchlineSuggestion[key] = null;
                }
              });
            }

            return {
              screenplay: typeof script.screenplay === 'string' ? script.screenplay : "No screenplay generated",
              usedDataset: typeof script.usedDataset === 'boolean' ? script.usedDataset : false,
              punchlineSuggestion: safePunchlineSuggestion
            };
          });
        } else {
          // Handle case where batch is not an array (fallback)
          console.warn("⚠️ Batch is not an array, creating fallback script");
          validatedBatch = [{
            screenplay: "Error generating script. Please try again.\nThere was a technical issue.\nSystem error occurred.",
            usedDataset: false,
            punchlineSuggestion: null
          }];
        }

        console.log("✅ Validated stored batch:", validatedBatch);
        return validatedBatch; // return stored scripts
      }
    }

    // ❌ No batch found or expired → generate new
    console.log("📝 No existing batch. Calling OpenAI...");
    console.log("📤 Calling generateBatchScripts with:", { topic, dialoguesLength: dialogues?.length, memesLength: memes?.length, trendsLength: trends?.length, genre });
    const result = await generateBatchScripts(topic, dialogues, memes, trends, genre);
    console.log("📥 generateBatchScripts returned:", result);

    // If generateBatchScripts returned an empty array, use rule-based fallback
    if (!result || !Array.isArray(result) || result.length === 0) {
      console.log("⚠️ generateBatchScripts returned empty result, using rule-based fallback");
      const fallbackScript = generateRuleBasedScript(topic, dialogues, memes, trends, genre);
      return [fallbackScript];
    }

    return result;
  } catch (error) {
    console.error("❌ Failed to get or generate batch:", error);
    // Use rule-based fallback on error
    try {
      const fallbackScript = generateRuleBasedScript(topic, dialogues, memes, trends, genre);
      return [fallbackScript];
    } catch (fallbackError) {
      console.error("❌ Failed to generate fallback script:", fallbackError);
      return [];
    }
  }
};

// Add Firestore imports
import { db } from "../firebase";
import { collection, addDoc, query, where, getDocs, deleteDoc } from "firebase/firestore";

// Robust JSON extractor
function extractJSON(text) {
  if (!text) return null;

  // Try to parse directly first
  try {
    return JSON.parse(text);
  } catch (e) {
    // If that fails, try to extract JSON from text
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e2) {
        console.error("Failed to parse extracted JSON:", e2);
        return null;
      }
    }
    return null;
  }
}

// Rule-based fallback generator
function generateRuleBasedScript(topic, dialogues, memes, trends, genre = "Comedy") {
  // If we have relevant items, use them directly
  // Otherwise, use the selectRelevantItems function to find relevant items
  let selectedDialogues, selectedMemes, selectedTrends;

  if (dialogues.length > 0 || memes.length > 0 || trends.length > 0) {
    // We already have relevant items, use them directly
    selectedDialogues = dialogues.slice(0, 2);
    selectedMemes = memes.slice(0, 1);
    selectedTrends = trends.slice(0, 1);
  } else {
    // No relevant items provided, try to find some from default datasets
    // Import default datasets
    const defaultDialogues = [];
    const defaultMemes = [];
    const defaultTrends = [];

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
    selectedDialogues = selectRelevantItems(defaultDialogues, topic, 2);
    selectedMemes = selectRelevantItems(defaultMemes, topic, 1);
    selectedTrends = selectRelevantItems(defaultTrends, topic, 1);
  }

  // Find the most relevant item to use as punchline suggestion
  const allItems = [...selectedDialogues, ...selectedMemes, ...selectedTrends];
  let punchlineSuggestion = null;

  if (allItems.length > 0) {
    // Sort by relevance score if available, otherwise use first item
    const sortedItems = allItems.sort((a, b) => (b.score || 0) - (a.score || 0));
    punchlineSuggestion = sortedItems[0];
  }

  const selectedDialogue = selectedDialogues[0]; // Pick first from shuffled
  const selectedMeme = selectedMemes[0]; // Pick first from shuffled
  const selectedTrend = selectedTrends[0]; // Pick first from shuffled

  // Generate a screenplay format fallback based on genre
  const title = `Telugu Reel: ${topic}`;

  // Customize content based on genre
  let hookLine, contextLine, punchlineLine;

  // Use punchline suggestion if available
  if (punchlineSuggestion) {
    punchlineLine = `${punchlineSuggestion.text || punchlineSuggestion.dialogue || punchlineSuggestion.caption || punchlineSuggestion.headline || "No punchline available"}`;
  } else {
    switch (genre) {
      case "Comedy":
        hookLine = selectedDialogue ? `CHARACTER reacts with "${selectedDialogue.text || selectedDialogue.dialogue}"` : `CHARACTER makes a funny face about ${topic}`;
        contextLine = selectedTrend ? `TRENDING: ${selectedTrend.headline || selectedTrend.text}` : `Background music plays as CHARACTER explains ${topic}`;
        punchlineLine = selectedMeme ? `CHARACTER says "${selectedMeme.caption || selectedMeme.text}"` : `CHARACTER makes a joke about ${topic}`;
        break;
      case "Cinematic":
        hookLine = selectedDialogue ? `CHARACTER delivers "${selectedDialogue.text || selectedDialogue.dialogue}" dramatically` : `CHARACTER looks intensely at camera about ${topic}`;
        contextLine = selectedTrend ? `NEWS FLASH: ${selectedTrend.headline || selectedTrend.text}` : `Scene shows dramatic visuals related to ${topic}`;
        punchlineLine = selectedMeme ? `CHARACTER whispers "${selectedMeme.caption || selectedMeme.text}"` : `CHARACTER delivers climactic line about ${topic}`;
        break;
      case "Romantic":
        hookLine = selectedDialogue ? `CHARACTER whispers "${selectedDialogue.text || selectedDialogue.dialogue}" lovingly` : `CHARACTER gazes dreamily at ${topic}`;
        contextLine = selectedTrend ? `LOVE TREND: ${selectedTrend.headline || selectedTrend.text}` : `Romantic music plays as CHARACTER thinks about ${topic}`;
        punchlineLine = selectedMeme ? `CHARACTER says "${selectedMeme.caption || selectedMeme.text}" affectionately` : `CHARACTER expresses love for ${topic}`;
        break;
      case "Savage":
        hookLine = selectedDialogue ? `CHARACTER drops "${selectedDialogue.text || selectedDialogue.dialogue}" brutally` : `CHARACTER stares down ${topic} with attitude`;
        contextLine = selectedTrend ? `BURNING ISSUE: ${selectedTrend.headline || selectedTrend.text}` : `Intense beat drops as CHARACTER faces ${topic}`;
        punchlineLine = selectedMeme ? `CHARACTER claps back with "${selectedMeme.caption || selectedMeme.text}"` : `CHARACTER destroys ${topic} with savage wit`;
        break;
      default:
        hookLine = selectedDialogue ? `CHARACTER says "${selectedDialogue.text || selectedDialogue.dialogue}"` : `CHARACTER starts talking about ${topic}`;
        contextLine = selectedTrend ? `TRENDING: ${selectedTrend.headline || selectedTrend.text}` : `Background music plays as CHARACTER explains ${topic}`;
        punchlineLine = selectedMeme ? `CHARACTER says "${selectedMeme.caption || selectedMeme.text}"` : `CHARACTER makes a point about ${topic}`;
    }
  }

  // Create a basic screenplay format
  let screenplay = `TITLE: ${title}

FADE IN:

SLUGLINE
INT. SOCIAL MEDIA REEL - DAY

HOOK (00:00–00:05)
${hookLine || "CHARACTER enters scene"}

CONTEXT (00:06–00:15)
${contextLine || "Scene develops with background music"}

PUNCHLINE (00:16–00:25)
${punchlineLine || "CHARACTER delivers punchline"}

CAPTION (SOCIAL MEDIA)
"${topic} - Telugu style! 😂💯
#${topic.replace(/\s+/g, '')} #TeluguReels #${genre}"

FADE OUT.`;

  // Create a safe punchline suggestion object for Firestore
  let safePunchlineSuggestion = null;
  if (punchlineSuggestion) {
    safePunchlineSuggestion = {
      id: punchlineSuggestion.id || null,
      text: punchlineSuggestion.text || punchlineSuggestion.dialogue || punchlineSuggestion.caption || punchlineSuggestion.headline || "",
      situation: punchlineSuggestion.situation || "",
      type: punchlineSuggestion.type || "dialogue"
    };

    // Remove any undefined values
    Object.keys(safePunchlineSuggestion).forEach(key => {
      if (safePunchlineSuggestion[key] === undefined) {
        safePunchlineSuggestion[key] = null;
      }
    });
  }

  // Return structured format with screenplay
  return {
    screenplay: screenplay,
    usedDataset: selectedDialogue || selectedMeme || selectedTrend ? true : false,
    punchlineSuggestion: safePunchlineSuggestion
  };
}

// Updated generateWithAI function with robust error handling
export async function generateWithAI(prompt) {
  try {
    console.log("🤖 Calling OpenAI with prompt:", prompt);

    const res = await client.chat.completions.create({
      model: "gpt-5-nano",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    console.log("🤖 OpenAI raw response:", res.choices[0].message);

    const rawContent = res.choices[0].message.content;
    const parsed = extractJSON(rawContent);

    if (parsed) {
      console.log("✅ Successfully parsed AI response:", parsed);
      return { ...parsed, usedDataset: false };
    } else {
      console.warn("⚠️ Failed to parse JSON, using fallback");
      // Return a basic fallback structure
      return {
        hook: "No hook generated",
        context: "No context generated",
        punchline: "No punchline generated",
        caption: "No caption generated",
        usedDataset: false
      };
    }
  } catch (error) {
    console.error("❌ OpenAI API error:", error);
    // Return fallback structure on error
    return {
      hook: "Error generating content",
      context: "There was a technical issue with AI generation",
      punchline: "Please try again later",
      caption: "Oops! Something went wrong 😔",
      usedDataset: false
    };
  }
}

// Updated generateScriptWithRelevance function with robust error handling
export async function generateScriptWithRelevance(topic, dialogues, memes, trends, genre = "Comedy") {
  try {
    console.log("🤖 Generating script with relevance for topic:", topic, "and genre:", genre);

    // 1️⃣ Find top relevant items using Fuse.js
    // Import the relevance utility function
    const { findRelevantItems } = await import("../utils/relevance");

    const relevantDialogues = findRelevantItems(topic, dialogues, "dialogue", 1); // max 1 for controlled creativity
    const relevantMemes = findRelevantItems(topic, memes, "meme", 1);         // max 1
    const relevantTrends = findRelevantItems(topic, trends, "trend", 1);       // max 1

    // Find the most relevant item to use as punchline suggestion
    const allItems = [...relevantDialogues, ...relevantMemes, ...relevantTrends];
    let punchlineSuggestion = null;

    if (allItems.length > 0) {
      // Sort by relevance score if available, otherwise use first item
      const sortedItems = allItems.sort((a, b) => (b.score || 0) - (a.score || 0));
      punchlineSuggestion = sortedItems[0];
    }

    console.log("🎯 Relevant items:", { relevantDialogues, relevantMemes, relevantTrends, punchlineSuggestion });

    // 2️⃣ Build strict screenplay-only prompt with only relevant items
    let prompt = `
You are a Telugu-English Celtx screenplay writer for Instagram reels.  
Your job is to generate a short screenplay (20–30s) based strictly on the TOPIC and GENRE.

RULES:
1. Use **exactly one dialogue** from the provided DATASET (don't use more than one).  
2. Do not list multiple dataset items; just pick one that fits naturally.  
3. Build a **proper HOOK** in the first 5 seconds that makes it Instagram-viral (relatable, funny, emotional, or shocking depending on GENRE).  
4. Context must develop the situation. Punchline should land hard. Caption should be short, Gen-Z, Telugu-English mix.  
5. Use Celtx screenplay structure only. No JSON.
6. Include proper scene descriptions, character actions, and timing.
7. If a PUNCHLINE SUGGESTION is provided, consider using it as the punchline as it's highly relevant to the topic.

GENRE: ${genre}
TOPIC: "${topic}"
`;

    // Add punchline suggestion if available
    if (punchlineSuggestion) {
      prompt += `PUNCHLINE SUGGESTION (highly relevant to topic): ${JSON.stringify(punchlineSuggestion)}\n\n`;
    }

    // Add datasets to prompt only if they contain items
    if (relevantDialogues.length > 0) {
      prompt += `DATASET (choose 1 dialogue ONLY):\n${JSON.stringify(relevantDialogues, null, 2)}\n`;
    }

    prompt += `
EXAMPLE OUTPUT:
TITLE: Paisa Pelliko Reel

FADE IN:

SLUGLINE
INT. LIVING ROOM – EVENING

HOOK (00:00–00:05)
RAJU
"Nuvvoka pani chey"

CONTEXT (00:06–00:15)
ANU
"Family family upma thini bathikesthunnara"

MOM
"Naaa savu nen sastha neekenduku"

PUNCHLINE (00:16–00:25)
ANU
"Nuv oka pani chay"

CAPTION (SOCIAL MEDIA)
"Sibling money fights in 30 seconds with Telugu memes! #TeluguReels #SiblingLove #MoneyTalk"

FADE OUT.
`;

    const res = await client.chat.completions.create({
      model: "gpt-5-nano",
      messages: [{ role: "user", content: prompt }],
      // Remove response_format to allow plain text output instead of JSON
    });

    console.log("🤖 OpenAI raw response:", res.choices[0].message);

    const rawContent = res.choices[0].message.content;

    // Check if we got a valid screenplay response
    if (rawContent && rawContent.includes("TITLE:") && rawContent.includes("FADE IN:")) {
      console.log("✅ Successfully generated screenplay:", rawContent);

      // Create a safe punchline suggestion object for Firestore
      let safePunchlineSuggestion = null;
      if (punchlineSuggestion) {
        safePunchlineSuggestion = {
          id: punchlineSuggestion.id || null,
          text: punchlineSuggestion.text || punchlineSuggestion.dialogue || punchlineSuggestion.caption || punchlineSuggestion.headline || "",
          situation: punchlineSuggestion.situation || "",
          type: punchlineSuggestion.type || "dialogue"
        };

        // Remove any undefined values
        Object.keys(safePunchlineSuggestion).forEach(key => {
          if (safePunchlineSuggestion[key] === undefined) {
            safePunchlineSuggestion[key] = null;
          }
        });
      }

      return {
        screenplay: rawContent,
        usedDataset: relevantDialogues.length > 0 || relevantMemes.length > 0 || relevantTrends.length > 0,
        punchlineSuggestion: safePunchlineSuggestion
      };
    } else {
      console.warn("⚠️ Invalid screenplay format, using rule-based fallback");
      return generateRuleBasedScript(topic, relevantDialogues, relevantMemes, relevantTrends, genre);
    }
  } catch (error) {
    console.error("❌ OpenAI API error:", error);
    return generateRuleBasedScript(topic, [], [], [], genre);
  }
}

