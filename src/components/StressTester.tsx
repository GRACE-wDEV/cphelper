import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Zap, AlertTriangle, CheckCircle2, XCircle, Settings2, RotateCcw } from 'lucide-react';
import { Button, Modal, Input } from '@/components/ui';
import { useProblemStore, useAppStore } from '@/stores';
import { executeCode } from '@/utils/codeRunner';
import { compareOutputs, cn } from '@/utils';

interface StressResult {
  testNumber: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  match: boolean;
  time: number;
}

const DEFAULT_GENERATOR = `import random
import sys

# Stress test generator: prints one random test case
n = random.randint(1, 100)
print(n)
print(' '.join(str(random.randint(1, 1000)) for _ in range(n)))
`;

const DEFAULT_BRUTE = `// Brute force solution
#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    // TODO: implement brute force
    sort(a.begin(), a.end());
    for (int x : a) cout << x << " ";
    cout << endl;
}
`;

export default function StressTester({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { activeProblemId, activeLanguage, getCode } = useProblemStore();
  const { settings } = useAppStore();

  const [generatorCode, setGeneratorCode] = useState(DEFAULT_GENERATOR);
  const [bruteForceCode, setBruteForceCode] = useState(DEFAULT_BRUTE);
  const [maxTests, setMaxTests] = useState(100);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<StressResult[]>([]);
  const [currentTest, setCurrentTest] = useState(0);
  const [failedTest, setFailedTest] = useState<StressResult | null>(null);
  const [status, setStatus] = useState<'idle' | 'running' | 'found' | 'passed'>('idle');
  const abortRef = useRef(false);

  const mainCode = activeProblemId ? getCode(activeProblemId, activeLanguage) : '';

  const handleRun = async () => {
    if (!activeProblemId) return;

    setIsRunning(true);
    setResults([]);
    setFailedTest(null);
    setStatus('running');
    abortRef.current = false;

    for (let i = 1; i <= maxTests; i++) {
      if (abortRef.current) break;
      setCurrentTest(i);

      try {
        // Step 1: Generate test input
        const genResult = await executeCode(generatorCode, 'python', '', 5000);
        if (genResult.exitCode !== 0 || genResult.compilationError) {
          setStatus('idle');
          setIsRunning(false);
          setResults((prev) => [
            ...prev,
            { testNumber: i, input: '', expectedOutput: '', actualOutput: `Generator error: ${genResult.stderr || genResult.compilationError}`, match: false, time: 0 },
          ]);
          return;
        }
        const testInput = genResult.stdout.trim();

        // Step 2: Run brute force
        const bruteResult = await executeCode(bruteForceCode, 'cpp', testInput, 10000);
        if (bruteResult.exitCode !== 0 && !bruteResult.compilationError) {
          // Brute force RTE, skip
          continue;
        }
        const expectedOutput = bruteResult.stdout.trim();

        // Step 3: Run main solution
        const mainResult = await executeCode(mainCode, activeLanguage, testInput, settings.compileTimeout * 1000);
        const actualOutput = mainResult.stdout.trim();

        const match = compareOutputs(expectedOutput, actualOutput);
        const result: StressResult = {
          testNumber: i,
          input: testInput,
          expectedOutput,
          actualOutput,
          match,
          time: mainResult.executionTime,
        };

        setResults((prev) => [...prev, result]);

        if (!match) {
          setFailedTest(result);
          setStatus('found');
          setIsRunning(false);
          return;
        }
      } catch (err) {
        continue;
      }
    }

    if (!abortRef.current) {
      setStatus('passed');
    }
    setIsRunning(false);
  };

  const handleStop = () => {
    abortRef.current = true;
    setIsRunning(false);
    setStatus('idle');
  };

  const handleAddAsTestCase = () => {
    if (failedTest && activeProblemId) {
      const { addTestCase } = useProblemStore.getState();
      addTestCase(activeProblemId, {
        input: failedTest.input,
        expectedOutput: failedTest.expectedOutput,
        isCustom: true,
      });
      onClose();
    }
  };

  const passedCount = results.filter((r) => r.match).length;
  const failedCount = results.filter((r) => !r.match).length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Stress Tester" size="lg">
      <div className="space-y-4">
        {/* Status bar */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-surface border border-surface-border">
          {status === 'idle' && (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Zap className="w-4 h-4" />
              <span>Configure generator and brute force, then run</span>
            </div>
          )}
          {status === 'running' && (
            <div className="flex items-center gap-2 text-cyan-400 text-sm">
              <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span>Testing #{currentTest}/{maxTests}...</span>
              <div className="flex-1">
                <div className="h-1.5 rounded bg-surface-border">
                  <motion.div
                    className="h-full rounded gradient-bg"
                    animate={{ width: `${(currentTest / maxTests) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}
          {status === 'found' && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <XCircle className="w-4 h-4" />
              <span className="font-bold">Counter-example found at test #{failedTest?.testNumber}!</span>
            </div>
          )}
          {status === 'passed' && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span className="font-bold">All {maxTests} tests passed! Solution looks correct.</span>
            </div>
          )}
        </div>

        {/* Config row */}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-400 mb-1">Max Tests</label>
            <input
              type="number"
              value={maxTests}
              onChange={(e) => setMaxTests(Math.min(1000, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-24 px-3 py-2 rounded-lg bg-surface border border-surface-border text-sm text-gray-200"
              disabled={isRunning}
            />
          </div>
          <div className="flex gap-2">
            {isRunning ? (
              <Button variant="danger" onClick={handleStop}>
                <Square className="w-3.5 h-3.5" /> Stop
              </Button>
            ) : (
              <Button onClick={handleRun} disabled={!activeProblemId}>
                <Play className="w-3.5 h-3.5" /> Run Stress Test
              </Button>
            )}
            <Button variant="ghost" onClick={() => { setResults([]); setStatus('idle'); setFailedTest(null); }}>
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </Button>
          </div>
        </div>

        {/* Code editors */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-400">
              Generator (Python) — prints one test case
            </label>
            <textarea
              value={generatorCode}
              onChange={(e) => setGeneratorCode(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-border text-xs text-gray-200 font-mono resize-y"
              disabled={isRunning}
              spellCheck={false}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-400">
              Brute Force (C++) — correct but slow
            </label>
            <textarea
              value={bruteForceCode}
              onChange={(e) => setBruteForceCode(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-border text-xs text-gray-200 font-mono resize-y"
              disabled={isRunning}
              spellCheck={false}
            />
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="text-green-400">✓ {passedCount} passed</span>
              {failedCount > 0 && <span className="text-red-400">✗ {failedCount} failed</span>}
            </div>

            {/* Results grid */}
            <div className="flex flex-wrap gap-1.5 max-h-[60px] overflow-y-auto">
              {results.map((r) => (
                <div
                  key={r.testNumber}
                  className={cn(
                    'w-5 h-5 rounded text-[9px] flex items-center justify-center font-mono',
                    r.match
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  )}
                  title={`Test #${r.testNumber}: ${r.match ? 'PASS' : 'FAIL'}`}
                >
                  {r.testNumber}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Failed test details */}
        {failedTest && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 space-y-3"
          >
            <h4 className="text-sm font-bold text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Counter-example (Test #{failedTest.testNumber})
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-gray-500 uppercase">Input</label>
                <pre className="text-xs text-gray-300 bg-surface p-2 rounded max-h-[100px] overflow-auto font-mono">
                  {failedTest.input}
                </pre>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-green-500 uppercase">Expected</label>
                <pre className="text-xs text-green-300 bg-green-500/5 p-2 rounded max-h-[100px] overflow-auto font-mono border border-green-500/20">
                  {failedTest.expectedOutput}
                </pre>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-red-500 uppercase">Actual</label>
                <pre className="text-xs text-red-300 bg-red-500/5 p-2 rounded max-h-[100px] overflow-auto font-mono border border-red-500/20">
                  {failedTest.actualOutput}
                </pre>
              </div>
            </div>
            <Button size="sm" onClick={handleAddAsTestCase}>
              Add as Test Case
            </Button>
          </motion.div>
        )}
      </div>
    </Modal>
  );
}
