import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Clock,
  Users,
  ExternalLink,
  RefreshCw,
  Loader2,
  Calendar,
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';
import { fetchCFContests, cn } from '@/utils';
import type { CFContest } from '@/types';

export default function ContestsPage() {
  const [contests, setContests] = useState<CFContest[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'upcoming' | 'running' | 'finished'>('upcoming');

  const loadContests = async () => {
    setLoading(true);
    const data = await fetchCFContests();
    setContests(data);
    setLoading(false);
  };

  useEffect(() => {
    loadContests();
  }, []);

  const filtered = contests.filter((c) => {
    if (filter === 'upcoming') return c.phase === 'BEFORE';
    if (filter === 'running') return c.phase === 'CODING';
    return c.phase === 'FINISHED';
  });

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatContestDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeUntil = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = timestamp - now;
    if (diff <= 0) return 'Started';
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    if (days > 0) return `In ${days}d ${hours}h`;
    const minutes = Math.floor((diff % 3600) / 60);
    return `In ${hours}h ${minutes}m`;
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-bold text-gray-200 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Codeforces Contests
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Track upcoming, running, and past contests
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={loadContests} disabled={loading}>
            <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-surface rounded-lg w-fit mb-6">
          {(['upcoming', 'running', 'finished'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={cn(
                'px-4 py-1.5 rounded-md text-xs font-medium transition-all capitalize',
                filter === tab
                  ? 'gradient-bg text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              )}
            >
              {tab}
              {tab === 'running' && contests.some((c) => c.phase === 'CODING') && (
                <span className="ml-1 w-2 h-2 rounded-full bg-green-400 inline-block animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* Contest list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-accent animate-spin" />
            <span className="ml-2 text-sm text-gray-400">Loading contests...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No {filter} contests found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((contest, idx) => (
              <motion.div
                key={contest.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Card hover>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm font-medium text-gray-200 truncate">
                          {contest.name}
                        </h3>
                        <Badge
                          variant={
                            contest.phase === 'BEFORE'
                              ? 'info'
                              : contest.phase === 'CODING'
                              ? 'success'
                              : 'default'
                          }
                        >
                          {contest.phase === 'BEFORE'
                            ? 'Upcoming'
                            : contest.phase === 'CODING'
                            ? 'Live'
                            : 'Finished'}
                        </Badge>
                        <Badge>{contest.type}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatContestDate(contest.startTimeSeconds)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(contest.durationSeconds)}
                        </span>
                        {contest.phase === 'BEFORE' && (
                          <span className="text-cyan-400 font-medium">
                            {getTimeUntil(contest.startTimeSeconds)}
                          </span>
                        )}
                      </div>
                    </div>
                    <a
                      href={`https://codeforces.com/contest/${contest.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-md text-gray-500 hover:text-accent-light hover:bg-accent-muted transition-colors shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
