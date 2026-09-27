'use strict';

const ARRAYS_CODE = {
  overview: `// Arrays and strings recurse by shrinking the range:
//
//   sum(arr, n)       = sum(arr, n - 1) + arr[n - 1]
//   isPal(s, lo, hi)  = s[lo] == s[hi] && isPal(s, lo + 1, hi - 1)
//
// sum does its work AFTER the call returns (it still
// needs to add arr[n - 1]). isPal returns the inner
// call's answer unchanged: that is TAIL recursion, so
// a compiler can turn it into a plain loop.`,
  sum: `int sum(int arr[], int n) {
    if (n == 0)
        return 0;                     // empty array
    int rest = sum(arr, n - 1);       // sum of the first n - 1
    return rest + arr[n - 1];         // plus the last one
}

int main(void) {
    int arr[] = { ... };
    printf("%d\\n", sum(arr, N));
}`,
  palindrome: `int isPal(const char *s, int lo, int hi) {
    if (lo >= hi)
        return 1;                     // 0 or 1 chars left
    if (s[lo] != s[hi])
        return 0;                     // mismatch
    return isPal(s, lo + 1, hi - 1);  // check the inside
}

int main(void) {
    char s[] = "value";
    printf("%d\\n", isPal(s, 0, strlen(s) - 1));
}`,
};

const WORDS = ['racecar', 'level', 'rotor', 'noon', 'kayak', 'banana', 'hello', 'abcba', 'stats', 'recursion'];

class ArraysRec extends StackDS {
  constructor() {
    super();
    this.key = 'arrays';
    this.name = 'Arrays & Strings';
    this.about = 'Array recursion works on a smaller range each call. sum(arr, n) waits for the sum of the first n − 1 elements, then adds the last one on the way back up. isPal compares the two ends and recurses on the inside; it returns the inner answer unchanged, which makes it tail-recursive.';
    this.facts = [['sum(arr, n) calls', 'n + 1'], ['sum time / stack', 'O(n) / O(n)'], ['isPal calls', '≤ len / 2 + 1'], ['isPal time', 'O(n)'], ['Tail call', 'isPal: yes · sum: no']];
    this.code = ARRAYS_CODE;
    this.inputType = 'text';
    this.placeholder = 'word';
    this.controls = [
      { op: 'sum', label: 'sum(arr, n)' },
      { sep: true },
      { op: 'palindrome', label: 'isPal(word)', arg: 'text' },
    ];
    this.clear();
  }

  sample() { return WORDS[rand(0, WORDS.length - 1)]; }
  stats() { return `stack depth: ${this.depth}`; }
  clear() { this.arr = [3, 7, 2, 9, 4, 6]; this.reset('sum'); }
  random() { this.arr = Array.from({ length: rand(4, 7) }, () => rand(1, 20)); this.reset('sum'); }
  reset(mode) {
    this.mode = mode;
    this.mainFrame();
    this.frames[0].cls = '';
    this.cells = [];
    this.lohi = null;
  }
  finish() { super.finish(); this.cells = []; this.lohi = null; }

  layout() {
    const nodes = [], edges = [];
    const items = this.mode === 'pal' ? [...this.word] : this.arr;
    const W = 50, n = items.length, left = -((n - 1) * W) / 2;
    items.forEach((v, i) => {
      nodes.push({
        id: `${this.mode}${i}`, kind: 'cell', cls: (this.mode === 'pal' ? 'byte ' : 'val ') + (this.cells[i] || ''),
        x: left + i * W, y: 0, w: 44, h: 44, label: this.mode === 'pal' ? `'${v}'` : v, sub: `[${i}]`,
      });
    });
    if (this.lohi) {
      const [lo, hi] = this.lohi;
      const tags = lo === hi ? [[lo, 'lo = hi']] : [[lo, 'lo'], [hi, 'hi']];
      for (const [i, t] of tags) if (i >= 0 && i < n) nodes.push({ id: 'p-' + t, kind: 'tag', cls: 'alt', x: left + i * W, y: 62, label: t });
    }
    nodes.push({ id: 'arr-name', kind: 'tag', cls: 'muted', x: left - 30 - 30, y: 0, label: this.mode === 'pal' ? 's' : 'arr' });
    nodes.push(...stackNodes(this.frames, left + (n - 1) * W + 190, 120));
    return { nodes, edges };
  }

