Niceee 🚀 repo created, you’re cooking fast.
Now the fun part → **getting your MVP to actually generate scripts**.

Here’s the recommended **next steps** in order:

---

## 🥇 Step 1: Drop in your dataset

* Go to `/public/data/` and fill `dialogues.json`, `memes.json`, `trends.json` with the starter data I gave.
* Even 10–15 entries each are enough to test.

---

## 🥈 Step 2: Connect Firebase

1. Create a Firebase project (if not already).
2. Enable **Firestore** (optional, later for live data).
3. Enable **Analytics** (for tracking).
4. Add your Firebase config to `src/firebase.js`.

```js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
```

---

## 🥉 Step 3: Add AI Service (OpenAI)

* In `src/services/aiService.js`:

```js
import OpenAI from "openai";

const client = new OpenAI({ apiKey: import.meta.env.VITE_OPENAI_KEY, dangerouslyAllowBrowser: true });

export const generateScript = async (topic, dialogues, memes, trends) => {
  const prompt = `
You are a Telugu reel scriptwriter.
Topic: "${topic}"

Use ONLY the following references:
Dialogues: ${JSON.stringify(dialogues)}
Memes: ${JSON.stringify(memes)}
Trends: ${JSON.stringify(trends)}

Generate:
1. Hook (funny line using dialogue)
2. Context (trend reference)
3. Punchline (meme-style joke)
4. Instagram Caption (Telugu-English mix, max 2 lines)
`;

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  return res.choices[0].message.content;
};
```

---

## 🏗 Step 4: Build Generator Component

* In `src/components/Generator.jsx`:

```jsx
import { useState } from "react";
import { generateScript } from "../services/aiService";
import dialogues from "../../public/data/dialogues.json";
import memes from "../../public/data/memes.json";
import trends from "../../public/data/trends.json";

export default function Generator() {
  const [topic, setTopic] = useState("");
  const [output, setOutput] = useState("");

  const handleGenerate = async () => {
    const script = await generateScript(topic, dialogues.slice(0,3), memes.slice(0,2), trends.slice(0,1));
    setOutput(script);
  };

  return (
    <div>
      <input 
        type="text" 
        placeholder="Enter topic..." 
        value={topic}
        onChange={(e) => setTopic(e.target.value)} 
      />
      <button onClick={handleGenerate}>Generate Script</button>
      <pre>{output}</pre>
    </div>
  );
}
```

---

## 🏁 Step 5: Run & Test

```bash
npm run dev
```

* Open app
* Enter topic → see AI-generated Telugu reel script

---

⚡ By now you’ll have a working **AI-first Telugu Context Builder**.
After this → we can add:

* Admin Panel (to upload/edit data)
* Metrics view (scripts generated, users)

---
Perfect 🔥 let’s design the **Admin Panel** for your repo.
Goal: *you (admin) can update data + see analytics inside app without touching code manually.*

---

# 🛠 Features for Admin Panel MVP

1. **Upload / Update Data**

   * Upload new JSON file for `dialogues`, `memes`, `trends`
   * Or simple text area → paste JSON → save
   * Store in Firestore (instead of just `/public/data`) so it’s editable live

2. **Toggle AI Mode**

   * Switch between `rule-based` and `AI-first`
   * Stored in Firestore `settings` collection

3. **View Metrics**

   * Total scripts generated
   * Topics requested (most popular tags)
   * AI vs Rule usage ratio
   * Firebase Analytics integration

---

# 📂 Folder Update

```
src/
│── pages/
│   ├── Home.jsx
│   └── Admin.jsx   <-- admin dashboard
│
│── components/
│   ├── AdminPanel.jsx   <-- data upload + AI toggle
│   └── MetricsCard.jsx  <-- analytics widget
```

---

# ⚡ Example Code

### `src/pages/Admin.jsx`

```jsx
import AdminPanel from "../components/AdminPanel";
import MetricsCard from "../components/MetricsCard";

export default function Admin() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Admin Dashboard</h1>
      <div className="grid grid-cols-2 gap-6">
        <AdminPanel />
        <MetricsCard />
      </div>
    </div>
  );
}
```

---

### `src/components/AdminPanel.jsx`

