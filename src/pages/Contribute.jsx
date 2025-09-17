// Update Contribute.jsx
import React, { useState } from 'react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import '../Contribute.css';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';


const Contribute = () => {
    const [formData, setFormData] = useState({
        type: 'dialogue',
        content: '',
        situation: '',
        tags: ''
    });
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.content.trim() || !formData.situation.trim()) {
            setStatus({ type: "error", message: "Please fill in all required fields." });
            return;
        }
        setIsSubmitting(true);
        setStatus(null);

        try {
            // Extract the values from formData
            const { type, content, situation, tags } = formData;

            await addDoc(collection(db, "contentItems"), {
                type: type,  // Ensure we're sending just the string value
                dialogue: content,
                situation: situation,
                tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
                createdAt: serverTimestamp(),
            });

            setStatus({
                type: "success",
                message: "✅ Saved successfully! Thank you for your contribution.",
            });
            setSuccessMessage('Saved successfully! Thank you for your contribution.');

            // Reset form after successful submission
            setTimeout(() => {
                setSuccessMessage('');
                setFormData({
                    type: 'dialogue',
                    content: '',
                    situation: '',
                    tags: ''
                });
            }, 3000);
        } catch (err) {
            console.error("❌ Error saving:", err);
            setStatus({ type: "error", message: "❌ Failed to save. Please try again." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="contribute-container">
            <h1>Contribute Data</h1>
            <p>Help us improve our AI by adding dialogues, memes, or trends.</p>

            <div className="quick-tip">
                <p><strong>Quick tip:</strong></p>
                <pre>{`type: "dialogue"
dialogue: "sai raam"
situation: "when achieved something by lot of hard work"
tags: "motivation, celebration"`}</pre>
            </div>

            <form onSubmit={handleSubmit} className="contribute-form">
                <div className="form-group">
                    <label htmlFor="type" className="form-label">Type *</label>
                    <Select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        options={[
                            { value: 'dialogue', label: 'Dialogue' },
                            { value: 'meme', label: 'Meme' },
                            { value: 'trend', label: 'Trend' }
                        ]}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="content" className="form-label">Content *</label>
                    <Input
                        id="content"
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        placeholder="Enter dialogue/meme/trend..."
                        required
                        className="w-full"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="situation" className="form-label">Situation/Context *</label>
                    <Input
                        id="situation"
                        name="situation"
                        value={formData.situation}
                        onChange={handleChange}
                        placeholder="When/where this is used..."
                        required
                        className="w-full"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="tags" className="form-label">Tags (comma-separated)</label>
                    <Input
                        id="tags"
                        name="tags"
                        value={formData.tags}
                        onChange={handleChange}
                        placeholder="e.g., funny, romantic, reaction"
                        className="w-full"
                    />
                </div>

                <Button
                    type="submit"
                    className="form-button"
                    variant="primary"
                    size="md"
                >
                    Save Contribution
                </Button>
            </form>

            {successMessage && (
                <div className="form-success-message">
                    <span>✓</span> {successMessage}
                </div>
            )}
        </div>
    );
};

export default Contribute;