import { useEffect, useState } from "react";
import { getUsage, getFormattedCosts, getEfficiencyMetrics, resetUsage, addDemoData } from "../services/usageTracker";

export default function UsageMetricsCard() {
    const [usage, setUsage] = useState(getUsage());
    const [costs, setCosts] = useState(getFormattedCosts());
    const [efficiency, setEfficiency] = useState(getEfficiencyMetrics());

    useEffect(() => {
        // Auto-refresh usage stats every 2 seconds
        const interval = setInterval(() => {
            const currentUsage = getUsage();
            const currentCosts = getFormattedCosts();
            const currentEfficiency = getEfficiencyMetrics();

            setUsage(currentUsage);
            setCosts(currentCosts);
            setEfficiency(currentEfficiency);
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const handleDemo = () => {
        const demoData = addDemoData();
        setUsage(demoData);
        setCosts(getFormattedCosts());
        setEfficiency(getEfficiencyMetrics());
    };

    const handleReset = () => {
        if (confirm("Are you sure you want to reset all usage statistics? This action cannot be undone.")) {
            const resetData = resetUsage();
            setUsage(resetData);
            setCosts(getFormattedCosts());
            setEfficiency(getEfficiencyMetrics());
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "No requests yet";
        return new Date(dateString).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            dateStyle: 'short',
            timeStyle: 'medium'
        });
    };

    const getUsageStatus = () => {
        if (usage.totalRequests === 0) return { text: "Ready", color: "#6c757d", bgColor: "#f8f9fa" };
        if (usage.estimatedCost < 0.01) return { text: "Light Usage", color: "#28a745", bgColor: "#d4edda" };
        if (usage.estimatedCost < 0.05) return { text: "Moderate", color: "#ffc107", bgColor: "#fff3cd" };
        if (usage.estimatedCost < 0.20) return { text: "Heavy Usage", color: "#fd7e14", bgColor: "#ffebd9" };
        return { text: "Very Heavy", color: "#dc3545", bgColor: "#f8d7da" };
    };

    const status = getUsageStatus();

    return (
        <div style={{
            padding: "4px",
            border: "1px solid #000",
            backgroundColor: "#fff",
            width: "100%",
            boxSizing: "border-box",
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace"
        }}>
            {/* Header - Mobile optimized */}
            <div style={{
                display: "flex",
                flexDirection: "row",
                gap: "4px",
                marginBottom: "4px",
                alignItems: "center",
                justifyContent: "space-between"
            }}>
                <h2 style={{
                    fontSize: "14px",
                    fontWeight: "400",
                    color: "#000",
                    margin: "0",
                    textAlign: "left",
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace"
                }}>
                    ▶ Usage Tracker
                </h2>

                {/* Usage Status Badge */}
                <div style={{
                    padding: "2px 4px",
                    backgroundColor: status.text === "Ready" ? "#fff" : "#000",
                    color: status.text === "Ready" ? "#000" : "#fff",
                    fontSize: "9px",
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                    border: "1px solid #000",
                    textAlign: "center"
                }}>
                    {status.text.toLowerCase()}
                </div>
            </div>

            {/* Primary Metrics */}
            <div style={{
                display: "flex",
                flexDirection: "row",
                gap: "4px",
                marginBottom: "4px"
            }}>
                {/* Total Requests */}
                <div style={{
                    padding: "4px",
                    backgroundColor: "#fff",
                    border: "1px solid #000",
                    textAlign: "center",
                    flex: 1
                }}>
                    <div style={{ fontSize: "14px", fontWeight: "400", color: "#000", fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace" }}>
                        {usage.totalRequests}
                    </div>
                    <div style={{ fontSize: "9px", color: "#666", fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace" }}>requests</div>
                </div>

                {/* Estimated Cost */}
                <div style={{
                    padding: "4px",
                    backgroundColor: "#fff",
                    border: "1px solid #000",
                    textAlign: "center",
                    flex: 1
                }}>
                    <div style={{ fontSize: "14px", fontWeight: "400", color: "#000", fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace" }}>
                        {costs.usd}
                    </div>
                    <div style={{ fontSize: "9px", color: "#666", fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace" }}>
                        cost
                    </div>
                </div>
            </div>

            {/* Token Usage & Actions Combined */}
            <div style={{
                padding: "4px",
                backgroundColor: "#fff",
                border: "1px solid #000",
                marginBottom: "4px"
            }}>
                <h3 style={{
                    fontSize: "11px",
                    fontWeight: "400",
                    marginBottom: "4px",
                    color: "#000",
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace"
                }}>
                    • Tokens & Actions
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "9px", fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "#666" }}>Input:</span>
                        <span style={{ fontWeight: "400", color: "#000" }}>
                            {usage.inputTokens.toLocaleString()}
                        </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "#666" }}>Output:</span>
                        <span style={{ fontWeight: "400", color: "#000" }}>
                            {usage.outputTokens.toLocaleString()}
                        </span>
                    </div>

                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingTop: "2px",
                        borderTop: "1px solid #ddd",
                        marginTop: "2px"
                    }}>
                        <span style={{ fontWeight: "400", color: "#000" }}>Total:</span>
                        <span style={{ fontWeight: "400", color: "#000" }}>
                            {efficiency.totalTokens.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: "2px", marginTop: "4px" }}>
                    <button
                        onClick={handleDemo}
                        style={{
                            padding: "2px 4px",
                            backgroundColor: "#666",
                            color: "#fff",
                            border: "1px solid #000",
                            fontSize: "8px",
                            cursor: "pointer",
                            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                            flex: 1
                        }}
                        title="Add demo data"
                    >
                        demo
                    </button>

                    <button
                        onClick={handleReset}
                        style={{
                            padding: "2px 4px",
                            backgroundColor: "#000",
                            color: "#fff",
                            border: "1px solid #000",
                            fontSize: "8px",
                            cursor: "pointer",
                            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                            flex: 1
                        }}
                        title="Reset statistics"
                    >
                        reset
                    </button>
                </div>

                <div style={{ fontSize: "8px", color: "#666", textAlign: "center", marginTop: "2px", fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace" }}>
                    Last: {usage.lastRequestTime ? new Date(usage.lastRequestTime).toLocaleTimeString() : 'none'}
                </div>
            </div>

            {/* Tips - Simplified */}
            {usage.totalRequests === 0 && (
                <div style={{
                    padding: "4px",
                    backgroundColor: "#f8f8f8",
                    border: "1px solid #ddd",
                    fontSize: "9px",
                    color: "#666",
                    textAlign: "center",
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace"
                }}>
                    Generate first script to start tracking
                </div>
            )}

            {usage.totalRequests > 0 && usage.estimatedCost > 0.10 && (
                <div style={{
                    padding: "4px",
                    backgroundColor: "#fff",
                    border: "1px solid #000",
                    fontSize: "9px",
                    color: "#000",
                    textAlign: "center",
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace"
                }}>
                    Cost alert: $0.10+ spent this session
                </div>
            )}
        </div>
    );
}