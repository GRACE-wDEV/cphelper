// ========================
// CPHelper Type Definitions
// ========================

export type Language = 'cpp' | 'python' | 'java' | 'javascript';

export type Verdict =
  | 'AC'      // Accepted
  | 'WA'      // Wrong Answer
  | 'TLE'     // Time Limit Exceeded
  | 'RTE'     // Runtime Error
  | 'CE'      // Compilation Error
  | 'PENDING' // Not yet run
  | 'RUNNING'; // Currently running

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type ProblemSource = 'codeforces' | 'atcoder' | 'leetcode' | 'custom';

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  verdict: Verdict;
  executionTime?: number; // ms
  memoryUsed?: number; // KB
  isCustom: boolean;
}

export interface Problem {
  id: string;
  title: string;
  source: ProblemSource;
  sourceUrl?: string;
  contestId?: string;
  problemIndex?: string;
  difficulty?: Difficulty;
  tags: string[];
  statement?: string;
  timeLimit: number; // seconds
  memoryLimit: number; // MB
  testCases: TestCase[];
  createdAt: number;
  updatedAt: number;
  isSolved: boolean;
  isFavorite: boolean;
  notes: string;
}

export interface CodeSubmission {
  id: string;
  problemId: string;
  language: Language;
  code: string;
  verdict: Verdict;
  timestamp: number;
  executionTime?: number;
}

export interface CodeTemplate {
  id: string;
  name: string;
  language: Language;
  code: string;
  description: string;
  isDefault: boolean;
  createdAt: number;
}

export interface UserStats {
  totalSolved: number;
  totalAttempted: number;
  streakDays: number;
  lastSolvedDate: string;
  solvedByDifficulty: Record<Difficulty, number>;
  solvedByTag: Record<string, number>;
  dailyActivity: Record<string, number>; // date -> count
  languageUsage: Record<Language, number>;
}

export interface ContestTimer {
  isRunning: boolean;
  startTime: number | null;
  duration: number; // minutes
  remainingMs: number;
}

export interface AppSettings {
  editorFontSize: number;
  editorTabSize: number;
  editorWordWrap: boolean;
  editorMinimap: boolean;
  editorLineNumbers: boolean;
  defaultLanguage: Language;
  autoSave: boolean;
  autoSaveInterval: number; // seconds
  compileTimeout: number; // seconds
  theme: 'dark' | 'midnight' | 'abyss';
  accentColor: string;
  sidebarCollapsed: boolean;
  showAnimations: boolean;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  memoryUsed: number;
  timedOut: boolean;
  compilationError?: string;
}

// Piston API types
export interface PistonRuntime {
  language: string;
  version: string;
  aliases: string[];
}

export interface PistonExecuteRequest {
  language: string;
  version: string;
  files: { name: string; content: string }[];
  stdin: string;
  compile_timeout: number;
  run_timeout: number;
  compile_memory_limit: number;
  run_memory_limit: number;
}

export interface PistonExecuteResponse {
  run: {
    stdout: string;
    stderr: string;
    code: number;
    signal: string | null;
    output: string;
  };
  compile?: {
    stdout: string;
    stderr: string;
    code: number;
    signal: string | null;
    output: string;
  };
  language: string;
  version: string;
}

// ========================
// Gamification Types
// ========================

