import { useAuth } from '../context/AuthContext';

export default function AdminSetupGuide() {
    const { user } = useAuth();

    if (!user) {
        return (
            <div style={{
                padding: "8px",
                backgroundColor: "#fff5f5",
                borderRadius: "8px",
                border: "2px solid #f5c6cb",
                margin: "8px 0"
            }}>
                <h3 style={{ color: "#721c24", marginBottom: "8px" }}>
                    🔐 Authentication Required
                </h3>
                <p style={{ color: "#666", fontSize: "14px" }}>
                    Please wait while we sign you in anonymously...
                </p>
            </div>
        );
    }

    return (
        <div style={{
            padding: "8px",
            backgroundColor: "#e3f2fd",
            borderRadius: "8px",
            border: "2px solid #2196f3",
            margin: "8px 0"
        }}>
            <h3 style={{ color: "#1976d2", marginBottom: "8px" }}>
                🛡️ Admin Setup Guide
            </h3>

            <div style={{ fontSize: "14px", color: "#1565c0", lineHeight: "1.5" }}>
                <p><strong>Your User ID:</strong></p>
                <div style={{
                    backgroundColor: "#fff",
                    padding: "8px",
                    borderRadius: "4px",
                    fontFamily: "monospace",
                    fontSize: "12px",
                    margin: "4px 0 8px 0",
                    border: "1px solid #ddd"
                }}>
                    {user.uid}
                </div>

                <p><strong>Steps to enable admin access:</strong></p>
                <ol style={{ paddingLeft: "20px", margin: "8px 0" }}>
                    <li>Go to Firebase Console → Firestore Database</li>
                    <li>Create a collection called <code style={{ backgroundColor: "#f5f5f5", padding: "2px 4px", borderRadius: "3px" }}>admins</code></li>
                    <li>Add a document with ID: <code style={{ backgroundColor: "#f5f5f5", padding: "2px 4px", borderRadius: "3px" }}>{user.uid}</code></li>
                    <li>Add any field (e.g., <code style={{ backgroundColor: "#f5f5f5", padding: "2px 4px", borderRadius: "3px" }}>enabled: true</code>)</li>
                    <li>Refresh this page</li>
                </ol>

                <div style={{
                    backgroundColor: "#fff3e0",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ffb74d",
                    marginTop: "8px"
                }}>
                    <strong>📋 Firestore Rules Example:</strong>
                    <pre style={{
                        fontSize: "11px",
                        fontFamily: "monospace",
                        margin: "4px 0",
                        whiteSpace: "pre-wrap",
                        color: "#bf360c"
                    }}>{`// Admin-only dataset collection
match /datasets/{docId} {
  allow read: if request.auth != null;
  allow write: if request.auth.token.admin == true 
             || exists(/databases/$(database)/documents/admins/$(request.auth.uid));
}`}</pre>
                </div>
            </div>
        </div>
    );
}