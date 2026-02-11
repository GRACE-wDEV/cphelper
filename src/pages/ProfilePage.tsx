import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  RefreshCw,
  LogOut,
  TrendingUp,
  Award,
  Globe,
  Users,
  Calendar,
  Activity,
  Zap,
  BarChart3,
  Loader2,
  ExternalLink,
  Target,
  Trophy,
} from 'lucide-react';
import { Card, Button, Input } from '@/components/ui';
import { useCFStore } from '@/stores';
import { CF_RANK_COLORS } from '@/types';
import { cn } from '@/utils';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

// ========== Rating Graph Component ==========
function RatingGraph({ ratingHistory }: { ratingHistory: { contestName: string; newRating: number; oldRating: number; ratingUpdateTimeSeconds: number }[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; data: typeof ratingHistory[0] } | null>(null);

  if (ratingHistory.length < 2) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        Not enough data for graph (need at least 2 contests).
      </div>
    );
  }

  const W = 800, H = 280, PAD = { top: 20, right: 30, bottom: 30, left: 50 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const ratings = ratingHistory.map((r) => r.newRating);
  const minR = Math.min(...ratings) - 100;
  const maxR = Math.max(...ratings) + 100;

  const xScale = (i: number) => PAD.left + (i / (ratingHistory.length - 1)) * plotW;
  const yScale = (r: number) => PAD.top + plotH - ((r - minR) / (maxR - minR)) * plotH;

  const pathD = ratingHistory
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScale(d.newRating).toFixed(1)}`)
    .join(' ');

  const areaD = pathD +
    ` L ${xScale(ratingHistory.length - 1).toFixed(1)} ${(PAD.top + plotH).toFixed(1)}` +
    ` L ${PAD.left.toFixed(1)} ${(PAD.top + plotH).toFixed(1)} Z`;

  // Rank zone bands
  const rankZones = [
    { min: 0, max: 1200, color: '#808080', label: 'Newbie' },
    { min: 1200, max: 1400, color: '#008000', label: 'Pupil' },
    { min: 1400, max: 1600, color: '#03A89E', label: 'Specialist' },
    { min: 1600, max: 1900, color: '#0000FF', label: 'Expert' },
    { min: 1900, max: 2100, color: '#AA00AA', label: 'CM' },
    { min: 2100, max: 2300, color: '#FF8C00', label: 'Master' },
    { min: 2300, max: 2400, color: '#FF8C00', label: 'IM' },
    { min: 2400, max: 2600, color: '#FF0000', label: 'GM' },
    { min: 2600, max: 3000, color: '#FF0000', label: 'IGM' },
    { min: 3000, max: 5000, color: '#FF0000', label: 'LGM' },
  ];

  // Y-axis ticks
  const yTicks: number[] = [];
  const step = maxR - minR > 600 ? 200 : 100;
  for (let v = Math.ceil(minR / step) * step; v <= maxR; v += step) {
    yTicks.push(v);
  }

  return (
    <div className="relative overflow-hidden">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <defs>
          <linearGradient id="line-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Rank zone backgrounds */}
        {rankZones.map((zone) => {
          const y1 = Math.max(PAD.top, yScale(Math.min(zone.max, maxR)));
          const y2 = Math.min(PAD.top + plotH, yScale(Math.max(zone.min, minR)));
          if (y2 <= y1) return null;
          return (
            <rect
              key={zone.label}
              x={PAD.left}
              y={y1}
              width={plotW}
              height={y2 - y1}
              fill={zone.color}
              opacity={0.06}
            />
          );
        })}

        {/* Grid lines */}
        {yTicks.map((v) => (
          <g key={v}>
            <line
              x1={PAD.left}
              y1={yScale(v)}
              x2={PAD.left + plotW}
              y2={yScale(v)}
              stroke="#ffffff10"
              strokeDasharray="3,3"
            />
            <text x={PAD.left - 8} y={yScale(v) + 4} fill="#6b7280" fontSize="10" textAnchor="end">
              {v}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaD} fill="url(#line-gradient)" />

        {/* Line */}
        <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {ratingHistory.map((d, i) => (
          <circle
            key={i}
            cx={xScale(i)}
            cy={yScale(d.newRating)}
            r="4"
            fill="#0a0a0f"
            stroke="#6366f1"
            strokeWidth="2"
            className="cursor-pointer hover:r-6"
            onMouseEnter={(e) => {
              const svg = svgRef.current;
              if (!svg) return;
              const rect = svg.getBoundingClientRect();
              const scaleX = rect.width / W;
              const scaleY = rect.height / H;
              setTooltip({
                x: xScale(i) * scaleX + rect.left,
                y: yScale(d.newRating) * scaleY + rect.top,
                data: d,
              });
            }}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-[200] bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-xs pointer-events-none shadow-xl"
          style={{
            left: tooltip.x,
            top: tooltip.y - 70,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="font-semibold text-white truncate max-w-[200px]">{tooltip.data.contestName}</div>
          <div className="flex gap-3 mt-1">
            <span className="text-gray-400">
              {tooltip.data.oldRating} → <span className={tooltip.data.newRating >= tooltip.data.oldRating ? 'text-green-400' : 'text-red-400'}>{tooltip.data.newRating}</span>
            </span>
            <span className={tooltip.data.newRating >= tooltip.data.oldRating ? 'text-green-400' : 'text-red-400'}>
              {tooltip.data.newRating >= tooltip.data.oldRating ? '+' : ''}{tooltip.data.newRating - tooltip.data.oldRating}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== Solved-By-Tag Chart ==========
function TagChart({ weakTags }: { weakTags: { tag: string; solved: number; attempted: number; ratio: number }[] }) {
  const top = weakTags.slice(0, 12);
  const maxVal = Math.max(...top.map((t) => t.attempted), 1);

  return (
    <div className="space-y-2">
      {top.map((t) => (
        <div key={t.tag} className="flex items-center gap-3">
          <span className="text-xs text-gray-400 w-28 truncate text-right">{t.tag}</span>
          <div className="flex-1 h-5 bg-surface-dark rounded-full overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(t.solved / maxVal) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute inset-y-0 left-0 rounded-full bg-green-500/50"
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(t.attempted / maxVal) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute inset-y-0 left-0 rounded-full border border-accent/30"
            />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-300 font-medium">
              {t.solved}/{t.attempted}
            </span>
          </div>
          <span className={cn(
            'text-xs font-mono w-10 text-right',
            t.ratio > 0.7 ? 'text-green-400' : t.ratio > 0.4 ? 'text-yellow-400' : 'text-red-400'
          )}>
            {(t.ratio * 100).toFixed(0)}%
          </span>
        </div>
      ))}
      <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-2 bg-green-500/50 rounded" /> Solved</span>
        <span className="flex items-center gap-1"><span className="w-3 h-2 border border-accent/30 rounded" /> Attempted</span>
      </div>
    </div>
  );
}

// ========== Submission Heatmap ==========
function SubmissionHeatmap({ submissions }: { submissions: { creationTimeSeconds: number; verdict: string }[] }) {
  const now = Date.now() / 1000;
  const daysBack = 180;
  const dayMap: Record<string, number> = {};

  submissions.forEach((s) => {
    const dayKey = Math.floor(s.creationTimeSeconds / 86400);
    dayMap[dayKey] = (dayMap[dayKey] || 0) + 1;
  });

  const cells: { day: number; count: number; date: string }[] = [];
  for (let i = daysBack - 1; i >= 0; i--) {
    const day = Math.floor(now / 86400) - i;
    const dateObj = new Date(day * 86400 * 1000);
    cells.push({
      day,
      count: dayMap[day] || 0,
      date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    });
  }

  const maxCount = Math.max(...cells.map((c) => c.count), 1);

  return (
    <div className="overflow-x-auto">
      <div className="flex flex-wrap gap-[3px]" style={{ maxWidth: '100%' }}>
        {cells.map((c, i) => {
          const intensity = c.count === 0 ? 0 : Math.min(c.count / maxCount, 1);
          return (
            <div
              key={i}
              className="w-3 h-3 rounded-sm group relative"
              style={{
                backgroundColor: c.count === 0
                  ? 'rgba(255,255,255,0.03)'
                  : `rgba(99, 102, 241, ${0.2 + intensity * 0.8})`,
              }}
              title={`${c.date}: ${c.count} submissions`}
            />
          );
        })}
      </div>
    </div>
  );
}

// ========== Main Profile Page ==========
export default function ProfilePage() {
  const {
    handle,
    user,
    ratingHistory,
    solvedSet,
    weakTags,
    submissions,
    isConnected,
    isLoading,
    lastSynced,
    connectHandle,
    disconnect,
    syncProfile,
  } = useCFStore();

  const [inputHandle, setInputHandle] = useState('');
  const [error, setError] = useState('');

  const handleConnect = async () => {
    if (!inputHandle.trim()) return;
    setError('');
    const ok = await connectHandle(inputHandle.trim());
    if (!ok) setError('User not found. Check the handle and try again.');
  };

  if (!isConnected || !user) {
    return (
      <div className="h-full overflow-auto p-6">
        <div className="max-w-md mx-auto mt-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-8"
          >
            <div className="w-20 h-20 mx-auto rounded-2xl gradient-bg flex items-center justify-center mb-4">
              <User className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Connect Codeforces</h1>
            <p className="text-gray-400 text-sm">
              Link your Codeforces handle to unlock rating graphs, smart recommendations, rival tracking, and more.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter Codeforces handle..."
                  value={inputHandle}
                  onChange={(e) => setInputHandle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                  className="flex-1"
                  autoFocus
                />
                <Button onClick={handleConnect} disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Connect'}
                </Button>
              </div>
              {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 grid grid-cols-2 gap-3 text-center"
          >
            {[
              { icon: TrendingUp, label: 'Rating Graph', desc: 'Track your progress' },
              { icon: BarChart3, label: 'Weak Tags', desc: 'Find your gaps' },
              { icon: Users, label: 'Rival Tracker', desc: 'Compare with friends' },
              { icon: Zap, label: 'Smart Recs', desc: 'Personalized problems' },
            ].map((f) => (
              <div key={f.label} className="p-3 rounded-lg bg-surface-dark/50 border border-surface-border">
                <f.icon className="w-5 h-5 text-accent mx-auto mb-1" />
                <div className="text-xs font-medium text-white">{f.label}</div>
                <div className="text-[10px] text-gray-500">{f.desc}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    );
  }

  const rankColor = CF_RANK_COLORS[user.rank?.toLowerCase()] || '#808080';
  const solvedCount = solvedSet.length;
  const ratingDelta = ratingHistory.length >= 2
    ? ratingHistory[ratingHistory.length - 1].newRating - ratingHistory[ratingHistory.length - 2].newRating
    : 0;

  return (
    <div className="h-full overflow-auto p-6">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-6xl mx-auto space-y-6"
      >
        {/* Profile Header */}
        <motion.div variants={item}>
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <img
                    src={user.avatar.startsWith('//') ? 'https:' + user.avatar : user.avatar}
                    alt={user.handle}
                    className="w-20 h-20 rounded-xl border-2 object-cover"
                    style={{ borderColor: rankColor }}
                  />
                  <div
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                    style={{ backgroundColor: rankColor }}
                  >
                    {user.rating}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2
                      className="text-xl font-extrabold"
                      style={{ color: rankColor }}
                    >
                      {user.handle}
                    </h2>
                    <a
                      href={`https://codeforces.com/profile/${user.handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-accent transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  <div className="text-sm font-semibold capitalize" style={{ color: rankColor }}>
                    {user.rank}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                    {user.organization && (
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />{user.organization}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />{user.friendOfCount} friends
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-3 h-3" />Max: {user.maxRating} ({user.maxRank})
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={syncProfile} disabled={isLoading}>
                  <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
                  Sync
                </Button>
                <Button size="sm" variant="danger" onClick={disconnect}>
                  <LogOut className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-5 gap-3 mt-5">
              {[
                { label: 'Rating', val: user.rating, icon: TrendingUp, color: rankColor },
                { label: 'Max Rating', val: user.maxRating, icon: Award, color: '#f59e0b' },
                { label: 'Solved', val: solvedCount, icon: Target, color: '#22c55e' },
                { label: 'Contests', val: ratingHistory.length, icon: Trophy, color: '#6366f1' },
                {
                  label: 'Last Delta',
                  val: `${ratingDelta >= 0 ? '+' : ''}${ratingDelta}`,
                  icon: Activity,
                  color: ratingDelta >= 0 ? '#22c55e' : '#ef4444',
                },
              ].map((s) => (
                <div key={s.label} className="p-3 rounded-lg bg-surface-dark/50 border border-surface-border text-center">
                  <s.icon className="w-4 h-4 mx-auto mb-1" style={{ color: s.color }} />
                  <div className="text-lg font-bold text-white">{s.val}</div>
                  <div className="text-[10px] text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>

            {lastSynced && (
              <div className="text-[10px] text-gray-600 mt-3 text-right">
                Last synced: {new Date(lastSynced).toLocaleString()}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Rating Graph */}
        <motion.div variants={item}>
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-accent" />
              <h3 className="font-bold text-white">Rating History</h3>
              <span className="text-xs text-gray-500">({ratingHistory.length} contests)</span>
            </div>
            <RatingGraph ratingHistory={ratingHistory} />
          </Card>
        </motion.div>

        {/* Bottom Row: Tags + Heatmap */}
        <div className="grid grid-cols-2 gap-6">
          <motion.div variants={item}>
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-accent" />
                <h3 className="font-bold text-white">Tag Analysis</h3>
              </div>
              {weakTags.length > 0 ? (
                <TagChart weakTags={weakTags} />
              ) : (
                <div className="text-gray-500 text-sm text-center py-8">No tag data yet.</div>
              )}
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-accent" />
                <h3 className="font-bold text-white">Submission Heatmap</h3>
                <span className="text-xs text-gray-500">Last 180 days</span>
              </div>
              <SubmissionHeatmap submissions={submissions} />
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
