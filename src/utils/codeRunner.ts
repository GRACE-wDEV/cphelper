import type {
  Language,
  ExecutionResult,
  PistonExecuteResponse,
  PistonRuntime,
} from '@/types';

const PISTON_API = 'https://emkc.org/api/v2/piston';

// Cache runtimes to avoid repeated API calls
let cachedRuntimes: PistonRuntime[] | null = null;

const LANGUAGE_MAP: Record<Language, { language: string; fileName: string }> = {
  cpp: { language: 'c++', fileName: 'main.cpp' },
  python: { language: 'python', fileName: 'main.py' },
  java: { language: 'java', fileName: 'Main.java' },
  javascript: { language: 'javascript', fileName: 'main.js' },
};

export async function getRuntimes(): Promise<PistonRuntime[]> {
  if (cachedRuntimes) return cachedRuntimes;

  try {
    const res = await fetch(`${PISTON_API}/runtimes`);
    if (!res.ok) throw new Error('Failed to fetch runtimes');
    cachedRuntimes = await res.json();
    return cachedRuntimes!;
  } catch {
    return [];
  }
}

export async function getLatestVersion(language: Language): Promise<string> {
  const runtimes = await getRuntimes();
  const mapped = LANGUAGE_MAP[language];

  const runtime = runtimes.find(
    (r) =>
      r.language === mapped.language ||
      r.aliases.includes(mapped.language) ||
      r.language === language ||
      r.aliases.includes(language)
  );

  return runtime?.version || '*';
}

export async function executeCode(
  code: string,
  language: Language,
  stdin: string,
  timeoutMs: number = 10000
): Promise<ExecutionResult> {
  const startTime = performance.now();
  const mapped = LANGUAGE_MAP[language];
  const version = await getLatestVersion(language);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs + 5000);

    const res = await fetch(`${PISTON_API}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        language: mapped.language,
        version,
        files: [{ name: mapped.fileName, content: code }],
        stdin,
        compile_timeout: 10000,
        run_timeout: timeoutMs,
        compile_memory_limit: -1,
        run_memory_limit: -1,
      }),
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Piston API error: ${res.status} - ${errText}`);
    }

    const data: PistonExecuteResponse = await res.json();
    const elapsed = performance.now() - startTime;

    // Check for compilation errors
    if (data.compile && data.compile.code !== 0) {
      return {
        stdout: '',
        stderr: data.compile.stderr || data.compile.output,
        exitCode: data.compile.code,
        executionTime: elapsed,
        memoryUsed: 0,
        timedOut: false,
        compilationError: data.compile.stderr || data.compile.output,
      };
    }

    const timedOut = data.run.signal === 'SIGKILL' || elapsed > timeoutMs;

    return {
      stdout: data.run.stdout || '',
      stderr: data.run.stderr || '',
      exitCode: data.run.code,
      executionTime: elapsed,
      memoryUsed: 0,
      timedOut,
    };
  } catch (error: unknown) {
    const elapsed = performance.now() - startTime;

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        stdout: '',
        stderr: 'Execution timed out',
        exitCode: -1,
        executionTime: elapsed,
        memoryUsed: 0,
        timedOut: true,
      };
    }

    return {
      stdout: '',
      stderr: error instanceof Error ? error.message : 'Unknown execution error',
      exitCode: -1,
      executionTime: elapsed,
      memoryUsed: 0,
      timedOut: false,
    };
  }
}
