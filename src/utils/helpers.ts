import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function formatTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

export function formatTimerDisplay(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateShort(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(timestamp);
}

export function normalizeOutput(output: string): string {
  return output
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trimEnd();
}

export function compareOutputs(expected: string, actual: string): boolean {
  return normalizeOutput(expected) === normalizeOutput(actual);
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

export function getDifficultyColor(diff: string): string {
  switch (diff) {
    case 'easy':
      return 'text-green-400';
    case 'medium':
      return 'text-yellow-400';
    case 'hard':
      return 'text-orange-400';
    case 'expert':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
}

export function getVerdictColor(verdict: string): string {
  switch (verdict) {
    case 'AC':
      return 'text-green-400';
    case 'WA':
      return 'text-red-400';
    case 'TLE':
      return 'text-yellow-400';
    case 'RTE':
      return 'text-orange-400';
    case 'CE':
      return 'text-purple-400';
    case 'RUNNING':
      return 'text-cyan-400';
    default:
      return 'text-gray-500';
  }
}

export function getVerdictBg(verdict: string): string {
  switch (verdict) {
    case 'AC':
      return 'bg-green-500/10 border-green-500/30';
    case 'WA':
      return 'bg-red-500/10 border-red-500/30';
    case 'TLE':
      return 'bg-yellow-500/10 border-yellow-500/30';
    case 'RTE':
      return 'bg-orange-500/10 border-orange-500/30';
    case 'CE':
      return 'bg-purple-500/10 border-purple-500/30';
    case 'RUNNING':
      return 'bg-cyan-500/10 border-cyan-500/30';
    default:
      return 'bg-gray-500/10 border-gray-500/30';
  }
}

export function getVerdictLabel(verdict: string): string {
  switch (verdict) {
    case 'AC': return 'Accepted';
    case 'WA': return 'Wrong Answer';
    case 'TLE': return 'Time Limit Exceeded';
    case 'RTE': return 'Runtime Error';
    case 'CE': return 'Compilation Error';
    case 'RUNNING': return 'Running...';
    case 'PENDING': return 'Not Run';
    default: return verdict;
  }
}

export function getLanguageLabel(lang: string): string {
  switch (lang) {
    case 'cpp': return 'C++';
    case 'python': return 'Python';
    case 'java': return 'Java';
    case 'javascript': return 'JavaScript';
    default: return lang;
  }
}

export function getLanguageIcon(lang: string): string {
  switch (lang) {
    case 'cpp': return '⚡';
    case 'python': return '🐍';
    case 'java': return '☕';
    case 'javascript': return '📜';
    default: return '📄';
  }
}

export function getMonacoLanguage(lang: string): string {
  switch (lang) {
    case 'cpp': return 'cpp';
    case 'python': return 'python';
    case 'java': return 'java';
    case 'javascript': return 'javascript';
    default: return 'plaintext';
  }
}

export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function getStreakEmoji(streak: number): string {
  if (streak >= 30) return '🏆';
  if (streak >= 14) return '🔥';
  if (streak >= 7) return '⚡';
  if (streak >= 3) return '✨';
  return '💪';
}

export function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}
