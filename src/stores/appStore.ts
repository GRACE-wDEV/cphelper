import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppSettings, ContestTimer, UserStats, CodeTemplate, Difficulty, Language, GamificationState, XPEvent, Achievement } from '@/types';
import { XP_PER_LEVEL, RANKS, DEFAULT_ACHIEVEMENTS } from '@/types';
import { createDefaultTemplates } from '@/utils/templates';
import { getTodayKey, generateId } from '@/utils/helpers';

interface AppState {
  settings: AppSettings;
  timer: ContestTimer;
  stats: UserStats;
  templates: CodeTemplate[];
  gamification: GamificationState;
  zenMode: boolean;
  showCelebration: boolean;

  // Settings
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;

  // Timer
  startTimer: (durationMinutes: number) => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  tickTimer: () => void;

  // Stats
  recordSolve: (difficulty: Difficulty, tags: string[], language: Language) => void;
  getStats: () => UserStats;

  // Templates
  addTemplate: (template: Omit<CodeTemplate, 'id' | 'createdAt'>) => void;
  updateTemplate: (id: string, updates: Partial<CodeTemplate>) => void;
  deleteTemplate: (id: string) => void;

  // Gamification
  awardXP: (type: XPEvent['type'], bonusXP?: number) => void;
  checkAchievements: () => Achievement[];
  triggerCelebration: () => void;
  dismissCelebration: () => void;
  toggleZenMode: () => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  editorFontSize: 14,
  editorTabSize: 4,
  editorWordWrap: false,
  editorMinimap: false,
  editorLineNumbers: true,
  defaultLanguage: 'cpp',
  autoSave: true,
  autoSaveInterval: 5,
  compileTimeout: 10,
  theme: 'dark',
  accentColor: '#6366f1',
  sidebarCollapsed: false,
  showAnimations: true,
};

const DEFAULT_STATS: UserStats = {
  totalSolved: 0,
  totalAttempted: 0,
  streakDays: 0,
  lastSolvedDate: '',
  solvedByDifficulty: { easy: 0, medium: 0, hard: 0, expert: 0 },
  solvedByTag: {},
  dailyActivity: {},
  languageUsage: { cpp: 0, python: 0, java: 0, javascript: 0 },
};

const initAchievements = (): Achievement[] =>
  DEFAULT_ACHIEVEMENTS.map((a) => ({ ...a, progress: 0, unlocked: false }));

function getRank(level: number): string {
  let rank = RANKS[0].name;
  for (const r of RANKS) {
    if (level >= r.minLevel) rank = r.name;
  }
  return rank;
}

