import type { CFProblem, CFContest, CFUser, CFRatingChange, CFSubmission, Problem, TestCase } from '@/types';
import { generateId } from './helpers';

const CF_API = 'https://codeforces.com/api';

export async function fetchCFContests(): Promise<CFContest[]> {
  try {
    const res = await fetch(`${CF_API}/contest.list?gym=false`);
    const data = await res.json();
    if (data.status !== 'OK') throw new Error(data.comment);
    return data.result.slice(0, 50); // last 50 contests
  } catch {
    return [];
  }
}

export async function fetchCFProblems(): Promise<CFProblem[]> {
  try {
    const res = await fetch(`${CF_API}/problemset.problems`);
    const data = await res.json();
    if (data.status !== 'OK') throw new Error(data.comment);
    return data.result.problems;
  } catch {
    return [];
  }
}

export async function fetchCFProblemTestCases(
  contestId: number,
  problemIndex: string
): Promise<TestCase[]> {
  // Codeforces doesn't have a public test case API, 
  // so we'll scrape the problem page for sample tests
  try {
    const url = `https://codeforces.com/contest/${contestId}/problem/${problemIndex}`;
    // Use a CORS proxy for web fetching
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    const html = await res.text();

    const testCases: TestCase[] = [];
    const inputRegex = /<div class="input"><pre[^>]*>([\s\S]*?)<\/pre>/g;
    const outputRegex = /<div class="output"><pre[^>]*>([\s\S]*?)<\/pre>/g;

    const inputs: string[] = [];
    const outputs: string[] = [];

    let match;
    while ((match = inputRegex.exec(html)) !== null) {
      let text = match[1]
        .replace(/<br\s*\/?>/g, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .trim();
      inputs.push(text);
    }

    while ((match = outputRegex.exec(html)) !== null) {
      let text = match[1]
        .replace(/<br\s*\/?>/g, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .trim();
      outputs.push(text);
    }

    for (let i = 0; i < Math.min(inputs.length, outputs.length); i++) {
      testCases.push({
        id: generateId(),
        input: inputs[i],
        expectedOutput: outputs[i],
        verdict: 'PENDING',
        isCustom: false,
      });
    }

    return testCases;
  } catch {
    return [];
  }
}

export function cfRatingToDifficulty(rating?: number): 'easy' | 'medium' | 'hard' | 'expert' {
  if (!rating || rating <= 1200) return 'easy';
  if (rating <= 1600) return 'medium';
  if (rating <= 2100) return 'hard';
  return 'expert';
}

export function cfProblemToLocal(cf: CFProblem): Omit<Problem, 'testCases'> {
  return {
    id: generateId(),
    title: `${cf.contestId}${cf.index} - ${cf.name}`,
    source: 'codeforces',
    sourceUrl: `https://codeforces.com/contest/${cf.contestId}/problem/${cf.index}`,
    contestId: String(cf.contestId),
    problemIndex: cf.index,
    difficulty: cfRatingToDifficulty(cf.rating),
    tags: cf.tags,
    timeLimit: 2,
    memoryLimit: 256,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isSolved: false,
    isFavorite: false,
    notes: '',
  };
}

// ========================
// CF Profile API
// ========================

export async function fetchCFUser(handle: string): Promise<CFUser | null> {
  try {
    const res = await fetch(`${CF_API}/user.info?handles=${handle}`);
    const data = await res.json();
    if (data.status !== 'OK') return null;
    return data.result[0];
  } catch {
    return null;
  }
}

export async function fetchCFRatingHistory(handle: string): Promise<CFRatingChange[]> {
  try {
    const res = await fetch(`${CF_API}/user.rating?handle=${handle}`);
    const data = await res.json();
    if (data.status !== 'OK') return [];
    return data.result;
  } catch {
    return [];
  }
}

export async function fetchCFSubmissions(handle: string, count = 500): Promise<CFSubmission[]> {
  try {
    const res = await fetch(`${CF_API}/user.status?handle=${handle}&from=1&count=${count}`);
    const data = await res.json();
    if (data.status !== 'OK') return [];
    return data.result;
  } catch {
    return [];
  }
}

export function extractSolvedProblems(submissions: CFSubmission[]): Set<string> {
  const solved = new Set<string>();
  for (const sub of submissions) {
    if (sub.verdict === 'OK') {
      solved.add(`${sub.problem.contestId}-${sub.problem.index}`);
    }
  }
  return solved;
}

export function analyzeWeakTags(submissions: CFSubmission[]): { tag: string; solved: number; attempted: number; ratio: number }[] {
  const tagStats: Record<string, { solved: number; attempted: Set<string> }> = {};

  for (const sub of submissions) {
    const key = `${sub.problem.contestId}-${sub.problem.index}`;
    for (const tag of sub.problem.tags) {
      if (!tagStats[tag]) tagStats[tag] = { solved: 0, attempted: new Set() };
      tagStats[tag].attempted.add(key);
      if (sub.verdict === 'OK') {
        tagStats[tag].solved++;
      }
    }
  }

  return Object.entries(tagStats)
    .map(([tag, s]) => ({
      tag,
      solved: s.solved,
      attempted: s.attempted.size,
      ratio: s.attempted.size > 0 ? s.solved / s.attempted.size : 0,
    }))
    .sort((a, b) => a.ratio - b.ratio);
}

export function recommendProblems(
  allProblems: CFProblem[],
  solved: Set<string>,
  userRating: number,
  weakTags: { tag: string; ratio: number }[],
  count = 20
): CFProblem[] {
  const unsolved = allProblems.filter(
    (p) => !solved.has(`${p.contestId}-${p.index}`) && p.rating
  );

  // Target: rating +/- 200 of user, weighted toward weak tags
  const ratingMin = Math.max(800, userRating - 200);
  const ratingMax = userRating + 300;
  const weakTagSet = new Set(weakTags.slice(0, 5).map((t) => t.tag));

  const scored = unsolved
    .filter((p) => p.rating && p.rating >= ratingMin && p.rating <= ratingMax)
    .map((p) => {
      let score = 0;
      // Boost for weak tags
      for (const tag of p.tags) {
        if (weakTagSet.has(tag)) score += 30;
      }
      // Slight preference for problems at or slightly above rating
      if (p.rating) {
        const diff = Math.abs(p.rating - userRating);
        score += Math.max(0, 20 - diff / 10);
        // Prefer slightly harder
        if (p.rating > userRating) score += 10;
      }
      // Add randomness for variety
      score += Math.random() * 15;
      return { problem: p, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, count).map((s) => s.problem);
}

export async function fetchContestProblems(contestId: number): Promise<CFProblem[]> {
  try {
    const res = await fetch(`${CF_API}/contest.standings?contestId=${contestId}&from=1&count=1`);
    const data = await res.json();
    if (data.status !== 'OK') return [];
    return data.result.problems;
  } catch {
    return [];
  }
}

export function getCFRankColor(rank: string): string {
  const lower = rank.toLowerCase();
  const colors: Record<string, string> = {
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
  return colors[lower] || '#808080';
}
