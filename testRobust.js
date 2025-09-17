import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "your_openai_api_key_here", // Use environment variable
});

// Robust JSON extractor
function extractJSON(text) {
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

async function testRobust() {
    const prompt = `
Generate a funny Telugu-English reel script about "Hyderabad traffic" in JSON format:

{
  "hook": "funny opening line",
  "context": "short setup context",
  "punchline": "funny punchline",
  "caption": "Instagram caption with hashtags"
}
`;

    try {
        // Try with gpt-5-nano first
        console.log("Testing with gpt-5-nano...");
        const res = await client.chat.completions.create({
            model: "gpt-5-nano",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
        });

        const rawContent = res.choices[0].message.content;
        console.log("RAW CONTENT:", rawContent);

        const parsed = extractJSON(rawContent);
        if (parsed) {
            console.log("SUCCESSFULLY PARSED:", parsed);
        } else {
            console.log("Failed to parse JSON, falling back to gpt-4o-mini...");

            // Fallback to gpt-4o-mini
            const fallbackRes = await client.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
            });

            const fallbackRaw = fallbackRes.choices[0].message.content;
            console.log("FALLBACK RAW:", fallbackRaw);

            const fallbackParsed = extractJSON(fallbackRaw);
            if (fallbackParsed) {
                console.log("FALLBACK SUCCESS:", fallbackParsed);
            } else {
                console.log("Both models failed, using rule-based fallback");
                // Rule-based fallback
                const fallback = {
                    hook: "Traffic in Hyderabad be like...",
                    context: "When you're stuck in bumper-to-bumper traffic for 2 hours",
                    punchline: "You realize walking would've been faster! 😅",
                    caption: "Hyderabad traffic got me feeling like a snail 🐌 #HyderabadTraffic #TelanganaLife"
                };
                console.log("RULE-BASED FALLBACK:", fallback);
            }
        }
    } catch (err) {
        console.error("❌ API error:", err);

        // Try fallback model
        try {
            console.log("Trying fallback model gpt-4o-mini...");
            const fallbackRes = await client.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
            });

            const fallbackRaw = fallbackRes.choices[0].message.content;
            console.log("FALLBACK RAW:", fallbackRaw);

            const fallbackParsed = extractJSON(fallbackRaw);
            if (fallbackParsed) {
                console.log("FALLBACK SUCCESS:", fallbackParsed);
            }
        } catch (fallbackErr) {
            console.error("Fallback also failed:", fallbackErr);
            // Rule-based fallback
            const fallback = {
                hook: "Traffic in Hyderabad be like...",
                context: "When you're stuck in bumper-to-bumper traffic for 2 hours",
                punchline: "You realize walking would've been faster! 😅",
                caption: "Hyderabad traffic got me feeling like a snail 🐌 #HyderabadTraffic #TelanganaLife"
            };
            console.log("RULE-BASED FALLBACK:", fallback);
        }
    }
}

testRobust();