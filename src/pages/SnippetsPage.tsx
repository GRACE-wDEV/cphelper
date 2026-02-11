import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Copy, Check, Trash2, BookOpen, Tag } from 'lucide-react';
import { Card, Button, Modal, Input, Badge } from '@/components/ui';
import { cn, generateId, getLanguageLabel, getLanguageIcon } from '@/utils';
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
    id: 'dsu',
    title: 'Disjoint Set Union (DSU)',
    language: 'cpp',
    category: 'Data Structures',
    description: 'Union-Find with path compression and union by rank',
    code: `struct DSU {
    vector<int> parent, rank_;
    DSU(int n) : parent(n), rank_(n, 0) {
        iota(parent.begin(), parent.end(), 0);
    }
    int find(int x) {
        return parent[x] == x ? x : parent[x] = find(parent[x]);
    }
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
    id: 'segtree',
    title: 'Segment Tree',
    language: 'cpp',
    category: 'Data Structures',
    description: 'Generic segment tree with point update and range query',
    code: `template<typename T>
struct SegTree {
    int n;
    vector<T> tree;
    SegTree(int n) : n(n), tree(4 * n, 0) {}
    
    void update(int node, int start, int end, int idx, T val) {
        if (start == end) { tree[node] = val; return; }
        int mid = (start + end) / 2;
        if (idx <= mid) update(2*node, start, mid, idx, val);
        else update(2*node+1, mid+1, end, idx, val);
        tree[node] = tree[2*node] + tree[2*node+1];
    }
    
    T query(int node, int start, int end, int l, int r) {
        if (r < start || end < l) return 0;
        if (l <= start && end <= r) return tree[node];
        int mid = (start + end) / 2;
        return query(2*node, start, mid, l, r) + query(2*node+1, mid+1, end, l, r);
    }
    
    void update(int idx, T val) { update(1, 0, n-1, idx, val); }
    T query(int l, int r) { return query(1, 0, n-1, l, r); }
};`,
  },
  {
    id: 'bfs',
    title: 'BFS Template',
    language: 'cpp',
    category: 'Graph',
    description: 'Breadth-first search with distance tracking',
    code: `vector<int> bfs(int start, const vector<vector<int>>& adj) {
    int n = adj.size();
    vector<int> dist(n, -1);
    queue<int> q;
    dist[start] = 0;
    q.push(start);
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : adj[u]) {
            if (dist[v] == -1) {
                dist[v] = dist[u] + 1;
                q.push(v);
            }
        }
    }
    return dist;
}`,
  },
  {
    id: 'dijkstra',
    title: 'Dijkstra\'s Algorithm',
    language: 'cpp',
    category: 'Graph',
    description: 'Shortest path with priority queue',
    code: `vector<long long> dijkstra(int start, const vector<vector<pair<int,long long>>>& adj) {
    int n = adj.size();
    vector<long long> dist(n, LLONG_MAX);
    priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;
    dist[start] = 0;
    pq.push({0, start});
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (d > dist[u]) continue;
        for (auto [v, w] : adj[u]) {
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});
            }
        }
    }
    return dist;
}`,
  },
  {
    id: 'modpow',
    title: 'Modular Exponentiation',
    language: 'cpp',
    category: 'Math',
    description: 'Fast power with modular arithmetic',
    code: `long long power(long long base, long long exp, long long mod) {
    long long result = 1;
    base %= mod;
    while (exp > 0) {
        if (exp & 1) result = result * base % mod;
        base = base * base % mod;
        exp >>= 1;
    }
    return result;
}`,
  },
  {
    id: 'sieve',
    title: 'Sieve of Eratosthenes',
    language: 'cpp',
    category: 'Math',
    description: 'Find all primes up to n',
    code: `vector<bool> sieve(int n) {
    vector<bool> is_prime(n + 1, true);
    is_prime[0] = is_prime[1] = false;
    for (int i = 2; i * i <= n; i++) {
        if (is_prime[i]) {
            for (int j = i * i; j <= n; j += i) {
                is_prime[j] = false;
            }
        }
    }
    return is_prime;
}`,
  },
  {
    id: 'binlift',
    title: 'Binary Lifting (LCA)',
    language: 'cpp',
    category: 'Tree',
    description: 'Lowest Common Ancestor with binary lifting',
    code: `const int LOG = 20;
int up[200005][LOG], depth[200005];

void dfs(int u, int p, const vector<vector<int>>& adj) {
    up[u][0] = p;
    for (int j = 1; j < LOG; j++)
        up[u][j] = up[up[u][j-1]][j-1];
    for (int v : adj[u]) if (v != p) {
        depth[v] = depth[u] + 1;
        dfs(v, u, adj);
    }
}

