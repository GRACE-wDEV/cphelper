import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from 'react-resizable-panels';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  FileText,
  Trash2,
  Heart,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  XCircle,
  StickyNote,
  Maximize2,
  Minimize2,
  FlaskConical,
} from 'lucide-react';
import { CodeEditor, EditorToolbar, SnippetPalette } from '@/components/editor';
import { insertSnippetAtCursor } from '@/components/editor/CodeEditor';
import { TestCasePanel } from '@/components/testcases';
import StressTester from '@/components/StressTester';
import { Modal, Button, Input, Badge } from '@/components/ui';
import { useProblemStore, useAppStore } from '@/stores';
import {
  cn,
  getDifficultyColor,
  getRelativeTime,
  generateId,
} from '@/utils';
import type { Difficulty, ProblemSource } from '@/types';

export default function SolvePage() {
  const {
    problems,
    activeProblemId,
    setActiveProblem,
    addProblem,
    deleteProblem,
    toggleFavorite,
    updateProblem,
    runAllTestCases,
    isRunning,
  } = useProblemStore();

  const { zenMode, toggleZenMode, triggerCelebration, awardXP, checkAchievements } = useAppStore();

  const [showNewProblem, setShowNewProblem] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [showSnippetPalette, setShowSnippetPalette] = useState(false);
  const [showStressTester, setShowStressTester] = useState(false);
  const editorInsertRef = useRef<((code: string) => void) | null>(null);

  const activeProblem = problems.find((p) => p.id === activeProblemId);

  // Expose editor insert for snippet palette
  const handleEditorInsert = useCallback((insertFn: (code: string) => void) => {
    editorInsertRef.current = insertFn;
  }, []);

  const handleSnippetInsert = useCallback((code: string) => {
    insertSnippetAtCursor(code);
  }, []);

  // Run all and check for celebration
  const handleRunAll = useCallback(async () => {
    if (!activeProblemId || isRunning) return;
    await runAllTestCases(activeProblemId);

    // Check if all passed for celebration
    const updated = useProblemStore.getState().problems.find((p) => p.id === activeProblemId);
    if (updated && updated.testCases.length > 0 && updated.testCases.every((tc) => tc.verdict === 'AC')) {
      awardXP('solve');
      if (updated.difficulty === 'hard' || updated.difficulty === 'expert') {
        awardXP('hard_problem');
      }
      triggerCelebration();
      // Check achievements after awarding XP
      setTimeout(() => checkAchievements(), 500);
    }
  }, [activeProblemId, isRunning]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'F5' && !e.ctrlKey) {
        e.preventDefault();
        handleRunAll();
      }
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        setShowNewProblem(true);
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        setShowSnippetPalette(true);
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'Z') {
        e.preventDefault();
        toggleZenMode();
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        setShowStressTester(true);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeProblemId, isRunning, handleRunAll]);

  return (
    <div className="h-full flex">
      {/* Problem sidebar - hidden in zen mode */}
      <AnimatePresence>
        {showSidebar && !zenMode && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full border-r border-surface-border bg-bg-secondary flex flex-col overflow-hidden shrink-0"
          >
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-surface-border shrink-0">
              <h3 className="text-xs font-semibold text-gray-400">My Problems</h3>
              <button
                onClick={() => setShowNewProblem(true)}
                className="p-1 rounded-md text-accent-light hover:bg-accent-muted transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {problems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full px-4 text-center">
                  <FileText className="w-10 h-10 text-gray-700 mb-2" />
                  <p className="text-xs text-gray-500 mb-3">No problems yet</p>
                  <Button
                    size="sm"
                    onClick={() => setShowNewProblem(true)}
                  >
                    <Plus className="w-3 h-3" /> Create Problem
                  </Button>
                </div>
              ) : (
                problems.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setActiveProblem(p.id)}
                    className={cn(
                      'w-full flex items-start gap-2 px-3 py-2.5 text-left transition-colors relative',
                      p.id === activeProblemId
                        ? 'bg-accent-muted'
                        : 'hover:bg-surface-hover'
                    )}
                  >
                    {p.id === activeProblemId && (
                      <motion.div
                        layoutId="problem-indicator"
                        className="absolute left-0 top-0 bottom-0 w-[2px] gradient-bg"
                      />
                    )}
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full mt-1.5 shrink-0',
                        p.isSolved ? 'bg-green-400' : 'bg-gray-600'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-300 truncate flex-1">{p.title}</span>
                        {p.isFavorite && <span className="text-yellow-400 text-[10px]">★</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-500">{p.source}</span>
                        {p.difficulty && (
                          <span className={cn('text-[10px] capitalize', getDifficultyColor(p.difficulty))}>
                            {p.difficulty}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle sidebar - hidden in zen mode */}
      {!zenMode && (
        <button
          onClick={() => setShowSidebar((s) => !s)}
          className="w-5 h-full flex items-center justify-center bg-bg-secondary/50 hover:bg-surface-hover border-r border-surface-border text-gray-600 hover:text-gray-400 transition-colors shrink-0"
        >
          <ChevronRight
            className={cn('w-3 h-3 transition-transform', showSidebar && 'rotate-180')}
          />
        </button>
      )}

      {/* Main workspace */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Problem header */}
        {activeProblem && (
          <div className="flex items-center justify-between px-4 py-2 border-b border-surface-border bg-bg-secondary/50 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {activeProblem.isSolved ? (
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-gray-600 shrink-0" />
              )}
              <h2 className="text-sm font-medium text-gray-200 truncate">
                {activeProblem.title}
              </h2>
              {activeProblem.difficulty && (
                <Badge
                  variant={
                    activeProblem.difficulty === 'easy'
                      ? 'success'
                      : activeProblem.difficulty === 'medium'
                      ? 'warning'
                      : 'danger'
                  }
                >
                  {activeProblem.difficulty}
                </Badge>
              )}
              {activeProblem.tags.slice(0, 3).map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setShowNotes(true)}
                className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 hover:bg-surface-hover transition-colors"
                title="Notes"
              >
                <StickyNote className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => toggleFavorite(activeProblem.id)}
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  activeProblem.isFavorite
                    ? 'text-yellow-400 hover:text-yellow-300'
                    : 'text-gray-500 hover:text-yellow-400'
                )}
                title="Favorite"
              >
                <Heart
                  className="w-3.5 h-3.5"
                  fill={activeProblem.isFavorite ? 'currentColor' : 'none'}
                />
              </button>
              {activeProblem.sourceUrl && (
                <a
                  href={activeProblem.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-md text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                  title="Open original"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                onClick={() => {
                  if (confirm('Delete this problem?')) {
                    deleteProblem(activeProblem.id);
                  }
                }}
                className="p-1.5 rounded-md text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-4 bg-surface-border mx-1" />
              <button
                onClick={() => setShowStressTester(true)}
                className="p-1.5 rounded-md text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                title="Stress Tester (Ctrl+Shift+T)"
              >
                <FlaskConical className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={toggleZenMode}
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  zenMode
                    ? 'text-accent hover:text-accent-light bg-accent-muted'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-surface-hover'
                )}
                title="Zen Mode (Ctrl+Shift+Z)"
              >
                {zenMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}

        {/* Editor + Test cases */}
        <div className="flex-1 overflow-hidden">
          <PanelGroup direction="horizontal">
            <Panel defaultSize={60} minSize={30}>
              <div className="h-full flex flex-col">
                <EditorToolbar />
                <div className="flex-1 overflow-hidden">
                  <CodeEditor />
                </div>
              </div>
            </Panel>
            <PanelResizeHandle />
            <Panel defaultSize={40} minSize={20}>
              <TestCasePanel />
            </Panel>
          </PanelGroup>
        </div>
      </div>

      {/* New Problem Modal */}
      <NewProblemModal
        isOpen={showNewProblem}
        onClose={() => setShowNewProblem(false)}
      />

      {/* Notes Modal */}
      {activeProblem && (
        <Modal
          isOpen={showNotes}
          onClose={() => setShowNotes(false)}
          title="Problem Notes"
        >
          <textarea
            value={activeProblem.notes}
            onChange={(e) =>
              updateProblem(activeProblem.id, { notes: e.target.value })
            }
            placeholder="Write your notes, observations, approach ideas..."
            rows={10}
            className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-border text-sm text-gray-300 font-mono resize-y placeholder-gray-600"
          />
        </Modal>
      )}

      {/* Snippet Palette */}
      <SnippetPalette
        isOpen={showSnippetPalette}
        onClose={() => setShowSnippetPalette(false)}
        onInsert={handleSnippetInsert}
        language={useProblemStore.getState().activeLanguage}
      />

      {/* Stress Tester */}
      <StressTester
        isOpen={showStressTester}
        onClose={() => setShowStressTester(false)}
      />
    </div>
  );
}

function NewProblemModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { addProblem } = useProblemStore();
  const [title, setTitle] = useState('');
  const [source, setSource] = useState<ProblemSource>('custom');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [tags, setTags] = useState('');
  const [timeLimit, setTimeLimit] = useState('2');
  const [memoryLimit, setMemoryLimit] = useState('256');
  const [sourceUrl, setSourceUrl] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) return;
    addProblem({
      title: title.trim(),
      source,
      sourceUrl: sourceUrl || undefined,
      difficulty,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      timeLimit: parseInt(timeLimit) || 2,
      memoryLimit: parseInt(memoryLimit) || 256,
      testCases: [],
      isSolved: false,
      isFavorite: false,
      notes: '',
    });
    setTitle('');
    setTags('');
    setSourceUrl('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Problem">
      <div className="space-y-4">
        <Input
          label="Problem Title"
          placeholder="e.g., Two Sum, CF 1900A - Watermelon"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-400">Source</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as ProblemSource)}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-border text-sm text-gray-200"
            >
              <option value="custom">Custom</option>
              <option value="codeforces">Codeforces</option>
              <option value="atcoder">AtCoder</option>
              <option value="leetcode">LeetCode</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-400">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-border text-sm text-gray-200"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="expert">Expert</option>
            </select>
          </div>
        </div>

        <Input
          label="Source URL (optional)"
          placeholder="https://codeforces.com/contest/..."
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
        />

        <Input
          label="Tags (comma-separated)"
          placeholder="dp, greedy, math"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Time Limit (sec)"
            type="number"
            value={timeLimit}
            onChange={(e) => setTimeLimit(e.target.value)}
          />
          <Input
            label="Memory Limit (MB)"
            type="number"
            value={memoryLimit}
            onChange={(e) => setMemoryLimit(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim()}>
            Create Problem
          </Button>
        </div>
      </div>
    </Modal>
  );
}
