import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords,
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  Target,
  RefreshCw,
  Loader2,
  ExternalLink,
  Crown,
  Users,
} from 'lucide-react';
import { Card, Button, Input } from '@/components/ui';
import { useCFStore } from '@/stores';
import { CF_RANK_COLORS } from '@/types';
import type { Rival, CFRatingChange } from '@/types';
import { cn } from '@/utils';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

// ========== Mini Sparkline ==========
function Sparkline({ data, color, height = 40, width = 160 }: { data: number[]; color: string; height?: number; width?: number }) {
  if (data.length < 2) return null;
  const min = Math.min(...data) - 50;
  const max = Math.max(...data) + 50;
  const xStep = width / (data.length - 1);
  const yScale = (v: number) => height - ((v - min) / (max - min)) * height;

  const pathD = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i * xStep).toFixed(1)} ${yScale(v).toFixed(1)}`).join(' ');

  return (
    <svg width={width} height={height} className="shrink-0">
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={(data.length - 1) * xStep} cy={yScale(data[data.length - 1])} r="3" fill={color} />
    </svg>
  );
}

// ========== Comparison Table ==========
function ComparisonOverlay({ self, rivals }: { self: { handle: string; rating: number; maxRating: number; solved: number; contests: number }; rivals: Rival[] }) {
  const allPlayers = [
    { handle: self.handle, rating: self.rating, maxRating: self.maxRating, solved: self.solved, contests: self.contests, isSelf: true },
    ...rivals.map((r) => ({
      handle: r.handle,
      rating: r.user?.rating || 0,
      maxRating: r.user?.maxRating || 0,
      solved: r.solvedCount,
      contests: r.ratingHistory.length,
      isSelf: false,
    })),
  ].sort((a, b) => b.rating - a.rating);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-500 border-b border-surface-border">
            <th className="text-left py-2 px-2">#</th>
            <th className="text-left py-2 px-2">Handle</th>
            <th className="text-right py-2 px-2">Rating</th>
            <th className="text-right py-2 px-2">Max</th>
            <th className="text-right py-2 px-2">Solved</th>
            <th className="text-right py-2 px-2">Contests</th>
          </tr>
        </thead>
        <tbody>
          {allPlayers.map((p, i) => (
            <tr
              key={p.handle}
              className={cn(
                'border-b border-surface-border/50 transition-colors',
                p.isSelf ? 'bg-accent/5' : 'hover:bg-surface-hover'
              )}
            >
              <td className="py-2 px-2 text-gray-500">
                {i === 0 ? <Crown className="w-4 h-4 text-yellow-400" /> : i + 1}
              </td>
              <td className="py-2 px-2 font-semibold">
                <span className={p.isSelf ? 'text-accent-light' : 'text-white'}>
                  {p.handle}
                  {p.isSelf && <span className="text-xs text-gray-500 ml-1">(you)</span>}
                </span>
              </td>
              <td className="py-2 px-2 text-right font-mono font-bold text-white">{p.rating}</td>
              <td className="py-2 px-2 text-right font-mono text-gray-400">{p.maxRating}</td>
              <td className="py-2 px-2 text-right font-mono text-green-400">{p.solved}</td>
              <td className="py-2 px-2 text-right font-mono text-gray-400">{p.contests}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ========== Main Page ==========
export default function RivalsPage() {
  const {
    user,
    isConnected,
    rivals,
    ratingHistory,
    solvedSet,
    addRival,
    removeRival,
    syncRivals,
  } = useCFStore();

  const [newHandle, setNewHandle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async () => {
    if (!newHandle.trim()) return;
    setError('');
    setIsAdding(true);
    const ok = await addRival(newHandle.trim());
    if (!ok) setError('User not found or already added.');
    else setNewHandle('');
    setIsAdding(false);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await syncRivals();
    setIsSyncing(false);
  };

  if (!isConnected || !user) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Swords className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-white mb-2">Connect Codeforces First</h2>
          <p className="text-gray-400 text-sm">Go to Profile to link your handle.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-5xl mx-auto space-y-6"
      >
        {/* Header */}
        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Swords className="w-5 h-5 text-red-400" />
              Rival Tracker
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Track and compare with your competitive rivals
            </p>
          </div>
          {rivals.length > 0 && (
            <Button size="sm" variant="secondary" onClick={handleSync} disabled={isSyncing}>
              {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Sync All
            </Button>
          )}
        </motion.div>

        {/* Add Rival */}
        <motion.div variants={item}>
          <Card className="p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter rival's Codeforces handle..."
                value={newHandle}
                onChange={(e) => setNewHandle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="flex-1"
              />
              <Button onClick={handleAdd} disabled={isAdding}>
                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Add Rival</>}
              </Button>
            </div>
            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
          </Card>
        </motion.div>

        {/* Leaderboard */}
        {rivals.length > 0 && (
          <motion.div variants={item}>
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-5 h-5 text-yellow-400" />
                <h3 className="font-bold text-white">Leaderboard</h3>
              </div>
              <ComparisonOverlay
                self={{
                  handle: user.handle,
                  rating: user.rating,
                  maxRating: user.maxRating,
                  solved: solvedSet.length,
                  contests: ratingHistory.length,
                }}
                rivals={rivals}
              />
            </Card>
          </motion.div>
        )}

        {/* Rival Cards */}
        {rivals.length === 0 ? (
          <motion.div variants={item} className="text-center py-16">
            <Users className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <h3 className="text-gray-400 font-medium">No rivals yet</h3>
            <p className="text-gray-600 text-xs mt-1">Add rivals above to start comparing</p>
          </motion.div>
        ) : (
          <motion.div variants={container} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rivals.map((rival) => {
              const rankColor = CF_RANK_COLORS[rival.user?.rank?.toLowerCase() || 'newbie'] || '#808080';
              const ratingDiff = (user.rating || 0) - (rival.user?.rating || 0);
              const solvedDiff = solvedSet.length - rival.solvedCount;
              const sparkData = rival.ratingHistory.map((r) => r.newRating);

              return (
                <motion.div key={rival.handle} variants={item}>
                  <Card className="p-4 hover:border-accent/30 transition-all group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {rival.user && (
                          <img
                            src={rival.user.avatar.startsWith('//') ? 'https:' + rival.user.avatar : rival.user.avatar}
                            alt={rival.handle}
                            className="w-12 h-12 rounded-lg border-2 object-cover"
                            style={{ borderColor: rankColor }}
                          />
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`https://codeforces.com/profile/${rival.handle}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-sm hover:text-accent transition-colors"
                              style={{ color: rankColor }}
                            >
                              {rival.handle}
                            </a>
                            <ExternalLink className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="text-xs capitalize" style={{ color: rankColor }}>
                            {rival.user?.rank || 'unrated'}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => removeRival(rival.handle)}
                        className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Sparkline */}
                    <div className="mt-3 flex justify-center">
                      <Sparkline data={sparkData} color={rankColor} width={280} height={50} />
                    </div>

                    {/* Comparison stats */}
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div className="text-center p-2 rounded-lg bg-surface-dark/50">
                        <div className="text-xs text-gray-500">Rating</div>
                        <div className="text-sm font-bold text-white">{rival.user?.rating || '?'}</div>
                        <div className={cn(
                          'text-[10px] font-mono',
                          ratingDiff > 0 ? 'text-green-400' : ratingDiff < 0 ? 'text-red-400' : 'text-gray-500'
                        )}>
                          {ratingDiff > 0 ? `you +${ratingDiff}` : ratingDiff < 0 ? `you ${ratingDiff}` : 'tied'}
                        </div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-surface-dark/50">
                        <div className="text-xs text-gray-500">Solved</div>
                        <div className="text-sm font-bold text-white">{rival.solvedCount}</div>
                        <div className={cn(
                          'text-[10px] font-mono',
                          solvedDiff > 0 ? 'text-green-400' : solvedDiff < 0 ? 'text-red-400' : 'text-gray-500'
                        )}>
                          {solvedDiff > 0 ? `you +${solvedDiff}` : solvedDiff < 0 ? `you ${solvedDiff}` : 'tied'}
                        </div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-surface-dark/50">
                        <div className="text-xs text-gray-500">Contests</div>
                        <div className="text-sm font-bold text-white">{rival.ratingHistory.length}</div>
                        <div className="text-[10px] text-gray-500">
                          max {rival.user?.maxRating || '?'}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