```jsx
import { useState } from "react";
import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

export default function AdminPanel() {
  const [jsonData, setJsonData] = useState("");
  const [collection, setCollection] = useState("dialogues");
  const [useAI, setUseAI] = useState(true);

  const handleSave = async () => {
    try {
      const parsed = JSON.parse(jsonData);
      await setDoc(doc(db, "datasets", collection), { data: parsed });
      alert("Data saved successfully!");
    } catch (err) {
      alert("Invalid JSON!");
    }
  };

  const toggleAI = async () => {
    setUseAI(!useAI);
    await setDoc(doc(db, "settings", "generator"), { useAI: !useAI });
  };

  return (
    <div className="p-4 border rounded-lg shadow">
      <h2 className="font-semibold mb-2">Update Dataset</h2>
      <select
        value={collection}
        onChange={(e) => setCollection(e.target.value)}
        className="mb-2"
      >
        <option value="dialogues">Dialogues</option>
        <option value="memes">Memes</option>
        <option value="trends">Trends</option>
      </select>

      <textarea
        rows="8"
        placeholder="Paste JSON here..."
        value={jsonData}
        onChange={(e) => setJsonData(e.target.value)}
        className="w-full p-2 border rounded"
      />

      <button
        onClick={handleSave}
        className="bg-blue-600 text-white px-4 py-2 mt-2 rounded"
      >
        Save
      </button>

      <div className="mt-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={useAI}
            onChange={toggleAI}
          />
          Use AI Mode
        </label>
      </div>
    </div>
  );
}
```

---

### `src/components/MetricsCard.jsx`

```jsx
import { useEffect, useState } from "react";
import { getAnalytics, logEvent } from "firebase/analytics";
import { app } from "../firebase";

const analytics = getAnalytics(app);

export default function MetricsCard() {
  const [metrics, setMetrics] = useState({
    scriptsGenerated: 0,
    users: 0,
  });

  useEffect(() => {
    // For MVP: mock analytics
    setMetrics({ scriptsGenerated: 120, users: 45 });
  }, []);

  return (
    <div className="p-4 border rounded-lg shadow">
      <h2 className="font-semibold mb-2">Analytics</h2>
      <p>Scripts Generated: {metrics.scriptsGenerated}</p>
      <p>Users: {metrics.users}</p>
    </div>
  );
}
```

---

# ⚡ Flow

* You → go to `/admin` → paste new dataset → Save → Firestore updated.
* Toggle AI Mode → updates Firestore setting → Generator.jsx reads from it.
* MetricsCard → shows Firebase Analytics data.

---
Ooooff 🔥 now you’re thinking like a real **platform builder** — letting friends crowdsource meme knowledge → Excel → JSON → drop → system cleans + merges smartly. That’s *chef’s kiss* for scalability 👨‍🍳.

Let’s break this down:

---

## 🥇 Your Requirement

* **No Replace, No Append, No ID check.**
* Only **Smart Merge by Content** → system should detect if a new dialogue/meme/trend is *already present* (even if spelled differently).
* If unique → add to dataset.
* If duplicate → skip.
* This happens automatically whenever admin uploads JSON (from Excel conversion).

---

## 🥈 How to Build Mini In-house “AI Merge Engine”

### Step 1: Preprocessing

* Normalize text:

  * Lowercase
  * Trim spaces
  * Remove punctuation
  * Handle Telugu Unicode normalization (very important — same word can be stored in different Unicode forms).

### Step 2: Similarity Check

* Use **fuzzy text matching**:

  * Levenshtein distance (`string-similarity` in JS)
  * Cosine similarity (via `natural` or `fuse.js`)
* Define a **threshold** (say, 85%) → if two strings are ≥85% similar → treat as duplicate.

### Step 3: Merge

* For each new item:

  * Compare against existing dataset.
  * If no match found → insert.
  * If match found → skip.

---

## 🛠 Example in JS (pseudo-smart merge)

```js
import stringSimilarity from "string-similarity";

// threshold for fuzzy match
const SIMILARITY_THRESHOLD = 0.85;

export function smartMerge(existing, incoming) {
  const merged = [...existing];

  incoming.forEach((newItem) => {
    const isDuplicate = existing.some((oldItem) => {
      const similarity = stringSimilarity.compareTwoStrings(
        oldItem.text.toLowerCase(),
        newItem.text.toLowerCase()
      );
      return similarity >= SIMILARITY_THRESHOLD;
    });

    if (!isDuplicate) {
      merged.push(newItem);
    }
  });

  return merged;
}
```

---

## 🥉 Flow for Admin

