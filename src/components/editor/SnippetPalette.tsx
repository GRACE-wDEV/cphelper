import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, Copy, ChevronRight, Zap, X } from 'lucide-react';
import { cn, getLanguageIcon } from '@/utils';
import type { Language } from '@/types';

interface Snippet {
  id: string;
  title: string;
  language: Language;
  category: string;
  code: string;
  description: string;
}

const BUILTIN_SNIPPETS: Snippet[] = [
  {
    id: 'dsu', title: 'DSU / Union-Find', language: 'cpp', category: 'Data Structures',
    description: 'Path compression + union by rank',
    code: `struct DSU {
    vector<int> parent, rank_;
    DSU(int n) : parent(n), rank_(n, 0) { iota(parent.begin(), parent.end(), 0); }
    int find(int x) { return parent[x] == x ? x : parent[x] = find(parent[x]); }
    bool unite(int a, int b) {
        a = find(a); b = find(b);
        if (a == b) return false;
        if (rank_[a] < rank_[b]) swap(a, b);
        parent[b] = a;
        if (rank_[a] == rank_[b]) rank_[a]++;
        return true;
    }
};`,
  },
  {
    id: 'segtree', title: 'Segment Tree', language: 'cpp', category: 'Data Structures',
    description: 'Point update + range query',
    code: `template<typename T>
struct SegTree {
    int n; vector<T> tree;
    SegTree(int n) : n(n), tree(4 * n, 0) {}
    void update(int node, int s, int e, int idx, T val) {
        if (s == e) { tree[node] = val; return; }
        int mid = (s + e) / 2;
        if (idx <= mid) update(2*node, s, mid, idx, val);
        else update(2*node+1, mid+1, e, idx, val);
        tree[node] = tree[2*node] + tree[2*node+1];
    }
    T query(int node, int s, int e, int l, int r) {
        if (r < s || e < l) return 0;
        if (l <= s && e <= r) return tree[node];
        int mid = (s + e) / 2;
        return query(2*node, s, mid, l, r) + query(2*node+1, mid+1, e, l, r);
    }
    void update(int idx, T val) { update(1, 0, n-1, idx, val); }
    T query(int l, int r) { return query(1, 0, n-1, l, r); }
};`,
  },
  {
    id: 'fenwick', title: 'Fenwick / BIT', language: 'cpp', category: 'Data Structures',
    description: 'Binary Indexed Tree for prefix sums',
    code: `struct BIT {
    int n; vector<long long> tree;
    BIT(int n) : n(n), tree(n + 1, 0) {}
    void update(int i, long long delta) { for (++i; i <= n; i += i & (-i)) tree[i] += delta; }
    long long query(int i) { long long s = 0; for (++i; i > 0; i -= i & (-i)) s += tree[i]; return s; }
    long long query(int l, int r) { return query(r) - (l ? query(l-1) : 0); }
};`,
  },
  {
    id: 'dijkstra', title: "Dijkstra's SSSP", language: 'cpp', category: 'Graph',
    description: 'Shortest path with priority queue',
    code: `vector<long long> dijkstra(int start, const vector<vector<pair<int,long long>>>& adj) {
    int n = adj.size();
    vector<long long> dist(n, LLONG_MAX);
    priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;
    dist[start] = 0; pq.push({0, start});
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (d > dist[u]) continue;
        for (auto [v, w] : adj[u])
            if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; pq.push({dist[v], v}); }
    }
    return dist;
}`,
  },
  {
    id: 'bfs', title: 'BFS Template', language: 'cpp', category: 'Graph',
    description: 'Breadth-first search with distance',
    code: `vector<int> bfs(int start, const vector<vector<int>>& adj) {
    int n = adj.size();
    vector<int> dist(n, -1);
    queue<int> q;
    dist[start] = 0; q.push(start);
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : adj[u]) if (dist[v] == -1) { dist[v] = dist[u] + 1; q.push(v); }
    }
    return dist;
}`,
  },
  {
    id: 'modpow', title: 'Modular Exponentiation', language: 'cpp', category: 'Math',
    description: 'Fast power mod',
    code: `long long power(long long base, long long exp, long long mod) {
    long long result = 1; base %= mod;
    while (exp > 0) {
        if (exp & 1) result = result * base % mod;
        base = base * base % mod;
        exp >>= 1;
    }
    return result;
}`,
  },
  {
    id: 'sieve', title: 'Sieve of Eratosthenes', language: 'cpp', category: 'Math',
    description: 'All primes up to n',
    code: `vector<bool> sieve(int n) {
    vector<bool> is_prime(n + 1, true);
    is_prime[0] = is_prime[1] = false;
    for (int i = 2; i * i <= n; i++)
        if (is_prime[i]) for (int j = i * i; j <= n; j += i) is_prime[j] = false;
    return is_prime;
}`,
  },
  {
    id: 'lca', title: 'Binary Lifting LCA', language: 'cpp', category: 'Graph',
    description: 'Lowest Common Ancestor in O(log n)',
    code: `struct LCA {
    int n, LOG; vector<vector<int>> up, adj; vector<int> depth;
    LCA(int n) : n(n), LOG(20), up(n, vector<int>(20, 0)), adj(n), depth(n, 0) {}
    void addEdge(int u, int v) { adj[u].push_back(v); adj[v].push_back(u); }
    void build(int root = 0) {
        function<void(int, int)> dfs = [&](int u, int p) {
            up[u][0] = p;
            for (int i = 1; i < LOG; i++) up[u][i] = up[up[u][i-1]][i-1];
            for (int v : adj[u]) if (v != p) { depth[v] = depth[u] + 1; dfs(v, u); }
        };
        dfs(root, root);
    }
    int lca(int u, int v) {
        if (depth[u] < depth[v]) swap(u, v);
        int diff = depth[u] - depth[v];
        for (int i = 0; i < LOG; i++) if ((diff >> i) & 1) u = up[u][i];
        if (u == v) return u;
        for (int i = LOG - 1; i >= 0; i--) if (up[u][i] != up[v][i]) { u = up[u][i]; v = up[v][i]; }
        return up[u][0];
    }
};`,
  },
  {
    id: 'trie', title: 'Trie', language: 'cpp', category: 'Data Structures',
    description: 'Prefix tree for strings',
    code: `struct Trie {
    struct Node { int children[26] = {}; bool end = false; };
    vector<Node> nodes{Node{}};
    void insert(const string& s) {
        int cur = 0;
        for (char c : s) {
            int i = c - 'a';
            if (!nodes[cur].children[i]) { nodes[cur].children[i] = nodes.size(); nodes.emplace_back(); }
            cur = nodes[cur].children[i];
        }
        nodes[cur].end = true;
    }
    bool search(const string& s) {
        int cur = 0;
        for (char c : s) { int i = c - 'a'; if (!nodes[cur].children[i]) return false; cur = nodes[cur].children[i]; }
        return nodes[cur].end;
    }
};`,
  },
  {
    id: 'combmod', title: 'nCr mod p', language: 'cpp', category: 'Math',
    description: 'Combinations with modular inverse',
    code: `const int MOD = 1e9 + 7, MAXN = 2e5 + 5;
long long fac[MAXN], inv_fac[MAXN];
long long power(long long b, long long e, long long m) {
    long long r = 1; b %= m;
    while (e > 0) { if (e & 1) r = r * b % m; b = b * b % m; e >>= 1; }
    return r;
}
void precompute() {
    fac[0] = 1;
    for (int i = 1; i < MAXN; i++) fac[i] = fac[i-1] * i % MOD;
    inv_fac[MAXN-1] = power(fac[MAXN-1], MOD-2, MOD);
    for (int i = MAXN-2; i >= 0; i--) inv_fac[i] = inv_fac[i+1] * (i+1) % MOD;
}
long long C(int n, int r) { return (n < r || r < 0) ? 0 : fac[n] % MOD * inv_fac[r] % MOD * inv_fac[n-r] % MOD; }`,
  },
  {
    id: 'sparse_table', title: 'Sparse Table (RMQ)', language: 'cpp', category: 'Data Structures',
    description: 'O(1) range minimum query',
    code: `struct SparseTable {
    vector<vector<int>> table; vector<int> log2_;
    SparseTable(const vector<int>& a) {
        int n = a.size(), K = __lg(n) + 1;
        table.assign(K, vector<int>(n));
        table[0] = a;
        for (int k = 1; k < K; k++)
            for (int i = 0; i + (1 << k) <= n; i++)
                table[k][i] = min(table[k-1][i], table[k-1][i + (1<<(k-1))]);
    }
    int query(int l, int r) {
        int k = __lg(r - l + 1);
        return min(table[k][l], table[k][r - (1<<k) + 1]);
    }
};`,
  },
  {
    id: 'topological', title: 'Topological Sort', language: 'cpp', category: 'Graph',
    description: "Kahn's algorithm",
    code: `vector<int> topSort(int n, const vector<vector<int>>& adj) {
    vector<int> indegree(n, 0), order;
    for (int u = 0; u < n; u++) for (int v : adj[u]) indegree[v]++;
    queue<int> q;
    for (int i = 0; i < n; i++) if (!indegree[i]) q.push(i);
    while (!q.empty()) {
        int u = q.front(); q.pop(); order.push_back(u);
        for (int v : adj[u]) if (--indegree[v] == 0) q.push(v);
    }
    return order; // if size != n, cycle exists
}`,
  },
];

