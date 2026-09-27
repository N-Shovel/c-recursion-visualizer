'use strict';

const FIB_CODE = {
  overview: `// Fibonacci: 0, 1, 1, 2, 3, 5, 8, 13, 21, ...
//   fib(0) = 0, fib(1) = 1
//   fib(n) = fib(n - 1) + fib(n - 2)
//
// Each call makes TWO more calls, so the calls form
// a tree. The naive version recomputes the same
// values again and again: O(2^n) calls.
//
// Memoization stores each answer the first time,
// so every fib(k) is computed once: O(n) calls.`,
  naive: `int fib(int n) {
    if (n < 2)
        return n;                  // fib(0) = 0, fib(1) = 1
    int a = fib(n - 1);
    int b = fib(n - 2);
    return a + b;
}

int main(void) {
    printf("%d\\n", fib(value));
}`,
  memo: `int memo[50];                      // -1 = not computed yet

int fib(int n) {
    if (n < 2)
        return n;
    if (memo[n] != -1)
        return memo[n];            // cache hit: no recursion
    int a = fib(n - 1);
    int b = fib(n - 2);
    return memo[n] = a + b;        // remember the answer
}

int main(void) {
    memset(memo, -1, sizeof memo);
    printf("%d\\n", fib(value));
}`,
};

class Fib extends DS {
  constructor() {
    super();
    this.key = 'fib';
    this.name = 'Fibonacci';
    this.about = 'Every call to fib(n) makes two more calls, so the calls form a tree. The yellow node is running and grey ones are waiting on the stack, so the path from the root to the yellow node is the call stack. Purple nodes are wasted work in the naive version (a value already computed elsewhere) and cache hits in the memoized version.';
    this.facts = [['Naive calls', 'O(2ⁿ)'], ['fib(n) naive calls', '2·fib(n+1) − 1'], ['Memoized calls', 'O(n)'], ['Max stack depth', 'n'], ['Extra memory (memo)', 'O(n)']];
    this.code = FIB_CODE;
    this.placeholder = 'n';
    this.noRandom = true;
    this.controls = [
      { op: 'naive', label: 'fib(n)', arg: 'num', min: 0, max: 6 },
      { op: 'memo', label: 'memo fib(n)', arg: 'num', min: 0, max: 12 },
    ];
    this.clear();
  }

  sample(ctl) { return ctl.op === 'naive' ? rand(4, 5) : rand(6, 9); }
  stats() { return `calls: ${this.calls} · depth: ${this.depth}` + (this.dups ? ` · repeated: ${this.dups}` : ''); }
  clear() { this.root = null; this.memoArr = null; this.hot = {}; this.calls = 0; this.depth = 0; this.dups = 0; }
  random() { this.clear(); }
  finish() {
    this.hot = {};
    const walk = n => { if (!n) return; if (n.cls !== 'visit' && n.cls !== 'found') n.cls = ''; n.kids.forEach(walk); };
    walk(this.root);
  }

  layout() {
    const spec = treeSpec(this.root, { dy: 74 });
    if (!spec.nodes.length) {
      spec.nodes.push({ id: 'hint', kind: 'tag', cls: 'muted', x: 0, y: 0, label: 'enter n and run fib(n) or memo fib(n)' });
    }
    if (this.memoArr) {
      const n = this.memoArr.length, W = 50, left = -((n - 3) * W) / 2;
      for (let i = 2; i < n; i++) {
        const v = this.memoArr[i];
        spec.nodes.push({
          id: 'm' + i, kind: 'cell', cls: 'val ' + (this.hot[i] || ''), x: left + (i - 2) * W, y: -100,
          w: 44, h: 36, label: v, sub: `[${i}]`, subDy: -28,
        });
      }
      if (n > 2) spec.nodes.push({ id: 'm-name', kind: 'tag', cls: 'muted', x: left - 62, y: -100, label: 'memo' });
    }
    return spec;
  }