export interface XPEvent {
  type: 'solve' | 'streak' | 'speed' | 'first_try' | 'hard_problem' | 'daily';
  xp: number;
  label: string;
  timestamp: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'solve' | 'streak' | 'speed' | 'mastery' | 'explorer';
  requirement: number;
  progress: number;
  unlocked: boolean;
  unlockedAt?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface GamificationState {
  xp: number;
  level: number;
  xpToNextLevel: number;
  totalXpEarned: number;
  achievements: Achievement[];
  recentXP: XPEvent[];
  rank: string;
  titleUnlocks: string[];
  selectedTitle: string;
}

export const XP_PER_LEVEL = 500;
export const RANKS = [
  { minLevel: 0, name: 'Newbie', color: '#808080' },
  { minLevel: 3, name: 'Pupil', color: '#22c55e' },
  { minLevel: 7, name: 'Specialist', color: '#22d3ee' },
  { minLevel: 12, name: 'Expert', color: '#6366f1' },
  { minLevel: 18, name: 'Candidate Master', color: '#c084fc' },
  { minLevel: 25, name: 'Master', color: '#f97316' },
  { minLevel: 35, name: 'Grandmaster', color: '#ef4444' },
  { minLevel: 50, name: 'Legendary Grandmaster', color: '#dc2626' },
];

export const DEFAULT_ACHIEVEMENTS: Omit<Achievement, 'progress' | 'unlocked' | 'unlockedAt'>[] = [
  { id: 'first_ac', title: 'First Blood', description: 'Solve your first problem', icon: '🎯', category: 'solve', requirement: 1, rarity: 'common' },
  { id: 'solve_10', title: 'Getting Started', description: 'Solve 10 problems', icon: '⚡', category: 'solve', requirement: 10, rarity: 'common' },
  { id: 'solve_50', title: 'Problem Crusher', description: 'Solve 50 problems', icon: '🔥', category: 'solve', requirement: 50, rarity: 'rare' },
  { id: 'solve_100', title: 'Centurion', description: 'Solve 100 problems', icon: '💯', category: 'solve', requirement: 100, rarity: 'epic' },
  { id: 'solve_500', title: 'Legend', description: 'Solve 500 problems', icon: '🏆', category: 'solve', requirement: 500, rarity: 'legendary' },
  { id: 'streak_3', title: 'Warming Up', description: 'Maintain a 3-day streak', icon: '🔥', category: 'streak', requirement: 3, rarity: 'common' },
  { id: 'streak_7', title: 'On Fire', description: 'Maintain a 7-day streak', icon: '🔥', category: 'streak', requirement: 7, rarity: 'rare' },
  { id: 'streak_30', title: 'Unstoppable', description: '30-day streak', icon: '☄️', category: 'streak', requirement: 30, rarity: 'epic' },
  { id: 'streak_100', title: 'Iron Discipline', description: '100-day streak', icon: '💎', category: 'streak', requirement: 100, rarity: 'legendary' },
  { id: 'speed_1', title: 'Speed Demon', description: 'Solve a problem under 5 mins', icon: '⏱️', category: 'speed', requirement: 1, rarity: 'rare' },
  { id: 'hard_5', title: 'Fearless', description: 'Solve 5 hard/expert problems', icon: '💀', category: 'mastery', requirement: 5, rarity: 'epic' },
  { id: 'all_langs', title: 'Polyglot', description: 'Solve in all 4 languages', icon: '🌍', category: 'explorer', requirement: 4, rarity: 'rare' },
  { id: 'tags_10', title: 'Well Rounded', description: 'Solve problems in 10 different tags', icon: '🎪', category: 'explorer', requirement: 10, rarity: 'epic' },
  { id: 'night_owl', title: 'Night Owl', description: 'Solve a problem after midnight', icon: '🦉', category: 'explorer', requirement: 1, rarity: 'common' },
];

// Codeforces API types
export interface CFProblem {
  contestId: number;
  index: string;
  name: string;
  type: string;
  points?: number;
  rating?: number;
  tags: string[];
}

export interface CFContest {
  id: number;
  name: string;
  type: string;
  phase: string;
  durationSeconds: number;
  startTimeSeconds: number;
}

// ========================
// Codeforces Profile Types
// ========================

export interface CFUser {
  handle: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  city?: string;
  organization?: string;
  contribution: number;
  rank: string;
  rating: number;
  maxRank: string;
  maxRating: number;
  lastOnlineTimeSeconds: number;
  registrationTimeSeconds: number;
  friendOfCount: number;
  avatar: string;
  titlePhoto: string;
}

export interface CFRatingChange {
  contestId: number;
  contestName: string;
  handle: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
}

export interface CFSubmission {
  id: number;
  contestId: number;
  creationTimeSeconds: number;
  relativeTimeSeconds: number;
  problem: CFProblem;
  author: {
    contestId: number;
    members: { handle: string }[];
    participantType: string;
    ghost: boolean;
    startTimeSeconds: number;
  };
  programmingLanguage: string;
  verdict: string;
  testset: string;
  passedTestCount: number;
  timeConsumedMillis: number;
  memoryConsumedBytes: number;
}

export interface CFProfileState {
  handle: string;
  user: CFUser | null;
  ratingHistory: CFRatingChange[];
  solvedProblems: Set<string>; // "contestId-index" keys
  submissions: CFSubmission[];
  weakTags: { tag: string; solved: number; attempted: number; ratio: number }[];
  isConnected: boolean;
  isLoading: boolean;
  lastSynced: number | null;
}

export interface Rival {
  handle: string;
  user: CFUser | null;
  ratingHistory: CFRatingChange[];
  solvedCount: number;
}

export interface VirtualContest {
  contestId: number;
  contestName: string;
  problems: CFProblem[];
  durationSeconds: number;
  startedAt: number | null;
  isRunning: boolean;
  solvedInVirtual: string[]; // problem indices solved
}

export const CF_RANK_COLORS: Record<string, string> = {
  'newbie': '#808080',
  'pupil': '#008000',
  'specialist': '#03A89E',
  'expert': '#0000FF',
  'candidate master': '#AA00AA',
  'master': '#FF8C00',
  'international master': '#FF8C00',
  'grandmaster': '#FF0000',
  'international grandmaster': '#FF0000',
  'legendary grandmaster': '#FF0000',
};
