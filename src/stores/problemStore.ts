import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Problem, TestCase, Language, Verdict, CodeSubmission } from '@/types';
import { generateId, compareOutputs, getTodayKey } from '@/utils/helpers';
import { executeCode } from '@/utils/codeRunner';
import { DEFAULT_TEMPLATES } from '@/utils/templates';

interface ProblemState {
  problems: Problem[];
  activeProblemId: string | null;
  code: Record<string, Record<Language, string>>; // problemId -> language -> code
  activeLanguage: Language;
  submissions: CodeSubmission[];
  isRunning: boolean;
  runningTestId: string | null;

  // Actions
  addProblem: (problem: Omit<Problem, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateProblem: (id: string, updates: Partial<Problem>) => void;
  deleteProblem: (id: string) => void;
  setActiveProblem: (id: string | null) => void;
  toggleFavorite: (id: string) => void;
  markSolved: (id: string) => void;

  // Code
  getCode: (problemId: string, language: Language) => string;
  setCode: (problemId: string, language: Language, code: string) => void;
  setActiveLanguage: (language: Language) => void;

  // Test cases
  addTestCase: (problemId: string, testCase?: Partial<TestCase>) => void;
  updateTestCase: (problemId: string, testCaseId: string, updates: Partial<TestCase>) => void;
  deleteTestCase: (problemId: string, testCaseId: string) => void;
  resetTestCases: (problemId: string) => void;

  // Execution
  runTestCase: (problemId: string, testCaseId: string) => Promise<void>;
  runAllTestCases: (problemId: string) => Promise<void>;

  // Import
  importProblemWithTests: (problem: Omit<Problem, 'id' | 'createdAt' | 'updatedAt'>, testCases: Omit<TestCase, 'id'>[]) => string;
}

export const useProblemStore = create<ProblemState>()(
  persist(
    (set, get) => ({
      problems: [],
      activeProblemId: null,
      code: {},
      activeLanguage: 'cpp',
      submissions: [],
      isRunning: false,
      runningTestId: null,

      addProblem: (problem) => {
        const id = generateId();
        const now = Date.now();
        const newProblem: Problem = {
          ...problem,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          problems: [newProblem, ...state.problems],
          activeProblemId: id,
        }));
        // Initialize code with default template
        const lang = get().activeLanguage;
        get().setCode(id, lang, DEFAULT_TEMPLATES[lang]);
        return id;
      },

      updateProblem: (id, updates) => {
        set((state) => ({
          problems: state.problems.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
          ),
        }));
      },

      deleteProblem: (id) => {
        set((state) => ({
          problems: state.problems.filter((p) => p.id !== id),
          activeProblemId:
            state.activeProblemId === id ? null : state.activeProblemId,
          code: Object.fromEntries(
            Object.entries(state.code).filter(([k]) => k !== id)
          ),
        }));
      },

      setActiveProblem: (id) => {
        set({ activeProblemId: id });
      },

      toggleFavorite: (id) => {
        set((state) => ({
          problems: state.problems.map((p) =>
            p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
          ),
        }));
      },

      markSolved: (id) => {
        set((state) => ({
          problems: state.problems.map((p) =>
            p.id === id ? { ...p, isSolved: true, updatedAt: Date.now() } : p
          ),
        }));
      },

      getCode: (problemId, language) => {
        const codeMap = get().code;
        return codeMap[problemId]?.[language] || DEFAULT_TEMPLATES[language];
      },

      setCode: (problemId, language, code) => {
        set((state) => ({
          code: {
            ...state.code,
            [problemId]: {
              ...state.code[problemId],
              [language]: code,
            },
          },
        }));
      },

      setActiveLanguage: (language) => {
        set({ activeLanguage: language });
      },

      addTestCase: (problemId, testCase) => {
        const tc: TestCase = {
          id: generateId(),
          input: testCase?.input || '',
          expectedOutput: testCase?.expectedOutput || '',
          verdict: 'PENDING',
          isCustom: testCase?.isCustom ?? true,
          ...testCase,
        };
        tc.id = generateId();
        set((state) => ({
          problems: state.problems.map((p) =>
            p.id === problemId
              ? { ...p, testCases: [...p.testCases, tc], updatedAt: Date.now() }
              : p
          ),
        }));
      },

      updateTestCase: (problemId, testCaseId, updates) => {
        set((state) => ({
          problems: state.problems.map((p) =>
            p.id === problemId
              ? {
                  ...p,
                  testCases: p.testCases.map((tc) =>
                    tc.id === testCaseId ? { ...tc, ...updates } : tc
                  ),
                  updatedAt: Date.now(),
                }
              : p
          ),
        }));
      },

      deleteTestCase: (problemId, testCaseId) => {
        set((state) => ({
          problems: state.problems.map((p) =>
            p.id === problemId
              ? {
                  ...p,
                  testCases: p.testCases.filter((tc) => tc.id !== testCaseId),
                  updatedAt: Date.now(),
                }
              : p
          ),
        }));
      },

      resetTestCases: (problemId) => {
        set((state) => ({
          problems: state.problems.map((p) =>
            p.id === problemId
              ? {
                  ...p,
                  testCases: p.testCases.map((tc) => ({
                    ...tc,
                    actualOutput: undefined,
                    verdict: 'PENDING' as Verdict,
                    executionTime: undefined,
                  })),
                }
              : p
          ),
        }));
      },

      runTestCase: async (problemId, testCaseId) => {
        const state = get();
        const language = state.activeLanguage;
        const code = state.getCode(problemId, language);
        const problem = state.problems.find((p) => p.id === problemId);
        const tc = problem?.testCases.find((t) => t.id === testCaseId);
        if (!tc || !problem) return;

        set({ isRunning: true, runningTestId: testCaseId });

        // Mark as running
        get().updateTestCase(problemId, testCaseId, { verdict: 'RUNNING' });

        try {
          const result = await executeCode(
            code,
            language,
            tc.input,
            problem.timeLimit * 1000
          );

          let verdict: Verdict;
          if (result.compilationError) {
            verdict = 'CE';
          } else if (result.timedOut) {
            verdict = 'TLE';
          } else if (result.exitCode !== 0) {
            verdict = 'RTE';
          } else if (
            tc.expectedOutput &&
            compareOutputs(tc.expectedOutput, result.stdout)
          ) {
            verdict = 'AC';
          } else if (tc.expectedOutput) {
            verdict = 'WA';
          } else {
            // No expected output, just show output
            verdict = 'AC';
          }

          get().updateTestCase(problemId, testCaseId, {
            actualOutput: result.compilationError || result.stderr || result.stdout,
            verdict,
            executionTime: result.executionTime,
          });

          // Save submission
          const submission: CodeSubmission = {
            id: generateId(),
            problemId,
            language,
            code,
            verdict,
            timestamp: Date.now(),
            executionTime: result.executionTime,
          };
          set((s) => ({ submissions: [submission, ...s.submissions.slice(0, 99)] }));
        } catch {
          get().updateTestCase(problemId, testCaseId, {
            verdict: 'RTE',
            actualOutput: 'Execution failed',
          });
        }

        set({ isRunning: false, runningTestId: null });
      },

      runAllTestCases: async (problemId) => {
        const problem = get().problems.find((p) => p.id === problemId);
        if (!problem) return;

        set({ isRunning: true });

        for (const tc of problem.testCases) {
          await get().runTestCase(problemId, tc.id);
        }

        // Check if all passed
        const updated = get().problems.find((p) => p.id === problemId);
        if (updated && updated.testCases.every((tc) => tc.verdict === 'AC')) {
          get().markSolved(problemId);
        }

        set({ isRunning: false });
      },

      importProblemWithTests: (problem, testCases) => {
        const id = generateId();
        const now = Date.now();
        const tcs: TestCase[] = testCases.map((tc) => ({
          ...tc,
          id: generateId(),
        }));
        const newProblem: Problem = {
          ...problem,
          id,
          testCases: tcs,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          problems: [newProblem, ...state.problems],
          activeProblemId: id,
        }));
        const lang = get().activeLanguage;
        get().setCode(id, lang, DEFAULT_TEMPLATES[lang]);
        return id;
      },
    }),
    {
      name: 'cphelper-problems',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        problems: state.problems,
        code: state.code,
        activeLanguage: state.activeLanguage,
        submissions: state.submissions.slice(0, 100),
      }),
    }
  )
);