interface SnippetPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (code: string) => void;
  language: Language;
}

export default function SnippetPalette({ isOpen, onClose, onInsert, language }: SnippetPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Load custom snippets from localStorage
  const customSnippets: Snippet[] = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('cphelper-snippets') || '[]');
    } catch { return []; }
  }, [isOpen]);

  const allSnippets = useMemo(
    () => [...BUILTIN_SNIPPETS, ...customSnippets],
    [customSnippets]
  );

  const categories = useMemo(
    () => [...new Set(allSnippets.map((s) => s.category))],
    [allSnippets]
  );

  const filtered = useMemo(() => {
    return allSnippets.filter((s) => {
      const matchesQuery = !query ||
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.description.toLowerCase().includes(query.toLowerCase()) ||
        s.category.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = !selectedCategory || s.category === selectedCategory;
      return matchesQuery && matchesCategory;
    });
  }, [allSnippets, query, selectedCategory]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setSelectedCategory(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, selectedCategory]);

  // Scroll selected into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const el = list.children[selectedIndex] as HTMLElement;
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleKey = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[selectedIndex]) {
          onInsert(filtered[selectedIndex].code);
          onClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      case 'Tab':
        e.preventDefault();
        const catIdx = selectedCategory ? categories.indexOf(selectedCategory) : -1;
        const nextCat = catIdx + 1 >= categories.length ? null : categories[catIdx + 1];
        setSelectedCategory(nextCat);
        break;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90]"
            onClick={onClose}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 z-[100] w-[580px] max-h-[65vh] bg-bg-primary border border-surface-border rounded-xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col"
            onKeyDown={handleKey}
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-border bg-bg-secondary/50">
              <Zap className="w-4 h-4 text-accent" />
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Snippet Palette</span>
              <div className="flex-1" />
              <kbd className="px-1.5 py-0.5 rounded bg-surface text-[10px] font-mono text-gray-500 border border-surface-border">
                Ctrl+Shift+S
              </kbd>
              <button onClick={onClose} className="p-1 rounded hover:bg-surface-hover text-gray-500 hover:text-gray-300 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Search */}
            <div className="relative px-3 py-2 border-b border-surface-border">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search snippets... (Tab to cycle categories)"
                className="w-full pl-8 pr-3 py-2 bg-surface rounded-lg border border-surface-border text-sm text-gray-200 placeholder-gray-600 focus:border-accent/50 transition-colors"
              />
            </div>

            {/* Category pills */}
            <div className="flex gap-1.5 px-3 py-2 border-b border-surface-border overflow-x-auto">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-[11px] font-medium transition-all shrink-0',
                  !selectedCategory
                    ? 'gradient-bg text-white'
                    : 'bg-surface text-gray-400 hover:text-gray-300'
                )}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[11px] font-medium transition-all shrink-0',
                    selectedCategory === cat
                      ? 'gradient-bg text-white'
                      : 'bg-surface text-gray-400 hover:text-gray-300'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Snippet list */}
            <div ref={listRef} className="flex-1 overflow-y-auto py-1 max-h-[380px]">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <BookOpen className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-xs">No snippets found</span>
                </div>
              ) : (
                filtered.map((snippet, i) => (
                  <button
                    key={snippet.id}
                    onClick={() => { onInsert(snippet.code); onClose(); }}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={cn(
                      'w-full flex items-start gap-3 px-3 py-2.5 text-left transition-all',
                      i === selectedIndex
                        ? 'bg-accent-muted border-l-2 border-accent'
                        : 'hover:bg-surface-hover border-l-2 border-transparent'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-200">{snippet.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface text-gray-500">{snippet.category}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 truncate">{snippet.description}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] text-gray-600">{getLanguageIcon(snippet.language)}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer hint */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-surface-border bg-bg-secondary/30 text-[10px] text-gray-500">
              <div className="flex items-center gap-3">
                <span>↑↓ Navigate</span>
                <span>↵ Insert</span>
                <span>Tab Categories</span>
                <span>Esc Close</span>
              </div>
              <span>{filtered.length} snippets</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
