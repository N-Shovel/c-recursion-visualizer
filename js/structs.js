'use strict';

const STRUCTS_CODE = {
  overview: `// A struct that holds a pointer to its own type is
// recursive data: a list is a node followed by a
// smaller list, and a tree is a node with two smaller
// trees. Recursive functions follow the same shape:
//
//   base case       the pointer is NULL (empty list / tree)
//   recursive case  handle this node, then recurse on
//                   p->next, or on root->left / root->right
//
// p->val is shorthand for (*p).val.

struct Node {                 // singly linked list
    int val;
    struct Node *next;
};

struct TNode {                // binary search tree
    int val;
    struct TNode *left, *right;
};`,
  length: `int length(struct Node *p) {
    if (p == NULL)
        return 0;                    // empty list
    return 1 + length(p->next);      // this node + the rest
}

int main(void) {
    struct Node *head = ...;         // the list on screen
    printf("%d\\n", length(head));
}`,
  printReverse: `void printReverse(struct Node *p) {
    if (p == NULL)
        return;                      // nothing left to print
    printReverse(p->next);           // print the rest first
    printf("%d ", p->val);           // then this node
}

int main(void) {
    printReverse(head);              // prints the list backwards
}`,
  insert: `struct TNode *insert(struct TNode *root, int x) {
    if (root == NULL) {
        struct TNode *n = malloc(sizeof *n);
        n->val = x;
        n->left = n->right = NULL;
        return n;                          // the new leaf
    }
    if (x < root->val)
        root->left = insert(root->left, x);
    else if (x > root->val)
        root->right = insert(root->right, x);
    return root;                           // same root, updated subtree
}

int main(void) {
    root = insert(root, value);
}`,
  height: `int height(struct TNode *root) {
    if (root == NULL)
        return 0;                          // empty tree
    int l = height(root->left);
    int r = height(root->right);
    return 1 + (l > r ? l : r);            // taller side + this node
}

int main(void) {
    printf("%d\\n", height(root));
}`,
  inorder: `void inorder(struct TNode *root) {
    if (root == NULL)
        return;
    inorder(root->left);                   // smaller values first
    printf("%d ", root->val);              // then this node
    inorder(root->right);                  // then the larger values
}

int main(void) {
    inorder(root);                         // prints in sorted order
}`,
};

const TREE_MAX = 15;

class StructsRec extends StackDS {
  constructor() {
    super();
    this.key = 'structs';
    this.name = 'Structs';
    this.about = 'A struct that points to its own type is recursive data, so the recursion follows the pointers: each call handles one node and passes p->next (or root->left and root->right) to the next call, until it reaches NULL. Addresses above the nodes match the pointers in the call stack. insert returns the (possibly new) subtree root, and each caller stores it back into its left or right field.';
    this.facts = [['Base case', 'pointer == NULL'], ['length / printReverse', 'O(n) time, O(n) stack'], ['Tree calls (n nodes)', '2n + 1 (with NULLs)'], ['height / inorder', 'O(n)'], ['BST insert', 'O(h), h = height'], ['p->val', '(*p).val']];
    this.code = STRUCTS_CODE;
    this.placeholder = 'x (1-99)';
    this.controls = [
      { op: 'length', label: 'length(head)' },
      { op: 'printReverse', label: 'printReverse(head)' },
      { sep: true },
      { op: 'insert', label: 'insert(root, x)', arg: 'num', min: 1, max: 99 },
      { op: 'height', label: 'height(root)' },
      { op: 'inorder', label: 'inorder(root)' },
    ];
    this.mode = 'list';
    this.build([3, 7, 1, 9], [40, 20, 60, 10, 30, 70]);
  }

