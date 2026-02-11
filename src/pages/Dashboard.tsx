import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Code2,
  Trophy,
  Target,
  Flame,
  TrendingUp,
  Clock,
  Star,
  ArrowRight,
  Zap,
  BarChart3,
  Award,
  Shield,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { useProblemStore, useAppStore, useCFStore } from '@/stores';
import { RANKS, CF_RANK_COLORS } from '@/types';
import {
  cn,
  getStreakEmoji,
  getRelativeTime,
  getDifficultyColor,
  getVerdictColor,
  getLanguageLabel,
} from '@/utils';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};
export default function Dashboard() { 
  const navigate = useNavigate();
  const { problems, submissions } = useProblemStore();
  const { stats } = useAppStore();
  const { gamification } = useAppStore();
  const { user, isConnected } = useCFStore();

  const solved = problems.filter((p) => p.isSolved).length;
  const favorites = problems.filter((p) => p.isFavorite).length;
  const recentProblems = [...problems]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 5);
  const recentSubmissions = submissions.slice(0, 8);

  return (
    <div className="h-full overflow-auto p-6">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-6xl mx-auto space-y-6"
      >
        {/* Codeforces Profile Widget */}
        <motion.div variants={item}>
          <Card className="p-4 flex items-center gap-5 border-accent/20 mb-2">
            {isConnected && user ? (
              <>
                <img
                  src={user.avatar.startsWith('//') ? 'https:' + user.avatar : user.avatar}
                  alt={user.handle}
                  className="w-12 h-12 rounded-lg border-2 object-cover"
                  style={{ borderColor: CF_RANK_COLORS[user.rank?.toLowerCase()] || '#808080' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg" style={{ color: CF_RANK_COLORS[user.rank?.toLowerCase()] || '#808080' }}>{user.handle}</span>
                    <span className="text-xs font-semibold capitalize" style={{ color: CF_RANK_COLORS[user.rank?.toLowerCase()] || '#808080' }}>{user.rank}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span>Rating: <span className="font-mono font-bold text-accent">{user.rating}</span></span>
                    <span>Max: <span className="font-mono text-yellow-400">{user.maxRating}</span></span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => navigate('/profile')}>Profile</Button>
                  <Button size="sm" variant="primary" onClick={() => navigate('/recommend')}>Recommend</Button>
                  <Button size="sm" variant="secondary" onClick={() => navigate('/rivals')}>Rivals</Button>
                  <Button size="sm" variant="secondary" onClick={() => navigate('/virtual-contest')}>Virtual</Button>
                </div>
              </>
            ) : (
              <div className="flex-1 text-center">
                <span className="text-sm text-gray-400">Connect your Codeforces handle in <Button size="sm" variant="primary" onClick={() => navigate('/profile')}>Profile</Button> to unlock rating graph, recommendations, rivals, and virtual contests!</span>
              </div>
            )}
          </Card>
        </motion.div>
        {/* Hero section */}
        <motion.div variants={item} className="relative overflow-hidden rounded-2xl gradient-bg p-8">
          <div className="relative z-10">
            <h1 className="text-2xl font-bold text-white mb-2">
              Welcome back to <span className="font-extrabold">CPHelper</span> {getStreakEmoji(stats.streakDays)}
            </h1>
            <p className="text-white/70 text-sm mb-5">
              {stats.streakDays > 0
                ? `You're on a ${stats.streakDays}-day streak! Keep it going!`
                : "Ready to crush some problems today?"}
            </p>
            <button
              onClick={() => navigate('/solve')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 backdrop-blur-sm text-white text-sm font-semibold hover:bg-white/20 transition-colors border border-white/20"
            >
              <Code2 className="w-4 h-4" />
              Start Solving
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
            <div className="w-full h-full rounded-full bg-white blur-3xl" />
          </div>
          <div className="absolute -bottom-10 -right-10 text-[120px] font-black text-white/5 select-none">
            &lt;/&gt;
          </div>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <motion.div variants={item}>
            <StatCard
              icon={<Target className="w-5 h-5" />}
              label="Problems Solved"
              value={solved}
              total={problems.length}
              color="text-green-400"
              bgColor="bg-green-500/10"
            />
          </motion.div>
          <motion.div variants={item}>
            <StatCard
              icon={<Flame className="w-5 h-5" />}
              label="Day Streak"
              value={stats.streakDays}
              color="text-orange-400"
              bgColor="bg-orange-500/10"
            />
          </motion.div>
          <motion.div variants={item}>
            <StatCard
              icon={<Zap className="w-5 h-5" />}
              label="Submissions"
              value={submissions.length}
              color="text-cyan-400"
              bgColor="bg-cyan-500/10"
            />
          </motion.div>
          <motion.div variants={item}>
            <StatCard
              icon={<Star className="w-5 h-5" />}
              label="Favorites"
              value={favorites}
              color="text-yellow-400"
              bgColor="bg-yellow-500/10"
            />
          </motion.div>
        </div>

        {/* XP / Level / Achievements Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Level & XP Card */}
          <motion.div variants={item}>
            <Card className="h-full">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black border-2"
                  style={{
                    borderColor: RANKS.find((r) => r.name === gamification.rank)?.color || '#808080',
                    color: RANKS.find((r) => r.name === gamification.rank)?.color || '#808080',
                    backgroundColor: `${RANKS.find((r) => r.name === gamification.rank)?.color || '#808080'}15`,
                  }}
                >
                  {gamification.level}
                </div>
                <div>
                  <div className="text-sm font-bold" style={{ color: RANKS.find((r) => r.name === gamification.rank)?.color }}>
                    {gamification.rank}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {gamification.totalXpEarned.toLocaleString()} Total XP
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>Level {gamification.level}</span>
                  <span>Level {gamification.level + 1}</span>
                </div>
                <div className="h-2 rounded-full bg-surface-border overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(((500 + gamification.level * 100 - gamification.xpToNextLevel) / (500 + gamification.level * 100)) * 100, 100)}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full rounded-full relative overflow-hidden"
                    style={{ backgroundColor: RANKS.find((r) => r.name === gamification.rank)?.color }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    />
                  </motion.div>
                </div>
              </div>

              {/* Recent XP */}
              {gamification.recentXP.length > 0 && (
                <div className="mt-4 space-y-1">
                  <h4 className="text-[10px] font-semibold text-gray-500 uppercase">Recent XP</h4>
                  {gamification.recentXP.slice(0, 5).map((e, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-400">{e.label}</span>
                      <span className="text-yellow-400 font-bold">+{e.xp}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>

          {/* Achievements Card */}
          <motion.div variants={item} className="lg:col-span-2">
            <Card className="h-full">
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Achievements ({gamification.achievements.filter((a) => a.unlocked).length}/{gamification.achievements.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {gamification.achievements.map((a) => (
                  <div
                    key={a.id}
                    className={cn(
                      'p-2.5 rounded-lg border text-center transition-all',
                      a.unlocked
                        ? 'border-accent/30 bg-accent/5'
                        : 'border-surface-border bg-surface opacity-50'
                    )}
                    title={a.description}
                  >
                    <div className={cn('text-xl mb-1', !a.unlocked && 'grayscale opacity-40')}>
                      {a.icon}
                    </div>
                    <div className="text-[10px] font-bold text-gray-300 truncate">{a.title}</div>
                    <div className="mt-1 h-1 rounded-full bg-surface-border overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          a.rarity === 'legendary' && 'bg-yellow-400',
                          a.rarity === 'epic' && 'bg-purple-400',
                          a.rarity === 'rare' && 'bg-blue-400',
                          a.rarity === 'common' && 'bg-gray-400',
                        )}
                        style={{ width: `${Math.min((a.progress / a.requirement) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="text-[9px] text-gray-500 mt-0.5">
                      {a.progress}/{a.requirement}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Difficulty breakdown */}
          <motion.div variants={item}>
            <Card className="h-full">
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                By Difficulty
              </h3>
              <div className="space-y-3">
                {(['easy', 'medium', 'hard', 'expert'] as const).map((diff) => (
                  <DifficultyBar
                    key={diff}
                    label={diff}
                    count={stats.solvedByDifficulty[diff] || 0}
                    max={Math.max(
                      ...Object.values(stats.solvedByDifficulty),
                      1
                    )}
                  />
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Language usage */}
          <motion.div variants={item}>
            <Card className="h-full">
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-4 flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                Languages Used
              </h3>
              <div className="space-y-3">
                {Object.entries(stats.languageUsage)
                  .filter(([, v]) => v > 0)
                  .sort(([, a], [, b]) => b - a)
                  .map(([lang, count]) => (
                    <div key={lang} className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">{getLanguageLabel(lang)}</span>
                      <span className="text-sm font-mono text-accent-light">{count}</span>
                    </div>
                  ))}
                {Object.values(stats.languageUsage).every((v) => v === 0) && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No submissions yet
                  </p>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Activity heatmap / quick actions */}
          <motion.div variants={item}>
            <Card className="h-full">
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Quick Actions
              </h3>
              <div className="space-y-2">
                <QuickAction
                  icon={<Code2 className="w-4 h-4" />}
                  label="New Problem"
                  description="Create & start solving"
                  onClick={() => navigate('/solve')}
                />
                <QuickAction
                  icon={<Trophy className="w-4 h-4" />}
                  label="Browse Codeforces"
                  description="Import problems"
                  onClick={() => navigate('/problems')}
                />
                <QuickAction
                  icon={<Clock className="w-4 h-4" />}
                  label="Start Timer"
                  description="Virtual contest mode"
                  onClick={() => navigate('/timer')}
                />
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Recent problems & submissions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <motion.div variants={item}>
            <Card>
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">
                Recent Problems
              </h3>
              {recentProblems.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">
                  No problems yet. Start by creating one!
                </p>
              ) : (
                <div className="space-y-1">
                  {recentProblems.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        useProblemStore.getState().setActiveProblem(p.id);
                        navigate('/solve');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-surface-hover transition-colors"
                    >
                      <div
                        className={cn(
                          'w-2 h-2 rounded-full shrink-0',
                          p.isSolved ? 'bg-green-400' : 'bg-gray-600'
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-300 truncate">{p.title}</div>
                        <div className="text-[10px] text-gray-500">
                          {getRelativeTime(p.updatedAt)}
                        </div>
                      </div>
                      {p.difficulty && (
                        <span className={cn('text-[10px] capitalize', getDifficultyColor(p.difficulty))}>
                          {p.difficulty}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card>
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">
                Recent Submissions
              </h3>
              {recentSubmissions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">
                  No submissions yet. Run some test cases!
                </p>
              ) : (
                <div className="space-y-1">
                  {recentSubmissions.map((s) => {
                    const problem = problems.find((p) => p.id === s.problemId);
                    return (
                      <div
                        key={s.id}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg"
                      >
                        <span
                          className={cn(
                            'text-[10px] font-bold w-7 text-center',
                            getVerdictColor(s.verdict)
                          )}
                        >
                          {s.verdict}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-400 truncate">
                            {problem?.title || 'Unknown'}
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-500">
                          {getRelativeTime(s.timestamp)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  total,
  color,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  total?: number;
  color: string;
  bgColor: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-3', bgColor, color)}>
        {icon}
      </div>
      <div className="flex items-end gap-1">
        <span className="text-2xl font-bold text-white">{value}</span>
        {total !== undefined && (
          <span className="text-sm text-gray-500 mb-0.5">/{total}</span>
        )}
      </div>
      <p className="text-[11px] text-gray-500 mt-1">{label}</p>
    </Card>
  );
}

function DifficultyBar({
  label,
  count,
  max,
}: {
  label: string;
  count: number;
  max: number;
}) {
  const width = max > 0 ? (count / max) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className={cn('text-xs capitalize', getDifficultyColor(label))}>
          {label}
        </span>
        <span className="text-xs text-gray-500 font-mono">{count}</span>
      </div>
      <div className="h-1.5 rounded-full bg-bg-primary overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn(
            'h-full rounded-full',
            label === 'easy' && 'bg-green-400',
            label === 'medium' && 'bg-yellow-400',
            label === 'hard' && 'bg-orange-400',
            label === 'expert' && 'bg-red-400'
          )}
        />
      </div>
    </div>
  );
}

function QuickAction({
  icon,
  label,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-hover border border-transparent hover:border-surface-border transition-all text-left group"
    >
      <div className="w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center text-accent-light group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <div className="text-xs font-medium text-gray-300">{label}</div>
        <div className="text-[10px] text-gray-500">{description}</div>
      </div>
      <ArrowRight className="w-3 h-3 text-gray-600 ml-auto group-hover:text-accent-light group-hover:translate-x-1 transition-all" />
    </button>
  );
}
