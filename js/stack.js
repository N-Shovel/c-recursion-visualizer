'use strict';

const STACK_CODE = {
  overview: `// A recursive function solves a problem by calling
// itself on a smaller version of the same problem.
//
// Every recursive function needs:
//   1. a BASE CASE that returns without recursing
//   2. a RECURSIVE CASE that moves toward the base case
//
// Each call gets its own stack frame with its own copy
// of the parameters. Frames pile up until the base case,
// then unwind one by one as each call returns.`,
  factorial: `int factorial(int n) {
    if (n <= 1)
        return 1;                 // base case
    return n * factorial(n - 1);  // recursive case
}

int main(void) {
    int r = factorial(value);
    printf("%d\\n", r);
}`,
  countdown: `void countdown(int n) {
    if (n == 0) {
        printf("Liftoff!\\n");
        return;
    }
    printf("%d\\n", n);       // print BEFORE the call
    countdown(n - 1);
}

int main(void) {
    countdown(value);
}`,
  countup: `void countup(int n) {
    if (n == 0)
        return;
    countup(n - 1);          // recurse FIRST
    printf("%d\\n", n);       // print on the way back up
}

int main(void) {
    countup(value);
}`,
  overflow: `int sum(int n) {
    // BUG: no base case!
    return n + sum(n - 1);
}

int main(void) {
    printf("%d\\n", sum(3));
}`,
};

class CallStack extends StackDS {
  constructor() {
    super();
    this.key = 'stack';
    this.name = 'Call Stack';
    this.about = 'Each call pushes a frame (drawn newest on top) with its own copy of n. Frames pile up until the base case, then unwind as each call returns to the one below. Countdown prints on the way down and countup prints on the way back up, so the same recursion produces opposite orders. Without a base case the frames never stop piling up.';
    this.facts = [['Each call', 'push a frame'], ['Each return', 'pop a frame'], ['factorial(n) frames', 'n'], ['Code before the call', 'runs going down'], ['Code after the call', 'runs coming up'], ['No base case', 'stack overflow']];
    this.code = STACK_CODE;
    this.placeholder = 'n (0-8)';
    this.noRandom = true;
    this.controls = [
      { op: 'factorial', label: 'factorial(n)', arg: 'num', min: 0, max: 8 },
      { op: 'countdown', label: 'countdown(n)', arg: 'num', min: 0, max: 8 },
      { op: 'countup', label: 'countup(n)', arg: 'num', min: 0, max: 8 },
      { sep: true },
      { op: 'overflow', label: 'no base case' },
    ];
    this.clear();
  }

  sample() { return rand(3, 5); }
  stats() { return `stack depth: ${this.depth}` + (this.maxDepth ? ` · max ${this.maxDepth}` : ''); }
  clear() { this.mainFrame(); this.frames[0].cls = ''; this.limit = false; this.maxDepth = 0; }
  random() { this.clear(); }
  finish() { super.finish(); for (const f of this.frames) for (const v of f.vars) v.cls = ''; }

  call(label, vars) {
    const f = this.push(label, { vars });
    this.maxDepth = Math.max(this.maxDepth, this.depth);
    return f;
  }
  print(text) {
    this.printed.push(text);
    App.out('stdout: ' + this.printed.join('  '));
  }

  layout() {
    const nodes = [], edges = [];
    const FW = 440, FH = 46, GAP = 56;
    this.frames.forEach((f, k) => {
      const y = -k * GAP;
      nodes.push({ id: 'f' + f.id, kind: 'cell', cls: 'frame ' + (f.cls || ''), x: 0, y, w: FW, h: FH, label: '' });
      nodes.push({ id: 'fh' + f.id, kind: 'tag', cls: 'alt', x: -FW / 2 + 14 + tagWidth(f.label) / 2, y, label: f.label });
      f.vars.forEach((v, j) => {
        nodes.push({ id: `v${f.id}.${v.name}`, kind: 'cell', cls: 'val wide ' + (v.cls || ''), x: 110 + j * 110, y, w: 100, h: 32, label: `${v.name} = ${v.val}` });
      });
      if (f.ret !== undefined) {
        const t = `return ${f.ret}`;
        nodes.push({ id: 'r' + f.id, kind: 'tag', cls: 'ok', x: FW / 2 + 14 + tagWidth(t) / 2, y, label: t });
      }
    });
    const top = -(this.frames.length - 1) * GAP - 48;
    if (this.limit) nodes.push({ id: 'limit', kind: 'tag', cls: 'bad', x: 0, y: top, label: '━━━━━━  stack limit (~8 MB) reached  ━━━━━━' });
    else nodes.push({ id: 'grow', kind: 'tag', cls: 'muted', x: 0, y: top, label: '↑ each call pushes a new frame on top' });
    return { nodes, edges };
  }

