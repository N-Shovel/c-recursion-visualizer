'use strict';

const HANOI_CODE = {
  overview: `// Tower of Hanoi: move a stack of n disks from A to C.
//   - move one disk at a time
//   - never put a bigger disk on a smaller one
//
// The recursive idea: to move n disks from A to C,
//   1. move the top n - 1 out of the way (A → B)
//   2. move the biggest disk            (A → C)
//   3. move the n - 1 back on top of it (B → C)
//
// That takes 2^n - 1 moves.`,
  hanoi: `void hanoi(int n, char from, char to, char via) {
    if (n == 1) {
        printf("disk 1: %c -> %c\\n", from, to);
        return;
    }
    hanoi(n - 1, from, via, to);   // park n-1 disks on via
    printf("disk %d: %c -> %c\\n", n, from, to);
    hanoi(n - 1, via, to, from);   // stack them back on top
}

int main(void) {
    hanoi(value, 'A', 'C', 'B');
}`,
};

const PEGS = ['A', 'B', 'C'];

class Hanoi extends StackDS {
  constructor() {
    super();
    this.key = 'hanoi';
    this.name = 'Tower of Hanoi';
    this.about = 'hanoi(n) trusts that hanoi(n − 1) already works: park the top n − 1 disks on the spare peg, move the biggest disk, then bring the n − 1 back on top. The call stack on the right shows which sub-problem is being solved right now.';
    this.facts = [['Moves', '2ⁿ − 1'], ['Calls', '2ⁿ − 1'], ['Stack depth', 'n'], ['Time', 'O(2ⁿ)'], ['4 disks', '15 moves'], ['64 disks', '≈ 1.8 × 10¹⁹ moves']];
    this.code = HANOI_CODE;
    this.placeholder = 'n (1-4)';
    this.noRandom = true;
    this.controls = [{ op: 'hanoi', label: 'hanoi(n)', arg: 'num', min: 1, max: 4 }];
    this.clear();
  }

  sample() { return 3; }
  stats() { return `moves: ${this.moves}/${2 ** this.n - 1} · stack depth: ${this.depth}`; }
  clear() { this.reset(3); }
  random() { this.clear(); }
  reset(n) {
    this.n = n;
    this.pegs = [Array.from({ length: n }, (_, i) => n - i), [], []];
    this.moves = 0;
    this.moving = null;
    this.mainFrame();
    this.frames[0].cls = '';
  }
  finish() { super.finish(); this.moving = null; }

  layout() {
    const nodes = [], edges = [];
    const GAP = 210, BASE = 70, DH = 24;
    nodes.push({ id: 'base', kind: 'cell', cls: 'frame', x: 0, y: BASE + 5, w: 3 * GAP, h: 10, label: '' });
    PEGS.forEach((p, i) => {
      const x = (i - 1) * GAP;
      nodes.push({ id: 'rod' + p, kind: 'cell', cls: 'frame', x, y: BASE - 70, w: 10, h: 140, label: '' });
      nodes.push({ id: 'peg' + p, kind: 'tag', cls: 'alt', x, y: BASE + 30, label: p });
    });
    this.pegs.forEach((stack, i) => {
      stack.forEach((d, k) => {
        nodes.push({
          id: 'disk' + d, kind: 'cell', cls: 'val ' + (d === this.moving ? 'cur' : ''),
          x: (i - 1) * GAP, y: BASE - DH / 2 - k * DH, w: 40 + d * 30, h: DH - 2, label: d,
        });
      });
    });
    nodes.push(...stackNodes(this.frames, 1.5 * GAP + 150, BASE));
    return { nodes, edges };
  }

  async hanoi(n) {
    this.reset(n);
    this.frames[0].cls = 'cur';
    await this.step(12, `main calls hanoi(${n}, 'A', 'C', 'B'): move ${n} disk${n > 1 ? 's' : ''} from A to C`);
    await this.h(n, 0, 2, 1);
    await this.step(12, `done: ${this.moves} moves = 2^${n} - 1`, 'ok');
    App.out(`${this.moves} move${this.moves > 1 ? "s" : ""} for ${n} disk${n > 1 ? 's' : ''}   (2^${n} - 1 = ${2 ** n - 1})`);
  }

  async h(n, from, to, via) {
    const [F, T, V] = [PEGS[from], PEGS[to], PEGS[via]];
    const f = this.push(`hanoi(${n}, ${F}, ${T}, ${V})`);
    await this.step(1, `call: move ${n} disk${n > 1 ? 's' : ''} from ${F} to ${T}, using ${V} as the spare`);
    if (n === 1) {
      await this.move(1, from, to, 3, 'n == 1: base case, just move it. ');
      this.pop();
      return;
    }
    f.cls = 'path';
    await this.step(6, `step 1: park the top ${n - 1} disk${n > 2 ? 's' : ''} on ${V}`);
    await this.h(n - 1, from, via, to);
    f.cls = 'cur';
    await this.move(n, from, to, 7, `step 2: ${F} now only holds disk ${n} on top. `);
    f.cls = 'path';
    await this.step(8, `step 3: bring the ${n - 1} disk${n > 2 ? 's' : ''} from ${V} back on top of disk ${n}`);
    await this.h(n - 1, via, to, from);
    f.cls = 'cur';
    await this.step(9, `hanoi(${n}, ${F}, ${T}, ${V}) is done → return`);
    this.pop();
  }

  async move(d, from, to, line, why) {
    this.pegs[from].pop();
    this.pegs[to].push(d);
    this.moves++;
    this.moving = d;
    App.out(`move ${this.moves}: disk ${d}  ${PEGS[from]} → ${PEGS[to]}`);
    await this.step(line, `${why}Move ${this.moves}: disk ${d} ${PEGS[from]} → ${PEGS[to]}`, 'ok');
    this.moving = null;
  }
}