  /* ---------- data ---------- */
  alloc() { const a = this.heap; this.heap += 0x20; return a; }
  build(listVals, treeVals) {
    this.heap = 0x5a10;
    this.list = listVals.map(val => ({ id: nextId(), val, addr: this.alloc() }));
    this.root = null;
    for (const v of treeVals) this.root = this.bstAdd(this.root, v);
    this.mainFrame();
    this.frames[0].cls = '';
  }
  bstAdd(n, v) {
    if (!n) return { id: nextId(), val: v, addr: this.alloc(), left: null, right: null };
    if (v < n.val) n.left = this.bstAdd(n.left, v);
    else if (v > n.val) n.right = this.bstAdd(n.right, v);
    return n;
  }
  treeVals(n = this.root, out = []) {
    if (n) { this.treeVals(n.left, out); out.push(n.val); this.treeVals(n.right, out); }
    return out;
  }

  sample() {
    const have = new Set(this.treeVals());
    let v;
    do v = rand(1, 99); while (have.has(v));
    return v;
  }
  stats() {
    const size = this.mode === 'list' ? `list: ${this.list.length} nodes` : `tree: ${this.treeVals().length} nodes`;
    return `${size} · stack depth: ${this.depth}`;
  }
  clear() { this.build([3, 7, 1, 9], []); }
  random() {
    const vals = new Set();
    const n = rand(5, 7);
    while (vals.size < n) vals.add(rand(1, 99));
    this.build(Array.from({ length: rand(3, 6) }, () => rand(1, 20)), [...vals]);
  }
  finish() { super.finish(); this.p = null; this.nullAt = null; this.pending = null; }

  begin(mode) {
    this.mode = mode;
    this.printed = [];
    this.mainFrame();
  }
  print(v) {
    this.printed.push(v);
    App.out('stdout: ' + this.printed.join(' '));
  }
  where(parent, side) { return parent ? `${parent.val}'s ${side} child` : 'the root'; }

  /* ---------- layout ---------- */
  layout() { return this.mode === 'list' ? this.listLayout() : this.treeLayout(); }

  listLayout() {
    const nodes = [], edges = [];
    const GAP = 150, n = this.list.length, left = -((n - 1) * GAP) / 2;
    this.list.forEach((nd, i) => {
      const next = this.list[i + 1];
      nodes.push({
        id: 'L' + nd.id, kind: 'll', cls: this.m['L' + nd.id] || '', x: left + i * GAP, y: 0,
        w: 112, h: 44, dataW: 44, label: nd.val, ptr: next ? hex(next.addr) : 'NULL', sub: hex(nd.addr),
      });
      if (next) edges.push({ from: 'L' + nd.id, to: 'L' + next.id, cls: 'ptr', arrow: true });
    });
    const headX = left - 130;
    nodes.push({ id: 'head', kind: 'tag', cls: 'alt', x: headX, y: 0, label: n ? 'head' : 'head = NULL' });
    if (n) edges.push({ from: 'head', to: 'L' + this.list[0].id, cls: 'ptr', arrow: true });
    if (this.p !== null && this.p !== undefined) {
      const x = left + this.p * GAP;
      if (this.p >= n) nodes.push({ id: 'lnull', kind: 'tag', cls: 'cmp', x: n ? x - 20 : headX, y: n ? 0 : 36, label: 'NULL' });
      nodes.push({ id: 'p', kind: 'tag', cls: 'alt', x: n ? x - (this.p >= n ? 20 : 0) : headX, y: n ? 50 : 66, label: 'p' });
    }
    const right = n ? left + (n - 1) * GAP + 56 : 0;
    nodes.push(...stackNodes(this.frames, right + 250, 150, 240));
    return { nodes, edges };
  }

