'use strict';

const BSEARCH_CODE = {
  overview: `// Binary search on a SORTED array:
// look at the middle element, then recurse into
// only the half that can still contain x.
//
// Every call halves the range, so an array of n
// elements needs at most about log2(n) + 1 calls.
// 1,000,000 elements → at most 20 calls.`,
  search: `int bs(int a[], int lo, int hi, int x) {
    if (lo > hi)
        return -1;                     // empty range: not found
    int mid = lo + (hi - lo) / 2;
    if (a[mid] == x)
        return mid;                    // found it
    if (a[mid] < x)
        return bs(a, mid + 1, hi, x);  // search the right half
    return bs(a, lo, mid - 1, x);      // search the left half
}

int main(void) {
    int a[] = { ... };                 // must be sorted
    printf("%d\\n", bs(a, 0, N - 1, value));
}`,
};

class BSearch extends StackDS {
  constructor() {
    super();
    this.key = 'bsearch';
    this.name = 'Binary Search';
    this.about = 'Each call looks at the middle of a[lo..hi] and recurses into only one half, so the range halves every call. Greyed-out cells have been ruled out. The answer is passed straight back down the stack unchanged (tail recursion).';
    this.facts = [['Time', 'O(log n)'], ['Stack depth', 'O(log n)'], ['10 elements', '≤ 4 calls to find'], ['1,000,000 elements', '≤ 20 calls'], ['Requires', 'sorted array']];
    this.code = BSEARCH_CODE;
    this.placeholder = 'x (1-99)';
    this.controls = [{ op: 'search', label: 'bs(x)', arg: 'num', min: 1, max: 99 }];
    this.clear();
  }

  sample() { return Math.random() < 0.7 ? this.arr[rand(0, this.arr.length - 1)] : rand(1, 99); }
  stats() { return `stack depth: ${this.depth}` + (this.calls ? ` · calls: ${this.calls}` : ''); }
  clear() { this.arr = [3, 8, 15, 21, 27, 34, 42, 56, 63, 78]; this.reset(); }
  random() {
    const s = new Set();
    while (s.size < 10) s.add(rand(1, 99));
    this.arr = [...s].sort((a, b) => a - b);
    this.reset();
  }
  reset() { this.mainFrame(); this.frames[0].cls = ''; this.view = null; this.hit = -1; this.calls = 0; }
  finish() { super.finish(); this.view = null; }

  layout() {
    const nodes = [], edges = [];
    const W = 52, n = this.arr.length, left = -((n - 1) * W) / 2;
    const v = this.view;
    this.arr.forEach((val, i) => {
      let cls = 'val';
      if (i === this.hit) cls += ' found';
      else if (v && (i < v.lo || i > v.hi)) cls = 'garbage';
      else if (v && i === v.mid) cls += ' cmp';
      nodes.push({ id: 'a' + i, kind: 'cell', cls, x: left + i * W, y: 0, w: 46, h: 44, label: val, sub: `[${i}]` });
    });
    if (v) {
      const at = {};
      const add = (i, t) => { if (i >= 0 && i < n) (at[i] = at[i] || []).push(t); };
      add(v.lo, 'lo'); add(v.hi, 'hi');
      if (v.mid !== null) add(v.mid, 'mid');
      for (const i in at) nodes.push({ id: 'p' + at[i].join(), kind: 'tag', cls: 'alt', x: left + i * W, y: 62, label: at[i].join('=') });
      if (v.lo > v.hi) nodes.push({ id: 'empty', kind: 'tag', cls: 'bad', x: 0, y: 96, label: `lo ${v.lo} > hi ${v.hi}: empty range` });
    }
    nodes.push(...stackNodes(this.frames, left + (n - 1) * W + 180, 120));
    return { nodes, edges };
  }

  async search(x) {
    this.reset();
    this.frames[0].cls = 'cur';
    const n = this.arr.length;
    await this.step(14, `main calls bs(a, 0, ${n - 1}, ${x})`);
    const r = await this.bs(0, n - 1, x);
    this.view = null;
    await this.step(14, r >= 0 ? `found ${x} at index ${r} after ${this.calls} call${this.calls > 1 ? 's' : ''}` : `${x} is not in the array → -1`, r >= 0 ? 'ok' : 'err');
    App.out(`bs(a, 0, ${n - 1}, ${x}) = ${r}   ·   ${this.calls} call${this.calls > 1 ? 's' : ''}`);
  }

  async bs(lo, hi, x) {
    const f = this.push(`bs(a, ${lo}, ${hi}, ${x})`);
    this.calls++;
    this.view = { lo, hi, mid: null };
    await this.step(1, `call bs: search a[${lo}..${hi}] (${Math.max(hi - lo + 1, 0)} element${hi - lo === 0 ? '' : 's'})`);
    if (lo > hi) {
      f.ret = -1;
      await this.step(3, `lo > hi (${lo} > ${hi}): the range is empty, return -1`, 'err');
      this.pop();
      return -1;
    }
    const mid = lo + Math.floor((hi - lo) / 2);
    this.view.mid = mid;
    await this.step(4, `mid = ${lo} + (${hi} - ${lo}) / 2 = ${mid}`);
    const am = this.arr[mid];
    await this.step(5, `a[mid] == x → ${am} == ${x} → ${am === x}`);
    if (am === x) {
      this.hit = mid;
      f.ret = mid;
      await this.step(6, `found: return ${mid}`, 'ok');
      this.pop();
      return mid;
    }
    const right = am < x;
    await this.step(7, `a[mid] < x → ${am} < ${x} → ${right}`);
    const line = right ? 8 : 9;
    f.cls = 'path';
    await this.step(line, right ? `${x} can only be to the right: recurse on [${mid + 1}..${hi}]` : `${x} can only be to the left: recurse on [${lo}..${mid - 1}]`);
    const r = right ? await this.bs(mid + 1, hi, x) : await this.bs(lo, mid - 1, x);
    f.cls = 'cur';
    f.ret = r;
    this.view = { lo, hi, mid };
    await this.step(line, `passes ${r} straight back (tail call)`);
    this.pop();
    return r;
  }
}