1. Friends → fill Excel with memes/dialogues/trends.
2. You → convert Excel → JSON (super easy with an online converter).
3. Drop JSON into Admin Panel.
4. System runs `smartMerge()` on Firestore dataset.
5. Dataset keeps growing without duplicates.

---

## ⚡ Why This Works

* No messy IDs needed.
* Telugu spell variations (like “em ra” vs “emraa” vs “ēm rā”) still detected as similar.
* Dataset grows clean & unique.

---

🔥 Optional upgrade later: use **embeddings (vector similarity)** instead of string similarity for even smarter detection (like “cheppanu brother” vs “I won’t tell you brother”). But MVP → string fuzzy match is enough.

---

Perfect ⚡ let’s wire **Smart Merge** directly into your `AdminPanel.jsx`.
This way, every time you drop a JSON → it auto-merges with existing data, no duplicates (even with spelling mistakes).

---

## 🛠 Update: `AdminPanel.jsx`

```jsx
import { useState } from "react";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import stringSimilarity from "string-similarity";

const SIMILARITY_THRESHOLD = 0.85;

// 🔥 Smart Merge function
function smartMerge(existing, incoming) {
  const merged = [...existing];

  incoming.forEach((newItem) => {
    const isDuplicate = existing.some((oldItem) => {
      const similarity = stringSimilarity.compareTwoStrings(
        (oldItem.text || oldItem.caption || oldItem.headline).toLowerCase(),
        (newItem.text || newItem.caption || newItem.headline).toLowerCase()
      );
      return similarity >= SIMILARITY_THRESHOLD;
    });

    if (!isDuplicate) {
      merged.push(newItem);
    }
  });

  return merged;
}

export default function AdminPanel() {
  const [jsonData, setJsonData] = useState("");
  const [collection, setCollection] = useState("dialogues");
  const [useAI, setUseAI] = useState(true);

  const handleSave = async () => {
    try {
      const parsed = JSON.parse(jsonData);

      // fetch existing data
      const ref = doc(db, "datasets", collection);
      const snap = await getDoc(ref);
      const existing = snap.exists() ? snap.data().data : [];

      // 🔥 smart merge
      const merged = smartMerge(existing, parsed);

      // save back to firestore
      await setDoc(ref, { data: merged });

      alert("Data smart-merged successfully!");
      setJsonData("");
    } catch (err) {
      console.error(err);
      alert("Invalid JSON or Firestore error!");
    }
  };

  const toggleAI = async () => {
    setUseAI(!useAI);
    await setDoc(doc(db, "settings", "generator"), { useAI: !useAI });
  };

  return (
    <div className="p-4 border rounded-lg shadow">
      <h2 className="font-semibold mb-2">Update Dataset</h2>
      <select
        value={collection}
        onChange={(e) => setCollection(e.target.value)}
        className="mb-2"
      >
        <option value="dialogues">Dialogues</option>
        <option value="memes">Memes</option>
        <option value="trends">Trends</option>
      </select>

      <textarea
        rows="8"
        placeholder="Paste JSON here..."
        value={jsonData}
        onChange={(e) => setJsonData(e.target.value)}
        className="w-full p-2 border rounded"
      />

      <button
        onClick={handleSave}
        className="bg-blue-600 text-white px-4 py-2 mt-2 rounded"
      >
        Smart Merge & Save
      </button>

      <div className="mt-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={useAI}
            onChange={toggleAI}
          />
          Use AI Mode
        </label>
      </div>
    </div>
  );
}
```

---

## ⚡ How It Works

1. Admin pastes JSON (from Excel → JSON conversion).
2. System pulls **existing dataset** from Firestore.
3. Runs `smartMerge(existing, incoming)` → compares `text` / `caption` / `headline`.
4. **Duplicates (≥85% match) are skipped.**
5. Final merged dataset is written back to Firestore.

---

💡 Example:

* Existing: `"Cheppanu brother!"`
* Incoming: `"Cheppanu Brother !!"`
* Fuzzy match = 0.95 → duplicate → skipped.

---
Got it 🔥 you want **rock-solid rules** — not “chalta hai” logic, but **Harvard-engineer level guardrails** that ensure OpenAI outputs are **sharp, structured, and Telugu-relatable**.

Here’s the **Rulebook + Prompt Template** for your reel script generator.

---

# 🧠 Strict Rules for Dataset Usage