int lca(int a, int b) {
    if (depth[a] < depth[b]) swap(a, b);
    int diff = depth[a] - depth[b];
    for (int j = 0; j < LOG; j++)
        if ((diff >> j) & 1) a = up[a][j];
    if (a == b) return a;
    for (int j = LOG - 1; j >= 0; j--)
        if (up[a][j] != up[b][j]) {
            a = up[a][j];
            b = up[b][j];
        }
    return up[a][0];
}`,
  },
  {
    id: 'fenwick',
    title: 'Fenwick Tree (BIT)',
    language: 'cpp',
    category: 'Data Structures',
    description: 'Binary Indexed Tree for prefix sums',
    code: `struct BIT {
    int n;
    vector<long long> tree;
    BIT(int n) : n(n), tree(n + 1, 0) {}
    
    void update(int i, long long delta) {
        for (++i; i <= n; i += i & (-i))
            tree[i] += delta;
    }
    
    long long query(int i) {
        long long sum = 0;
        for (++i; i > 0; i -= i & (-i))
            sum += tree[i];
        return sum;
    }
    
    long long query(int l, int r) {
        return query(r) - (l > 0 ? query(l - 1) : 0);
    }
};`,
  },
];

export default function SnippetsPage() {
  const [customSnippets, setCustomSnippets] = useState<Snippet[]>(() => {
    const saved = localStorage.getItem('cphelper-snippets');
    return saved ? JSON.parse(saved) : [];
  });
  const [showNew, setShowNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [copied, setCopied] = useState<string | null>(null);

  const allSnippets = [...BUILTIN_SNIPPETS, ...customSnippets];
  const categories = [...new Set(allSnippets.map((s) => s.category))];

  const filtered = allSnippets.filter((s) => {
    const matchSearch =
      !searchQuery ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = categoryFilter === 'all' || s.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const addSnippet = (snippet: Omit<Snippet, 'id'>) => {
    const newSnippets = [...customSnippets, { ...snippet, id: generateId() }];
    setCustomSnippets(newSnippets);
    localStorage.setItem('cphelper-snippets', JSON.stringify(newSnippets));
  };

  const deleteSnippet = (id: string) => {
    const newSnippets = customSnippets.filter((s) => s.id !== id);
    setCustomSnippets(newSnippets);
    localStorage.setItem('cphelper-snippets', JSON.stringify(newSnippets));
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-bold text-gray-200 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-green-400" />
              Snippet Library
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Common algorithms & data structures ready to use
            </p>
          </div>
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="w-3 h-3" /> Add Snippet
          </Button>
        </div>

        {/* Search & filter */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Search snippets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="flex items-center gap-1 p-1 bg-surface rounded-lg">
            <button
              onClick={() => setCategoryFilter('all')}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                categoryFilter === 'all'
                  ? 'gradient-bg text-white'
                  : 'text-gray-400 hover:text-gray-200'
              )}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  categoryFilter === cat
                    ? 'gradient-bg text-white'
                    : 'text-gray-400 hover:text-gray-200'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Snippets grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map((snippet, idx) => (
            <motion.div
              key={snippet.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <Card className="h-full">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-medium text-gray-200">{snippet.title}</h3>
                    <p className="text-[11px] text-gray-500">{snippet.description}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge>{snippet.category}</Badge>
                    <Badge>
                      {getLanguageIcon(snippet.language)} {getLanguageLabel(snippet.language)}
                    </Badge>
                  </div>
                </div>

                <pre className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-surface-border text-[10px] text-gray-400 font-mono overflow-x-auto max-h-40 mb-3">
                  {snippet.code}
                </pre>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(snippet.code, snippet.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-gray-400 hover:text-gray-200 hover:bg-surface-hover transition-colors"
                  >
                    {copied === snippet.id ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    Copy
                  </button>
                  {!BUILTIN_SNIPPETS.find((b) => b.id === snippet.id) && (
                    <button
                      onClick={() => deleteSnippet(snippet.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Add Snippet Modal */}
        <AddSnippetModal
          isOpen={showNew}
          onClose={() => setShowNew(false)}
          onAdd={addSnippet}
        />
      </div>
    </div>
  );
}

function AddSnippetModal({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (snippet: Omit<Snippet, 'id'>) => void;
}) {
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState<Language>('cpp');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');

  const handleSubmit = () => {
    if (!title.trim() || !code.trim()) return;
    onAdd({
      title: title.trim(),
      language,
      category: category.trim() || 'Custom',
      description: description.trim(),
      code,
    });
    setTitle('');
    setCategory('');
    setDescription('');
    setCode('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Snippet" maxWidth="max-w-xl">
      <div className="space-y-4">
        <Input
          label="Title"
          placeholder="e.g., KMP String Matching"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-400">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-border text-sm text-gray-200"
            >
              <option value="cpp">C++</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="javascript">JavaScript</option>
            </select>
          </div>
          <Input label="Category" placeholder="e.g., Graph" value={category} onChange={(e) => setCategory(e.target.value)} />
          <Input label="Description" placeholder="Short desc" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-400">Code</label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your code..."
            rows={12}
            className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-surface-border text-xs text-gray-300 font-mono resize-y placeholder-gray-600"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || !code.trim()}>
            Save Snippet
          </Button>
        </div>
      </div>
    </Modal>
  );
}