  /* ---------- factorial ---------- */
  async factorial(n) {
    this.clear();
    this.mainFrame([{ name: 'r', val: '?' }]);
    await this.step(8, `main calls factorial(${n})`);
    const res = await this.fact(n);
    const r = this.frames[0].vars[0];
    r.val = res;
    r.cls = 'found';
    await this.step(8, `r = ${res}. The stack is back to just main().`, 'ok');
    await this.step(9, `prints ${res}`);
    App.out(`factorial(${n}) = ${res}   ·   ${Math.max(n, 1)} call${n > 1 ? 's' : ''}, max depth ${this.maxDepth}`);
  }

  async fact(n) {
    const f = this.call(`factorial(${n})`, [{ name: 'n', val: n, cls: 'new' }]);
    await this.step(1, `call factorial(${n}) → new frame, depth ${this.depth}`);
    f.vars[0].cls = 'cmp';
    await this.step(2, `n <= 1 → ${n} <= 1 → ${n <= 1}`);
    f.vars[0].cls = '';
    if (n <= 1) {
      f.ret = 1;
      await this.step(3, 'base case: return 1 without calling again', 'ok');
      this.pop();
      return 1;
    }
    f.cls = 'path';
    await this.step(4, `needs factorial(${n - 1}) first, so this frame waits with n = ${n}`);
    const r = await this.fact(n - 1);
    f.cls = 'cur';
    f.ret = n * r;
    await this.step(4, `back in factorial(${n}): ${n} * ${r} = ${f.ret} → return ${f.ret}`, 'ok');
    this.pop();
    return f.ret;
  }

  /* ---------- countdown: work before the call ---------- */
  async countdown(n) {
    this.clear();
    this.printed = [];
    this.frames[0].cls = 'cur';
    await this.step(11, `main calls countdown(${n})`);
    await this.down(n);
    await this.step(11, `back in main. Printed on the way DOWN: ${this.printed.join(', ')}`, 'ok');
  }

  async down(n) {
    const f = this.call(`countdown(${n})`, [{ name: 'n', val: n, cls: 'new' }]);
    await this.step(1, `call countdown(${n}) → depth ${this.depth}`);
    f.vars[0].cls = 'cmp';
    await this.step(2, `n == 0 → ${n} == 0 → ${n === 0}`);
    f.vars[0].cls = '';
    if (n === 0) {
      this.print('Liftoff!');
      await this.step(3, 'base case: print "Liftoff!"', 'ok');
      await this.step(4, 'return: start unwinding');
      this.pop();
      return;
    }
    f.vars[0].cls = 'found';
    this.print(n);
    await this.step(6, `print ${n} BEFORE recursing`, 'ok');
    f.vars[0].cls = '';
    await this.step(7, `call countdown(${n - 1})`);
    await this.down(n - 1);
    await this.step(8, `countdown(${n}) has nothing left to do after the call → return`);
    this.pop();
  }

  /* ---------- countup: work after the call ---------- */
  async countup(n) {
    this.clear();
    this.printed = [];
    this.frames[0].cls = 'cur';
    await this.step(9, `main calls countup(${n})`);
    await this.up(n);
    await this.step(9, `back in main. Printed on the way UP: ${this.printed.join(', ') || '(nothing)'}`, 'ok');
  }

  async up(n) {
    const f = this.call(`countup(${n})`, [{ name: 'n', val: n, cls: 'new' }]);
    await this.step(1, `call countup(${n}) → depth ${this.depth}`);
    f.vars[0].cls = 'cmp';
    await this.step(2, `n == 0 → ${n} == 0 → ${n === 0}`);
    f.vars[0].cls = '';
    if (n === 0) {
      await this.step(3, 'base case: return without printing. Now the frames unwind.', 'ok');
      this.pop();
      return;
    }
    f.cls = 'path';
    await this.step(4, `recurse first: countup(${n - 1}). This frame waits; nothing printed yet.`);
    await this.up(n - 1);
    f.cls = 'cur';
    f.vars[0].cls = 'found';
    this.print(n);
    await this.step(5, `back in countup(${n}): now print ${n}`, 'ok');
    this.pop();
  }

  /* ---------- missing base case ---------- */
  async overflow() {
    this.clear();
    this.frames[0].cls = 'cur';
    await this.step(7, 'main calls sum(3)');
    const SHOW = 10;
    for (let n = 3; n > 3 - SHOW; n--) {
      const f = this.call(`sum(${n})`, [{ name: 'n', val: n, cls: 'new' }]);
      await this.step(1, `call sum(${n}) → depth ${this.depth}` + (n < 0 ? '. n is negative, and nothing stops it.' : ''), n < 0 ? 'warn' : '');
      f.vars[0].cls = '';
      await this.step(3, `needs sum(${n - 1}) before it can add ${n}`);
    }
    this.limit = true;
    const top = this.frames[this.frames.length - 1];
    top.cls = 'del';
    await this.step(3, '… about 100,000+ frames later the stack runs out of room', 'warn');
    for (const f of this.frames) if (f !== this.frames[0]) f.cls = 'del';
    await this.step(3, 'Segmentation fault (core dumped). Stack overflow: no base case means the calls never stop.', 'err');
    App.out('Segmentation fault (core dumped)');
  }
}
