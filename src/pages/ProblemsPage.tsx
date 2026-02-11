import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  ExternalLink,
  Loader2,
  RefreshCw,
  Star,
  Tag,
} from 'lucide-react';
import { Button, Input, Badge, Card } from '@/components/ui';
import { useProblemStore } from '@/stores';
import {
  fetchCFProblems,
  fetchCFProblemTestCases,
  cfProblemToLocal,
  cfRatingToDifficulty,
  cn,
  getDifficultyColor,
} from '@/utils';
import type { CFProblem } from '@/types';

export default function ProblemsPage() {
  const navigate = useNavigate();
  const { importProblemWithTests } = useProblemStore();

  const [cfProblems, setCfProblems] = useState<CFProblem[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');

  const loadProblems = async () => {
    setLoading(true);
    const problems = await fetchCFProblems();
    setCfProblems(problems);
    setLoading(false);
  };

  useEffect(() => {
    loadProblems();
  }, []);

  // Get unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    cfProblems.forEach((p) => p.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [cfProblems]);

  // Filter problems
  const filtered = useMemo(() => {
    let result = cfProblems;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          `${p.contestId}${p.index}`.includes(q)
      );
    }

    if (ratingFilter !== 'all') {
      const [min, max] = ratingFilter.split('-').map(Number);
      result = result.filter(
        (p) => p.rating && p.rating >= min && p.rating <= max
      );
    }

    if (tagFilter !== 'all') {
      result = result.filter((p) => p.tags.includes(tagFilter));
    }

    return result.slice(0, 100); // Limit for performance
  }, [cfProblems, searchQuery, ratingFilter, tagFilter]);

  const handleImport = async (cf: CFProblem) => {
    const key = `${cf.contestId}-${cf.index}`;
    setImporting(key);
    try {
      const testCases = await fetchCFProblemTestCases(cf.contestId, cf.index);
      const local = cfProblemToLocal(cf);
      importProblemWithTests(
        { ...local, testCases: [] },
        testCases.map((tc) => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          verdict: 'PENDING' as const,
          isCustom: false,
        }))
      );
      navigate('/solve');
    } catch {
      // Failed silently
    }
    setImporting(null);
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-bold text-gray-200">Problem Browser</h1>
            <p className="text-xs text-gray-500 mt-1">
              Browse and import problems from Codeforces
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={loadProblems}
            disabled={loading}
          >
            <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search problems... (name or ID)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>

          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-surface border border-surface-border text-xs text-gray-300"
          >
            <option value="all">All Ratings</option>
            <option value="800-1000">800 - 1000</option>
            <option value="1000-1200">1000 - 1200</option>
            <option value="1200-1400">1200 - 1400</option>
            <option value="1400-1600">1400 - 1600</option>
            <option value="1600-1900">1600 - 1900</option>
            <option value="1900-2100">1900 - 2100</option>
            <option value="2100-2400">2100 - 2400</option>
            <option value="2400-3500">2400+</option>
          </select>

          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-surface border border-surface-border text-xs text-gray-300 max-w-[200px]"
          >
            <option value="all">All Tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>

        {/* Results count */}
        <p className="text-xs text-gray-500 mb-3">
          Showing {filtered.length} of {cfProblems.length} problems
        </p>

        {/* Problem list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-accent animate-spin" />
            <span className="ml-2 text-sm text-gray-400">Loading problems from Codeforces...</span>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_80px_80px_2fr_80px] gap-3 px-4 py-2 text-[10px] font-semibold text-gray-500 uppercase">
              <span>Problem</span>
              <span>Contest</span>
              <span>Rating</span>
              <span>Tags</span>
              <span className="text-right">Action</span>
            </div>

            {filtered.map((p) => {
              const key = `${p.contestId}-${p.index}`;
              const diff = cfRatingToDifficulty(p.rating);
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-[1fr_80px_80px_2fr_80px] gap-3 px-4 py-2.5 rounded-lg hover:bg-surface-hover transition-colors items-center"
                >
                  <div className="min-w-0">
                    <a
                      href={`https://codeforces.com/contest/${p.contestId}/problem/${p.index}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-300 hover:text-accent-light transition-colors truncate flex items-center gap-1"
                    >
                      {p.contestId}{p.index} - {p.name}
                      <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-50" />
                    </a>
                  </div>
                  <span className="text-xs text-gray-500 font-mono">{p.contestId}</span>
                  <span className={cn('text-xs font-semibold', getDifficultyColor(diff))}>
                    {p.rating || '—'}
                  </span>
                  <div className="flex flex-wrap gap-1 min-w-0">
                    {p.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag}>{tag}</Badge>
                    ))}
                    {p.tags.length > 3 && (
                      <Badge>+{p.tags.length - 3}</Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleImport(p)}
                      disabled={importing === key}
                    >
                      {importing === key ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Download className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
