import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils';

interface DiffViewerProps {
  expected: string;
  actual: string;
  className?: string;
}

interface DiffLine {
  lineNum: number;
  expected: string;
  actual: string;
  type: 'match' | 'mismatch' | 'extra-expected' | 'extra-actual';
}

function computeDiff(expected: string, actual: string): DiffLine[] {
  const expLines = expected.split('\n').map((l) => l.trimEnd());
  const actLines = actual.split('\n').map((l) => l.trimEnd());
  const maxLen = Math.max(expLines.length, actLines.length);
  const result: DiffLine[] = [];

  for (let i = 0; i < maxLen; i++) {
    const exp = i < expLines.length ? expLines[i] : undefined;
    const act = i < actLines.length ? actLines[i] : undefined;

    if (exp !== undefined && act !== undefined) {
      result.push({
        lineNum: i + 1,
        expected: exp,
        actual: act,
        type: exp === act ? 'match' : 'mismatch',
      });
    } else if (exp !== undefined) {
      result.push({
        lineNum: i + 1,
        expected: exp,
        actual: '',
        type: 'extra-expected',
      });
    } else {
      result.push({
        lineNum: i + 1,
        expected: '',
        actual: act || '',
        type: 'extra-actual',
      });
    }
  }

  return result;
}

function highlightCharDiff(a: string, b: string): { aChars: { char: string; diff: boolean }[]; bChars: { char: string; diff: boolean }[] } {
  const maxLen = Math.max(a.length, b.length);
  const aChars: { char: string; diff: boolean }[] = [];
  const bChars: { char: string; diff: boolean }[] = [];

  for (let i = 0; i < maxLen; i++) {
    const ca = i < a.length ? a[i] : '';
    const cb = i < b.length ? b[i] : '';
    const isDiff = ca !== cb;
    if (ca) aChars.push({ char: ca, diff: isDiff });
    if (cb) bChars.push({ char: cb, diff: isDiff });
  }

  return { aChars, bChars };
}

export default function DiffViewer({ expected, actual, className }: DiffViewerProps) {
  const diff = useMemo(
    () => computeDiff(expected, actual),
    [expected, actual]
  );

  const mismatchCount = diff.filter((d) => d.type !== 'match').length;

  if (mismatchCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className={cn('rounded-lg border border-red-500/20 bg-red-500/5 overflow-hidden', className)}
    >
      <div className="flex items-center justify-between px-3 py-1.5 bg-red-500/10 border-b border-red-500/20">
        <span className="text-[11px] font-semibold text-red-400">
          Output Diff — {mismatchCount} line{mismatchCount > 1 ? 's' : ''} differ
        </span>
        <div className="flex gap-3 text-[10px]">
          <span className="text-green-400">Expected</span>
          <span className="text-red-400">Actual</span>
        </div>
      </div>
      <div className="overflow-x-auto max-h-[200px] overflow-y-auto font-mono text-[11px]">
        {diff.map((line) => {
          if (line.type === 'match') {
            return (
              <div key={line.lineNum} className="flex border-b border-surface-border/30 opacity-50">
                <div className="w-8 text-center py-0.5 text-gray-600 bg-surface/30 shrink-0 border-r border-surface-border/30">
                  {line.lineNum}
                </div>
                <div className="flex-1 px-2 py-0.5 text-gray-500 whitespace-pre">{line.expected || ' '}</div>
              </div>
            );
          }

          const { aChars, bChars } = line.type === 'mismatch'
            ? highlightCharDiff(line.expected, line.actual)
            : { aChars: [], bChars: [] };

          return (
            <div key={line.lineNum} className="border-b border-surface-border/30">
              {/* Expected line */}
              {(line.type === 'mismatch' || line.type === 'extra-expected') && (
                <div className="flex bg-green-500/5">
                  <div className="w-8 text-center py-0.5 text-green-600 bg-green-500/10 shrink-0 border-r border-surface-border/30">
                    {line.lineNum}
                  </div>
                  <div className="flex-1 px-2 py-0.5 whitespace-pre">
                    {line.type === 'mismatch' ? (
                      aChars.map((c, i) => (
                        <span
                          key={i}
                          className={c.diff ? 'bg-green-500/30 text-green-300 font-bold' : 'text-green-200/60'}
                        >
                          {c.char}
                        </span>
                      ))
                    ) : (
                      <span className="text-green-300">{line.expected}</span>
                    )}
                  </div>
                </div>
              )}
              {/* Actual line */}
              {(line.type === 'mismatch' || line.type === 'extra-actual') && (
                <div className="flex bg-red-500/5">
                  <div className="w-8 text-center py-0.5 text-red-600 bg-red-500/10 shrink-0 border-r border-surface-border/30">
                    {line.lineNum}
                  </div>
                  <div className="flex-1 px-2 py-0.5 whitespace-pre">
                    {line.type === 'mismatch' ? (
                      bChars.map((c, i) => (
                        <span
                          key={i}
                          className={c.diff ? 'bg-red-500/30 text-red-300 font-bold' : 'text-red-200/60'}
                        >
                          {c.char}
                        </span>
                      ))
                    ) : (
                      <span className="text-red-300">{line.actual}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