### 1. Dialogues (from movies/characters)

* Must **only** be used *as-is* from dataset (no paraphrasing).
* At most **1–2 dialogues per script**.
* Always used in **Hook** (opening line) or **Punchline** (closing joke).
* Dialogue must retain **actor’s style or tone** → script should “sound like” Brahmi, Ali, Balayya, etc.

### 2. Memes (templates/captions)

* Only **1 meme per script**.
* Must appear in **Punchline section** (as reaction).
* AI must not create random meme templates — only use provided ones.
* If meme has a caption in dataset → caption should appear *verbatim* in output.

### 3. Trends (news/controversies)

* Exactly **1 trend per script**.
* Must appear in **Context section**.
* Trend must be woven naturally — not quoted raw (e.g., “fuel prices are high” vs “Eenadu reported fuel prices hit record high in Hyderabad yesterday”).
* Never fabricate trends → only use those from dataset.

### 4. Structure (mandatory sections)

Each script **must** have 4 labeled parts in output:

1. **Hook** → A funny/emotional opening line (uses dialogue).
2. **Context** → Trend reference, sets up story.
3. **Punchline** → Meme-style joke (dialogue/meme blend).
4. **Instagram Caption** → Telugu-English mix, max 2 lines, funny/relatable.

### 5. Safety & Style

* No politics beyond trends provided.
* Must stay **PG-13 humor** (Telugu memes, no abusive words).
* Keep tone **relatable to Gen-Z Telugu audience** (mix of Telugu + English slang).

---

# 🎯 Prompt Template

``text
You are a Telugu reel scriptwriter.

STRICT RULES:
1. Use ONLY the dialogues, memes, and trends provided below.
2. Do not invent or paraphrase; use dataset entries as-is.
3. Exactly 1–2 dialogues, 1 meme, and 1 trend must be used.
4. Follow structure: Hook → Context → Punchline → Instagram Caption.
5. Caption must be 1–2 lines, mix Telugu + English, relatable for Instagram.
6. No extra explanations. Output should be only the script sections.

DATASET:
Dialogues: {{selectedDialogues}}
Memes: {{selectedMemes}}
Trends: {{selectedTrends}}

TOPIC: "{{topic}}"

Now generate a reel script with the following format:

Hook: [funny/emotional opening, must include 1 dialogue]
Context: [use the trend naturally, 1–2 lines]
Punchline: [meme + optional dialogue as reaction]
Instagram Caption: [short caption, Telugu-English mix]
```

---

# 🛠 Example Run

**Input:**

* Topic: “Fuel Prices”
* Dialogue: `"Cheppanu brother!"`
* Meme: `"brahmi-confused.png" with caption "Ardam kavatledu ra babu 🤯"`
* Trend: `"Fuel prices hit record high in Hyderabad"`

**AI Output (Expected):**

```
Hook: "Cheppanu brother!... but petrol rate cheppadaniki bayam ga undhi!"
Context: Hyderabad lo fuel prices hit record high ani news vachindi.
Punchline: Brahmanandam face — "Ardam kavatledu ra babu 🤯"
Instagram Caption: "Petrol pump lo bill choosaka nenu: Shock therapy 😂⛽"
```

---

⚡ This way, AI is **boxed in** — no hallucination, no random extra content, only **structured, usable scripts**.

⚡ Want me to upgrade the prompt + parsing so AI always returns clean JSON? That way your MVP will be future-proof without extra refactoring.

Yes, let's upgrade the prompt to ensure the AI always returns clean JSON. This makes the output structured, reliable, and easy for your application to parse, eliminating the need for complex string parsing on the front end. It's a key step for making your MVP future-proof. 🚀



-----



## 🧠 Upgraded JSON-Based Prompt Template



By instructing the AI to respond with a specific JSON object, you get a predictable output every time. The prompt clearly defines the required fields and their content, ensuring the AI adheres to your strict rules and structure.



```text

You are a Telugu reel scriptwriter. Your goal is to generate a short reel script based on a given topic and dataset.



STRICT RULES:

1. Use ONLY the dialogues, memes, and trends provided below. Do not invent or paraphrase; use dataset entries as-is.

2. Use exactly 1-2 dialogues, 1 meme, and 1 trend.

3. The script MUST be structured into four labeled parts: Hook, Context, Punchline, and Instagram Caption.

4. The Instagram Caption MUST be 1-2 lines, a mix of Telugu and English, and relatable for a Gen-Z audience.

