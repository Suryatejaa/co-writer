import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Button from "./ui/Button";

export default function ReelIdeaLoader({ onDone, topic, genre, isScriptReady }) {
    const [ideas, setIdeas] = useState([]);
    const [current, setCurrent] = useState(0);

    // Load ideas from the JSON file instead of fetching from Firestore
    useEffect(() => {
        const loadIdeas = async () => {
            try {
                const response = await fetch('/data/reelIdeas.json');
                const data = await response.json();
                setIdeas(data);
            } catch (error) {
                console.error("Error loading reel ideas:", error);
                // Fallback ideas if JSON file fails to load
                setIdeas(getFallbackIdeas());
            }
        };

        loadIdeas();
    }, []);

    // Get fallback ideas if JSON file fails to load
    const getFallbackIdeas = () => {
        return [
            {
                id: "fallback-1",
                dialogue: "Garba transition spin",
                situation: "Start casual wear → spin mid-air → full Garba lehenga with mirror or dupatta flip. High energy with festive music.",
                type: "trend",
                tags: ["dance", "festival", "transition"]
            },
            {
                id: "fallback-2",
                dialogue: "Vintage saree cinematic glow",
                situation: "Wear vintage saree, golden hour light, wind-blown hair, retro filter; slow zoom and film grain effect.",
                type: "trend",
                tags: ["cinematic", "vintage", "fashion"]
            },
            {
                id: "fallback-3",
                dialogue: "Sibling money fight comedic sketch",
                situation: "Sibling arguments over small money things, funny dialogues, exaggeration and relatable punchline.",
                type: "dialogue",
                tags: ["comedy", "family", "relatable"]
            },
            {
                id: "fallback-4",
                dialogue: "Day-in-life routine (Telugu student)",
                situation: "Morning alarm, college rush, study, chai breaks, internet lag — fast cuts + trending audio.",
                type: "trend",
                tags: ["daily", "student", "fast cuts"]
            },
            {
                id: "fallback-5",
                dialogue: "Before vs After transformation",
                situation: "Messy vs glam, plain vs fancy — show contrast with clothes, skincare, room decor.",
                type: "trend",
                tags: ["transformation", "fashion", "beauty"]
            },
            {
                id: "fallback-6",
                dialogue: "POV style: Your future self visiting you",
                situation: "Act out dialogue with future-you giving advice/warning, emotional or funny twist.",
                type: "trend",
                tags: ["POV", "emotional", "storytelling"]
            },
            {
                id: "fallback-7",
                dialogue: "Reaction to 'free advice' memes",
                situation: "Reacting to people giving unsolicited advice – classic memes + sarcasm + punchline.",
                type: "meme",
                tags: ["reaction", "humor", "memes"]
            },
            {
                id: "fallback-8",
                dialogue: "Quick tutorial under 15 seconds",
                situation: "One-minute hack: e.g., how to style dupatta 3 ways, or make chai variation; keep energy high.",
                type: "trend",
                tags: ["tutorial", "tips", "quick"]
            },
            {
                id: "fallback-9",
                dialogue: "Trending audio + iconic hook dance",
                situation: "Use trending music, create a catchy hook dance move that others can replicate; repeat move for transitions.",
                type: "trend",
                tags: ["dance", "trend", "hook"]
            },
            {
                id: "fallback-10",
                dialogue: "Cinematic rainy sequence",
                situation: "Rain drops, slow motion, umbrella, reflection, emotional music — mood reels.",
                type: "trend",
                tags: ["cinematic", "emotional", "mood"]
            }
        ];
    };

    // Auto-rotate every 4s
    useEffect(() => {
        if (ideas.length === 0) return;

        const interval = setInterval(() => {
            setCurrent(prev => (prev + 1) % ideas.length);
        }, 4000);

        return () => clearInterval(interval);
    }, [ideas]);

    if (!ideas.length) {
        return (
            <div className="h-full flex flex-col justify-center items-center bg-gradient-to-br from-gray-900 to-black text-white p-6 rounded-xl">
                <p className="text-white">No reel ideas available</p>
            </div>
        );
    }

    const currentIdea = ideas[current];

    return (
        <div className="h-full flex flex-col justify-center items-center bg-gradient-to-br from-gray-900 to-black text-white p-6 rounded-xl">
            <motion.div
                key={currentIdea.id}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-lg max-w-md text-center w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">💡 Viral Reel Idea</h2>
                    <span className={`px-2 py-1 rounded-full text-xs ${currentIdea.type === 'dialogue' ? 'bg-blue-500' :
                        currentIdea.type === 'meme' ? 'bg-purple-500' :
                            'bg-green-500'
                        }`}>
                        {currentIdea.type}
                    </span>
                </div>

                <p className="text-lg font-semibold mb-4 italic">"{currentIdea.dialogue}"</p>
                <p className="text-sm text-gray-300 mb-4">{currentIdea.situation}</p>

                <div className="flex flex-wrap gap-2 justify-center mb-4">
                    {currentIdea.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-white/20 rounded-full text-xs">
                            #{tag}
                        </span>
                    ))}
                </div>

                <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>{current + 1} of {ideas.length}</span>
                    <span>Generating your "{topic}" reel...</span>
                </div>
            </motion.div>

            <div className="mt-6 text-center">
                <p className="text-gray-400 text-sm mb-4">
                    Exploring ideas while your script is generating…
                </p>
                <div className="flex justify-center space-x-2">
                    {ideas.map((_, index) => (
                        <div
                            key={index}
                            className={`w-2 h-2 rounded-full ${index === current ? 'bg-white' : 'bg-gray-600'
                                }`}
                        />
                    ))}
                </div>
            </div>

            <div className="mt-6 flex gap-3">
                <Button
                    onClick={() => setCurrent(prev => (prev + 1) % ideas.length)}
                    variant="secondary"
                    size="sm"
                >
                    Next Idea
                </Button>
                <Button
                    onClick={onDone}
                    variant="primary"
                    size="sm"
                    disabled={!isScriptReady}
                >
                    {isScriptReady ? "View Your Script" : "Script Generating..."}
                </Button>
            </div>

            {/* Additional message to clarify this is loading content */}
            <div className="mt-4 text-center text-xs text-gray-500">
                <p>These are sample ideas. Your custom script is being generated.</p>
            </div>
        </div>
    );
}