import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const captions = [
    "🎬 Finding the perfect dialogue...",
    "😂 Mixing comedy & memes...",
    "🔥 Cooking up savage punchline...",
    "🎥 Adding cinematic vibes...",
    "📱 Finalizing Insta caption...",
    "✨ Reel script almost ready..."
];

const emojis = {
    comedy: ["🤣", "😂", "😆", "🎭"],
    cinematic: ["🎥", "🎬", "📽️", "🎞️"],
    romantic: ["💕", "😍", "💑", "🌹"],
    savage: ["🔥", "⚡", "💣", "💥"],
    dramatic: ["🎭", "🎬", "スポットライト", "🎬"],
    relatable: ["🤔", "🤷‍♂️", "👀", "💯"],
    educational: ["📚", "🧠", "🎓", "💡"]
};

export default function ReelLoader({ genre = "comedy" }) {
    const [index, setIndex] = useState(0);

    // Cycle through captions every 3s
    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % captions.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // Genre-based color themes
    const genreColors = {
        comedy: "from-yellow-400 to-pink-500",
        cinematic: "from-purple-500 to-indigo-700",
        romantic: "from-pink-500 to-rose-600",
        savage: "from-red-500 to-orange-600",
        dramatic: "from-gray-700 to-black",
        relatable: "from-blue-400 to-cyan-500",
        educational: "from-green-400 to-teal-600"
    };

    const currentEmojis = emojis[genre] || emojis.comedy;

    return (
        <div className="h-full flex flex-col justify-center items-center bg-gradient-to-br from-gray-900 to-black text-white p-6 rounded-xl">
            {/* Animated Progress Bar */}
            <motion.div
                className="w-full max-w-md h-2 bg-gray-700 rounded-full overflow-hidden mb-6"
            >
                <motion.div
                    className={`h-full bg-gradient-to-r ${genreColors[genre] || genreColors.comedy} rounded-full`}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 45, ease: "linear" }} // Matches API wait
                />
            </motion.div>

            {/* Animated captions */}
            <motion.p
                key={index}
                className="text-xl font-semibold text-center px-6 mb-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.6 }}
            >
                {captions[index]}
            </motion.p>

            {/* Reel vibe animation */}
            <motion.div
                className="flex gap-4 mb-8"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
            >
                <span className="text-3xl">🎬</span>
                {currentEmojis.map((emoji, i) => (
                    <motion.span
                        key={i}
                        className="text-3xl"
                        animate={{
                            y: [0, -10, 0],
                            rotate: [0, 10, -10, 0]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.2
                        }}
                    >
                        {emoji}
                    </motion.span>
                ))}
                <span className="text-3xl">📱</span>
            </motion.div>

            {/* Additional loading indicators */}
            <div className="flex space-x-2">
                {[...Array(3)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="w-3 h-3 bg-white rounded-full"
                        animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: i * 0.2
                        }}
                    />
                ))}
            </div>
        </div>
    );
}