import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Trash2,
  Play,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useProblemStore } from '@/stores';
import { cn, getVerdictColor, getVerdictBg, getVerdictLabel, formatTime } from '@/utils';
import DiffViewer from '@/components/DiffViewer';
import type { TestCase } from '@/types';

export default function TestCasePanel() {
  const {
    problems,
    activeProblemId,
    isRunning,
    runningTestId,
    addTestCase,
    deleteTestCase,
    updateTestCase,
    runTestCase,
  } = useProblemStore();

  const problem = problems.find((p) => p.id === activeProblemId);
  const testCases = problem?.testCases || [];

  if (!activeProblemId) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 text-sm">
        Select a problem to see test cases
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-bg-primary">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-surface-border bg-bg-secondary shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold text-gray-300">Test Cases</h3>
          <span className="px-1.5 py-0.5 rounded-full bg-surface text-[10px] text-gray-500 font-mono">
            {testCases.length}
          </span>
          {testCases.length > 0 && (
            <VerdictSummary testCases={testCases} />
          )}
        </div>
        <button
          onClick={() => addTestCase(activeProblemId)}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-accent-light hover:bg-accent-muted transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add Test
        </button>
      </div>

      {/* Test cases list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {testCases.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
            <AlertCircle className="w-8 h-8 text-gray-600" />
            <p className="text-xs">No test cases yet</p>
            <button
              onClick={() => addTestCase(activeProblemId)}
              className="text-xs text-accent-light hover:underline"
            >
              Add your first test case
            </button>
          </div>
        ) : (
          testCases.map((tc, idx) => (
            <TestCaseCard
              key={tc.id}
              testCase={tc}
              index={idx}
              problemId={activeProblemId}
              isRunning={runningTestId === tc.id}
              onRun={() => runTestCase(activeProblemId, tc.id)}
              onDelete={() => deleteTestCase(activeProblemId, tc.id)}
              onUpdate={(updates) => updateTestCase(activeProblemId, tc.id, updates)}
              disabled={isRunning}
            />
          ))
        )}
      </div>
    </div>
  );
}

function VerdictSummary({ testCases }: { testCases: TestCase[] }) {
  const ac = testCases.filter((t) => t.verdict === 'AC').length;
  const total = testCases.length;
  const allPassed = ac === total && total > 0 && testCases.every(t => t.verdict !== 'PENDING');

  if (testCases.every((t) => t.verdict === 'PENDING')) return null;

  return (
    <span
      className={cn(
        'px-1.5 py-0.5 rounded text-[10px] font-semibold',
        allPassed ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
      )}
    >
      {ac}/{total} passed
    </span>
  );
}

function TestCaseCard({
  testCase,
  index,
  problemId,
  isRunning,
  onRun,
  onDelete,
  onUpdate,
  disabled,
}: {
  testCase: TestCase;
  index: number;
  problemId: string;
  isRunning: boolean;
  onRun: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<TestCase>) => void;
  disabled: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-lg border transition-all overflow-hidden',
        testCase.verdict === 'RUNNING'
          ? 'border-cyan-500/30 bg-cyan-500/5'
          : testCase.verdict === 'AC'
          ? 'border-green-500/20 bg-green-500/5'
          : testCase.verdict === 'WA' || testCase.verdict === 'RTE' || testCase.verdict === 'CE'
          ? 'border-red-500/20 bg-red-500/5'
          : 'border-surface-border bg-surface'
      )}
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-3 py-2">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-2 text-xs font-medium text-gray-300 hover:text-white transition-colors"
        >
          {expanded ? (
            <ChevronUp className="w-3 h-3 text-gray-500" />
          ) : (
            <ChevronDown className="w-3 h-3 text-gray-500" />
          )}
          <span>Test #{index + 1}</span>
          {testCase.isCustom && (
            <span className="px-1 py-0.5 rounded bg-accent-muted text-[9px] text-accent-light">
              Custom
            </span>
          )}
        </button>

        <div className="flex items-center gap-2">
          {/* Verdict badge */}
          {testCase.verdict !== 'PENDING' && (
            <span
              className={cn(
                'px-1.5 py-0.5 rounded text-[10px] font-bold border',
                getVerdictBg(testCase.verdict),
                getVerdictColor(testCase.verdict)
              )}
            >
              {testCase.verdict}
            </span>
          )}

          {/* Execution time */}
          {testCase.executionTime && (
            <span className="text-[10px] text-gray-500 font-mono">
              {formatTime(testCase.executionTime)}
            </span>
          )}

          {/* Run button */}
          <button
            onClick={onRun}
            disabled={disabled || isRunning}
            className={cn(
              'p-1 rounded transition-colors',
              isRunning
                ? 'text-cyan-400'
                : 'text-gray-500 hover:text-green-400 hover:bg-green-500/10'
            )}
          >
            {isRunning ? (
              <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" fill="currentColor" />
            )}
          </button>

          {/* Delete */}
          <button
            onClick={onDelete}
            className="p-1 rounded text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Card body */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {/* Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-medium text-gray-500 uppercase">Input</label>
              <button
                onClick={() => handleCopy(testCase.input, 'input')}
                className="text-gray-600 hover:text-gray-300 transition-colors"
              >
                {copiedField === 'input' ? (
                  <Check className="w-3 h-3 text-green-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
            <textarea
              value={testCase.input}
              onChange={(e) => onUpdate({ input: e.target.value })}
              placeholder="Enter input..."
              rows={3}
              className="w-full px-2 py-1.5 rounded-md bg-bg-primary border border-surface-border text-xs text-gray-300 font-mono resize-y placeholder-gray-600 focus:border-accent/50 transition-colors"
            />
          </div>

          {/* Expected Output */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-medium text-gray-500 uppercase">
                Expected Output
              </label>
              <button
                onClick={() => handleCopy(testCase.expectedOutput, 'expected')}
                className="text-gray-600 hover:text-gray-300 transition-colors"
              >
                {copiedField === 'expected' ? (
                  <Check className="w-3 h-3 text-green-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
            <textarea
              value={testCase.expectedOutput}
              onChange={(e) => onUpdate({ expectedOutput: e.target.value })}
              placeholder="Expected output..."
              rows={3}
              className="w-full px-2 py-1.5 rounded-md bg-bg-primary border border-surface-border text-xs text-gray-300 font-mono resize-y placeholder-gray-600 focus:border-accent/50 transition-colors"
            />
          </div>

          {/* Actual Output */}
          {testCase.actualOutput !== undefined && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  className={cn(
                    'text-[10px] font-medium uppercase',
                    testCase.verdict === 'AC' ? 'text-green-500' : 'text-red-500'
                  )}
                >
                  Actual Output
                </label>
                <button
                  onClick={() => handleCopy(testCase.actualOutput || '', 'actual')}
                  className="text-gray-600 hover:text-gray-300 transition-colors"
                >
                  {copiedField === 'actual' ? (
                    <Check className="w-3 h-3 text-green-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
              <pre
                className={cn(
                  'w-full px-2 py-1.5 rounded-md text-xs font-mono whitespace-pre-wrap break-all border max-h-32 overflow-auto',
                  testCase.verdict === 'AC'
                    ? 'bg-green-500/5 border-green-500/20 text-green-300'
                    : testCase.verdict === 'CE'
                    ? 'bg-purple-500/5 border-purple-500/20 text-purple-300'
                    : 'bg-red-500/5 border-red-500/20 text-red-300'
                )}
              >
                {testCase.actualOutput}
              </pre>

              {/* Diff Viewer for Wrong Answer */}
              {testCase.verdict === 'WA' && testCase.expectedOutput && testCase.actualOutput && (
                <DiffViewer
                  expected={testCase.expectedOutput}
                  actual={testCase.actualOutput}
                  className="mt-2"
                />
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
