import { describe, it, expect } from "vitest";
import {
  sq, nameOf, mkState, legalMoves, apply, statusOf, inCheck, bestMove,
} from "../src/Tempo.jsx";

const moves = (state) => legalMoves(state).map((m) => nameOf(m.from) + nameOf(m.to));
const play = (state, from, to) =>
  apply(state, legalMoves(state).find((m) => m.from === sq(from) && m.to === sq(to)));

describe("naming", () => {
  it("round-trips every square", () => {
    for (let i = 0; i < 64; i++) expect(sq(nameOf(i))).toBe(i);
  });
  it("puts a1 bottom left and h8 top right", () => {
    expect(sq("a1")).toBe(56);
    expect(sq("h8")).toBe(7);
  });
});

describe("the pieces", () => {
  it("opens with twenty moves", () => {
    expect(legalMoves(mkState("start", {})).length).toBe(20);
  });
  it("gives a lone centre knight eight squares", () => {
    expect(moves(mkState([["d4", "wN"], ["e1", "wK"], ["e8", "bK"]], {})).filter((m) => m.startsWith("d4")).length).toBe(8);
  });
  it("keeps a bishop on its own colour", () => {
    const st = mkState([["c1", "wB"], ["e1", "wK"], ["e8", "bK"]], {});
    for (const m of moves(st).filter((x) => x.startsWith("c1"))) {
      const dark = (sq(m.slice(2)) + Math.floor(sq(m.slice(2)) / 8)) % 2;
      expect(dark).toBe((sq("c1") + Math.floor(sq("c1") / 8)) % 2);
    }
  });
  it("lets a pawn step one or two from home and never backwards", () => {
    const st = mkState([["e2", "wP"], ["e1", "wK"], ["e8", "bK"]], {});
    expect(moves(st).filter((m) => m.startsWith("e2")).sort()).toEqual(["e2e3", "e2e4"]);
  });
  it("makes a pawn capture aslant only", () => {
    const st = mkState([["e4", "wP"], ["d5", "bP"], ["e5", "bP"], ["e1", "wK"], ["e8", "bK"]], {});
    expect(moves(st).filter((m) => m.startsWith("e4"))).toEqual(["e4d5"]);
  });
});

describe("the laws", () => {
  it("will not leave its own king in check", () => {
    const st = mkState([["e1", "wK"], ["e2", "wB"], ["e8", "bR"], ["a8", "bK"]], {});
    expect(moves(st).some((m) => m.startsWith("e2"))).toBe(false);
  });
  it("castles king and rook together", () => {
    const st = mkState([["e1", "wK"], ["h1", "wR"], ["e8", "bK"]], { castling: { K: true, Q: false, k: false, q: false } });
    const after = play(st, "e1", "g1");
    expect(after.board[sq("g1")].t).toBe("k");
    expect(after.board[sq("f1")].t).toBe("r");
    expect(after.hist[0]).toBe("O-O");
  });
  it("refuses to castle through an attacked square", () => {
    const st = mkState([["e1", "wK"], ["h1", "wR"], ["f8", "bR"], ["a8", "bK"]], { castling: { K: true, Q: false, k: false, q: false } });
    expect(moves(st)).not.toContain("e1g1");
  });
  it("promotes on the eighth rank", () => {
    const after = play(mkState([["a7", "wP"], ["e1", "wK"], ["h8", "bK"]], {}), "a7", "a8");
    expect(after.board[sq("a8")].t).toBe("q");
  });
  it("takes en passant and removes the passing pawn", () => {
    const st = mkState([["e5", "wP"], ["d5", "bP"], ["e1", "wK"], ["e8", "bK"]], { ep: "d6" });
    const after = play(st, "e5", "d6");
    expect(after.board[sq("d5")]).toBe(null);
    expect(after.board[sq("d6")].t).toBe("p");
  });
  it("calls the back rank mate a mate", () => {
    const st = mkState([["a8", "wR"], ["h8", "bK"], ["g7", "bP"], ["h7", "bP"], ["g1", "wK"]], { turn: "b" });
    expect(statusOf(st)).toBe("checkmate");
    expect(inCheck(st, "b")).toBe(true);
  });
  it("calls a frozen king with no check a stalemate", () => {
    const st = mkState([["a8", "bK"], ["c7", "wQ"], ["g1", "wK"]], { turn: "b" });
    expect(statusOf(st)).toBe("stalemate");
  });
  it("calls king against king a draw", () => {
    expect(statusOf(mkState([["e1", "wK"], ["e8", "bK"]], {}))).toBe("draw");
  });
  it("draws on the fifty move rule", () => {
    const st = mkState([["e1", "wK"], ["a1", "wR"], ["e8", "bK"]], {});
    expect(statusOf(Object.assign({}, st, { half: 100 }))).toBe("draw");
  });
});

