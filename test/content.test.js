import { describe, it, expect } from "vitest";
import {
  sq, nameOf, mkState, legalMoves, apply, statusOf, bestMove,
  answersFor, checkPredicate,
  CHAPTERS, CONCEPTS, BOSSES, CARDS, SANDBOX_PRESETS, PHRASEBOOK, TOTAL_UNITS,
} from "../src/Tempo.jsx";

const FILES = "abcdefgh";
const square = (n) => typeof n === "string" && n.length === 2 && FILES.includes(n[0]) && "12345678".includes(n[1]);

/* every exercise position in the course, with a label that says where it lives */
const positions = [];
const exercises = [];
for (const c of CONCEPTS) {
  c.contexts.forEach((ctx) => {
    const where = `${c.id} - ${ctx.setting}`;
    positions.push({ where, pieces: ctx.ex.pieces, opts: ctx.ex.opts });
    exercises.push({ where, ex: ctx.ex });
  });
}
for (const b of BOSSES) {
  b.phases.forEach((ph, i) => {
    const where = `${b.id} - phase ${i + 1}`;
    positions.push({ where, pieces: ph.ex.pieces, opts: ph.ex.opts });
    exercises.push({ where, ex: ph.ex });
  });
}
for (const p of SANDBOX_PRESETS) positions.push({ where: `sandbox - ${p.id}`, pieces: p.pieces, opts: p.opts });

describe("every position on a board is a legal one", () => {
  it.each(positions)("$where", ({ pieces, opts }) => {
    if (pieces === "start") return;
    const seen = new Set();
    for (const [s, pc] of pieces) {
      expect(square(s), `bad square ${s}`).toBe(true);
      expect(seen.has(s), `two pieces on ${s}`).toBe(false);
      expect(/^[wb][KQRBNP]$/.test(pc), `bad piece code ${pc}`).toBe(true);
      seen.add(s);
    }
    const st = mkState(pieces, opts);
    expect(st.board.filter((p) => p && p.c === "w" && p.t === "k").length).toBe(1);
    expect(st.board.filter((p) => p && p.c === "b" && p.t === "k").length).toBe(1);
    st.board.forEach((p, i) => {
      if (p && p.t === "p") expect(i >= 8 && i < 56, `pawn on ${nameOf(i)}`).toBe(true);
    });
  });
});

describe("every exercise can actually be solved", () => {
  it.each(exercises)("$where", ({ ex }) => {
    const st = mkState(ex.pieces, ex.opts);
    if (ex.type === "find") {
      expect(ex.targets.length).toBeGreaterThan(0);
      ex.targets.forEach((t) => expect(square(t), `bad target ${t}`).toBe(true));
      return;
    }
    if (ex.type === "trace") {
      expect(st.board[sq(ex.from)], `nothing on ${ex.from}`).toBeTruthy();
      ex.path.forEach((t) => expect(square(t), `bad path square ${t}`).toBe(true));
      return;
    }
    if (ex.type === "mark") {
      expect(st.board[sq(ex.from)], `nothing on ${ex.from}`).toBeTruthy();
      expect(answersFor(ex).size, "no squares to mark").toBeGreaterThan(0);
      return;
    }
    if (ex.type === "move") {
      expect(statusOf(st)).toBe("play");
      const sat = legalMoves(st).filter((m) => checkPredicate(st, m, ex.ok));
      expect(sat.length, `no legal move satisfies ${JSON.stringify(ex.ok)}`).toBeGreaterThan(0);
      for (const key of Object.keys(ex.altMsgs || {})) {
        expect(legalMoves(st).some((m) => nameOf(m.from) + nameOf(m.to) === key), `altMsgs "${key}" is not legal here`).toBe(true);
      }
      return;
    }
    if (ex.type === "exchange") {
      let cur = st;
      ex.steps.forEach((step, i) => {
        expect(statusOf(cur), `step ${i + 1} starts ${statusOf(cur)}`).toBe("play");
        const sat = legalMoves(cur).filter((m) => checkPredicate(cur, m, step.ok));
        expect(sat.length, `step ${i + 1} has no solution`).toBeGreaterThan(0);
        cur = apply(cur, sat[0]);
        if (i < ex.steps.length - 1) cur = apply(cur, bestMove(cur, 2));
      });
      return;
    }
    if (ex.type === "duel") {
      expect(statusOf(st)).toBe("play");
      expect(ex.moveLimit).toBeGreaterThan(0);
      return;
    }
    throw new Error(`unknown exercise type "${ex.type}"`);
  });
});

describe("the notebook", () => {
  it("has eighteen pages in four chapters", () => {
    expect(CONCEPTS.length).toBe(18);
    expect(CHAPTERS.length).toBe(4);
    expect(new Set(CONCEPTS.map((c) => c.ch))).toEqual(new Set([1, 2, 3, 4]));
  });
  it("counts every unit exactly once on the progress bar", () => {
    expect(TOTAL_UNITS).toBe(CONCEPTS.length + BOSSES.length + 1);
  });
  it("gives every page an id of its own", () => {
    expect(new Set(CONCEPTS.map((c) => c.id)).size).toBe(CONCEPTS.length);
  });
  it("gives every page at least three settings and a full memory hook", () => {
    for (const c of CONCEPTS) {
      expect(c.contexts.length, c.id).toBeGreaterThanOrEqual(3);
      expect(c.hook.plain && c.hook.image && c.hook.when, `${c.id} hook`).toBeTruthy();
      expect(c.intro && c.dues && c.lockedHint, `${c.id} prose`).toBeTruthy();
      expect(c.depth.length, `${c.id} margin notes`).toBeGreaterThan(0);
      for (const ctx of c.contexts) expect(ctx.setting && ctx.flavor && ctx.explain, `${c.id} setting`).toBeTruthy();
    }
  });
  it("sends every club night after pages that exist", () => {
    const ids = new Set(CONCEPTS.map((c) => c.id));
    for (const b of BOSSES) {
      expect(b.needs.length).toBeGreaterThan(0);
      for (const n of b.needs) expect(ids.has(n), `${b.id} needs missing page "${n}"`).toBe(true);
      expect(b.intro.length && b.outro.length && b.phases.length, b.id).toBeTruthy();
      expect(b.vision.caption, `${b.id} vision`).toBeTruthy();
    }
  });
});

describe("the cabinet and the phrasebook", () => {
  it("holds twenty-four cards across three rarities", () => {
    expect(CARDS.length).toBe(24);
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(24);
    expect(new Set(CARDS.map((c) => c.rarity))).toEqual(new Set([1, 2, 3]));
    for (const c of CARDS) expect(c.title && c.sub && c.text, c.id).toBeTruthy();
  });
  it("defines every phrase and shows it in use", () => {
    for (const g of PHRASEBOOK) {
      expect(g.items.length).toBeGreaterThan(0);
      for (const it of g.items) expect(it.t && it.d && it.u, it.t).toBeTruthy();
    }
  });
});
