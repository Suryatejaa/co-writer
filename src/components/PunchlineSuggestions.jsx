import { motion } from "framer-motion";
import Button from "./ui/Button";

const PunchlineSuggestions = ({ suggestions, onUseSuggestion }) => {
    if (!suggestions || suggestions.length === 0) return null;

    return (
        <motion.div
            className="contribute-form mt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <h3 className="text-lg font-semibold text-gray-800 border-b border-white/30 pb-2 mb-3">
                💡 Suggested Punchlines
            </h3>

            <p className="text-sm text-gray-600 mb-4">
                These punchlines are highly relevant to your topic. Click to use one in a new generation:
            </p>

            <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                    <motion.div
                        key={`${suggestion.id}-${index}`}
                        className="p-3 bg-white/50 rounded-lg border border-gray-200 hover:bg-white/70 transition-all"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <p className="font-medium text-gray-800">
                                    "{suggestion.text}"
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    <span className="font-medium">Situation:</span> {suggestion.situation}
                                </p>
                                <div className="flex items-center mt-2">
                                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${suggestion.type === 'dialogue' ? 'bg-blue-100 text-blue-800' :
                                            suggestion.type === 'meme' ? 'bg-purple-100 text-purple-800' :
                                                'bg-green-100 text-green-800'
                                        }`}>
                                        {suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1)}
                                    </span>
                                </div>
                            </div>
                            <Button
                                onClick={() => onUseSuggestion(suggestion)}
                                variant="secondary"
                                size="sm"
                                className="ml-3"
                            >
                                Use
                            </Button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

export default PunchlineSuggestions;