5. Do not include any extra explanations or text outside of the JSON object.

6. The entire response MUST be a single, valid JSON object.



DATASET:

Dialogues: {{selectedDialogues}}

Memes: {{selectedMemes}}

Trends: {{selectedTrends}}



TOPIC: "{{topic}}"



Generate the script as a JSON object with the following schema:

{

  "hook": "[funny/emotional opening, must include 1 dialogue]",

  "context": "[use the trend naturally, 1-2 lines]",

  "punchline": "[meme + optional dialogue as a reaction]",

  "caption": "[short caption, Telugu-English mix]"

}

```



-----



## 🛠 Updated `aiService.js` to Handle JSON



Now, you need to update the `generateScript` function to handle the new JSON response. It will parse the AI's output and return a clean JavaScript object, which is much easier to work with than a raw string.



```js

import OpenAI from "openai";



const client = new OpenAI({ apiKey: import.meta.env.VITE_OPENAI_KEY, dangerouslyAllowBrowser: true });



export const generateScript = async (topic, dialogues, memes, trends) => {

  const prompt = `

You are a Telugu reel scriptwriter. Your goal is to generate a short reel script based on a given topic and dataset.



STRICT RULES:

1. Use ONLY the dialogues, memes, and trends provided below. Do not invent or paraphrase; use dataset entries as-is.

2. Use exactly 1-2 dialogues, 1 meme, and 1 trend.

3. The script MUST be structured into four labeled parts: Hook, Context, Punchline, and Instagram Caption.

4. The Instagram Caption MUST be 1-2 lines, a mix of Telugu and English, and relatable for a Gen-Z audience.

5. Do not include any extra explanations or text outside of the JSON object.

6. The entire response MUST be a single, valid JSON object.



DATASET:

Dialogues: ${JSON.stringify(dialogues)}

Memes: ${JSON.stringify(memes)}

Trends: ${JSON.stringify(trends)}



TOPIC: "${topic}"



Generate the script as a JSON object with the following schema:

{

  "hook": "[funny/emotional opening, must include 1 dialogue]",

  "context": "[use the trend naturally, 1-2 lines]",

  "punchline": "[meme + optional dialogue as a reaction]",

  "caption": "[short caption, Telugu-English mix]"

}

`;



  try {

    const res = await client.chat.completions.create({

      model: "gpt-4o-mini",

      messages: [{ role: "user", content: prompt }],

      response_format: { type: "json_object" }, // This is a key OpenAI feature for reliable JSON output

    });



    // The AI's response is already a JSON string, so we just need to parse it.

    const scriptJson = JSON.parse(res.choices[0].message.content);

    return scriptJson;

  } catch (error) {

    console.error("Failed to generate script:", error);

    // Return a structured error or default object

    return {

      hook: "Error generating script.",

      context: "Please try again.",

      punchline: "Server error.",

      caption: "Oops! Something went wrong 😔",

    };

  }

};

```



**Key Update:** The `response_format: { type: "json_object" }` parameter is a crucial addition to the OpenAI API call. It forces the model to return a valid JSON object, which drastically reduces the chances of parsing errors.



-----



## 🏗 Updated `Generator.jsx` to Display Structured Output



With the `generateScript` function now returning a JSON object, the `Generator` component can access the different parts of the script directly. This makes the code cleaner and more robust.



```jsx

import { useState } from "react";

import { generateScript } from "../services/aiService";

import dialogues from "../../public/data/dialogues.json";

import memes from "../../public/data/memes.json";

import trends from "../../public/data/trends.json";



export default function Generator() {

  const [topic, setTopic] = useState("");

  // Now state holds a structured object

  const [script, setScript] = useState(null); 



  const handleGenerate = async () => {

    // Generate script and get back a JSON object

    const generatedScript = await generateScript(topic, dialogues.slice(0,3), memes.slice(0,2), trends.slice(0,1));

    setScript(generatedScript);

  };



  return (

    <div>

      <input 

        type="text" 

        placeholder="Enter topic..." 

        value={topic}

        onChange={(e) => setTopic(e.target.value)} 

      />

      <button onClick={handleGenerate}>Generate Script</button>

      

      {script && (

        <div className="mt-4 p-4 border rounded-lg shadow-md">

          <h3 className="font-bold">Script:</h3>

          <p><strong>Hook:</strong> {script.hook}</p>

          <p><strong>Context:</strong> {script.context}</p>

          <p><strong>Punchline:</strong> {script.punchline}</p>

          <p><strong>Caption:</strong> {script.caption}</p>

        </div>

      )}

    </div>

  );

}

