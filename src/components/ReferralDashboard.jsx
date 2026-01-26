import React from 'react';
import { useUserInteractions } from '../contexts/UserInteractionsContext';
import { Copy, Gift, Users, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReferralDashboard() {
    const { userProfile } = useUserInteractions();
    const referralLink = `https://dreambeesai.com/?ref=${userProfile.referralCode || 'join'}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralLink);
        toast.success("Referral link copied!");
    };

    return (
        <div className="referral-dashboard glass-panel p-8 rounded-2xl border border-white/10 space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
                    <Gift size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold">Referral Rewards</h2>
                    <p className="text-zinc-400">Invite friends and earn premium credits.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                    <div className="text-zinc-400 text-sm mb-1 uppercase tracking-wider">Total Referrals</div>
                    <div className="text-3xl font-bold flex items-center gap-2">
                        <Users className="text-purple-400" size={24} />
                        {userProfile.referralCount || 0}
                    </div>
                </div>
                <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                    <div className="text-zinc-400 text-sm mb-1 uppercase tracking-wider">Credits Earned</div>
                    <div className="text-3xl font-bold flex items-center gap-2">
                        <Gift className="text-purple-400" size={24} />
                        {(userProfile.referralCount || 0) * 50}
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <label className="text-sm font-medium text-zinc-300">Your Referral Link</label>
                <div className="flex gap-2">
                    <div className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-zinc-300 font-mono text-sm truncate">
                        {referralLink}
                    </div>
                    <button
                        onClick={copyToClipboard}
                        className="p-3 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors"
                        title="Copy Link"
                    >
                        <Copy size={20} />
                    </button>
                    <a
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Create stunning AI art for free on DreamBees! Use my link for 50 bonus credits: ${referralLink}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                        title="Share on X"
                    >
                        <ExternalLink size={20} />
                    </a>
                </div>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl">
                <p className="text-sm text-purple-300 leading-relaxed">
                    <strong>Pro Tip:</strong> For every friend who signs up using your link, both of you receive <strong>50 bonus credits</strong> instantly. There's no limit to how many friends you can invite!
                </p>
            </div>
        </div>
    );
}
