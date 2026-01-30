import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { isValidUsername } from '../utils/usernameValidation';
import './UsernameOnboarding.css';

export default function UsernameOnboarding() {
    const { currentUser } = useAuth();
    const [username, setUsername] = useState('');
    const [displayPreference, setDisplayPreference] = useState('username'); // 'name' or 'username'
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const handleSave = async () => {
        if (!currentUser) return;

        const validation = isValidUsername(username);
        if (!validation.valid) {
            setError(validation.error);
            toast.error(validation.error);
            return;
        }

        setSaving(true);
        setError(null);
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await setDoc(userRef, {
                username: username.replace(/\s+/g, '').toLowerCase(),
                displayPreference: displayPreference
            }, { merge: true });

            toast.success("Welcome to the hive!");
            // Determine if parent needs to reload or if context snapshot handles it (Snapshot handles it)
        } catch (error) {
            console.error("Error setting username:", error);
            toast.error("Failed to set username");
            setSaving(false);
        }
    };

    return (
        <div className="onboarding-overlay">
            <div className="onboarding-card">
                <div className="onboarding-icon">👋</div>

                <h2 className="onboarding-title">
                    Welcome!
                </h2>
                <p className="onboarding-subtitle">
                    Before you start creating, let's claim your unique username.
                </p>

                <div className="input-group">
                    <label className="input-label">Choose a Username</label>
                    <div className="username-input-wrapper">
                        <span className="username-prefix">@</span>
                        <input
                            type="text"
                            value={username}
                            onChange={e => {
                                setUsername(e.target.value.replace(/\s+/g, '').toLowerCase());
                                setError(null);
                            }}
                            placeholder="username"
                            autoFocus
                            className={`username-input ${error ? 'error' : ''}`}
                        />
                    </div>
                    {error && <p className="error-text">{error}</p>}
                </div>

                <div className="input-group">
                    <label className="input-label">How should we show your name?</label>
                    <div className="preference-group">
                        <button
                            onClick={() => setDisplayPreference('name')}
                            className={`preference-btn ${displayPreference === 'name' ? 'active' : ''}`}
                        >
                            <span className="font-medium">Use Name</span>
                            <span className="preference-subtext">{currentUser?.displayName || 'User'}</span>
                        </button>
                        <button
                            onClick={() => setDisplayPreference('username')}
                            className={`preference-btn ${displayPreference === 'username' ? 'active' : ''}`}
                        >
                            <span className="font-medium">Use Username</span>
                            <span className="preference-subtext">@{username || '...'}</span>
                        </button>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving || !username}
                    className="submit-btn"
                >
                    {saving ? 'Setting up...' : 'Get Started'}
                </button>
            </div>
            <style>{`
                .username-input.error {
                    border-color: #ef4444;
                }
                .error-text {
                    color: #ef4444;
                    font-size: 0.8rem;
                    margin-top: 6px;
                }
            `}</style>
        </div>
    );
}