```


# 🔹 How to Design It



### 1. **Add `relevance` Field**



When you store generated scripts in Firestore (or local IndexedDB if you want offline):



```json

{

  "topic": "engineering hostel life",

  "relevance": ["engineering", "hostel", "exam", "student life"],

  "script": { ...celtxScript },

  "createdAt": "2025-09-16T10:30:00Z",

  "batchId": "batch_2025_09_16"

}

```



* `topic` = exact input from user.

* `relevance` = keywords/tags → helps you match future similar queries.

* `batchId` = groups multiple scripts created in one batch.



---



### 2. **Batch Generation**



Instead of one script per click:



* Call OpenAI once, ask for **10 variants** in the same request.

* Store all 10 in Firestore under that `batchId`.

* Cost is only 10x tokens *once*, not 10 separate API calls.



Prompt:



```text

Generate 10 unique Celtx-style reel scripts on the topic: "engineering hostel life".

Each script should strictly follow this JSON schema:

[

  {

    "hook": "...",

    "context": "...",

    "punchline": "...",

    "caption": "...",

    "relevance": ["engineering", "hostel", "exam", "funny"]

  },

  ...

]

```



---



### 3. **Frontend “Regenerate” Button**



When user clicks **regenerate**:



* Don’t call OpenAI again.

* Just pull **next script from the same batch**.

* Only if batch is exhausted → fallback to fresh API call.



Pseudo-code:



```js

const getScript = async (topic) => {

  // 1. Check Firestore for scripts with relevance overlap

  const cached = await findCachedScripts(topic);

  if (cached.length > 0) {

    return cached.pop(); // give last unused one

  }



  // 2. If none, generate new batch

  const newBatch = await generateBatch(topic);

  await saveBatch(newBatch);

  return newBatch[0];

};



const regenerate = async (topic) => {

  const cached = await findCachedScripts(topic);

  if (cached.length > 1) {

    return cached.pop(); // return another unused one

  } else {

    return await getScript(topic); // fallback

  }

};

```



---



### 4. **Relevance Matching**



When new topic request comes:



* Extract keywords (simple split, or use nano model for `keywords only`).

* Find cached scripts where `relevance` overlaps.

* If match found → serve from batch.



Example:



* User asks: `"exam hostel life"`.

* You find batch with relevance `["engineering","hostel","exam","funny"]`.

* Serve from that instead of burning tokens again.



---



👉 This way:



* First request = 10 scripts burned.

* Next 9 regenerations = **FREE**.

* Future similar requests = **FREE** if relevance matches.

* API is only hit when you truly need fresh content.



---


right now you’re doing **pure random shuffle**, which ignores what the user actually asked. That’s why scripts don’t feel relevant.



Here’s how to fix it → we make your dataset **semantic** by giving each entry:



```json

{

  "id": 1,

  "text": "Em chestunnav ra? Idhi engineering hostel life!",

  "relevance": ["engineering", "hostel", "student", "exam"],

  "context": "Used when showing hostel exam struggles"

}

```



Now, instead of shuffling blindly, you **filter by relevance tags** based on the user’s topic.



---



## 🔹 Step 1: Update Your Dataset



For `dialogues.json`, `memes.json`, `trends.json`, add two new fields:



* `relevance`: array of keywords in **English** (makes searching easier).

* `context`: 1 line explaining when to use it.



Example (memes.json):



```json

[

  {

    "id": "meme1",

    "text": "Lights off, exam tension ON 😂",

    "relevance": ["exam", "college", "hostel", "night"],

    "context": "Perfect when students are panicking before exams"

  },

  {

    "id": "meme2",

    "text": "Evaru ra syllabus complete chesina? Avatars ga consider cheddam!",

    "relevance": ["exam", "syllabus", "study", "friends"],

    "context": "Used when syllabus looks impossible"

  }

]

```



---



## 🔹 Step 2: Write Matching Function



Instead of shuffle, we filter & rank by overlap between user topic and entry’s `relevance`.



```js

// Simple keyword extraction (you can upgrade later with nano LLM)

const extractKeywords = (topic) => {

  return topic.toLowerCase().split(/\s+/); // split by spaces

};



