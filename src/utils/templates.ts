import type { Language, CodeTemplate } from '@/types';
import { generateId } from './helpers';

export const DEFAULT_TEMPLATES: Record<Language, string> = {
  cpp: `#include <bits/stdc++.h>
using namespace std;

#define ll long long
#define vi vector<int>
#define vll vector<long long>
#define pii pair<int, int>
#define pb push_back
#define all(x) (x).begin(), (x).end()
#define sz(x) (int)(x).size()
#define FOR(i, a, b) for (int i = (a); i < (b); i++)
#define F0R(i, n) FOR(i, 0, n)

void solve() {
    // Your solution here
    
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    int t = 1;
    // cin >> t;
    while (t--) {
        solve();
    }
    
    return 0;
}
`,
  python: `import sys
from collections import defaultdict, deque, Counter
from itertools import permutations, combinations
from functools import lru_cache
from heapq import heappush, heappop

input = sys.stdin.readline

def solve():
    # Your solution here
    pass

def main():
    t = 1
    # t = int(input())
    for _ in range(t):
        solve()

if __name__ == "__main__":
    main()
`,
  java: `import java.util.*;
import java.io.*;

public class Main {
    static BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
    static PrintWriter out = new PrintWriter(new BufferedOutputStream(System.out));
    
    static void solve() throws IOException {
        // Your solution here
        
    }
    
    public static void main(String[] args) throws IOException {
        int t = 1;
        // t = Integer.parseInt(br.readLine().trim());
        while (t-- > 0) {
            solve();
        }
        out.flush();
        out.close();
    }
}
`,
  javascript: `'use strict';

const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines = [];

rl.on('line', (line) => lines.push(line.trim()));

rl.on('close', () => {
    let idx = 0;
    const next = () => lines[idx++];
    
    // Your solution here
    
});
`,
};

export function createDefaultTemplates(): CodeTemplate[] {
  return [
    {
      id: generateId(),
      name: 'CP Template (C++)',
      language: 'cpp',
      code: DEFAULT_TEMPLATES.cpp,
      description: 'Full competitive programming template with common macros',
      isDefault: true,
      createdAt: Date.now(),
    },
    {
      id: generateId(),
      name: 'CP Template (Python)',
      language: 'python',
      code: DEFAULT_TEMPLATES.python,
      description: 'Python CP template with fast I/O and common imports',
      isDefault: true,
      createdAt: Date.now(),
    },
    {
      id: generateId(),
      name: 'CP Template (Java)',
      language: 'java',
      code: DEFAULT_TEMPLATES.java,
      description: 'Java CP template with buffered I/O',
      isDefault: true,
      createdAt: Date.now(),
    },
    {
      id: generateId(),
      name: 'CP Template (JavaScript)',
      language: 'javascript',
      code: DEFAULT_TEMPLATES.javascript,
      description: 'JavaScript CP template with readline',
      isDefault: true,
      createdAt: Date.now(),
    },
  ];
}
