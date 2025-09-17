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

  // 🎲 Shuffle arrays to randomize selection
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Simple keyword extraction (you can upgrade later with nano LLM)
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
      return shuffleArray(dataset).slice(0, max);
    }

    return ranked.slice(0, max);
  };

  // 🎯 Select relevant data instead of random shuffle
  const selectedDialogues = selectRelevantItems(dialogues, topic, 2);
  const selectedMemes = selectRelevantItems(memes, topic, 1);
  const selectedTrends = selectRelevantItems(trends, topic, 1);

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
        model: "gpt-5-nano",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }, // 🔑 Key OpenAI feature for reliable JSON output
      });

      console.log("AI raw response:", res);

      // 🔥 Extract and log token usage from API response
      const usageInfo = res.usage || { prompt_tokens: 0, completion_tokens: 0 };
      const updatedUsage = logUsage(usageInfo.prompt_tokens, usageInfo.completion_tokens);

      console.log(`📊 Tokens used: ${usageInfo.prompt_tokens} input + ${usageInfo.completion_tokens} output = ${usageInfo.prompt_tokens + usageInfo.completion_tokens} total`);
      console.log(`💰 Session cost: $${updatedUsage.estimatedCost.toFixed(6)}`);

      // Parse the JSON response
      const scriptJson = JSON.parse(res.choices[0].message.content);

      // 🛡️ Validate JSON structure with new usedDataset field
      const requiredFields = ['hook', 'context', 'punchline', 'caption'];
      const missingFields = requiredFields.filter(field => !scriptJson[field]);

      if (missingFields.length > 0) {
        throw new Error(`AI output missing required fields: ${missingFields.join(', ')}`);
      }

      // Add usedDataset flag if missing (backward compatibility)
      if (typeof scriptJson.usedDataset !== 'boolean') {
        scriptJson.usedDataset = false; // Default fallback
      }

      console.log(`🎯 Dataset usage: ${scriptJson.usedDataset ? 'Used dataset content' : 'Generated fresh content'}`);

      return scriptJson;

    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);

      // If this is the last attempt, handle the error
      if (attempt === maxRetries - 1) {
        // 🚪 Enhanced error handling for different scenarios
        if (error.status === 429) {
          // Rate limit or quota exceeded
          return {
            hook: "OpenAI API rate limit reached. Using rule-based generation.",
            context: "Your API key has hit the usage limit. Check billing or wait for reset.",
            punchline: "Don't worry - rule-based generation works great too!",
            caption: "Rate limit reached 😅 Try again later! #RateLimited",
            usedDataset: false,
            error: "rate_limit"
          };
        }

        // Return a structured error object that maintains the same schema
        return {
          hook: "Error generating script. Please try again.",
          context: "Technical issue occurred during script generation.",
          punchline: "System error - please retry.",
          caption: "Oops! Something went wrong 😔 Try again!",
          usedDataset: false,
          error: true
        };
      }

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
export const generateBatchScripts = async (topic, dialogues, memes, trends) => {
  console.log("🔍 generateBatchScripts called with:", { topic, dialoguesLength: dialogues?.length, memesLength: memes?.length, trendsLength: trends?.length });

  // Validate input data
  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    console.error("❌ Invalid topic:", topic);
    return [];
  }

  if (!Array.isArray(dialogues) || dialogues.length === 0) {
    console.error("❌ Invalid dialogues:", dialogues);
    return [];
  }

  if (!Array.isArray(memes) || memes.length === 0) {
    console.error("❌ Invalid memes:", memes);
    return [];
  }

  if (!Array.isArray(trends) || trends.length === 0) {
    console.error("❌ Invalid trends:", trends);
    return [];
  }

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

  // Select relevant data
  const selectedDialogues = selectRelevantItems(dialogues, topic, 2);
  const selectedMemes = selectRelevantItems(memes, topic, 1);
  const selectedTrends = selectRelevantItems(trends, topic, 1);

  console.log("🔍 Selected items:", {
    selectedDialogues: selectedDialogues.map(d => d.id),
    selectedMemes: selectedMemes.map(m => m.id),
    selectedTrends: selectedTrends.map(t => t.id)
  });
  console.log("🔍 Selected dialogues details:", selectedDialogues);
  console.log("🔍 Selected memes details:", selectedMemes);
  console.log("🔍 Selected trends details:", selectedTrends);

  const prompt = `
You are a Telugu reel scriptwriter. Your goal is to generate a short reel script based on a given topic and dataset.

STRICT RULES:
1. Use ONLY the dialogues, memes, and trends provided below. Do not invent or paraphrase; use dataset entries as-is.
2. Use exactly 1-2 dialogues, 1 meme, and 1 trend.
3. The script MUST be structured into four labeled parts: Hook, Context, Punchline, and Instagram Caption.
4. The Instagram Caption MUST be 1-2 lines, mix Telugu + English, relatable for a Gen-Z audience.
5. Do not include any extra explanations outside JSON.
6. The entire response MUST be a JSON array containing exactly 3 JSON objects.

DATASET:
Dialogues: ${JSON.stringify(selectedDialogues)}
Memes: ${JSON.stringify(selectedMemes)}
Trends: ${JSON.stringify(selectedTrends)}

TOPIC: "${topic}"

Generate exactly 3 different JSON objects (3 separate scripts) in a JSON array.
Each script must follow this schema:
[
  {
    "hook": "...",
    "context": "...",
    "punchline": "...",
    "caption": "..."
  },
  {
    "hook": "...",
    "context": "...",
    "punchline": "...",
    "caption": "..."
  },
  {
    "hook": "...",
    "context": "...",
    "punchline": "...",
    "caption": "..."
  }
]
`;

  try {
    console.log("🚀 Sending request to OpenAI API...");
    const res = await client.chat.completions.create({
      model: "gpt-5-nano",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    console.log("✅ Received response from OpenAI API:", res);
    console.log(" Raw content:", res.choices[0].message.content);

    // 🔥 Log token usage
    const usageInfo = res.usage || { prompt_tokens: 0, completion_tokens: 0 };
    logUsage(usageInfo.prompt_tokens, usageInfo.completion_tokens);

    // Parse JSON
    let scripts = [];
    try {
      const rawContent = res.choices[0].message.content;
      console.log(" Raw content type:", typeof rawContent);
      console.log(" Raw content length:", rawContent.length);

      const parsedContent = JSON.parse(rawContent);
      console.log(" Parsed content:", parsedContent);
      console.log(" Parsed content type:", typeof parsedContent);

      scripts = Array.isArray(parsedContent) ? parsedContent : [parsedContent]; // Ensure array
      console.log("📦 Parsed scripts:", scripts);
    } catch (err) {
      console.error("❌ JSON parse failed:", err);
      console.error(" Raw content:", res.choices[0].message.content);
      return [];
    }

    // Ensure each script has the required fields and is properly formatted
    const validatedScripts = scripts.map((script, index) => {
      // Log each script for debugging
      console.log(`📄 Generated script ${index}:`, script);

      // Ensure script is an object
      if (typeof script !== 'object' || script === null) {
        console.warn(`⚠️ Generated script ${index} is not an object, creating fallback`);
        return {
          hook: "No hook generated",
          context: "No context generated",
          punchline: "No punchline generated",
          caption: "No caption generated"
        };
      }

      return {
        hook: typeof script.hook === 'string' ? script.hook : "No hook generated",
        context: typeof script.context === 'string' ? script.context : "No context generated",
        punchline: typeof script.punchline === 'string' ? script.punchline : "No punchline generated",
        caption: typeof script.caption === 'string' ? script.caption : "No caption generated"
      };
    });

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
export const getOrGenerateBatchScripts = async (topic, dialogues, memes, trends) => {
  try {
    console.log("🔍 getOrGenerateBatchScripts called with:", { topic, dialoguesLength: dialogues?.length, memesLength: memes?.length, trendsLength: trends?.length });

    // 🔎 Query DB for existing batch with same topic
    const q = query(collection(db, "scripts"), where("topic", "==", topic));
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
                hook: "No hook generated",
                context: "No context generated",
                punchline: "No punchline generated",
                caption: "No caption generated",
                usedDataset: false
              };
            }

            return {
              hook: typeof script.hook === 'string' ? script.hook : "No hook generated",
              context: typeof script.context === 'string' ? script.context : "No context generated",
              punchline: typeof script.punchline === 'string' ? script.punchline : "No punchline generated",
              caption: typeof script.caption === 'string' ? script.caption : "No caption generated",
              usedDataset: typeof script.usedDataset === 'boolean' ? script.usedDataset : false
            };
          });
        } else {
          // Handle case where batch is not an array (fallback)
          console.warn("⚠️ Batch is not an array, creating fallback script");
          validatedBatch = [{
            hook: "No hook generated",
            context: "No context generated",
            punchline: "No punchline generated",
            caption: "No caption generated",
            usedDataset: false
          }];
        }

        console.log("✅ Validated stored batch:", validatedBatch);
        return validatedBatch; // return stored scripts
      }
    }

    // ❌ No batch found or expired → generate new
    console.log("📝 No existing batch. Calling OpenAI...");
    console.log("📤 Calling generateBatchScripts with:", { topic, dialoguesLength: dialogues?.length, memesLength: memes?.length, trendsLength: trends?.length });
    const result = await generateBatchScripts(topic, dialogues, memes, trends);
    console.log("📥 generateBatchScripts returned:", result);
    return result;
  } catch (error) {
    console.error("❌ Failed to get or generate batch:", error);
    return [];
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
function generateRuleBasedScript(topic, dialogues, memes, trends) {
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
    hook: selectedDialogue ? `"${selectedDialogue.text}" - ${selectedDialogue.actor} style se ${topic} gurinchi matladina!` : `Ee ${topic} gurinchi cheppadaniki ready ga!`,
    context: selectedTrend ? `${selectedTrend.headline} - ee news vinnaka ${topic} gurinchi alochinchadam start chesanu.` : `${topic} ante evvaru telusu ra!`,
    punchline: selectedMeme ? `${selectedMeme.caption} - exactly ila react ayyanu ${topic} gurinchi!` : `${topic} ante ila untadi ra! 😅`,
    caption: `${topic} #TeluguReels #funny #trending`,
    usedDataset: true // Rule-based always uses dataset
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
export async function generateScriptWithRelevance(topic, dialogues, memes, trends) {
  try {
    console.log("🤖 Generating script with relevance for topic:", topic);

    // Create prompt with dataset context
    const prompt = `
You are a Telugu-English reel script writer.
Generate JSON in this schema:
{
  "hook": "...",
  "context": "...",
  "punchline": "...",
  "caption": "...",
  "dialoguesYouCanUse": ["dialogue1", "dialogue2"]
}

Topic: "${topic}"
Relevant Context from DB: ${JSON.stringify([...dialogues, ...memes, ...trends], null, 2)}
`;

    const res = await client.chat.completions.create({
      model: "gpt-5-nano",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    console.log("🤖 OpenAI raw response:", res.choices[0].message);

    const rawContent = res.choices[0].message.content;
    const parsed = extractJSON(rawContent);

    if (parsed && parsed.hook && parsed.context && parsed.punchline && parsed.caption) {
      console.log("✅ Successfully parsed AI response:", parsed);
      // Ensure dialoguesYouCanUse is included in the response
      const result = { ...parsed, usedDataset: true };
      if (!result.dialoguesYouCanUse && dialogues.length > 0) {
        // Extract dialogues from the dataset
        result.dialoguesYouCanUse = dialogues.map(d => d.dialogue || d.text).slice(0, 2);
      }
      return result;
    } else {
      console.warn("⚠️ Failed to parse valid JSON or missing fields, using rule-based fallback");
      // Use rule-based fallback
      const fallbackResult = generateRuleBasedScript(topic, dialogues, memes, trends);
      // Add dialoguesYouCanUse to the fallback result
      if (!fallbackResult.dialoguesYouCanUse && dialogues.length > 0) {
        fallbackResult.dialoguesYouCanUse = dialogues.map(d => d.dialogue || d.text).slice(0, 2);
      }
      return fallbackResult;
    }
  } catch (error) {
    console.error("❌ OpenAI API error:", error);
    // Use rule-based fallback on error
    const fallbackResult = generateRuleBasedScript(topic, dialogues, memes, trends);
    // Add dialoguesYouCanUse to the fallback result
    if (!fallbackResult.dialoguesYouCanUse && dialogues.length > 0) {
      fallbackResult.dialoguesYouCanUse = dialogues.map(d => d.dialogue || d.text).slice(0, 2);
    }
    return fallbackResult;
  }
}

