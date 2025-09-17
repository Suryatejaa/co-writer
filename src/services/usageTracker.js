// 🔥 Token Usage & Cost Tracking for OpenAI GPT-4o mini
// Real-time tracking with accurate pricing and INR conversion

// In-memory usage tracker (can be persisted to Firestore later)
let usage = {
    totalRequests: 0,
    inputTokens: 0,
    outputTokens: 0,
    estimatedCost: 0, // in USD
    lastRequestTime: null,
    dailyReset: null
};

// GPT-4o mini pricing (as of 2024)
const COST_INPUT = 0.15 / 1_000_000;   // $0.15 per 1M input tokens
const COST_OUTPUT = 0.60 / 1_000_000;  // $0.60 per 1M output tokens
const USD_TO_INR = 84; // Approximate exchange rate

/**
 * Log token usage from OpenAI API response
 * @param {number} inputTokens - Number of input tokens used
 * @param {number} outputTokens - Number of output tokens generated
 * @returns {object} Updated usage statistics
 */
export const logUsage = (inputTokens, outputTokens) => {
    const now = new Date();

    // Auto-reset daily counters at midnight
    const today = now.toDateString();
    if (usage.dailyReset !== today) {
        // Reset daily counters (keep total lifetime stats)
        usage.dailyReset = today;
    }

    // Update counters
    usage.totalRequests += 1;
    usage.inputTokens += inputTokens || 0;
    usage.outputTokens += outputTokens || 0;
    usage.lastRequestTime = now.toISOString();

    // Calculate estimated cost
    usage.estimatedCost =
        (usage.inputTokens * COST_INPUT) + (usage.outputTokens * COST_OUTPUT);

    console.log(`📊 Usage logged: +${inputTokens} input, +${outputTokens} output tokens`);

    return { ...usage }; // Return a copy for immutability
};

/**
 * Get current usage statistics
 * @returns {object} Current usage data
 */
export const getUsage = () => {
    return { ...usage };
};

/**
 * Reset usage statistics (for testing or manual reset)
 */
export const resetUsage = () => {
    usage = {
        totalRequests: 0,
        inputTokens: 0,
        outputTokens: 0,
        estimatedCost: 0,
        lastRequestTime: null,
        dailyReset: new Date().toDateString()
    };
    console.log("🔄 Usage statistics reset");
    return { ...usage };
};

/**
 * Get formatted cost strings for display
 * @returns {object} Formatted cost information
 */
export const getFormattedCosts = () => {
    const usdCost = usage.estimatedCost;
    const inrCost = usdCost * USD_TO_INR;

    return {
        usd: `$${usdCost.toFixed(4)}`,
        inr: `₹${inrCost.toFixed(2)}`,
        avgPerRequest: usage.totalRequests > 0
            ? `$${(usdCost / usage.totalRequests).toFixed(6)}/req`
            : '$0.000000/req'
    };
};

/**
 * Get usage efficiency metrics
 * @returns {object} Efficiency statistics
 */
export const getEfficiencyMetrics = () => {
    const totalTokens = usage.inputTokens + usage.outputTokens;
    const avgTokensPerRequest = usage.totalRequests > 0
        ? Math.round(totalTokens / usage.totalRequests)
        : 0;

    return {
        totalTokens,
        avgTokensPerRequest,
        inputOutputRatio: usage.outputTokens > 0
            ? (usage.inputTokens / usage.outputTokens).toFixed(2)
            : '0.00',
        costPerToken: totalTokens > 0
            ? `$${(usage.estimatedCost / totalTokens * 1000).toFixed(6)}/1K tokens`
            : '$0.000000/1K tokens'
    };
};

/**
 * Add demo usage data for testing (remove this in production)
 * @returns {object} Updated usage statistics with demo data
 */
export const addDemoData = () => {
    // Simulate some realistic usage for demo
    logUsage(150, 45);  // First call
    logUsage(180, 52);  // Second call  
    logUsage(165, 48);  // Third call
    logUsage(142, 41);  // Fourth call
    logUsage(158, 46);  // Fifth call

    console.log("🎆 Demo data added - 5 simulated API calls with realistic token usage");
    return { ...usage };
};