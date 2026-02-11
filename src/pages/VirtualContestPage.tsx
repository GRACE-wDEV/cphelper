import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayCircle,
  StopCircle,
  Clock,
  Trophy,
  ExternalLink,
  Search,
  Loader2,
  Timer,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Zap,
} from 'lucide-react';
import { Card, Button, Input } from '@/components/ui';
import { useCFStore } from '@/stores';
import { fetchCFContests } from '@/utils/codeforces';
import type { CFContest } from '@/types';
import { cn } from '@/utils';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function getDiffColor(rating?: number): string {
  if (!rating) return '#808080';
  if (rating < 1200) return '#808080';
  if (rating < 1400) return '#008000';
  if (rating < 1600) return '#03A89E';
  if (rating < 1900) return '#0000FF';
  if (rating < 2100) return '#AA00AA';
  if (rating < 2400) return '#FF8C00';
  return '#FF0000';
}

export default function VirtualContestPage() {
  const {
    isConnected,
    user,
    virtualContest,
    startVirtualContest,
    markVirtualSolved,
    endVirtualContest,
  } = useCFStore();

  const [contests, setContests] = useState<CFContest[]>([]);
  const [loadingContests, setLoadingContests] = useState(false);
  const [search, setSearch] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [remaining, setRemaining] = useState(0);

  // Load past contests
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingContests(true);
      const all = await fetchCFContests();
      if (!cancelled) {
        setContests(all.filter((c) => c.phase === 'FINISHED' && c.type === 'CF'));
        setLoadingContests(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Timer tick
  useEffect(() => {
    if (!virtualContest?.isRunning || !virtualContest.startedAt) return;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - virtualContest.startedAt!) / 1000);
      const rem = Math.max(0, virtualContest.durationSeconds - elapsed);
      setRemaining(rem);
      if (rem === 0) endVirtualContest();
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [virtualContest?.isRunning, virtualContest?.startedAt, virtualContest?.durationSeconds]);

  const filteredContests = useMemo(() => {
    const q = search.toLowerCase();
    return contests
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 50);
  }, [contests, search]);

  const handleStart = async (c: CFContest) => {
    setIsStarting(true);
    await startVirtualContest(c.id, c.name, c.durationSeconds);
    setIsStarting(false);
  };

  if (!isConnected || !user) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-white mb-2">Connect Codeforces First</h2>
          <p className="text-gray-400 text-sm">Go to Profile to link your handle.</p>
        </div>
      </div>
    );
  }

  // Active Virtual Contest View
  if (virtualContest && virtualContest.isRunning) {
    const elapsed = virtualContest.startedAt ? Math.floor((Date.now() - virtualContest.startedAt) / 1000) : 0;
    const progress = Math.min(elapsed / virtualContest.durationSeconds, 1);

    return (
      <div className="h-full overflow-auto p-6">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-4xl mx-auto space-y-6"
        >
          {/* Timer Header */}
          <motion.div variants={item}>
            <Card className="p-6 border-accent/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-lg font-bold text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />
                    Virtual Contest Active
                  </h1>
                  <p className="text-sm text-gray-400 mt-1">{virtualContest.contestName}</p>
                </div>
                <Button variant="danger" size="sm" onClick={endVirtualContest}>
                  <StopCircle className="w-4 h-4" /> End Contest
                </Button>
              </div>

              {/* Big Timer */}
              <div className="text-center">
                <div className={cn(
                  'text-5xl font-mono font-bold',
                  remaining < 300 ? 'text-red-400 animate-pulse' : remaining < 900 ? 'text-yellow-400' : 'text-white'
                )}>
                  {formatTime(remaining)}
                </div>
                <div className="w-full h-2 bg-surface-dark rounded-full mt-3 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full gradient-bg"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>00:00</span>
                  <span>{formatTime(virtualContest.durationSeconds)}</span>
                </div>
              </div>

              {/* Scoreboard */}
              <div className="flex items-center gap-2 mt-4 justify-center text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-bold">{virtualContest.solvedInVirtual.length}</span>
                <span className="text-gray-500">/ {virtualContest.problems.length} solved</span>
              </div>
            </Card>
          </motion.div>

          {/* Problem List */}
          <motion.div variants={container} className="space-y-2">
            {virtualContest.problems.map((p, idx) => {
              const isSolved = virtualContest.solvedInVirtual.includes(p.index);

              return (
                <motion.div key={p.index} variants={item}>
                  <Card className={cn(
                    'p-4 flex items-center gap-4 transition-all',
                    isSolved
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'hover:border-accent/30'
                  )}>
                    {/* Status */}
                    <div className="shrink-0">
                      {isSolved ? (
                        <CheckCircle2 className="w-6 h-6 text-green-400" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-600" />
                      )}
                    </div>

                    {/* Problem Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-accent">{p.index}</span>
                        <a
                          href={`https://codeforces.com/contest/${p.contestId}/problem/${p.index}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-white hover:text-accent transition-colors truncate"
                        >
                          {p.name}
                        </a>
                        <ExternalLink className="w-3 h-3 text-gray-600 shrink-0" />
                      </div>
                      <div className="flex gap-1.5 mt-1">
                        {p.tags.slice(0, 4).map((t) => (
                          <span key={t} className="px-1.5 py-0.5 rounded text-[10px] bg-surface-dark text-gray-500">{t}</span>
                        ))}
                      </div>
                    </div>

                    {/* Rating + Mark */}
                    <div className="flex items-center gap-3 shrink-0">
                      {p.rating && (
                        <span className="text-sm font-bold font-mono" style={{ color: getDiffColor(p.rating) }}>
                          {p.rating}
                        </span>
                      )}
                      {!isSolved && (
                        <Button
                          size="sm"
                          onClick={() => markVirtualSolved(p.index)}
                          className="text-xs"
                        >
                          ✓ Mark Solved
                        </Button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Finished Virtual Contest Summary
  if (virtualContest && !virtualContest.isRunning) {
    return (
      <div className="h-full overflow-auto p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto mt-10"
        >
          <Card className="p-8 text-center">
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Contest Complete!</h1>
            <p className="text-gray-400 mb-1">{virtualContest.contestName}</p>
            <div className="text-4xl font-mono font-bold text-accent my-4">
              {virtualContest.solvedInVirtual.length} / {virtualContest.problems.length}
            </div>
            <p className="text-gray-500 text-sm mb-6">problems solved</p>

            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {virtualContest.problems.map((p) => {
                const solved = virtualContest.solvedInVirtual.includes(p.index);
                return (
                  <div
                    key={p.index}
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm',
                      solved
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-surface-dark text-gray-600 border border-surface-border'
                    )}
                  >
                    {p.index}
                  </div>
                );
              })}
            </div>

            <Button onClick={() => endVirtualContest()}>
              <PlayCircle className="w-4 h-4" /> New Virtual Contest
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Contest Picker
  return (
    <div className="h-full overflow-auto p-6">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-4xl mx-auto space-y-6"
      >
        <motion.div variants={item}>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-accent" />
            Virtual Contest
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Pick a past Codeforces contest and simulate it with a timer
          </p>
        </motion.div>

        {/* Search */}
        <motion.div variants={item}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search contests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Contest List */}
        {loadingContests ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
        ) : (
          <motion.div variants={container} className="space-y-2">
            {filteredContests.map((c) => (
              <motion.div key={c.id} variants={item}>
                <Card className="p-4 flex items-center gap-4 hover:border-accent/30 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-surface-dark flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{c.name}</div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {Math.floor(c.durationSeconds / 3600)}h {Math.floor((c.durationSeconds % 3600) / 60)}m
                      </span>
                      <span>
                        {new Date(c.startTimeSeconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleStart(c)}
                    disabled={isStarting}
                    className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {isStarting ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
                    Start
                  </Button>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
