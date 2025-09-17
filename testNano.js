import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "your_openai_api_key_here", // Use environment variable
});

async function test() {
    const prompt = `
Return ONLY JSON in this exact schema:

{
  "hook": "funny opening",
  "context": "short setup",
  "punchline": "punchline",
  "caption": "caption"
}

TOPIC: "Hyderabad traffic"
`;

    try {
        const res = await client.chat.completions.create({
            model: "gpt-5-nano",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }, // force JSON
        });

        console.log("RAW:", res.choices[0].message);
        console.log("PARSED:", JSON.parse(res.choices[0].message.content));
    } catch (err) {
        console.error("❌ API error:", err);
    }
}

test();