  treeLayout() {
    const nodes = [], edges = [];
    const DX = 60, DY = 76, pos = new Map();
    let i = 0, maxY = 0;
    const walk = (n, d) => {
      if (!n) return;
      walk(n.left, d + 1);
      pos.set(n, { x: i++ * DX, y: d * DY });
      maxY = Math.max(maxY, d * DY);
      walk(n.right, d + 1);
    };
    walk(this.root, 0);
    const shift = ((i - 1) * DX) / 2;
    for (const p of pos.values()) p.x -= shift;
    const spot = (parent, side) => {
      if (!parent) return { x: 0, y: 0 };
      const p = pos.get(parent);
      return { x: p.x + (side === 'left' ? -DX / 2 : DX / 2), y: p.y + DY };
    };
    const circle = (n, x, y, cls) => ({
      id: 'T' + n.id, kind: 'circle', cls, x, y, r: 22, label: n.val, sub: hex(n.addr), subDx: 50, subDy: 0,
    });

    for (const [n, p] of pos) {
      nodes.push(circle(n, p.x, p.y, this.m['T' + n.id] || ''));
      for (const k of [n.left, n.right]) if (k) edges.push({ from: 'T' + n.id, to: 'T' + k.id });
    }
    if (this.root) {
      nodes.push({ id: 'root', kind: 'tag', cls: 'alt', x: pos.get(this.root).x, y: -64, label: 'root' });
      edges.push({ from: 'root', to: 'T' + this.root.id, cls: 'ptr', arrow: true });
    }
    if (this.pending) {
      const s = spot(this.nullAt?.parent, this.nullAt?.side);
      nodes.push(circle(this.pending, s.x, s.y, 'new'));
    } else if (this.nullAt) {
      const s = spot(this.nullAt.parent, this.nullAt.side);
      nodes.push({ id: 'tnull', kind: 'tag', cls: 'cmp', x: s.x, y: s.y, label: 'NULL' });
      if (this.nullAt.parent) edges.push({ id: 'tnull-e', from: 'T' + this.nullAt.parent.id, to: 'tnull', cls: 'ptr' });
    }
    if (!this.root && !this.pending && !this.nullAt) {
      nodes.push({ id: 'root', kind: 'tag', cls: 'alt', x: 0, y: -30, label: 'root = NULL' });
      nodes.push({ id: 'hint', kind: 'tag', cls: 'muted', x: 0, y: 6, label: 'type a value and run insert(root, x)' });
    }
    const right = i ? (i - 1) * DX / 2 + 80 : 120;
    nodes.push(...stackNodes(this.frames, right + 170, Math.max(maxY + DY, 150), 250));
    return { nodes, edges };
  }

  /* ---------- list: length ---------- */
  async length() {
    this.begin('list');
    this.frames[0].cls = 'cur';
    await this.step(9, `main calls length(head), head = ${this.list.length ? hex(this.list[0].addr) : 'NULL'}`);
    const r = await this.lenCall(0);
    this.p = null;
    await this.step(9, `length = ${r}. The stack is back to main().`, 'ok');
    App.out(`length(head) = ${r}   ·   ${r + 1} calls (one per node, plus the NULL at the end)`);
  }

  async lenCall(i) {
    const nd = this.list[i], addr = nd ? hex(nd.addr) : 'NULL';
    const f = this.push(`length(${addr})`);
    this.p = i;
    if (!nd) {
      await this.step(1, `call length(NULL): p walked off the end of the list, depth ${this.depth}`);
      f.ret = 0;
      await this.step(3, 'p == NULL: base case, an empty list has length 0', 'ok');
      this.pop();
      return 0;
    }
    this.mark('L' + nd.id, 'cur');
    await this.step(1, `call length(${addr}): node ${nd.val}, depth ${this.depth}`);
    await this.step(2, `p == NULL → ${addr} == NULL → false`);
    this.mark('L' + nd.id, 'path');
    const next = this.list[i + 1];
    await this.step(4, `count this node, but first length(p->next) = length(${next ? hex(next.addr) : 'NULL'})`);
    const r = await this.lenCall(i + 1);
    this.p = i;
    this.mark('L' + nd.id, 'found');
    f.ret = 1 + r;
    await this.step(4, `back in length(${addr}): 1 + ${r} = ${f.ret} → return ${f.ret}`, 'ok');
    this.pop();
    return f.ret;
  }