  node(parent, n) {
    const node = { id: nextId(), label: `fib(${n})`, kids: [], cls: 'cur' };
    if (parent) { parent.kids.push(node); parent.cls = 'path'; } else this.root = node;
    this.calls++;
    this.depth++;
    return node;
  }
  done(node, n, r) {
    node.label = `fib(${n})=${r}`;
    this.depth--;
  }

  /* ---------- naive ---------- */
  async naive(n) {
    this.clear();
    this.seen = new Set();
    const r = await this.call(null, n);
    App.out(`fib(${n}) = ${r}   ·   ${this.calls} calls, ${this.dups} of them repeated work`);
    log(`${this.calls} calls in total. ${this.dups} calls recomputed a value that was already known.`, this.dups ? 'warn' : 'ok');
  }

  async call(parent, n) {
    const node = this.node(parent, n);
    const dup = n >= 2 && this.seen.has(n);
    if (dup) this.dups++;
    await this.step(1, `call fib(${n}), depth ${this.depth}` + (dup ? `. fib(${n}) was already computed, but naive recursion does it all again.` : ''), dup ? 'warn' : '');
    let r;
    if (n < 2) {
      r = n;
      this.done(node, n, r);
      node.cls = 'cmp';
      await this.step(3, `n < 2: base case, return ${n}`, 'ok');
    } else {
      node.cls = 'path';
      const a = await this.call(node, n - 1);
      node.cls = 'cur';
      await this.step(4, `back in fib(${n}): a = ${a}. Now call fib(${n - 2}).`);
      node.cls = 'path';
      const b = await this.call(node, n - 2);
      r = a + b;
      this.done(node, n, r);
      node.cls = 'cur';
      await this.step(6, `back in fib(${n}): b = ${b} → return ${a} + ${b} = ${r}`, 'ok');
      this.seen.add(n);
    }
    node.cls = dup ? 'visit' : '';
    return r;
  }

  /* ---------- memoized ---------- */
  async memo(n) {
    this.clear();
    this.memoArr = Array(Math.max(n + 1, 2)).fill(-1);
    if (n >= 2) await this.step(15, `memo[2..${n}] = -1: nothing computed yet`);
    const r = await this.mcall(null, n);
    App.out(`fib(${n}) = ${r}   ·   ${this.calls} call${this.calls > 1 ? "s" : ""} (naive needs ${2 * fibNum(n + 1) - 1})`);
    log(`Only ${this.calls} calls: each fib(k) was computed once and then read from memo[].`, 'ok');
  }

  async mcall(parent, n) {
    const node = this.node(parent, n);
    this.hot = {};
    await this.step(3, `call fib(${n}), depth ${this.depth}`);
    let r;
    if (n < 2) {
      r = n;
      this.done(node, n, r);
      node.cls = 'cmp';
      await this.step(5, `n < 2: base case, return ${n}`, 'ok');
      node.cls = '';
      return r;
    }
    this.hot = { [n]: 'cmp' };
    const m = this.memoArr[n];
    await this.step(6, `memo[${n}] != -1 → ${m} != -1 → ${m !== -1}`);
    if (m !== -1) {
      this.done(node, n, m);
      node.cls = 'visit';
      this.hot = { [n]: 'visit' };
      await this.step(7, `cache hit: return memo[${n}] = ${m}, no recursion needed`, 'ok');
      this.hot = {};
      return m;
    }
    this.hot = {};
    node.cls = 'path';
    const a = await this.mcall(node, n - 1);
    node.cls = 'cur';
    this.hot = {};
    await this.step(8, `back in fib(${n}): a = ${a}. Now call fib(${n - 2}).`);
    node.cls = 'path';
    const b = await this.mcall(node, n - 2);
    r = a + b;
    this.memoArr[n] = r;
    this.done(node, n, r);
    node.cls = 'cur';
    this.hot = { [n]: 'new' };
    await this.step(10, `memo[${n}] = ${a} + ${b} = ${r}, then return it`, 'ok');
    this.hot = {};
    node.cls = '';
    return r;
  }
}

function fibNum(n) { let a = 0, b = 1; for (let i = 0; i < n; i++) [a, b] = [b, a + b]; return a; }
