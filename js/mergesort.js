'use strict';

const MERGE_CODE = {
  overview: `// Merge sort is divide and conquer:
//   DIVIDE   split the array in half
//   CONQUER  sort each half recursively
//   COMBINE  merge the two sorted halves
//
// A range of 0 or 1 elements is already sorted:
// that is the base case.
//
// log2(n) levels of splitting, O(n) merge work
// per level → O(n log n) in every case.`,
  mergeSort: `void mergeSort(int a[], int lo, int hi) {
    if (lo >= hi)
        return;                     // 0 or 1 element: sorted
    int mid = (lo + hi) / 2;
    mergeSort(a, lo, mid);          // sort the left half
    mergeSort(a, mid + 1, hi);      // sort the right half
    merge(a, lo, mid, hi);          // join the sorted halves
}

int main(void) {
    int a[] = { ... };
    mergeSort(a, 0, N - 1);
}`,
  merge: `void merge(int a[], int lo, int mid, int hi) {
    int tmp[hi - lo + 1], i = lo, j = mid + 1, k = 0;
    while (i <= mid && j <= hi)      // take the smaller head
        tmp[k++] = (a[i] <= a[j]) ? a[i++] : a[j++];
    while (i <= mid) tmp[k++] = a[i++];
    while (j <= hi)  tmp[k++] = a[j++];
    for (k = 0; k < hi - lo + 1; k++)
        a[lo + k] = tmp[k];          // copy back
}`,
};

const fmtArr = a => '[' + a.join(' ') + ']';

class MergeSort extends DS {
  constructor() {
    super();
    this.key = 'mergesort';
    this.name = 'Merge Sort';
    this.about = 'Each call splits its range in half and makes two recursive calls, so the calls form a binary tree. Going down, the array is split until single elements remain (base case). Coming back up, each call merges its two sorted halves. A node shows its range before the merge and the sorted result after it.';
    this.facts = [['Time (all cases)', 'O(n log n)'], ['Recursion depth', '⌈log₂ n⌉'], ['Calls', '2n − 1'], ['Extra memory', 'O(n)'], ['Stable', 'yes']];
    this.code = MERGE_CODE;
    this.controls = [{ op: 'mergeSort', label: 'mergeSort(a)' }];
    this.clear();
  }

  stats() { return `calls: ${this.calls} · depth: ${this.depth}`; }
  clear() { this.arr = [38, 27, 43, 3, 9, 82, 10]; this.reset(); }
  random() { this.arr = Array.from({ length: rand(5, 8) }, () => rand(1, 99)); this.reset(); }
  reset() {
    this.root = { id: nextId(), label: fmtArr(this.arr), kids: [], cls: '' };
    this.calls = 0;
    this.depth = 0;
  }
  finish() {
    const walk = n => { if (n.cls !== 'found') n.cls = ''; n.kids.forEach(walk); };
    walk(this.root);
  }

  layout() {
    const spec = treeSpec(this.root, { dy: 70 });
    const d = [...this.arr];
    spec.nodes.push({ id: 'arr-lbl', kind: 'tag', cls: 'muted', x: 0, y: -44, label: `a[] = {${d.join(', ')}}` });
    return spec;
  }

  async mergeSort() {
    const a = [...this.arr];
    this.root = null;
    this.calls = 0;
    await this.ms(null, a, 0, a.length - 1);
    await this.step(12, `sorted: ${fmtArr(a)} in ${this.calls} calls`, 'ok');
    App.out(`${fmtArr(this.arr)} → ${fmtArr(a)}   ·   ${this.calls} calls`);
  }

  async ms(parent, a, lo, hi) {
    const node = { id: nextId(), label: fmtArr(a.slice(lo, hi + 1)), kids: [], cls: 'cur' };
    if (parent) { parent.kids.push(node); parent.cls = 'path'; } else this.root = node;
    this.calls++;
    this.depth++;
    await this.step(1, `call mergeSort(a, ${lo}, ${hi}): ${fmtArr(a.slice(lo, hi + 1))}`);
    if (lo >= hi) {
      node.cls = 'cmp';
      await this.step(3, `lo >= hi: one element is already sorted, return`, 'ok');
      node.cls = 'found';
      this.depth--;
      return;
    }
    const mid = (lo + hi) >> 1;
    await this.step(4, `mid = (${lo} + ${hi}) / 2 = ${mid}: left a[${lo}..${mid}], right a[${mid + 1}..${hi}]`);
    node.cls = 'path';
    await this.ms(node, a, lo, mid);
    node.cls = 'cur';
    await this.step(6, `left half is sorted. Now sort the right half a[${mid + 1}..${hi}]`);
    node.cls = 'path';
    await this.ms(node, a, mid + 1, hi);

    const L = a.slice(lo, mid + 1), R = a.slice(mid + 1, hi + 1), out = [];
    let i = 0, j = 0;
    while (i < L.length && j < R.length) out.push(L[i] <= R[j] ? L[i++] : R[j++]);
    out.push(...L.slice(i), ...R.slice(j));
    a.splice(lo, out.length, ...out);

    node.cls = 'cur';
    for (const k of node.kids) k.cls = 'cmp';
    await this.step(7, `both halves sorted: merge ${fmtArr(L)} + ${fmtArr(R)}`);
    node.label = fmtArr(out);
    node.cls = 'found';
    for (const k of node.kids) k.cls = '';
    await this.step(7, `merged → ${fmtArr(out)}, return`, 'ok');
    this.depth--;
  }
}