  /* ---------- list: printReverse ---------- */
  async printReverse() {
    this.begin('list');
    this.frames[0].cls = 'cur';
    await this.step(9, 'main calls printReverse(head)');
    await this.revCall(0);
    this.p = null;
    await this.step(9, `back in main. Printed on the way back up: ${this.printed.join(' ') || '(nothing)'}`, 'ok');
  }

  async revCall(i) {
    const nd = this.list[i], addr = nd ? hex(nd.addr) : 'NULL';
    this.push(`printReverse(${addr})`);
    this.p = i;
    if (!nd) {
      await this.step(1, `call printReverse(NULL), depth ${this.depth}`);
      await this.step(3, 'p == NULL: base case, return without printing. Now the frames unwind.', 'ok');
      this.pop();
      return;
    }
    this.mark('L' + nd.id, 'cur');
    await this.step(1, `call printReverse(${addr}): node ${nd.val}, depth ${this.depth}`);
    this.mark('L' + nd.id, 'path');
    await this.step(4, `recurse on p->next first; ${nd.val} waits in this frame`);
    await this.revCall(i + 1);
    this.p = i;
    this.mark('L' + nd.id, 'found');
    this.print(nd.val);
    await this.step(5, `back in printReverse(${addr}): print p->val = ${nd.val}`, 'ok');
    this.pop();
  }

  /* ---------- tree: insert ---------- */
  async insert(x) {
    const vals = this.treeVals();
    if (vals.length >= TREE_MAX && !vals.includes(x)) {
      log(`The tree already has ${TREE_MAX} nodes. Press Clear to start over.`, 'err');
      return;
    }
    this.begin('tree');
    this.frames[0].cls = 'cur';
    await this.step(16, `main calls root = insert(root, ${x}), root = ${this.root ? hex(this.root.addr) : 'NULL'}`);
    const r = await this.insCall(this.root, x, null, null);
    if (!this.root) {
      this.root = r;
      this.pending = null;
      this.nullAt = null;
      this.mark('T' + r.id, 'new');
      await this.step(16, `root was NULL, so root now points to the new node at ${hex(r.addr)}`, 'ok');
    } else {
      await this.step(16, `root = ${hex(r.addr)}: the root itself never changes once it exists`, 'ok');
    }
    App.out(`inorder: ${this.treeVals().join(' ')}`);
  }

  async insCall(node, x, parent, side) {
    const f = this.push(`insert(${node ? hex(node.addr) : 'NULL'}, ${x})`);
    if (!node) {
      this.nullAt = { parent, side };
      await this.step(1, `call insert(NULL, ${x}) at ${this.where(parent, side)}, depth ${this.depth}`);
      await this.step(2, 'root == NULL → true: this empty spot is where x goes');
      const n = { id: nextId(), val: x, addr: this.alloc(), left: null, right: null };
      this.pending = n;
      await this.step(3, `malloc a struct TNode → n = ${hex(n.addr)}`, 'ok');
      await this.step(5, `n->val = ${x}; n->left = n->right = NULL`);
      f.ret = hex(n.addr);
      await this.step(6, `return the new node ${hex(n.addr)} to the caller`, 'ok');
      this.pop();
      return n;
    }
    const id = 'T' + node.id, v = node.val;
    this.mark(id, 'cur');
    await this.step(1, `call insert(${hex(node.addr)}, ${x}): node ${v}, depth ${this.depth}`);
    this.mark(id, 'cmp');
    await this.step(8, `x < root->val → ${x} < ${v} → ${x < v}`);
    let dir = null;
    if (x < v) dir = 'left';
    else {
      await this.step(10, `x > root->val → ${x} > ${v} → ${x > v}`);
      if (x > v) dir = 'right';
    }
    if (dir) {
      this.mark(id, 'path');
      const child = await this.insCall(node[dir], x, node, dir);
      const linked = !node[dir];
      node[dir] = child;
      this.nullAt = null;
      this.pending = null;
      this.mark(id, 'cur');
      if (linked) this.mark('T' + child.id, 'new');
      await this.step(dir === 'left' ? 9 : 11, `root->${dir} = ${hex(child.addr)}` +
        (linked ? `: ${v}'s ${dir} pointer now links in the new node` : ' (the same pointer as before)'), linked ? 'ok' : '');
    } else {
      this.mark(id, 'visit');
      await this.step(10, `${x} == ${v}: already in the tree, so nothing is inserted`, 'warn');
    }
    f.ret = hex(node.addr);
    await this.step(12, `return root = ${hex(node.addr)} unchanged`);
    this.mark(id, '');
    this.pop();
    return node;
  }