function calcLevel(xp: number): { level: number; xpToNext: number } {
  let level = 0;
  let remaining = xp;
  while (remaining >= XP_PER_LEVEL + level * 100) {
    remaining -= XP_PER_LEVEL + level * 100;
    level++;
  }
  return { level, xpToNext: XP_PER_LEVEL + level * 100 - remaining };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      timer: {
        isRunning: false,
        startTime: null,
        duration: 120,
        remainingMs: 120 * 60 * 1000,
      },
      stats: DEFAULT_STATS,
      templates: createDefaultTemplates(),
      gamification: {
        xp: 0,
        level: 0,
        xpToNextLevel: XP_PER_LEVEL,
        totalXpEarned: 0,
        achievements: initAchievements(),
        recentXP: [],
        rank: 'Newbie',
        titleUnlocks: ['Newbie'],
        selectedTitle: 'Newbie',
      },
      zenMode: false,
      showCelebration: false,

      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
      },

      resetSettings: () => {
        set({ settings: DEFAULT_SETTINGS });
      },

      startTimer: (durationMinutes) => {
        set({
          timer: {
            isRunning: true,
            startTime: Date.now(),
            duration: durationMinutes,
            remainingMs: durationMinutes * 60 * 1000,
          },
        });
      },

      pauseTimer: () => {
        set((state) => ({
          timer: {
            ...state.timer,
            isRunning: !state.timer.isRunning,
          },
        }));
      },

      resetTimer: () => {
        set((state) => ({
          timer: {
            isRunning: false,
            startTime: null,
            duration: state.timer.duration,
            remainingMs: state.timer.duration * 60 * 1000,
          },
        }));
      },

      tickTimer: () => {
        set((state) => {
          if (!state.timer.isRunning) return state;
          const elapsed = Date.now() - (state.timer.startTime || Date.now());
          const remaining = Math.max(
            0,
            state.timer.duration * 60 * 1000 - elapsed
          );
          return {
            timer: {
              ...state.timer,
              remainingMs: remaining,
              isRunning: remaining > 0 ? state.timer.isRunning : false,
            },
          };
        });
      },

      recordSolve: (difficulty, tags, language) => {
        const today = getTodayKey();
        set((state) => {
          const stats = { ...state.stats };
          stats.totalSolved += 1;
          stats.solvedByDifficulty = {
            ...stats.solvedByDifficulty,
            [difficulty]: (stats.solvedByDifficulty[difficulty] || 0) + 1,
          };
          tags.forEach((tag) => {
            stats.solvedByTag = {
              ...stats.solvedByTag,
              [tag]: (stats.solvedByTag[tag] || 0) + 1,
            };
          });
          stats.languageUsage = {
            ...stats.languageUsage,
            [language]: (stats.languageUsage[language] || 0) + 1,
          };
          stats.dailyActivity = {
            ...stats.dailyActivity,
            [today]: (stats.dailyActivity[today] || 0) + 1,
          };

          // Update streak
          if (stats.lastSolvedDate === today) {
            // Already solved today, streak stays
          } else {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayKey = yesterday.toISOString().split('T')[0];
            if (stats.lastSolvedDate === yesterdayKey) {
              stats.streakDays += 1;
            } else if (stats.lastSolvedDate !== today) {
              stats.streakDays = 1;
            }
          }
          stats.lastSolvedDate = today;

          return { stats };
        });
      },

      getStats: () => get().stats,

      addTemplate: (template) => {
        const newTemplate: CodeTemplate = {
          ...template,
          id: generateId(),
          createdAt: Date.now(),
        };
        set((state) => ({
          templates: [...state.templates, newTemplate],
        }));
      },

      updateTemplate: (id, updates) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
      },

      deleteTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        }));
      },

      // Gamification
      awardXP: (type, bonusXP) => {
        const xpMap: Record<XPEvent['type'], number> = {
          solve: 50,
          streak: 30,
          speed: 80,
          first_try: 40,
          hard_problem: 100,
          daily: 20,
        };
        const labelMap: Record<XPEvent['type'], string> = {
          solve: 'Problem Solved',
          streak: 'Streak Bonus',
          speed: 'Speed Bonus',
          first_try: 'First Try Bonus',
          hard_problem: 'Hard Problem Bonus',
          daily: 'Daily Activity',
        };
        const xpGained = bonusXP ?? xpMap[type];
        const event: XPEvent = {
          type,
          xp: xpGained,
          label: labelMap[type],
          timestamp: Date.now(),
        };

        set((state) => {
          const newTotalXP = state.gamification.xp + xpGained;
          const { level, xpToNext } = calcLevel(state.gamification.totalXpEarned + xpGained);
          const newRank = getRank(level);
          const titleUnlocks = [...new Set([...state.gamification.titleUnlocks, newRank])];

          return {
            gamification: {
              ...state.gamification,
              xp: newTotalXP,
              level,
              xpToNextLevel: xpToNext,
              totalXpEarned: state.gamification.totalXpEarned + xpGained,
              recentXP: [event, ...state.gamification.recentXP.slice(0, 19)],
              rank: newRank,
              titleUnlocks,
            },
          };
        });
      },

      checkAchievements: () => {
        const state = get();
        const stats = state.stats;
        const gam = state.gamification;
        const newlyUnlocked: Achievement[] = [];

        const updatedAchievements = gam.achievements.map((a) => {
          let progress = a.progress;

          switch (a.id) {
            case 'first_ac': progress = Math.min(stats.totalSolved, 1); break;
            case 'solve_10': progress = Math.min(stats.totalSolved, 10); break;
            case 'solve_50': progress = Math.min(stats.totalSolved, 50); break;
            case 'solve_100': progress = Math.min(stats.totalSolved, 100); break;
            case 'solve_500': progress = Math.min(stats.totalSolved, 500); break;
            case 'streak_3': progress = Math.min(stats.streakDays, 3); break;
            case 'streak_7': progress = Math.min(stats.streakDays, 7); break;
            case 'streak_30': progress = Math.min(stats.streakDays, 30); break;
            case 'streak_100': progress = Math.min(stats.streakDays, 100); break;
            case 'hard_5':
              progress = Math.min((stats.solvedByDifficulty.hard || 0) + (stats.solvedByDifficulty.expert || 0), 5);
              break;
            case 'all_langs':
              progress = Object.values(stats.languageUsage).filter((v) => v > 0).length;
              break;
            case 'tags_10':
              progress = Object.keys(stats.solvedByTag).length;
              break;
            case 'night_owl': {
              const hour = new Date().getHours();
              if (hour >= 0 && hour < 5 && stats.totalSolved > 0) progress = 1;
              break;
            }
          }

          const wasUnlocked = a.unlocked;
          const isNowUnlocked = progress >= a.requirement;

          if (isNowUnlocked && !wasUnlocked) {
            const unlocked = { ...a, progress, unlocked: true, unlockedAt: Date.now() };
            newlyUnlocked.push(unlocked);
            return unlocked;
          }

          return { ...a, progress };
        });

        if (newlyUnlocked.length > 0) {
          set((s) => ({
            gamification: {
              ...s.gamification,
              achievements: updatedAchievements,
            },
          }));

          // Award bonus XP for each achievement
          newlyUnlocked.forEach((a) => {
            const bonusMap = { common: 50, rare: 150, epic: 400, legendary: 1000 };
            get().awardXP('solve', bonusMap[a.rarity]);
          });
        }

        return newlyUnlocked;
      },

      triggerCelebration: () => {
        set({ showCelebration: true });
        setTimeout(() => {
          set({ showCelebration: false });
        }, 4000);
      },

      dismissCelebration: () => {
        set({ showCelebration: false });
      },

      toggleZenMode: () => {
        set((state) => ({ zenMode: !state.zenMode }));
      },
    }),
    {
      name: 'cphelper-app',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
