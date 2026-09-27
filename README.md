# C Recursion Visualizer

An interactive, animated web walkthrough of **recursion in C**. Every example runs step by step while the matching C code highlights line by line, so you can watch each call push a stack frame, see the call tree grow, and follow every return as the stack unwinds.

**Live demo:** https://n-shovel.github.io/c-recursion-visualizer/

It is a companion to [C Fundamentals Visualizer](https://github.com/N-Shovel/c-fundamentals-visualizer) ([live demo](https://n-shovel.github.io/c-fundamentals-visualizer/)) and [C Data Structures Visualizer](https://github.com/N-Shovel/c-data-structures-visualizer) ([live demo](https://n-shovel.github.io/c-data-structures-visualizer/)), and uses the same animation engine.

## Topics

| # | Topic | What you can run |
|---|---|---|
| 1 | **Call Stack** | `factorial(n)` pushing and unwinding frames; `countdown(n)` (work *before* the call) vs `countup(n)` (work *after* the call); a function with no base case running into a stack overflow |
| 2 | **Fibonacci** | naive `fib(n)` as a call tree with the repeated work highlighted; memoized `fib(n)` with a live `memo[]` array and cache hits |
| 3 | **Arrays & Strings** | `sum(arr, n)` over a shrinking range; `isPal(s, lo, hi)` palindrome check as a tail call |
| 4 | **Binary Search** | recursive `bs(a, lo, hi, x)` with `lo` / `mid` / `hi` and the ruled-out halves greyed out |
| 5 | **Tower of Hanoi** | `hanoi(n, from, to, via)` moving the disks while the call stack shows the current sub-problem (2ⁿ − 1 moves) |
| 6 | **Merge Sort** | the divide-and-conquer tree: splitting down to single elements, then merging back up |
| 7 | **Backtracking** | all subsets (take / skip decision tree) and all permutations (swap, recurse, undo) |

## Features

- **C code panel** that highlights the line being executed. Every snippet is browsable and copyable.
- **Call trees** for the recursions that branch (Fibonacci, merge sort, backtracking) and a **call stack** for those that don't. The yellow node is running and grey ones are waiting on the stack.
- **Step-by-step mode**: pause after every line and advance with **Next step**, → or Space.
- **Speed control** from 0.12 s to 1.8 s per step.
- **Execution log** that explains each step with the actual values (`n <= 1 → 3 <= 1 → false`, `memo[5] != -1 → 5 != -1 → true`, and so on).
- **Key facts** table for each topic (number of calls, stack depth, time complexity).
- If the input box is empty, a sensible random value is used.
- **Dark / light mode toggle** (moon/sun button in the header, or press **T**). It follows your OS setting until you pick one, then remembers your choice.

## Running locally

There's no build step and there are no dependencies. Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 8000
# then visit http://localhost:8000
```

Link straight to a topic with its hash, for example `index.html#hanoi`.

## Project structure

```
index.html
css/style.css
js/core.js       # animated SVG scene, code panel, step control, tree + stack layouts
js/stack.js      # Call Stack
js/fib.js        # Fibonacci
js/arrays.js     # Arrays & Strings
js/bsearch.js    # Binary Search
js/hanoi.js      # Tower of Hanoi
js/mergesort.js  # Merge Sort
js/backtrack.js  # Backtracking
js/main.js       # UI wiring
```

To add a topic, extend `DS` (or `StackDS` for a call-stack view) and implement `layout()` (it returns nodes and edges) plus async operation methods that call `await this.step(line, message)`. Use `treeSpec(root)` to draw a recursion tree or `stackNodes(frames, x, y)` to draw a call stack. Then register the topic in `js/main.js` and add its `<script>` tag to `index.html`.