describe("the scoresheet", () => {
  const line = (pairs) => {
    let st = mkState("start", { castling: { K: true, Q: true, k: true, q: true } });
    for (const [f, t] of pairs) st = play(st, f, t);
    return st.hist;
  };
  it("writes the way a club writes", () => {
    expect(line([["e2", "e4"], ["e7", "e5"], ["g1", "f3"], ["b8", "c6"], ["f1", "b5"], ["g8", "f6"], ["e1", "g1"]]))
      .toEqual(["e4", "e5", "Nf3", "Nc6", "Bb5", "Nf6", "O-O"]);
  });
  it("says which knight moved", () => {
    const st = mkState([["b1", "wN"], ["f3", "wN"], ["e1", "wK"], ["e8", "bK"]], {});
    expect(play(st, "b1", "d2").hist[0]).toBe("Nbd2");
    expect(play(st, "f3", "d2").hist[0]).toBe("Nfd2");
  });
  it("names the file a pawn captured from", () => {
    expect(play(mkState([["e4", "wP"], ["d5", "bP"], ["e1", "wK"], ["e8", "bK"]], {}), "e4", "d5").hist[0]).toBe("exd5");
  });
  it("marks promotion, check and mate", () => {
    expect(play(mkState([["b7", "wP"], ["e1", "wK"], ["a8", "bK"], ["h5", "bR"]], {}), "b7", "b8").hist[0]).toBe("b8=Q+");
    expect(play(mkState([["a1", "wR"], ["g1", "wK"], ["h8", "bK"], ["g7", "bP"], ["h7", "bP"]], {}), "a1", "a8").hist[0]).toBe("Ra8#");
  });
  it("writes both castles", () => {
    expect(play(mkState([["e1", "wK"], ["a1", "wR"], ["e8", "bK"]], { castling: { K: false, Q: true, k: false, q: false } }), "e1", "c1").hist[0]).toBe("O-O-O");
  });
  it("uses no character a keyboard cannot type", () => {
    let st = mkState("start", { castling: { K: true, Q: true, k: true, q: true } });
    for (let i = 0; i < 40 && statusOf(st) === "play"; i++) st = apply(st, bestMove(st, 1));
    for (const move of st.hist) expect(move, move).toMatch(/^[a-hKQRBNOx0-8=+#-]+$/);
  });
});

describe("the Pale Automaton", () => {
  it("takes a free queen", () => {
    const st = mkState([["d8", "bR"], ["d4", "wQ"], ["e1", "wK"], ["h8", "bK"]], { turn: "b" });
    const m = bestMove(st, 2);
    expect(nameOf(m.from) + nameOf(m.to)).toBe("d8d4");
  });
  it("finds mate in one", () => {
    const st = mkState([["a1", "bR"], ["h2", "bR"], ["e4", "bK"], ["h8", "wK"]], { turn: "b" });
    expect(statusOf(apply(st, bestMove(st, 2)))).toBe("checkmate");
  });
  it("always returns a legal move", () => {
    let st = mkState("start", { castling: { K: true, Q: true, k: true, q: true } });
    for (let i = 0; i < 12 && statusOf(st) === "play"; i++) {
      const m = bestMove(st, 1);
      expect(legalMoves(st)).toContainEqual(m);
      st = apply(st, m);
    }
  });
});
