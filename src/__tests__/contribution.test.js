import { findRelevantItems } from "../utils/relevance";

// Mock dataset
const mockDataset = [
    {
        type: "dialogue",
        dialogue: "Em ra idhi, endhuku ala choostunnav?",
        situation: "when seeing something unexpected",
        tags: ["confusion", "funny", "reaction"]
    },
    {
        type: "dialogue",
        dialogue: "How you doin?",
        situation: "when hitting on someone",
        tags: ["flirt", "friends"]
    },
    {
        type: "meme",
        dialogue: "This is fine",
        situation: "when everything is going wrong",
        tags: ["reaction", "stress"]
    },
    {
        type: "trend",
        dialogue: "Skibidi Toilet",
        situation: "when something is weird",
        tags: ["weird", "viral"]
    }
];

describe("Contribution System", () => {
    test("findRelevantItems should return relevant items based on user prompt", () => {
        const userPrompt = "unexpected situation";
        const type = "dialogue";
        const limit = 2;

        const result = findRelevantItems(userPrompt, mockDataset, type, limit);

        expect(result).toHaveLength(1);
        expect(result[0].dialogue).toBe("Em ra idhi, endhuku ala choostunnav?");
        expect(result[0].type).toBe("dialogue");
    });

    test("findRelevantItems should filter by type", () => {
        const userPrompt = "weird";
        const type = "trend";
        const limit = 1;

        const result = findRelevantItems(userPrompt, mockDataset, type, limit);

        expect(result).toHaveLength(1);
        expect(result[0].type).toBe("trend");
        expect(result[0].dialogue).toBe("Skibidi Toilet");
    });
});