  /* ---------- sum ---------- */
  async sum() {
    this.reset('sum');
    this.frames[0].cls = 'cur';
    const N = this.arr.length;
    await this.step(10, `main calls sum(arr, ${N}) on {${this.arr.join(', ')}}`);
    const r = await this.sumCall(N);
    this.cells = this.arr.map(() => 'found');
    await this.step(10, `sum = ${r}. The stack is back to main().`, 'ok');
    App.out(`sum(arr, ${N}) = ${r}   ·   ${N + 1} calls`);
  }

  async sumCall(n) {
    const f = this.push(`sum(arr, ${n})`);
    this.cells = this.arr.map((_, i) => (i < n ? 'path' : ''));
    await this.step(1, `call sum(arr, ${n}): add up arr[0..${n - 1}]` + (n === 0 ? ' (nothing)' : ''));
    if (n === 0) {
      f.ret = 0;
      await this.step(3, 'n == 0: base case, return 0', 'ok');
      this.pop();
      return 0;
    }
    f.cls = 'path';
    await this.step(4, `n = ${n}: first get the sum of the first ${n - 1}`);
    const rest = await this.sumCall(n - 1);
    f.cls = 'cur';
    this.cells = this.arr.map((_, i) => (i < n - 1 ? 'found' : i === n - 1 ? 'cmp' : ''));
    f.ret = rest + this.arr[n - 1];
    await this.step(5, `rest = ${rest}, plus arr[${n - 1}] = ${this.arr[n - 1]} → return ${f.ret}`, 'ok');
    this.pop();
    return f.ret;
  }

  /* ---------- palindrome ---------- */
  async palindrome(word) {
    this.word = word.toLowerCase();
    this.reset('pal');
    this.frames[0].cls = 'cur';
    const hi = this.word.length - 1;
    await this.step(11, `main calls isPal(s, 0, ${hi}) on "${this.word}"`);
    const r = await this.palCall(0, hi);
    this.lohi = null;
    await this.step(11, `isPal returned ${r}: "${this.word}" ${r ? 'is' : 'is not'} a palindrome`, r ? 'ok' : 'err');
    App.out(`isPal("${this.word}") = ${r}`);
  }

  async palCall(lo, hi) {
    const f = this.push(`isPal(s, ${lo}, ${hi})`);
    const base = () => [...this.word].map((_, i) => (i < lo || i > hi ? 'found' : ''));
    this.cells = base();
    this.lohi = [lo, hi];
    await this.step(1, `call isPal(s, ${lo}, ${hi}): check s[${lo}..${hi}]`);
    if (lo >= hi) {
      f.ret = 1;
      await this.step(3, `lo >= hi (${lo} >= ${hi}): ${hi < lo ? 'nothing' : 'one char'} left to compare, return 1`, 'ok');
      this.pop();
      return 1;
    }
    const a = this.word[lo], b = this.word[hi];
    this.cells = base();
    this.cells[lo] = this.cells[hi] = 'cmp';
    await this.step(4, `s[${lo}] != s[${hi}] → '${a}' != '${b}' → ${a !== b}`);
    if (a !== b) {
      this.cells[lo] = this.cells[hi] = 'del';
      f.ret = 0;
      await this.step(5, 'mismatch: return 0', 'err');
      this.pop();
      return 0;
    }
    this.cells[lo] = this.cells[hi] = 'found';
    f.cls = 'path';
    await this.step(6, `'${a}' matches. Check the inside: isPal(s, ${lo + 1}, ${hi - 1})`);
    const r = await this.palCall(lo + 1, hi - 1);
    f.cls = 'cur';
    f.ret = r;
    this.lohi = [lo, hi];
    await this.step(6, `passes ${r} straight back: nothing left to do after the call (tail call)`);
    this.pop();
    return r;
  }
}