  /* ---------- tree: height ---------- */
  async height() {
    this.begin('tree');
    this.frames[0].cls = 'cur';
    await this.step(10, 'main calls height(root)');
    this.calls = 0;
    const h = await this.hCall(this.root, null, null);
    await this.step(10, `height = ${h}`, 'ok');
    App.out(`height(root) = ${h}   ·   ${this.calls} call${this.calls > 1 ? "s" : ""} (${(this.calls - 1) / 2} nodes + ${(this.calls + 1) / 2} NULL${this.calls > 1 ? "s" : ""})`);
  }

  async hCall(node, parent, side) {
    this.calls++;
    const f = this.push(`height(${node ? hex(node.addr) : 'NULL'})`);
    if (!node) {
      this.nullAt = { parent, side };
      await this.step(1, `call height(NULL) at ${this.where(parent, side)}, depth ${this.depth}`);
      f.ret = 0;
      await this.step(3, 'root == NULL: base case, an empty tree has height 0', 'ok');
      this.nullAt = null;
      this.pop();
      return 0;
    }
    const id = 'T' + node.id;
    this.mark(id, 'cur');
    await this.step(1, `call height(${hex(node.addr)}): node ${node.val}, depth ${this.depth}`);
    await this.step(2, `root == NULL → false. First the left subtree.`);
    this.mark(id, 'path');
    const l = await this.hCall(node.left, node, 'left');
    this.mark(id, 'cur');
    await this.step(5, `back in ${node.val}: l = ${l}. Now the right subtree.`);
    this.mark(id, 'path');
    const r = await this.hCall(node.right, node, 'right');
    this.mark(id, 'found');
    f.ret = 1 + Math.max(l, r);
    await this.step(6, `back in ${node.val}: r = ${r} → 1 + max(${l}, ${r}) = ${f.ret}`, 'ok');
    this.pop();
    return f.ret;
  }

  /* ---------- tree: inorder ---------- */
  async inorder() {
    this.begin('tree');
    this.frames[0].cls = 'cur';
    await this.step(10, 'main calls inorder(root)');
    await this.inCall(this.root, null, null);
    await this.step(10, `back in main. Printed: ${this.printed.join(' ') || '(nothing)'}, which is sorted order`, 'ok');
  }

  async inCall(node, parent, side) {
    this.push(`inorder(${node ? hex(node.addr) : 'NULL'})`);
    if (!node) {
      this.nullAt = { parent, side };
      await this.step(3, `inorder(NULL) at ${this.where(parent, side)}: nothing there, return`);
      this.nullAt = null;
      this.pop();
      return;
    }
    const id = 'T' + node.id;
    this.mark(id, 'cur');
    await this.step(1, `call inorder(${hex(node.addr)}): node ${node.val}, depth ${this.depth}`);
    this.mark(id, 'path');
    await this.step(4, `visit everything smaller than ${node.val} first (the left subtree)`);
    await this.inCall(node.left, node, 'left');
    this.mark(id, 'found');
    this.print(node.val);
    await this.step(5, `back in ${node.val}: left side done, print ${node.val}`, 'ok');
    await this.step(6, `now the larger values (the right subtree of ${node.val})`);
    await this.inCall(node.right, node, 'right');
    this.pop();
  }
}
