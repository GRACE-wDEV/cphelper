import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Timer, Zap, Search, Keyboard } from 'lucide-react';
import { useAppStore, useProblemStore } from '@/stores';
import { formatTimerDisplay, cn } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { timer, tickTimer } = useAppStore();
  const { problems, activeProblemId, isRunning } = useProblemStore();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const activeProblem = problems.find((p) => p.id === activeProblemId);

  // Timer tick
  useEffect(() => {
    if (!timer.isRunning) return;
    const interval = setInterval(tickTimer, 100);
    return () => clearInterval(interval);
  }, [timer.isRunning, tickTimer]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        setShowSearch((s) => !s);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const pageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/solve': return activeProblem ? activeProblem.title : 'Solve';
      case '/problems': return 'Problem Browser';
      case '/contests': return 'Contests';
      case '/templates': return 'Code Templates';
      case '/snippets': return 'Snippet Library';
      case '/settings': return 'Settings';
      case '/timer': return 'Contest Timer';
      default: return 'CPHelper';
    }
  };

  const filteredProblems = problems.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <header className="h-12 border-b border-surface-border flex items-center justify-between px-4 bg-bg-secondary/50 backdrop-blur-sm shrink-0 z-40">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-gray-200">{pageTitle()}</h1>
          {isRunning && (
            <div className="flex items-center gap-1.5 text-xs text-cyan-400">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Running...
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Quick search */}
          <button
            onClick={() => setShowSearch(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-surface-border text-gray-400 text-xs hover:border-accent/50 transition-colors"
          >
            <Search className="w-3 h-3" />
            <span>Search</span>
            <kbd className="ml-2 px-1.5 py-0.5 rounded bg-bg-primary text-[10px] font-mono">Ctrl+K</kbd>
          </button>

          {/* Timer display */}
          {timer.isRunning && (
            <button
              onClick={() => navigate('/timer')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors',
                timer.remainingMs < 300000
                  ? 'bg-red-500/10 border border-red-500/30 text-red-400 animate-pulse'
                  : 'bg-accent-muted border border-accent/30 text-accent-light'
              )}
            >
              <Timer className="w-3 h-3" />
              {formatTimerDisplay(timer.remainingMs)}
            </button>
          )}

          {/* Status indicator */}
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-[10px] text-gray-500 font-medium">READY</span>
          </div>
        </div>
      </header>

      {/* Search Modal */}
      <AnimatePresence>
        {showSearch && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[200]"
              onClick={() => setShowSearch(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed top-[15%] left-1/2 -translate-x-1/2 w-[500px] max-h-[60vh] bg-surface border border-surface-border rounded-xl shadow-2xl z-[201] overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border">
                <Search className="w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search problems..."
                  className="flex-1 pl-2 py-1 bg-transparent text-sm text-gray-200 placeholder-gray-500 outline-none"
                  autoFocus
                />
                <kbd className="px-1.5 py-0.5 rounded bg-bg-primary text-[10px] text-gray-500 font-mono border border-surface-border">
                  ESC
                </kbd>
              </div>
              <div className="max-h-[45vh] overflow-y-auto py-2">
                {filteredProblems.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-500">
                    {searchQuery ? 'No problems found' : 'Type to search problems...'}
                  </div>
                ) : (
                  filteredProblems.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        useProblemStore.getState().setActiveProblem(p.id);
                        navigate('/solve');
                        setShowSearch(false);
                        setSearchQuery('');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-surface-hover transition-colors"
                    >
                      <div
                        className={cn(
                          'w-2 h-2 rounded-full shrink-0',
                          p.isSolved ? 'bg-green-400' : 'bg-gray-600'
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-gray-200 truncate">{p.title}</div>
                        <div className="text-[10px] text-gray-500">{p.source}</div>
                      </div>
                      {p.isFavorite && <span className="text-yellow-400 text-xs">★</span>}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