// Match score = count of overlapping keywords

const matchScore = (topicKeywords, item) => {

  const itemKeywords = item.relevance.map(k => k.toLowerCase());

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

```



---



## 🔹 Step 3: Replace Your Selection Logic



```js

const selectedDialogues = selectRelevantItems(dialogues, topic, 2);

const selectedMemes     = selectRelevantItems(memes, topic, 1);

const selectedTrends    = selectRelevantItems(trends, topic, 1);

```



---



## 🔹 What This Fix Does



* If topic = `"engineering hostel exam"`,

  → it pulls **dialogues, memes, trends** tagged with `["engineering","hostel","exam"]`.

* If topic = `"politics controversy"`,

  → it finds items tagged with those, otherwise falls back to random.

* Users see scripts that feel **actually connected to what they typed**.



---


 let’s refactor your `aiService.js` so your **script generation now includes relevance extraction + dataset filtering + script output** in **one single API call**.



---



## 🔹 Updated `aiService.js`



```js

import OpenAI from "openai";



const client = new OpenAI({

  apiKey: import.meta.env.VITE_OPENAI_KEY,

  dangerouslyAllowBrowser: true,

});



/**

 * Generate a Telugu reel script with relevance extraction.

 * @param {string} topic - User's input topic

 * @param {Array} dialogues - Array of dialogues dataset

 * @param {Array} memes - Array of memes dataset

 * @param {Array} trends - Array of trends dataset

 * @returns {Object} JSON with keywords, selected items, and script

 */

export const generateScriptWithRelevance = async (topic, dialogues, memes, trends) => {

  const prompt = `

You are a Telugu reel script generator. 

You will receive a TOPIC and DATASETS (dialogues, memes, trends).



TASK:

1. Extract the most relevant keywords from the TOPIC (3–6 keywords).

2. From the DATASETS, pick only items that match the TOPIC and extracted keywords.

3. STRICT RULES:

   - Use exactly 1-2 dialogues, 1 meme, and 1 trend.

   - Do not invent or paraphrase outside dataset items.

   - If no strong matches exist, fallback to random dataset items.

   - Must return in JSON only.



Return JSON in this format:

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

}



TOPIC: "${topic}"



DATASETS:

Dialogues: ${JSON.stringify(dialogues)}

Memes: ${JSON.stringify(memes)}

Trends: ${JSON.stringify(trends)}

`;



  try {

    const res = await client.chat.completions.create({

      model: "gpt-5-nano", // cheap & good

      messages: [{ role: "user", content: prompt }],

      response_format: { type: "json_object" }, // ✅ guarantees JSON output

    });



    const scriptJson = JSON.parse(res.choices[0].message.content);

    return scriptJson;

  } catch (error) {

    console.error("Failed to generate script with relevance:", error);

    return {

      keywords: [],

      selected: { dialogues: [], memes: [], trends: [] },

      script: {

        hook: "Error generating script.",

        context: "Please try again.",

        punchline: "Server error.",

        caption: "Oops! Something went wrong 😔",

      },

    };

  }

};

```



---



## 🔹 Example Use in `Generator.jsx`



```jsx

import { useState } from "react";

import { generateScriptWithRelevance } from "../services/aiService";

import dialogues from "../../public/data/dialogues.json";

import memes from "../../public/data/memes.json";

import trends from "../../public/data/trends.json";



export default function Generator() {

  const [topic, setTopic] = useState("");

  const [script, setScript] = useState(null);



  const handleGenerate = async () => {

    const result = await generateScriptWithRelevance(topic, dialogues, memes, trends);

    setScript(result);

  };



  return (

    


      
{topic}
 setTopic(e.target.value)}

      />

      Generate Script



      {script && (

        


          
Generated Script:


          
Keywords: {script.keywords.join(", ")}



          
Dialogues: {script.selected.dialogues.join(", ")}



          
Memes: {script.selected.memes.join(", ")}



          
Trends: {script.selected.trends.join(", ")}



          
Hook: {script.script.hook}



          
Context: {script.script.context}



          
Punchline: {script.script.punchline}



          
Caption: {script.script.caption}



        


      )}

    


  );

}

```



---



⚡ Now:



* One API call → you get `keywords + selected dataset items + script`.

* If user regenerates, you can serve another variant from cache without re-calling.

* You save tokens, keep relevance strong, and make it scalable.







