'use strict';

const BACKTRACK_CODE = {
  overview: `// Backtracking explores every choice recursively:
//   1. CHOOSE   make one choice
//   2. EXPLORE  recurse to make the remaining choices
//   3. UN-CHOOSE undo it, then try the next option
//
// The calls form a decision tree; every leaf is one
// complete answer. n letters give 2^n subsets and
// n! permutations.`,
  subsets: `char cur[10];
int len = 0;

void subsets(const char *s, int i) {
    if (s[i] == '\\0') {             // every letter decided
        cur[len] = '\\0';
        printf("{%s}\\n", cur);
        return;
    }
    cur[len++] = s[i];              // choose: take s[i]
    subsets(s, i + 1);
    len--;                          // un-choose (backtrack)
    subsets(s, i + 1);              // explore without s[i]
}`,
  permute: `void swap(char *a, char *b) {
    char t = *a; *a = *b; *b = t;
}

void permute(char *s, int i, int n) {
    if (i == n) {                   // every slot is fixed
        printf("%s\\n", s);
        return;
    }
    for (int j = i; j < n; j++) {
        swap(&s[i], &s[j]);         // choose s[j] for slot i
        permute(s, i + 1, n);
        swap(&s[i], &s[j]);         // undo (backtrack)
    }
}`,
};

class Backtrack extends DS {
  constructor() {
    super();
    this.key = 'backtrack';
    this.name = 'Backtracking';
    this.about = 'Every call makes one choice, recurses to make the rest, then undoes the choice and tries the next one. Subsets: the solid edge means "take the letter" and the dashed edge means "skip it". Permutations: letters left of | are fixed, and each child fixes one more slot. Green leaves are the printed answers.';
    this.facts = [['Subsets of n', '2ⁿ'], ['Subset calls', '2ⁿ⁺¹ − 1'], ['Permutations of n', 'n!'], ['Stack depth', 'n'], ['Pattern', 'choose → explore → undo']];
    this.code = BACKTRACK_CODE;
    this.inputType = 'text';
    this.placeholder = 'letters';
    this.noRandom = true;
    this.controls = [
      { op: 'subsets', label: 'subsets(s)', arg: 'text', maxLen: 4 },
      { op: 'permute', label: 'permute(s)', arg: 'text', maxLen: 3 },
    ];
    this.clear();
  }

  sample() { return 'abc'; }
  stats() { return `calls: ${this.calls} · depth: ${this.depth} · printed: ${this.printed.length}`; }
  clear() { this.root = null; this.calls = 0; this.depth = 0; this.printed = []; }
  random() { this.clear(); }
  finish() {
    const walk = n => { if (!n) return; if (n.cls !== 'found') n.cls = ''; n.kids.forEach(walk); };
    walk(this.root);
  }

  layout() {
    const spec = treeSpec(this.root, { dy: 76, gap: 12 });
    if (!spec.nodes.length) spec.nodes.push({ id: 'hint', kind: 'tag', cls: 'muted', x: 0, y: 0, label: 'type a few letters and run subsets(s) or permute(s)' });
    return spec;
  }

  node(parent, label, edge) {
    const node = { id: nextId(), label, kids: [], cls: 'cur', edge };
    if (parent) { parent.kids.push(node); parent.cls = 'path'; } else this.root = node;
    this.calls++;
    this.depth++;
    return node;
  }
  emit(text) {
    this.printed.push(text);
    App.out(this.printed.join('  '));
  }

  /* ---------- subsets ---------- */
  async subsets(s) {
    s = s.toLowerCase();
    this.clear();
    await this.sub(null, s, 0, '', '');
    log(`${this.printed.length} subsets from ${this.calls} calls`, 'ok');
  }

  async sub(parent, s, i, cur, edge) {
    const node = this.node(parent, `{${cur}}`, edge);
    await this.step(4, parent ? `subsets(s, ${i}), cur = {${cur}}` : `subsets("${s}", 0), cur = {}`);
    if (i === s.length) {
      node.cls = 'found';
      this.emit(`{${cur}}`);
      await this.step(7, `all ${s.length} letters decided: print {${cur}}`, 'ok');
      this.depth--;
      return;
    }
    await this.step(10, `choose: take '${s[i]}' → cur = {${cur + s[i]}}`);
    node.cls = 'path';
    await this.sub(node, s, i + 1, cur + s[i], '');
    node.cls = 'cur';
    await this.step(12, `back in {${cur}}: remove '${s[i]}' again (backtrack)`, 'warn');
    await this.step(13, `explore without '${s[i]}'`);
    node.cls = 'path';
    await this.sub(node, s, i + 1, cur, 'ptr');
    node.cls = '';
    this.depth--;
  }

  /* ---------- permutations ---------- */
  async permute(s) {
    s = s.toLowerCase();
    this.clear();
    await this.perm(null, [...s], 0);
    log(`${this.printed.length} permutations from ${this.calls} calls`, 'ok');
  }

  async perm(parent, s, i) {
    const n = s.length, str = s.join('');
    const node = this.node(parent, i === n ? str : str.slice(0, i) + '|' + str.slice(i), '');
    await this.step(5, `permute(s, ${i}, ${n}): ` + (i ? `"${str.slice(0, i)}" is fixed` : 'nothing fixed yet'));
    if (i === n) {
      node.cls = 'found';
      this.emit(str);
      await this.step(7, `all slots fixed: print "${str}"`, 'ok');
      this.depth--;
      return;
    }
    for (let j = i; j < n; j++) {
      node.cls = 'cur';
      [s[i], s[j]] = [s[j], s[i]];
      await this.step(11, j === i ? `j = ${j}: keep '${s[i]}' in slot ${i}` : `j = ${j}: swap slots ${i} and ${j} → "${s.join('')}", so '${s[i]}' goes in slot ${i}`);
      node.cls = 'path';
      await this.perm(node, s, i + 1);
      node.cls = 'cur';
      [s[i], s[j]] = [s[j], s[i]];
      await this.step(13, j === i ? 'undo: swapping a slot with itself changes nothing' : `undo the swap → "${s.join('')}" (backtrack)`, 'warn');
    }
    node.cls = '';
    this.depth--;
  }
}
