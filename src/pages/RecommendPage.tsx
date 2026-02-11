import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  RefreshCw,
  ExternalLink,
  Filter,
  Target,
  BookOpen,
  Trophy,
  ChevronDown,
  AlertTriangle,
  Loader2,
  Plus,
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { useCFStore, useProblemStore } from '@/stores';
import type { CFProblem } from '@/types';
import { cn } from '@/utils';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

function getDiffColor(rating: number): string {
  if (rating < 1200) return '#808080';
  if (rating < 1400) return '#008000';
  if (rating < 1600) return '#03A89E';
  if (rating < 1900) return '#0000FF';
  if (rating < 2100) return '#AA00AA';
  if (rating < 2400) return '#FF8C00';
  return '#FF0000';
}

export default function RecommendPage() {
  const {
    user,
    isConnected,
    recommended,
    isLoadingRecs,
    weakTags,
    solvedSet,
    refreshRecommendations,
  } = useCFStore();

  const { addProblem, problems: localProblems } = useProblemStore();

  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());

  const filteredRecs = useMemo(() => {
    if (!filterTag) return recommended;
    return recommended.filter((p) => p.tags.includes(filterTag));
  }, [recommended, filterTag]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    recommended.forEach((p) => p.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [recommended]);

  const handleImport = (p: CFProblem) => {
    addProblem({
      title: `${p.contestId}${p.index} - ${p.name}`,
      difficulty: p.rating && p.rating < 1400 ? 'easy' : p.rating && p.rating < 1800 ? 'medium' : p.rating && p.rating < 2200 ? 'hard' : 'expert',
      source: 'codeforces' as any,
      sourceUrl: `https://codeforces.com/contest/${p.contestId}/problem/${p.index}`,
      tags: p.tags,
    });
    setImportedIds((prev) => new Set([...prev, `${p.contestId}-${p.index}`]));
  };

  if (!isConnected || !user) {
    return (
      <div className="h-full overflow-auto p-6">
        <div className="flex flex-col items-center justify-center mt-32 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
          <h2 className="text-lg font-bold text-white mb-2">Connect Codeforces First</h2>
          <p className="text-gray-400 text-sm max-w-md">
            Go to the Profile page and connect your Codeforces handle to get personalized problem recommendations.
          </p>
        </div>
      </div>
    );
  }

  const topWeak = weakTags.slice(0, 5);

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
              <Sparkles className="w-5 h-5 text-yellow-400" />
              Smart Recommendations
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Personalized problems based on your rating ({user.rating}) and weak areas
            </p>
          </div>
          <Button onClick={refreshRecommendations} disabled={isLoadingRecs} size="sm">
            {isLoadingRecs ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </Button>
        </motion.div>

        {/* Weak Areas Highlight */}
        {topWeak.length > 0 && (
          <motion.div variants={item}>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-red-400" />
                <span className="text-sm font-semibold text-white">Your Weak Areas</span>
                <span className="text-xs text-gray-500">(lowest solve rates)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {topWeak.map((t) => (
                  <button
                    key={t.tag}
                    onClick={() => setFilterTag(filterTag === t.tag ? null : t.tag)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                      filterTag === t.tag
                        ? 'bg-accent/20 border-accent text-accent-light'
                        : 'bg-surface-dark/50 border-surface-border text-gray-400 hover:border-accent/50 hover:text-gray-300'
                    )}
                  >
                    {t.tag}
                    <span className={cn(
                      'ml-2 font-mono',
                      t.ratio > 0.5 ? 'text-yellow-400' : 'text-red-400'
                    )}>
                      {(t.ratio * 100).toFixed(0)}%
                    </span>
                  </button>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Filter Row */}
        <motion.div variants={item} className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowTagDropdown(!showTagDropdown)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-dark/50 border border-surface-border text-sm text-gray-400 hover:border-accent/50 transition-all"
            >
              <Filter className="w-3.5 h-3.5" />
              {filterTag || 'All Tags'}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <AnimatePresence>
              {showTagDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute top-full mt-1 left-0 z-50 w-48 max-h-60 overflow-auto bg-surface-light border border-surface-border rounded-lg shadow-xl"
                >
                  <button
                    onClick={() => { setFilterTag(null); setShowTagDropdown(false); }}
                    className="w-full px-3 py-2 text-xs text-left text-gray-400 hover:bg-surface-hover hover:text-white transition-colors"
                  >
                    All Tags
                  </button>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => { setFilterTag(tag); setShowTagDropdown(false); }}
                      className={cn(
                        'w-full px-3 py-2 text-xs text-left hover:bg-surface-hover transition-colors',
                        filterTag === tag ? 'text-accent-light bg-accent/10' : 'text-gray-400 hover:text-white'
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="text-xs text-gray-500">
            {filteredRecs.length} problems • {solvedSet.length} solved total
          </div>
        </motion.div>

        {/* Problem Cards */}
        {isLoadingRecs ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
        ) : filteredRecs.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            No recommendations available. Try refreshing.
          </div>
        ) : (
          <motion.div variants={container} className="space-y-2">
            {filteredRecs.map((p, idx) => {
              const key = `${p.contestId}-${p.index}`;
              const imported = importedIds.has(key);
              return (
                <motion.div key={key} variants={item}>
                  <Card
                    className={cn(
                      'p-4 flex items-center gap-4 group hover:border-accent/30 transition-all',
                      imported && 'border-green-500/30 bg-green-500/5'
                    )}
                  >
                    {/* Rank badge */}
                    <div className="w-8 h-8 rounded-lg bg-surface-dark flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                      #{idx + 1}
                    </div>

                    {/* Problem info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://codeforces.com/contest/${p.contestId}/problem/${p.index}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-white hover:text-accent transition-colors truncate"
                        >
                          {p.contestId}{p.index}. {p.name}
                        </a>
                        <ExternalLink className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {p.tags.slice(0, 5).map((t) => (
                          <span
                            key={t}
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[10px] font-medium',
                              weakTags.some((w) => w.tag === t && w.ratio < 0.5)
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : 'bg-surface-dark text-gray-500'
                            )}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-3 shrink-0">
                      {p.rating && (
                        <span
                          className="text-sm font-bold font-mono"
                          style={{ color: getDiffColor(p.rating) }}
                        >
                          {p.rating}
                        </span>
                      )}
                      <Button
                        size="sm"
                        variant={imported ? 'secondary' : 'primary'}
                        onClick={() => !imported && handleImport(p)}
                        disabled={imported}
                        className="text-xs"
                      >
                        {imported ? '✓ Added' : <><Plus className="w-3 h-3" /> Import</>}
                      </Button>
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
