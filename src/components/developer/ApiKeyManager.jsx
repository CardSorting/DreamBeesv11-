import React, { useEffect, useState } from 'react';
import { useApiKeys } from '../../hooks/useApiKeys';
import { Copy, Trash2, Key, Plus, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ApiKeyManager = () => {
    const { keys, loading, fetchKeys, createKey, revokeKey } = useApiKeys();
    const [newKeyName, setNewKeyName] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState({ read: true, write: true });
    const [createdKeyData, setCreatedKeyData] = useState(null); // { key, meta }
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchKeys();
    }, [fetchKeys]);

    const handleCreate = async () => {
        if (!newKeyName.trim()) return;

        // Construct scope based on permissions
        const scope = ['default'];
        if (selectedPermissions.read) scope.push('agent:read');
        if (selectedPermissions.write) scope.push('agent:write');

        const result = await createKey(newKeyName, scope);
        if (result) {
            setCreatedKeyData(result);
            setNewKeyName('');
            setIsCreating(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    const timeAgo = (dateString) => {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-6 text-white">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Key className="text-yellow-400" /> API Keys
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">Manage access keys for your OpenClaw agents.</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-all"
                >
                    <Plus size={18} /> Generate New Key
                </button>
            </div>

            {/* CREATION MODAL / PANEL */}
            <AnimatePresence>
                {createdKeyData && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mb-8 p-6 bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-500/30 rounded-xl"
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-green-500/20 rounded-full">
                                <CheckCircle className="text-green-400" size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-green-100">Key Generated Successfully</h3>
                                <p className="text-sm text-green-200/70 mb-4">
                                    This token will only be shown once. Please copy it now.
                                </p>
                                <div className="flex items-center gap-2 bg-black/50 p-3 rounded-lg border border-white/10 group relative">
                                    <code className="flex-1 font-mono text-emerald-400 break-all">
                                        {createdKeyData.key}
                                    </code>
                                    <button
                                        onClick={() => copyToClipboard(createdKeyData.key)}
                                        className="p-2 hover:bg-white/10 rounded-md transition-colors"
                                        title="Copy to clipboard"
                                    >
                                        <Copy size={18} className="text-gray-400 group-hover:text-white" />
                                    </button>
                                </div>
                                <button
                                    onClick={() => setCreatedKeyData(null)}
                                    className="mt-4 text-xs text-green-400 hover:text-green-300 underline"
                                >
                                    I have saved this key
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CREATION INPUT */}
            <AnimatePresence>
                {isCreating && !createdKeyData && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-6"
                    >
                        <div className="bg-gray-800/50 p-4 rounded-xl border border-white/10 flex flex-col gap-4">
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    placeholder="Key Name (e.g. Production Bot)"
                                    value={newKeyName}
                                    onChange={(e) => setNewKeyName(e.target.value)}
                                    className="flex-1 bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                                    autoFocus
                                />
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-300">
                                <span className="text-gray-500 uppercase text-xs font-bold tracking-wider">Permissions:</span>
                                <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                                    <input
                                        type="checkbox"
                                        checked={selectedPermissions.read}
                                        onChange={e => setSelectedPermissions(p => ({ ...p, read: e.target.checked }))}
                                        className="rounded bg-black/30 border-white/10 text-indigo-500 focus:ring-indigo-500"
                                    />
                                    Agent Read
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                                    <input
                                        type="checkbox"
                                        checked={selectedPermissions.write}
                                        onChange={e => setSelectedPermissions(p => ({ ...p, write: e.target.checked }))}
                                        className="rounded bg-black/30 border-white/10 text-indigo-500 focus:ring-indigo-500"
                                    />
                                    Agent Write
                                </label>
                            </div>

                            <div className="flex gap-3 pt-2 border-t border-white/5">
                                <button
                                    onClick={handleCreate}
                                    disabled={loading || !newKeyName.trim()}
                                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    {loading ? 'Creating...' : 'Create Key'}
                                </button>
                                <button
                                    onClick={() => setIsCreating(false)}
                                    className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* KEY LIST */}
            <div className="bg-gray-900/50 border border-white/5 rounded-xl overflow-hidden backdrop-blur-sm">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/5">
                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Token ID</th>
                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Created</th>
                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Last Used</th>
                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading && keys.length === 0 ? (
                            // SKELETON LOADING
                            [1, 2, 3].map(i => (
                                <tr key={i} className="animate-pulse">
                                    <td className="p-4"><div className="h-4 bg-white/10 rounded w-32"></div></td>
                                    <td className="p-4"><div className="h-4 bg-white/10 rounded w-24"></div></td>
                                    <td className="p-4"><div className="h-4 bg-white/10 rounded w-20"></div></td>
                                    <td className="p-4"><div className="h-4 bg-white/10 rounded w-20"></div></td>
                                    <td className="p-4"><div className="h-8 bg-white/10 rounded w-8 ml-auto"></div></td>
                                </tr>
                            ))
                        ) : keys.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500 italic">
                                    No API keys found. Create one to get started.
                                </td>
                            </tr>
                        ) : (
                            keys.map((key) => (
                                <tr key={key.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-4">
                                        <div className="font-medium text-white">{key.name}</div>
                                        {/* Show scopes in tiny text */}
                                        <div className="flex gap-1 mt-1">
                                            {key.scope?.map(scope => (
                                                <span key={scope} className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/20">
                                                    {scope}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4 font-mono text-sm text-gray-400">
                                        {key.prefix}...{key.lastChars}
                                    </td>
                                    <td className="p-4 text-sm text-gray-500">
                                        {new Date(key.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-sm text-gray-400">
                                        {key.lastUsed ? (
                                            <span className="text-green-400">{timeAgo(key.lastUsed)}</span>
                                        ) : (
                                            <span className="text-gray-600">Never</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => {
                                                if (window.confirm(`Revoke key "${key.name}"? API calls using this key will fail immediately.`)) {
                                                    revokeKey(key.id);
                                                }
                                            }}
                                            className="text-gray-500 hover:text-red-500 transition-colors p-2 rounded-md hover:bg-red-500/10"
                                            title="Revoke Key"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-8 p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg flex gap-3 text-sm text-blue-200">
                <AlertTriangle className="shrink-0 text-blue-400" size={20} />
                <p>
                    Ensure you store your API keys securely. Do not expose them in client-side code causing public access.
                    Use environment variables (<code>.env</code>) on your backend services.
                </p>
            </div>
        </div>
    );
};

export default ApiKeyManager;
