import { useState, useEffect, useRef, useMemo } from "react";

const Lock = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16"><rect x="3.2" y="7" width="9.6" height="6.4" rx="1.4" fill="none" stroke={color} strokeWidth="1.3" /><path d="M5.2 7 V5.2 a2.8 2.8 0 0 1 5.6 0 V7" fill="none" stroke={color} strokeWidth="1.3" /><circle cx="8" cy="10.2" r="1" fill={color} /></svg>
);

/* TEMPO. An interactive chess course in one React file. Palette: light blue and beige on a dark blue ground, ink on paper */

/* ---------------- theme ----------------
   Two accents on a dark blue ground, and nothing on screen that is not named here.
     blue   the primary accent and the house voice; buttons, labels, structure
     beige  the warm counterpart; earned things, principles, emphasis
     paper  the cream surfaces ink sits on
     ink    what is written on that paper
     rose   the one wrong-color, kept apart so it always means one thing
   Text on the dark ground is paper at six fixed alphas, never another white.
   An accent that has to carry ink-weight on cream gets an -Ink variant;
   -Line is a border, -Edge a fainter border, -Wash a background tint. */
const T = {
  /* the dark blue ground */
  dusk:     "#151d2b",
  duskUp:   "#1c2434",
  duskCool: "#1a2747",
  duskWarm: "#272219",

  /* scrims over the ground: one base, four depths */
  wellSoft: "rgba(11,15,24,0.22)",
  well:     "rgba(11,15,24,0.34)",
  wellDeep: "rgba(11,15,24,0.55)",
  overlay:  "rgba(11,15,24,0.86)",

  /* paper */
  paper:      "#f3f1e8",
  paperCard:  "#f0ede1",
  paperWarm:  "#efe7d3",
  paperBeige: "#ece0bf",
  paperBlue:  "#e4edf6",

  /* ink on paper */
  ink:      "#262b33",
  inkSoft:  "#575d68",
  inkLine:  "rgba(38,43,51,0.16)",

  /* text on the dark ground: paper at six alphas */
  onHi:    "rgba(243,241,232,0.92)",
  onBody:  "rgba(243,241,232,0.78)",
  onMute:  "rgba(243,241,232,0.62)",
  onSoft:  "rgba(243,241,232,0.46)",
  onFaint: "rgba(243,241,232,0.30)",
  onGhost: "rgba(243,241,232,0.16)",

  /* blue: the primary accent */
  blue:      "#9ec9ea",
  blueLight: "#c5e0f5",
  blueSoft:  "#a9c4dc",
  blueDeep:  "#5f8fb8",
  blueInk:   "#3c6485",
  blueLine:  "rgba(158,201,234,0.45)",
  blueEdge:  "rgba(158,201,234,0.24)",

  /* beige: the warm counterpart */
  beige:      "#d9c8a4",
  beigeLight: "#ece0bf",
  beigeDeep:  "#b3a37e",
  beigeInk:   "#6f6140",
  beigeLine:  "rgba(217,200,164,0.45)",
  beigeEdge:  "rgba(217,200,164,0.24)",
  beigeWash:  "rgba(217,200,164,0.09)",
  good:       "#cfc4a6",

  /* rose: the one wrong-color */
  rose:      "#c98a8a",
  roseDeep:  "#845656",
  roseBoard: "#b35c5c",
  clay:      "#c9a08a",
  roseLine:  "rgba(201,138,138,0.5)",

  /* the board: slate blue and beige */
  boardLight: "#e8e0ce",
  boardDark:  "#7c93b0",
  lastLight:  "#dcd2b8",
  lastDark:   "#6b83a4",
  hintLight:  "#cfe0f0",
  hintDark:   "#90a9c6",
  markLight:  "#dcc79a",
  markDark:   "#a89268",
  fileLight:  "#8a8372",
  fileDark:   "#dbe6f2",
  pieceShade: "#0b0e14",

  /* specular: the machined insets on the buttons and cards */
  sheen:      "rgba(255,255,255,0.45)",
  sheenSoft:  "rgba(255,255,255,0.28)",
  sheenFaint: "rgba(255,255,255,0.06)",

  /* the two voices: serif explains, mono reports */
  serif: "Lora, Palatino, 'Palatino Linotype', Georgia, serif",
  mono: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
};
/* per-chapter accent colors, drawn from the families above */
const ACC = { 1: T.blue, 2: T.beige, 3: T.clay, 4: T.beigeLight };

/* ---------------- chess engine ---------------- */
const FILES = "abcdefgh";
const sq = (n) => (8 - parseInt(n[1])) * 8 + FILES.indexOf(n[0]);
const nameOf = (i) => FILES[i % 8] + (8 - Math.floor(i / 8));
const rowOf = (i) => Math.floor(i / 8);
const colOf = (i) => i % 8;
const onB = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
const KN = [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]];
const KM = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
const RD = [[1,0],[-1,0],[0,1],[0,-1]];
const BD = [[1,1],[1,-1],[-1,1],[-1,-1]];
const GLYPH = { p:"\u265F", n:"\u265E", b:"\u265D", r:"\u265C", q:"\u265B", k:"\u265A" };
const PIECE_NAME = { p:"Pawn", n:"Knight", b:"Bishop", r:"Rook", q:"Queen", k:"King" };

function boardFrom(list) {
  const b = Array(64).fill(null);
  for (const [s, pc] of list) b[sq(s)] = { c: pc[0], t: pc[1].toLowerCase() };
  return b;
}
function startBoard() {
  const b = Array(64).fill(null);
  const back = ["r","n","b","q","k","b","n","r"];
  for (let c = 0; c < 8; c++) {
    b[c] = { c: "b", t: back[c] };
    b[8 + c] = { c: "b", t: "p" };
    b[48 + c] = { c: "w", t: "p" };
    b[56 + c] = { c: "w", t: back[c] };
  }
  return b;
}
function mkState(pieces, opts) {
  const o = opts || {};
  return {
    board: pieces === "start" ? startBoard() : boardFrom(pieces),
    turn: o.turn || "w",
    castling: o.castling || { K:false, Q:false, k:false, q:false },
    ep: o.ep ? sq(o.ep) : null,
    half: 0, caps: { w: [], b: [] }, hist: [], last: null
  };
}
/* fast reverse attack check */
function attacked(board, t, by) {
  const r = rowOf(t), c = colOf(t);
  const pr = by === "w" ? r + 1 : r - 1;
  for (const dc of [-1, 1]) {
    if (onB(pr, c + dc)) {
      const p = board[pr * 8 + c + dc];
      if (p && p.c === by && p.t === "p") return true;
    }
  }
  for (const [dr, dc] of KN) {
    if (onB(r + dr, c + dc)) {
      const p = board[(r + dr) * 8 + c + dc];
      if (p && p.c === by && p.t === "n") return true;
    }
  }
  for (const [dr, dc] of KM) {
    if (onB(r + dr, c + dc)) {
      const p = board[(r + dr) * 8 + c + dc];
      if (p && p.c === by && p.t === "k") return true;
    }
  }
  for (const [dr, dc] of RD) {
    let rr = r + dr, cc = c + dc;
    while (onB(rr, cc)) {
      const p = board[rr * 8 + cc];
      if (p) { if (p.c === by && (p.t === "r" || p.t === "q")) return true; break; }
      rr += dr; cc += dc;
    }
  }
  for (const [dr, dc] of BD) {
    let rr = r + dr, cc = c + dc;
    while (onB(rr, cc)) {
      const p = board[rr * 8 + cc];
      if (p) { if (p.c === by && (p.t === "b" || p.t === "q")) return true; break; }
      rr += dr; cc += dc;
    }
  }
  return false;
}
/* squares a piece strikes (for display / marking) */
function attacksFrom(board, i) {
  const p = board[i]; if (!p) return [];
  const r = rowOf(i), c = colOf(i), out = [];
  const push = (rr, cc) => { if (onB(rr, cc)) out.push(rr * 8 + cc); };
  if (p.t === "p") {
    const d = p.c === "w" ? -1 : 1;
    push(r + d, c - 1); push(r + d, c + 1);
  } else if (p.t === "n") {
    for (const [dr, dc] of KN) push(r + dr, c + dc);
  } else if (p.t === "k") {
    for (const [dr, dc] of KM) push(r + dr, c + dc);
  } else {
    const dirs = p.t === "r" ? RD : p.t === "b" ? BD : RD.concat(BD);
    for (const [dr, dc] of dirs) {
      let rr = r + dr, cc = c + dc;
      while (onB(rr, cc)) {
        out.push(rr * 8 + cc);
        if (board[rr * 8 + cc]) break;
        rr += dr; cc += dc;
      }
    }
  }
  return out;
}
function kingIdx(board, col) {
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (p && p.t === "k" && p.c === col) return i;
  }
  return -1;
}
function inCheck(state, col) {
  const k = kingIdx(state.board, col);
  if (k < 0) return false;
  return attacked(state.board, k, col === "w" ? "b" : "w");
}
function pseudo(state, i) {
  const { board, ep, castling } = state;
  const p = board[i]; const r = rowOf(i), c = colOf(i); const out = [];
  const add = (to, extra) => out.push(Object.assign({ from: i, to }, extra || {}));
  if (p.t === "p") {
    const d = p.c === "w" ? -1 : 1;
    const startR = p.c === "w" ? 6 : 1;
    const promoR = p.c === "w" ? 0 : 7;
    if (onB(r + d, c) && !board[(r + d) * 8 + c]) {
      add((r + d) * 8 + c, r + d === promoR ? { promo: "q" } : null);
      if (r === startR && !board[(r + 2 * d) * 8 + c]) add((r + 2 * d) * 8 + c, { dbl: true });
    }
    for (const dc of [-1, 1]) {
      const rr = r + d, cc = c + dc;
      if (!onB(rr, cc)) continue;
      const t = rr * 8 + cc;
      if (board[t] && board[t].c !== p.c) add(t, rr === promoR ? { promo: "q", cap: true } : { cap: true });
      else if (ep === t && !board[t]) add(t, { ep: true, cap: true });
    }
  } else if (p.t === "n") {
    for (const [dr, dc] of KN) {
      if (!onB(r + dr, c + dc)) continue;
      const t = (r + dr) * 8 + c + dc;
      if (!board[t]) add(t);
      else if (board[t].c !== p.c) add(t, { cap: true });
    }
  } else if (p.t === "k") {
    for (const [dr, dc] of KM) {
      if (!onB(r + dr, c + dc)) continue;
      const t = (r + dr) * 8 + c + dc;
      if (!board[t]) add(t);
      else if (board[t].c !== p.c) add(t, { cap: true });
    }
    const enemy = p.c === "w" ? "b" : "w";
    const home = p.c === "w" ? 60 : 4; /* e1 / e8 */
    if (i === home) {
      const kR = p.c === "w" ? castling.K : castling.k;
      const qR = p.c === "w" ? castling.Q : castling.q;
      const rk = p.c === "w" ? 63 : 7, ra = p.c === "w" ? 56 : 0;
      if (kR && !board[home + 1] && !board[home + 2] &&
          board[rk] && board[rk].t === "r" && board[rk].c === p.c &&
          !attacked(board, home, enemy) && !attacked(board, home + 1, enemy) && !attacked(board, home + 2, enemy)) {
        add(home + 2, { castle: "K" });
      }
      if (qR && !board[home - 1] && !board[home - 2] && !board[home - 3] &&
          board[ra] && board[ra].t === "r" && board[ra].c === p.c &&
          !attacked(board, home, enemy) && !attacked(board, home - 1, enemy) && !attacked(board, home - 2, enemy)) {
        add(home - 2, { castle: "Q" });
      }
    }
  } else {
    const dirs = p.t === "r" ? RD : p.t === "b" ? BD : RD.concat(BD);
    for (const [dr, dc] of dirs) {
      let rr = r + dr, cc = c + dc;
      while (onB(rr, cc)) {
        const t = rr * 8 + cc;
        if (!board[t]) add(t);
        else { if (board[t].c !== p.c) add(t, { cap: true }); break; }
        rr += dr; cc += dc;
      }
    }
  }
  return out;
}
function san(state, m, captured) {
  const p = state.board[m.from];
  if (m.castle) return m.castle === "K" ? "O-O" : "O-O-O";
  return GLYPH[p.t] + " " + nameOf(m.from) + (captured ? "\u00D7" : "-") + nameOf(m.to) + (m.promo ? "=\u265B" : "");
}
function apply(state, m) {
  const b = state.board.slice();
  const p = b[m.from];
  const enemy = p.c === "w" ? "b" : "w";
  let captured = b[m.to];
  if (m.ep) {
    const capSq = m.to + (p.c === "w" ? 8 : -8);
    captured = b[capSq]; b[capSq] = null;
  }
  b[m.to] = m.promo ? { c: p.c, t: m.promo } : p;
  b[m.from] = null;
  if (m.castle === "K") { const h = p.c === "w" ? 63 : 7; b[m.to - 1] = b[h]; b[h] = null; }
  if (m.castle === "Q") { const a = p.c === "w" ? 56 : 0; b[m.to + 1] = b[a]; b[a] = null; }
  const cr = Object.assign({}, state.castling);
  if (p.t === "k") { if (p.c === "w") { cr.K = false; cr.Q = false; } else { cr.k = false; cr.q = false; } }
  for (const idx of [m.from, m.to]) {
    if (idx === 63) cr.K = false; if (idx === 56) cr.Q = false;
    if (idx === 7) cr.k = false; if (idx === 0) cr.q = false;
  }
  const caps = { w: state.caps.w.slice(), b: state.caps.b.slice() };
  if (captured) caps[p.c].push(captured);
  return {
    board: b, turn: enemy, castling: cr,
    ep: m.dbl ? (m.from + m.to) / 2 : null,
    half: (p.t === "p" || captured) ? 0 : state.half + 1,
    caps, hist: state.hist.concat([san(state, m, captured)]),
    last: [m.from, m.to]
  };
}
function legalMoves(state) {
  const out = [];
  for (let i = 0; i < 64; i++) {
    const p = state.board[i];
    if (!p || p.c !== state.turn) continue;
    for (const m of pseudo(state, i)) {
      if (!inCheck(apply(state, m), state.turn)) out.push(m);
    }
  }
  return out;
}
function statusOf(state) {
  const ms = legalMoves(state);
  if (ms.length === 0) return inCheck(state, state.turn) ? "checkmate" : "stalemate";
  const rest = [];
  for (let i = 0; i < 64; i++) { const p = state.board[i]; if (p && p.t !== "k") rest.push(p); }
  if (rest.length === 0) return "draw";
  if (rest.length === 1 && (rest[0].t === "b" || rest[0].t === "n")) return "draw";
  if (state.half >= 100) return "draw";
  return "play";
}
/* ---------------- the Pale Automaton (AI) ---------------- */
const VAL = { p: 100, n: 310, b: 330, r: 500, q: 900, k: 0 };
function evalB(board) {
  let s = 0;
  for (let i = 0; i < 64; i++) {
    const p = board[i]; if (!p) continue;
    let v = VAL[p.t];
    const r = rowOf(i), c = colOf(i);
    const cd = Math.max(Math.abs(r - 3.5), Math.abs(c - 3.5));
    if (p.t === "n" || p.t === "b" || p.t === "p") v += (3.5 - cd) * 6;
    if (p.t === "p") v += (p.c === "w" ? (6 - r) : (r - 1)) * 2;
    s += p.c === "w" ? v : -v;
  }
  return s;
}
function nega(st, depth) {
  const ms = legalMoves(st);
  if (ms.length === 0) return inCheck(st, st.turn) ? (-100000 - depth * 1000) : 0;
  if (depth === 0) { const e = evalB(st.board); return st.turn === "w" ? e : -e; }
  let best = -Infinity;
  for (const m of ms) {
    const sc = -nega(apply(st, m), depth - 1);
    if (sc > best) best = sc;
  }
  return best;
}
function bestMove(state, depth) {
  const d = depth || 2;
  const ms = legalMoves(state);
  if (ms.length === 0) return null;
  let scored = ms.map((m) => ({ m, s: -nega(apply(state, m), d - 1) + Math.random() * 8 }));
  scored.sort((a, b) => b.s - a.s);
  return scored[0].m;
}
const cheb = (a, b) => Math.max(Math.abs(rowOf(a) - rowOf(b)), Math.abs(colOf(a) - colOf(b)));

/* CURRICULUM, 18 pages, 4 chapters Exercise types: find {targets:[names]} , click named squares trace {from, path:[names]} , click along the true path mark {from, mode:"moves"|"strikes"|"ring"}, mark every star move {ok:{kind...}, altMsgs?, demo?} , cast a real legal move */
const CHAPTERS = [
  { n: 1, title: "The Pieces", sub: "The board, the six pieces, and how each one moves." },
  { n: 2, title: "Laws of the Game", sub: "Check, mate, castling, promotion, and the half point." },
  { n: 3, title: "The Tactics", sub: "Value, forks, pins, and skewers." },
  { n: 4, title: "Openings and Endings", sub: "How games begin, and how they end." }
];

const CONCEPTS = [
  /* ---------- CHAPTER 1 ---------- */
  {
    id: "board", ch: 1, name: "The Map of Sixty-Four",
    lockedHint: "Every square on the board is named. Learn the names.",
    depth: [
      "The four center squares, d4, e4, d5, e5, are the thrones of the board. Nearly every opening argument is about who sits there.",
      "The two long diagonals, a1 to h8 and h1 to a8, are the great diagonals of the bishops. When one opens fully, someone is usually about to be hurt.",
      "Strong players do not calculate square names. They feel that f7 is beside the enemy king. That feeling is built exactly the way you are building it.",
    ],
    intro: "Before you can play, you have to read. Eight files, a through h, walk left to right. Eight ranks, 1 to 8, climb toward the enemy. A square's name is file then rank. That is the whole alphabet.",
    hook: {
      plain: "File letter first, rank number second: e4 means column e, row 4.",
      image: "A quiet neighborhood at dusk: lettered streets one way, numbered ones the other, and every corner has its name on the sign.",
      when: "Any time anyone says a square out loud, your eyes should land on it within one breath, without counting from a1."
    },
    dues: "Tonight, open lichess.org/training/coordinate (free, no account) and play the coordinates trainer for five minutes. Score does not matter. Landing without counting does.",
    contexts: [
      { setting: "The Club Floor", flavor: "A single square on the club floor waits to be named back.",
        explain: "Files run a to h from your left; find the file first, then climb the rank.",
        ex: { type: "find", pieces: [["e1","wK"],["e8","bK"]], targets: ["e4","c6"] } },
      { setting: "The Coordinates", flavor: "Call each square by its name, one after another, against the clock in your head.",
        explain: "Low numbers live near you; high numbers live near the enemy's edge.",
        ex: { type: "find", pieces: [["e1","wK"],["e8","bK"]], targets: ["b2","g7","d5"] } },
      { setting: "The Whispering Archive", flavor: "A locked drawer opens only for the reader who touches the exact square written on its tag.",
        explain: "Corners anchor everything: a1 is your left hand, h8 is the enemy's far right.",
        ex: { type: "find", pieces: [["e1","wK"],["e8","bK"]], targets: ["h3","a7","f2"] } }
    ]
  },
  {
    id: "pawn", ch: 1, name: "The Soul of Chess",
    lockedHint: "Small soldiers that march ahead but bite aslant.",
    depth: [
      "Pawns are the only pieces that can never step backward. Every pawn push is permanent, treat each one like ink, not pencil.",
      "Pawns standing diagonally, each guarding the next, form a chain: the strongest wall in chess. Two pawns stacked on one file are doubled, a scar that never fully heals.",
      "The whole shape of a game is written in its pawns. Masters read the pawn skeleton first and the pieces second.",
    ],
    intro: "The pawn is the smallest piece and the soul of the game. It walks straight, one square. It strikes only diagonally. On its very first step it may leap two.",
    hook: {
      plain: "Pawns walk forward one, capture diagonally one, and may jump two on their first move only.",
      image: "Someone walking a narrow lane who only ever reaches out to either side, and never to the person straight ahead of them.",
      when: "Before pushing any pawn, glance at both its forward diagonals: those are its teeth, and the enemy's teeth mirror them."
    },
    dues: "Play one game against the weakest computer on lichess.org (Play, then Computer, level 1). Every time you touch a pawn, say out loud: walk or bite?",
    contexts: [
      { setting: "The Garden Gate", flavor: "A young pawn stands at its gate, first march of its life.",
        explain: "From its home square a pawn may step one forward or leap two; both squares must be empty.",
        ex: { type: "mark", pieces: [["e2","wP"],["g1","wK"],["a8","bK"]], from: "e2", mode: "moves" } },
      { setting: "The Dusk Market", flavor: "Two shadows crowd the stall; the pawn may only bite what stands on its shoulders.",
        explain: "A pawn captures one square diagonally forward, never straight ahead.",
        ex: { type: "mark", pieces: [["d4","wP"],["c5","bN"],["e5","bP"],["g1","wK"],["a8","bK"]], from: "d4", mode: "moves" } },
      { setting: "The Diagonal Strike", flavor: "A bishop drifts within reach; strike as a pawn strikes.",
        explain: "When an enemy stands on your pawn's forward diagonal, the pawn may take its place.",
        ex: { type: "move", pieces: [["e4","wP"],["d5","bB"],["g1","wK"],["a8","bK"]], ok: { kind: "captureOn", sq: "d5" },
          prompt: "Capture the bishop with your pawn.", success: "The pawn bites aslant, exactly as it was born to." } }
    ]
  },
  {
    id: "rook", ch: 1, name: "The Rook's Road",
    lockedHint: "A rook that runs only on straight lines.",
    depth: [
      "Towers starve behind their own pawns. Give them open files, files with no pawns at all, and they become the strongest workers you own.",
      "A rook that reaches the enemy's second rank eats pawns like bread and traps the king on its back row. The seventh rank is called the feasting rank for a reason.",
      "When both your rooks stand on one file protecting each other, they are connected. Connected rooks argue twice as loudly.",
    ],
    intro: "The rook moves any distance along ranks and files. Straight lines, as far as the path is clear. It cannot leap what stands in the way.",
    hook: {
      plain: "Rooks slide any number of squares horizontally or vertically, stopping before friends and on top of enemies.",
      image: "A trolley on a long straight track: it rolls down the row or the column as far as it likes, and stops when something is parked in the way.",
      when: "When you see two pieces on the same rank or file with nothing between them, ask what a rook would do with that line."
    },
    dues: "Open lichess.org/learn and finish the Rook lesson. It takes three minutes and your hands will remember it longer than your eyes.",
    contexts: [
      { setting: "The Clocktower", flavor: "The rook climbs the c-file square by square; trace each square it touches.",
        explain: "A rook's path is every square along its straight line, in order.",
        ex: { type: "trace", pieces: [["c2","wR"],["g1","wK"],["a8","bK"]], from: "c2", path: ["c3","c4","c5"] } },
      { setting: "The Crowded Crossroads", flavor: "Friends and foes crowd the lines; mark every square the rook may reach this turn.",
        explain: "The line stops before a friend and lands on the first enemy.",
        ex: { type: "mark", pieces: [["d5","wR"],["d7","wP"],["b5","bN"],["g5","bB"],["d3","bP"],["g1","wK"],["a8","bK"]], from: "d5", mode: "moves" } },
      { setting: "The Open File", flavor: "An intruder waits at the far end of an open file.",
        explain: "An open line is a drawn bow: the rook crosses it in one motion.",
        ex: { type: "move", pieces: [["e1","wR"],["e6","bB"],["g1","wK"],["a8","bK"]], ok: { kind: "captureOn", sq: "e6" },
          prompt: "Send the rook down the open file.", success: "Five squares in one move. Open files are power." } }
    ]
  },
  {
    id: "bishop", ch: 1, name: "The Bishop's Diagonal",
    lockedHint: "It never leaves its own color.",
    depth: [
      "A bishop whose own pawns sit on its color is called a bad bishop, walled in by its own family. Keep your pawns off your best bishop's color when you can.",
      "Tucking a bishop onto b2 or g2 behind a small pawn-notch is called a fianchetto: from there it watches a whole long diagonal all game.",
      "One bishop sees only half the world, but the pair sees all of it. Two bishops together are worth slightly more than the sum of their parts.",
    ],
    intro: "The bishop glides any distance along diagonals. It lives its whole life on one color of square. Half the board is always open to it, and half is closed forever.",
    hook: {
      plain: "Bishops slide any number of squares diagonally and remain on their starting color for the whole game.",
      image: "A skater on a checkered pond who only ever glides corner to corner, so they spend the whole afternoon on one color and never once touch the other.",
      when: "Before moving a bishop, note its color: anything on the other color simply does not exist for it."
    },
    dues: "Open lichess.org/learn and finish the Bishop lesson, then look at any full board and point to which enemy pieces your light-squared bishop could ever touch.",
    contexts: [
      { setting: "The Glasswood", flavor: "The bishop leaves its home square and glides down the long light diagonal to the wood's far edge.",
        explain: "A diagonal path changes file and rank together, one step each, every square.",
        ex: { type: "trace", pieces: [["f1","wB"],["g1","wK"],["e8","bK"]], from: "f1", path: ["e2","d3","c4","b5","a6"] } },
      { setting: "The Dusk Market", flavor: "Stalls block some aisles; mark every square it can reach.",
        explain: "Like all sliders, it stops at friendly pieces and captures the first enemy it meets.",
        ex: { type: "mark", pieces: [["d4","wB"],["f6","wP"],["b6","bP"],["g1","wK"],["a8","bK"]], from: "d4", mode: "moves" } },
      { setting: "The Long Diagonal", flavor: "A knight rests four squares up the dark diagonal.",
        explain: "If a clear diagonal joins you to an enemy, the bishop may claim it in one glide.",
        ex: { type: "move", pieces: [["c1","wB"],["g5","bN"],["g1","wK"],["a8","bK"]], ok: { kind: "captureOn", sq: "g5" },
          prompt: "Let the bishop claim the diagonal.", success: "It never left its color. It never will." } }
    ]
  },
  {
    id: "knight", ch: 1, name: "The Knight's Leap",
    lockedHint: "The only piece that leaps over walls.",
    depth: [
      "A hole in the enemy pawns that their pawns can never bite again is an outpost. A knight planted on an outpost near their king is worth a rook.",
      "The rim is grim: a knight on the edge sees four stars, in the corner only two. Every knight belongs in the middle of the night sky.",
      "Knights are the slowest pieces, three hops to cross the board. Move them EARLY, so they arrive before the argument starts.",
    ],
    intro: "The knight moves two squares one way, then one square sideways, and it leaps: nothing standing between matters. It is the only piece that ignores walls.",
    hook: {
      plain: "Knights move in an L, two then one, jumping over anything, always landing on the opposite color.",
      image: "A knight wandering over hedgerows by moonlight, in no particular hurry, with eight easy places to come down, like small stars around it.",
      when: "Whenever an enemy knight comes near your pieces, pause and count its landing stars before you move anything."
    },
    dues: "Open lichess.org/learn and finish the Knight lesson. Then, on any diagram, cover a knight with your finger and name its landing squares before you peek.",
    contexts: [
      { setting: "The Club Roof", flavor: "From the center of the night sky, the knight sees all eight of its stars.",
        explain: "A centered knight always has eight landings: count two-then-one in every direction.",
        ex: { type: "mark", pieces: [["d4","wN"],["g1","wK"],["a8","bK"]], from: "d4", mode: "moves" } },
      { setting: "The Hedge Edge", flavor: "Pressed against the world's rim, half its stars fall off the map.",
        explain: "Knights on the edge see few stars; keep your knight near the middle where it is strongest.",
        ex: { type: "mark", pieces: [["a4","wN"],["g1","wK"],["h8","bK"]], from: "a4", mode: "moves" } },
      { setting: "The Walled Court", flavor: "A bishop hides behind your own wall of pawns; only one piece can reach over.",
        explain: "The leap ignores every wall: the knight alone attacks over other pieces.",
        ex: { type: "move", pieces: [["g1","wN"],["f2","wP"],["g2","wP"],["h2","wP"],["e1","wK"],["f3","bB"],["a8","bK"]],
          ok: { kind: "captureBy", t: "n" },
          prompt: "Strike over the wall with your knight.", success: "Walls mean nothing to the knight. Remember that when walls are all you have." } }
    ]
  },
  {
    id: "queen", ch: 1, name: "The Queen's Reach",
    lockedHint: "Tower and bishop, wed beneath one crown.",
    depth: [
      "Bringing the queen out early feels strong and is almost always weak: every enemy piece that attacks her develops itself for free while she runs.",
      "Her price is her burden, she can almost never trade with profit, so she must strike only what is loose or undefended.",
      "Late in the game, when the board empties, she transforms: from a cautious treasure into a herding, checking, unstoppable storm.",
    ],
    intro: "The queen moves as rook and bishop together: any distance, straight or diagonal. She is your strongest piece, and the one your enemy most wants to bait.",
    hook: {
      plain: "The queen combines rook and bishop: any number of squares in any straight or diagonal line.",
      image: "Someone standing at a crossroads where eight roads lead away, and she can see clear to the end of every one.",
      when: "When you cannot find a plan, trace all eight of your queen's lines; when your queen is attacked, do the same for the attacker first."
    },
    dues: "Open lichess.org/learn and finish the Queen lesson. In your next computer game, do not bring her out until at least two other pieces have moved.",
    contexts: [
      { setting: "The Clocktower Stair", flavor: "She climbs the straight line, then turns and glides the diagonal, both dialects in one voice.",
        explain: "Every queen move is secretly a rook move or a bishop move; she simply owns both books.",
        ex: { type: "trace", pieces: [["d1","wQ"],["g1","wK"],["a8","bK"]], from: "d1", path: ["d2","d3","d4","e5","f6","g7"] } },
      { setting: "The Crowded Court", flavor: "Her own retinue narrows the lines; mark all that remains open to her.",
        explain: "Even the queen stops before friends: crowded courts shrink her.",
        ex: { type: "mark", pieces: [["d4","wQ"],["c4","wP"],["e3","wP"],["d6","wP"],["c3","wN"],["e5","wB"],["g1","wK"],["a8","bK"]], from: "d4", mode: "moves" } },
      { setting: "The Glasswood", flavor: "A knight strays onto her diagonal, alone and unguarded.",
        explain: "Her reach means she punishes anything left loose on any of her eight lines.",
        ex: { type: "move", pieces: [["d1","wQ"],["g4","bN"],["g1","wK"],["a8","bK"]], ok: { kind: "captureOn", sq: "g4" },
          prompt: "Let the queen collect what was left unguarded.", success: "Loose pieces drift toward her like moths. Yours will too, if you leave them loose." } }
    ]
  },
  {
    id: "king", ch: 1, name: "The King's Two Lives",
    lockedHint: "The king. Lose it and the game is over.",
    depth: [
      "The king lives two lives. In the opening and middle he is a liability to be walled away; in the ending he becomes a fighting piece worth roughly four points.",
      "Most beginner disasters begin with an uncastled king on an opening file. Bar the keep before the center opens, every game.",
      "In endings, the side whose king marches first usually wins. When the queens leave the board, wake him up.",
    ],
    intro: "The king steps one square in any direction, and it may never step into fire. Every other piece can be spent. This one cannot. The whole game is its heartbeat.",
    hook: {
      plain: "The king moves one square any direction, may never move into an attacked square, and two kings can never stand side by side.",
      image: "One easy step at a time, and never onto a square somebody else is watching.",
      when: "Before every king move, mark every square the enemy attacks, and step only on the safe ones."
    },
    dues: "Open lichess.org/learn and finish Protect the King and Piece Checkmates basics. In your next game, keep your king behind pawns until the board empties.",
    contexts: [
      { setting: "The Burning Field", flavor: "An enemy rook rakes one line; mark every safe square the king may take.",
        explain: "The king's legal squares are its neighbors minus everything the enemy attacks.",
        ex: { type: "mark", pieces: [["e4","wK"],["d8","bR"],["a8","bK"]], from: "e4", mode: "moves" } },
      { setting: "The Long Diagonal", flavor: "A bishop's gaze pins the king in place; it must step out of the light.",
        explain: "When the king stands in fire, it must reach a cold square at once.",
        ex: { type: "move", pieces: [["e5","wK"],["b2","bB"],["a8","bK"],["a7","bP"]], ok: { kind: "any" },
          prompt: "Step the king out of the bishop's line.", success: "One square. That is all it ever needs, if you check the attacker's reach before you step." } },
      { setting: "The Two Kings", flavor: "The enemy king approaches; the two kings may never stand on adjacent squares.",
        explain: "Kings project fear one square around them, so two kings can never stand adjacent.",
        ex: { type: "mark", pieces: [["e4","wK"],["e6","bK"]], from: "e4", mode: "moves" } }
    ]
  },
  /* ---------- CHAPTER 2 ---------- */
  {
    id: "check", ch: 2, name: "The Alarm",
    lockedHint: "When the king is threatened, everything else stops.",
    depth: [
      "A discovered check is when moving one piece unveils another's line onto the king, the moved piece may then do anything it likes, with total impunity.",
      "A double check, two attackers at once, allows exactly one answer: the king must move. No block, no capture can silence two bells.",
      "Never say check aloud expecting fear. Ask instead: does this check GAIN something, time, material, position, or does it just help his king find a better home?",
    ],
    intro: "When an enemy piece attacks your king, the alarm sounds: that is check. You must answer it this very move. There are exactly three answers: move the king, block the line, or capture the attacker.",
    hook: {
      plain: "In check you must immediately move the king, block the attack, or capture the checker; nothing else is legal.",
      image: "Someone at your shoulder, and exactly three doors out of it: step aside, put something in the way, or deal with them. Three doors, and that is the whole list.",
      when: "When you hear check, run the three doors in order: move, block, capture, and test each one."
    },
    dues: "Open lichess.org/learn and finish Check in One. Say move, block, capture out loud before solving each position.",
    contexts: [
      { setting: "The Empty Hall", flavor: "The alarm rings and the king stands alone; only one kind of door exists tonight.",
        explain: "The first door: step the king to any cold square.",
        ex: { type: "move", pieces: [["e1","wK"],["e8","bR"],["a8","bK"]], ok: { kind: "any" },
          prompt: "The alarm sounds. Move the king to safety.", success: "Door one: the king walks. Simple, and sometimes the only door there is." } },
      { setting: "The Shield Bearer", flavor: "This time a bishop stands ready to throw herself across the line.",
        explain: "The second door: put one of your own pieces between the attacker and your king.",
        ex: { type: "move", pieces: [["e1","wK"],["d3","wB"],["e8","bR"],["a8","bK"]], ok: { kind: "block" },
          prompt: "Block the rook's line with the bishop.", success: "Door two: put a body in the way. The bishop holds the line so the king need not run." } },
      { setting: "The Counterstrike", flavor: "The attacker has wandered too close; a knight crouches within leaping distance.",
        explain: "The third door: capture the checking piece and the alarm dies with it.",
        ex: { type: "move", pieces: [["e1","wK"],["d3","wN"],["e5","bR"],["a8","bK"]], ok: { kind: "captureOn", sq: "e5" },
          prompt: "Silence the alarm: capture the checker.", success: "Door three: no attacker, no alarm. The cleanest answer when it exists." } }
    ]
  },
  {
    id: "mate", ch: 2, name: "The Final Word",
    lockedHint: "The word that ends the conversation.",
    depth: [
      "Learn mates by name: the back-rank (his own wall betrays him), the ladder (two heavy pieces climbing), the guarded touch (queen beside the king, protected).",
      "The smothered mate is the knight's masterpiece: a king buried alive by his own courtiers, sealed by a single knight. Look it up tonight, it will make you gasp.",
      "Every mate is the same sentence written differently: check, and all three doors bricked. Count doors, always, before you announce anything.",
    ],
    intro: "Checkmate is check with all three doors bricked shut: the king cannot move, nothing can block, nothing can capture. The game ends there, instantly. Every plan you'll ever make points at this.",
    hook: {
      plain: "Checkmate means the king is in check and has no legal reply: no move, no block, no capture.",
      image: "The same someone at your shoulder, except you try all three doors and every one of them is shut. Nothing dramatic; the game just ends.",
      when: "Before calling any check a mate, walk the three doors one by one; before your opponent does, check their doors too."
    },
    dues: "Do five puzzles at lichess.org/training/mateIn1. For each, name which of the three doors is shut and why.",
    contexts: [
      { setting: "The Sleeping Wall", flavor: "The enemy king sleeps behind its own unmoved pawns; a rook owns the open a-file.",
        explain: "The back-rank mate: the king's own pawns brick the escape doors for you.",
        ex: { type: "move", pieces: [["a1","wR"],["g8","bK"],["f7","bP"],["g7","bP"],["h7","bP"],["g1","wK"]], ok: { kind: "mate" },
          prompt: "Deliver the Final Seal along the back rank.", success: "Its own wall became its tomb. Watch your own back rank for the same sleep." } },
      { setting: "The Corner Vigil", flavor: "The enemy king is pressed to the corner with a single pawn for company.",
        explain: "A queen landing on the back rank closes both the rank and the fleeing diagonal at once.",
        ex: { type: "move", pieces: [["a3","wQ"],["h8","bK"],["h7","bP"],["g1","wK"]], ok: { kind: "mate" },
          prompt: "Close the corner with your queen.", success: "One arrival, two paths closed. The queen seals both escape squares at once." } },
      { setting: "The Escort", flavor: "A knight stands guard so the queen may lay her hand directly on the enemy king.",
        explain: "A queen touching the enemy king mates if she is defended, because capturing her is forbidden.",
        ex: { type: "move", pieces: [["a7","wQ"],["f5","wN"],["h8","bK"],["h7","bP"],["g1","wK"]], ok: { kind: "mate" },
          prompt: "Lay the guarded hand upon the king.", success: "It cannot take her: the knight watches. A guarded touch is the simplest mate there is." } },
      { setting: "The Full Requiem", flavor: "Two rooks, one wandering king, and no script to follow: drive it to the edge, rung by rung.",
        explain: "The ladder in full: one rook fences a rank while the other checks the next, alternating until the king runs out of board.",
        ex: { type: "duel", pieces: [["a1","wR"],["b2","wR"],["g1","wK"],["e5","bK"]], goal: "mate", moveLimit: 12,
          prompt: "Play the whole ladder yourself. Fence, check, climb.",
          moveHint: "If the king charges a rook, slide that rook to the far side of the SAME rank, the fence holds from any distance.",
          successText: "Rung by rung to silence, with no script at all. You will win real games with exactly this. I promise, and I do not promise often." } }
    ]
  },
  {
    id: "castle", ch: 2, name: "The Safe Harbor",
    lockedHint: "One move shifts king and rook at once.",
    depth: [
      "Castle kingside for safety and speed; queenside for aggression, it frees your rook toward the center faster but leaves the a-pawn loose.",
      "When the two players castle on opposite sides, the game becomes a footrace of pawn storms at each other's kings. Thrilling, and not for move ten of your career.",
      "Delay castling only for a reason you can say out loud. Hoping is not a reason.",
    ],
    intro: "Once per game, if king and rook have never moved, they may castle: the king steps two toward the rook and the rook leaps to his far side. One move, two pieces, and the king is home behind walls.",
    hook: {
      plain: "Castling: king moves two squares toward an unmoved rook and the rook lands beside him; illegal if either has moved, the path is blocked, or the king crosses attacked squares.",
      image: "King and rook quietly swapping seats in one move, and the king settles in behind the door.",
      when: "In every game, plan to castle before move ten, and check the path for enemy attacks before you begin."
    },
    dues: "In your next three computer games, castle before move ten in every one of them. No exceptions, even when it feels slow.",
    contexts: [
      { setting: "The Short Castle", flavor: "The king's side stands clear; castle toward the near rook.",
        explain: "Kingside castling: king from e1 to g1, rook from h1 to f1, one single move.",
        ex: { type: "move", opts: { castling: { K: true, Q: false, k: false, q: false } },
          pieces: [["e1","wK"],["h1","wR"],["e4","wP"],["f2","wP"],["g2","wP"],["h2","wP"],["f3","wN"],["c4","wB"],["e8","bK"],["e5","bP"],["c6","bN"]],
          ok: { kind: "castle", side: "K" }, moveHint: "Click your King, then the square g1.",
          prompt: "Castle kingside.", success: "King and rook in one motion. Your king now sleeps behind its pawns." } },
      { setting: "The Long Castle", flavor: "Tonight the near side is blocked; the castle must run the long way.",
        explain: "Queenside castling: king from e1 to c1, rook from a1 to d1; the longer path, same protection.",
        ex: { type: "move", opts: { castling: { K: false, Q: true, k: false, q: false } },
          pieces: [["e1","wK"],["a1","wR"],["f1","wB"],["h1","wR"],["a2","wP"],["b2","wP"],["c2","wP"],["d4","wP"],["d2","wQ"],["e8","bK"],["d5","bP"]],
          ok: { kind: "castle", side: "Q" }, moveHint: "Click your King, then the square c1.",
          prompt: "Castle queenside.", success: "The long way home is still a way home." } },
      { setting: "The Burning Door", flavor: "A distant bishop attacks one crossing square; only one castle remains legal.",
        explain: "The king may not castle through an attacked square: an attack on the path forbids the castle.",
        ex: { type: "move", opts: { castling: { K: true, Q: true, k: false, q: false } },
          pieces: [["e1","wK"],["a1","wR"],["h1","wR"],["a2","wP"],["b2","wP"],["f2","wP"],["g2","wP"],["h2","wP"],["e4","wP"],["a6","bB"],["e8","bK"]],
          ok: { kind: "castle", side: "Q" }, moveHint: "The kingside path is attacked at f1. Castle the other way.",
          prompt: "One path is attacked. Play the castle that remains.", success: "You saw the attack before you stepped. That habit will save you a hundred games." } }
    ]
  },
  {
    id: "promotion", ch: 2, name: "The Eighth Rank",
    lockedHint: "The smallest piece can become a queen.",
    depth: [
      "You may promote to ANY piece, not only a queen. Once in a hundred games a knight-promotion forks or a rook-promotion dodges stalemate, the underpromotion, rarest of all.",
      "A passed pawn, no enemy pawn can ever block or bite it, is a slow-burning promise. The old saying: passed pawns must be pushed.",
      "The ghost step exists for one reason: so no pawn can leap two squares to sneak PAST an enemy pawn untouched. It closes a loophole in the law.",
    ],
    intro: "Two secret laws belong to the pawns alone. Reach the final rank and one promotes, almost always into a queen. And when an enemy pawn leaps two squares to dodge past yours, for one single move you may strike it as if it had stepped one: the ghost step, en passant.",
    hook: {
      plain: "A pawn reaching the last rank promotes, usually to a queen; en passant lets your pawn capture an enemy pawn that just double-stepped past it, landing behind it, only on the very next move.",
      image: "A pawn strolling the whole file and coming back a queen; and a side door that stays open for exactly one turn before it shuts.",
      when: "Count every pawn past the middle as treasure to escort, and whenever an enemy pawn leaps two past yours, ask about the ghost door before it closes."
    },
    dues: "In a computer game, escort one pawn all the way to promotion. If the ghost door ever opens, step through it once just to feel it.",
    contexts: [
      { setting: "The Final Door", flavor: "One pawn stands a single step from the last rank.",
        explain: "On reaching the eighth rank a pawn transforms at once; here it promotes into a queen.",
        ex: { type: "move", pieces: [["e7","wP"],["g1","wK"],["a8","bK"]], ok: { kind: "promo" },
          prompt: "Walk the pawn through the final door.", success: "Promotion. The smallest piece just became the greatest. This is why endings are about pawns." } },
      { setting: "The Ghost Door", flavor: "An enemy pawn has just leapt two squares to slip past yours; the door stands open this move only.",
        explain: "En passant: your pawn captures the leaper as if it had moved one square, landing behind it.",
        ex: { type: "move", opts: { ep: "d6" }, pieces: [["e5","wP"],["d5","bP"],["e1","wK"],["e8","bK"]], ok: { kind: "ep" },
          moveHint: "Click your pawn on e5, then the empty square d6.",
          prompt: "Step through the ghost door before it closes.", success: "You struck a shadow and a body fell. Next turn, this door would have been closed." } },
      { setting: "The Tollgate", flavor: "A rook blocks the corner of the final rank, directly on your pawn's biting diagonal.",
        explain: "A pawn may capture onto the last rank and promote in the same breath.",
        ex: { type: "move", pieces: [["g7","wP"],["h8","bR"],["a8","bK"],["g1","wK"]], ok: { kind: "promoCap" },
          altMsgs: { "g7g8": "Promoting is good. Promoting while toppling the rook is better. Take h8." },
          prompt: "Take the toll: capture and promote at once.", success: "A rook fell and a queen rose in the same instant. Nothing in chess pays better." } }
    ]
  },
  {
    id: "truce", ch: 2, name: "The Half Point",
    lockedHint: "Not every ending is a victory. Some are only grey.",
    depth: [
      "Beyond stalemate, three more grey doors: the same position appearing three times, fifty moves passing with no capture or pawn move, and both sides simply agreeing.",
      "Perpetual check is the loser's escape rope, an endless chain of checks the enemy can never stop. When you are losing badly, hunt for one.",
      "Draws are not shameful. Half a point stolen from a stronger player is one of the sweetest tastes in chess.",
    ],
    intro: "Some games end in neither triumph nor ruin. If a player has no legal move but is not in check, the board freezes grey: stalemate, a draw. Bare kings that can never mate each other also draw. Learn the grey, or it will steal your won games.",
    hook: {
      plain: "Stalemate: no legal moves while not in check is a draw; so is bare king versus bare king, or king with only one knight or bishop.",
      image: "The enemy king is in no trouble at all; he simply has nowhere left to put his feet. Nobody wins, and you split the point.",
      when: "Whenever the enemy is down to a lonely king, count his breathing squares out loud before every one of your moves."
    },
    dues: "In your next winning endgame against the computer, pause before each queen move near their king and count his legal squares out loud. If the answer would be zero without check, choose differently.",
    contexts: [
      { setting: "The Statue Garden", flavor: "The enemy king stands untouched yet cannot stir; mark every neighboring square your queen controls.",
        explain: "When you control every square around a king but not the king itself, that is stalemate: a draw, not a win.",
        ex: { type: "mark", pieces: [["f7","wQ"],["f6","wK"],["h8","bK"]], from: "h8", mode: "ring",
          note: "Notice: h8 itself is cold. Frozen but unthreatened means the game is drawn." } },
      { setting: "The Two Doors", flavor: "Two tempting squares glimmer for your queen; one ends the game in gold, one freezes it in grey.",
        explain: "Near a cornered king, always choose the move that gives check and shuts the doors, never the one that merely shuts them.",
        ex: { type: "move", pieces: [["b7","wQ"],["f6","wK"],["h8","bK"]], ok: { kind: "mate" },
          prompt: "Seal in gold. Do not freeze the board.", success: "Check, and no doors. Gold, not grey. Feel the difference in your hands." } },
      { setting: "The Bare Dawn", flavor: "Only the two kings remain, wandering an empty field.",
        explain: "Two bare kings, or a king with only a single knight or bishop, can never force mate: such games are drawn.",
        ex: { type: "mark", pieces: [["d4","wK"],["d6","bK"]], from: "d4", mode: "moves",
          note: "Neither king can ever corner the other alone. This ending is already a truce." } }
    ]
  },
  /* ---------- CHAPTER 3 ---------- */
  {
    id: "value", ch: 3, name: "The Arithmetic",
    lockedHint: "Every piece has a weight. Learn the arithmetic.",
    depth: [
      "Trading a rook for a knight or a bishop is called winning the exchange, roughly two points of profit, enough to win most endings.",
      "The numbers are the grammar, not the poetry. An active knight on an outpost can outweigh a sleeping rook. Count first, then look at what the pieces are actually doing.",
      "Before every trade, ask the ending question: after everything is swapped, whose remaining pieces are happier? Trade toward YOUR happy ending.",
    ],
    intro: "Every piece carries a weight: pawn 1, knight 3, bishop 3, rook 5, queen 9. The king is beyond number. Trade only when the arithmetic smiles on you, and always count the defenders before you reach.",
    hook: {
      plain: "Pawn 1, knight 3, bishop 3, rook 5, queen 9; capture when you gain weight, and check who defends before you take.",
      image: "A kitchen scale on the counter, pieces as the weights, and you just do not make the trade where your side goes up.",
      when: "Before every capture, say both numbers out loud and name every defender of the square you are reaching into."
    },
    dues: "In your next computer game, before every capture say the two numbers aloud, three for five, yes, and skip any trade where your number is bigger.",
    contexts: [
      { setting: "The Weighing Room", flavor: "Two prizes sit in the knight's reach: a rook and an pawn.",
        explain: "When two safe captures exist, take the heavier piece.",
        ex: { type: "move", pieces: [["d3","wN"],["e5","bR"],["c5","bP"],["g1","wK"],["a8","bK"]], ok: { kind: "captureOn", sq: "e5" },
          altMsgs: { "d3c5": "One weight, when five hangs equally free? Weigh again." },
          prompt: "Take the heavier prize.", success: "Five for nothing. The scale sings." } },
      { setting: "The Guarded Vault", flavor: "A rook glitters on an open file, but the enemy king stands one step behind it.",
        explain: "A guarded prize costs you the taker: count defenders before reaching.",
        ex: { type: "move", pieces: [["d1","wQ"],["d7","bR"],["e8","bK"],["h5","bB"],["g1","wK"]], ok: { kind: "captureOn", sq: "h5" },
          altMsgs: { "d1d7": "The rook is guarded by the enemy king: nine for five is a robbery, and you are the one robbed." },
          prompt: "One prize is free and one is bait. Take the free one.", success: "Three for nothing beats five for nine. Arithmetic before appetite." } },
      { setting: "The Long Ledger", flavor: "The bishop may trade evenly at one edge of the board or profit cleanly at the other.",
        explain: "Prefer winning weight outright over trading even, when both are offered.",
        ex: { type: "move", pieces: [["c3","wB"],["h8","bR"],["a5","bN"],["b6","bP"],["e8","bK"],["g1","wK"]], ok: { kind: "captureOn", sq: "h8" },
          altMsgs: { "c3a5": "Three for three, guarded by a pawn: an even trade at best, while a whole rook hangs free across the wood." },
          prompt: "Read the whole ledger, then collect.", success: "The long diagonal paid five. Always read the whole board before signing." } }
    ]
  },
  {
    id: "fork", ch: 3, name: "The Fork",
    lockedHint: "One strike, two wounds.",
    depth: [
      "The royal fork, king and queen skewered on one knight's stars, is the most beloved single move in chess. The family fork takes king, queen, AND rook.",
      "Loose pieces drop off: almost every fork works because something stood undefended. Guard your pieces and half the enemy's snares dissolve.",
      "Hunt fork squares in this order: knight checks near their king first, then pawn advances, then the queen's crossroads.",
    ],
    intro: "A fork is one piece attacking two targets at once. The enemy may save only one. The knight is the master of this snare, because its L-shaped reach is so easy to miss.",
    hook: {
      plain: "A fork attacks two pieces with one move; the opponent saves one and you take the other.",
      image: "One piece that happens to be touching two of theirs at once. They only get to save one of them.",
      when: "Every move, glance for squares from which one of your pieces would touch two loose enemies, especially knight squares near their king."
    },
    dues: "Solve five puzzles at lichess.org/training/fork. Before each solution, name both prongs out loud.",
    contexts: [
      { setting: "The River Fork", flavor: "The knight crouches; one leap forward touches both the enemy king and its far rook.",
        explain: "A knight fork with check is deadliest: they must answer the check and abandon the rest.",
        ex: { type: "exchange", pieces: [["b5","wN"],["e8","bK"],["a8","bR"],["g1","wK"]], steps: [
          { ok: { kind: "list", moves: [["b5","c7"]] }, prompt: "Spring the twin snare with your knight.", success: "Check. The king must answer you, and the rook stands abandoned." },
          { ok: { kind: "capType", ts: ["r"] }, prompt: "It answered, as it had to. Now collect what the snare caught.", success: "Threat, reply, harvest. That second move is the whole point of a fork, a snare unsprung feeds no one." }
        ] } },
      { setting: "The Humble Spear", flavor: "A single pawn steps forward between two grazing knights.",
        explain: "Even a pawn forks: one step can menace two pieces that can never both escape.",
        ex: { type: "exchange", pieces: [["d4","wP"],["c6","bN"],["e6","bN"],["e1","wK"],["e8","bK"]], steps: [
          { ok: { kind: "list", moves: [["d4","d5"]] }, prompt: "Fork the twin knights with one small pawn.", success: "One weight menacing six. Now listen, it can only save one." },
          { ok: { kind: "capType", ts: ["n"] }, prompt: "One knight escaped. The other did not. Take it.", success: "A pawn ate a knight: one point took three. Arithmetic loves a fork, and so should you." }
        ] } },
      { setting: "The Crossroads Queen", flavor: "From one center square, the queen would see a loose rook down one line and a stray knight down another.",
        explain: "The queen forks along any two of her eight lines at once; hunt for the crossroad square.",
        ex: { type: "exchange", pieces: [["d1","wQ"],["h8","bK"],["a8","bR"],["g5","bN"],["g7","bP"],["h7","bP"],["g1","wK"],["a2","wP"],["g2","wP"]], steps: [
          { ok: { kind: "list", moves: [["d1","d5"]] }, prompt: "Find her crossroads and claim it.", success: "Two lines, two prizes, one square. Now hear which one it abandons." },
          { ok: { kind: "capType", ts: ["r","n"] }, prompt: "It saved what it could. Claim whatever was left behind.", success: "The crossroads square wins games, but only for the player who plays the second move too." }
        ] } }
    ]
  },
  {
    id: "pin", ch: 3, name: "The Pin",
    lockedHint: "An attack that forbids movement.",
    depth: [
      "An absolute pin (king behind) means the front piece cannot legally move. A relative pin (queen or rook behind) means it can move, at a price.",
      "The pin itself rarely wins. Piling on, attacking the pinned prisoner again with a pawn or another piece, is what collects.",
      "Break a pin the way you would break a grip: block the line with something cheap, chase the pinner away, or move the treasure off the line.",
    ],
    intro: "A pin is a line of attack through one enemy to something dearer behind it. The front piece dares not move, or must not move at all when the king stands behind. A pinned piece is half a prisoner.",
    hook: {
      plain: "A pin attacks through one piece to a more valuable one behind; the front piece is frozen, absolutely so if the king is behind it.",
      image: "A piece that cannot step aside, because the king is standing right behind it.",
      when: "Look for enemy pieces standing on the same line as their king or queen, then ask which of your sliders could pin along that line."
    },
    dues: "Solve five puzzles at lichess.org/training/pin. For each, say what the front piece is guarding behind it.",
    contexts: [
      { setting: "The Needle and the Crown", flavor: "The enemy knight stands on the same diagonal as its queen.",
        explain: "Pin a piece to the queen and it can only flee by paying nine.",
        ex: { type: "move", pieces: [["c1","wB"],["f6","bN"],["d8","bQ"],["e8","bK"],["g1","wK"]], ok: { kind: "list", moves: [["c1","g5"]] },
          prompt: "Pin the knight to its queen.", success: "It may technically move. It will not. That is the pin." } },
      { setting: "The Iron File", flavor: "An enemy piece and its king share one open file; your rook waits at its mouth.",
        explain: "A pin against the king is absolute: the pinned piece legally cannot move.",
        ex: { type: "move", pieces: [["a1","wR"],["e5","bN"],["e8","bK"],["g1","wK"]], ok: { kind: "list", moves: [["a1","e1"]] },
          prompt: "Pin along the iron file.", success: "Now the knight is left hanging, and it cannot run." } },
      { setting: "The Diagonal Pin", flavor: "The queen sees a diagonal running through the enemy knight straight to the enemy king.",
        explain: "Queens pin along diagonals too; the pin works on every straight line.",
        ex: { type: "move", pieces: [["d1","wQ"],["c6","bN"],["e8","bK"],["g1","wK"]], ok: { kind: "list", moves: [["d1","a4"]] },
          prompt: "Pin the knight to the king.", success: "One pin, and their knight became a wall ornament." } }
    ]
  },
  {
    id: "skewer", ch: 3, name: "The Skewer",
    lockedHint: "Light that pierces the first to reach the second.",
    depth: [
      "Skewers feast on open boards. After the queens and pawns trade off, wandering kings walk onto long lines, late-game rooks live on this.",
      "The x-ray is the skewer's quiet cousin: attacking or defending THROUGH an enemy piece along the same line. It wins endings no one saw coming.",
      "Any check that forces the king off a line should make you ask instantly: what did he just stop guarding, and what stands behind him?",
    ],
    intro: "A skewer is the pin reversed: you attack the dearer piece in front, it must flee, and your light falls on the prize behind it. Where the pin freezes, the skewer chases.",
    hook: {
      plain: "A skewer attacks a valuable front piece; when it moves away, you capture the piece behind it on the same line.",
      image: "A line that runs through the king and out the other side, where something valuable is sitting. He steps away, and you take what was behind him.",
      when: "When the enemy king or queen stands on an open line with treasure behind it, look for the piece that can shine straight down that line."
    },
    dues: "Solve five puzzles at lichess.org/training/skewer. Whisper front piece runs, back piece falls before each answer.",
    contexts: [
      { setting: "The Wandering King", flavor: "The enemy king has strayed onto an open file, its rook far behind on the same line.",
        explain: "Check the front king; it must step aside, and the line runs on to the prize.",
        ex: { type: "exchange", pieces: [["h1","wR"],["h2","wK"],["e5","bK"],["e8","bR"]], steps: [
          { ok: { kind: "list", moves: [["h1","e1"]] }, prompt: "Pierce the line: check first, collect after.", success: "The king must flee. Watch it go, and watch what it leaves behind." },
          { ok: { kind: "capType", ts: ["r"] }, prompt: "It fled. Collect.", success: "Front runs, back falls, and this time YOUR hands did the falling part. That is a skewer, complete." }
        ] } },
      { setting: "The Eighth Rank", flavor: "Along the enemy's own back rank, king stands before treasure.",
        explain: "Skewers run on ranks as well as files; the back rank is a favorite hunting ground.",
        ex: { type: "exchange", pieces: [["h1","wR"],["g1","wK"],["d8","bK"],["a8","bB"]], steps: [
          { ok: { kind: "list", moves: [["h1","h8"]] }, prompt: "Pierce down the eighth rank.", success: "Check along the rank. It must step off, listen for the footstep." },
          { ok: { kind: "capType", ts: ["b"] }, prompt: "The rank is clear of royalty. Take the bishop.", success: "Skewers run on every straight line, and the eighth rank is a favorite hunting ground. Remember this shape." }
        ] } },
      { setting: "The Dawn Diagonal", flavor: "The enemy king stands on the long light diagonal with its rook in the corner behind.",
        explain: "A bishop skewer costs three and often wins five: light pieces make fine spears.",
        ex: { type: "exchange", pieces: [["e2","wB"],["b7","bK"],["a8","bR"],["g1","wK"]], steps: [
          { ok: { kind: "list", moves: [["e2","f3"]] }, prompt: "Angle the dawn through the king.", success: "The long diagonal burns. The king must move, and may try to guard its treasure. Watch." },
          { ok: { kind: "capType", ts: ["r"] }, prompt: "Take the rook, even a guarded five outweighs your three.", success: "Front runs, back falls. Even when the king guards the corner, three for five is a trade that smiles." }
        ] } }
    ]
  },
  /* ---------- CHAPTER 4 ---------- */
  {
    id: "opening", ch: 4, name: "The Opening",
    lockedHint: "The first moves decide the whole game.",
    depth: [
      "Three sins to refuse: moving the same piece twice before move eight, bringing the queen out first, and grabbing side pawns while your keep stands open.",
      "f7 and f2 are the softest squares on the board, guarded only by the king himself. Every cheap early trap in existence aims there.",
      "When you want real openings to study: the Italian Game for clarity, the London System for calm, the Queen's Gambit for ambition. All three live free on lichess.",
    ],
    intro: "Every strong game begins the same way: claim the center with a pawn, develop your knights and bishops toward the middle, and castle before the storm. Memorize no long openings yet. Play these three truly.",
    hook: {
      plain: "Open with a center pawn, develop knights and bishops toward the center, castle early, and do not move the queen out first or the same piece twice without reason.",
      image: "An unhurried morning: claim a bit of the middle, get your pieces out where they can breathe, then tuck the king away.",
      when: "For your first eight moves of any game, if a move does not claim center, develop a new piece, or castle, ask it to justify itself."
    },
    dues: "Play three computer games where you open with e4 or d4, move both knights before your queen, and castle by move eight, every single game.",
    contexts: [
      { setting: "The Town Square", flavor: "The board is new, the day unwritten; plant the first banner.",
        explain: "Center pawns first: e4 and d4 claim the center and open lines for your bishops.",
        ex: { type: "move", pieces: "start", opts: { castling: { K:true, Q:true, k:true, q:true } },
          ok: { kind: "list", moves: [["e2","e4"],["d2","d4"]] },
          prompt: "Play the first move: claim the center.", success: "The center is yours for now. Everything good grows from here." } },
      { setting: "The Fast Riders", flavor: "Banners answered banners; now the gates open for the knights.",
        explain: "Develop with threats: the kingside knight to f3 both centralizes and attacks the e5 pawn.",
        ex: { type: "move", opts: { castling: { K:true, Q:true, k:true, q:true } },
          pieces: [["a1","wR"],["b1","wN"],["c1","wB"],["d1","wQ"],["e1","wK"],["f1","wB"],["g1","wN"],["h1","wR"],
                   ["a2","wP"],["b2","wP"],["c2","wP"],["d2","wP"],["e4","wP"],["f2","wP"],["g2","wP"],["h2","wP"],
                   ["a8","bR"],["b8","bN"],["c8","bB"],["d8","bQ"],["e8","bK"],["f8","bB"],["g8","bN"],["h8","bR"],
                   ["a7","bP"],["b7","bP"],["c7","bP"],["d7","bP"],["e5","bP"],["f7","bP"],["g7","bP"],["h7","bP"]],
          ok: { kind: "list", moves: [["g1","f3"]] },
          altMsgs: { "b1c3": "A fine knight, but the other knight rides AND hunts: from f3 it attacks the e5 banner." },
          prompt: "Send out the knight that also hunts.", success: "Developed, centralized, and already threatening. Three virtues in one hop." } },
      { setting: "The Barred Keep", flavor: "Banners planted, knights out; the storm gathers, and the keep waits.",
        explain: "Castle before move ten: it tucks your king away while the center burns.",
        ex: { type: "move", opts: { castling: { K:true, Q:true, k:true, q:true } },
          pieces: [["a1","wR"],["b1","wN"],["c1","wB"],["d1","wQ"],["e1","wK"],["h1","wR"],
                   ["a2","wP"],["b2","wP"],["c2","wP"],["d2","wP"],["e4","wP"],["f2","wP"],["g2","wP"],["h2","wP"],
                   ["f3","wN"],["c4","wB"],
                   ["a8","bR"],["c8","bB"],["d8","bQ"],["e8","bK"],["g8","bN"],["h8","bR"],
                   ["a7","bP"],["b7","bP"],["c7","bP"],["d7","bP"],["e5","bP"],["f7","bP"],["g7","bP"],["h7","bP"],
                   ["c6","bN"],["c5","bB"]],
          ok: { kind: "castle", side: "K" }, moveHint: "Click your King, then g1.",
          prompt: "Play the third move: castle.", success: "Center, knights, castle. You now open better than most who have played for years." } },
      { setting: "The Wayward Crown", flavor: "Across the board an impatient monarch has marched her queen out on move two, licking her lips at your pawns.",
        explain: "Punish an early queen by developing WITH a threat, every strike on her wins you a free developing move, and she wins nothing.",
        ex: { type: "move", opts: { castling: { K:true, Q:true, k:true, q:true } },
          pieces: [["a1","wR"],["c1","wB"],["d1","wQ"],["e1","wK"],["f1","wB"],["g1","wN"],["h1","wR"],["c3","wN"],
                   ["a2","wP"],["b2","wP"],["c2","wP"],["d2","wP"],["e4","wP"],["f2","wP"],["g2","wP"],["h2","wP"],
                   ["a8","bR"],["b8","bN"],["c8","bB"],["e8","bK"],["f8","bB"],["g8","bN"],["h8","bR"],
                   ["a7","bP"],["b7","bP"],["c7","bP"],["d7","bP"],["e5","bP"],["f7","bP"],["g7","bP"],["h7","bP"],["h4","bQ"]],
          ok: { kind: "list", moves: [["g1","f3"]] },
          altMsgs: { "g2g3": "g3 shoos her too, but Nf3 shoos her AND develops a knight. Two goods beat one good, always." },
          prompt: "Punish the wayward crown: develop with a threat.", success: "She must flee, and you grew stronger for free. Early queens feed their hunters, remember that when you are tempted yourself." } }
    ]
  },
  {
    id: "endgame", ch: 4, name: "The Endgame",
    lockedHint: "When the board empties, the kings themselves walk.",
    depth: [
      "The opposition: kings facing off with one square between them, and whoever must move, loses ground. This one staring contest decides most pawn endings.",
      "Rook endings are the most common endings in all of chess. One law carries you far: rooks belong BEHIND passed pawns, yours or theirs.",
      "When ahead, trade pieces and keep pawns; when behind, trade pawns and keep pieces. Say it twice. It will win you a hundred games.",
    ],
    intro: "When the board empties, everything changes: the king becomes a soldier, pawns become crowns waiting to happen, and the queen learns to herd. Learn to shrink the box, march your king, and only then go for mate.",
    hook: {
      plain: "In queen endings: keep your queen a knight's move from their king to shrink his box, walk your own king close, then mate at the edge, always counting his squares to dodge stalemate.",
      image: "Walking the last sheep into the pen with a long crook: easy steps, no rush, and never so tight that it cannot move at all.",
      when: "Any time you are up a queen against a bare king: box, march, mate, and count his breathing squares every move."
    },
    dues: "Open lichess Practice and complete Checkmate with the Queen once without hints. Then return in two days and do it again cold: the second time is the one that stays.",
    contexts: [
      { setting: "The Golden Crook", flavor: "The enemy king roams the open field; take up the crook at a knight's distance.",
        explain: "Hold your queen a knight's move from their king: she fences him without ever standing where he can touch her.",
        ex: { type: "move", pieces: [["a2","wQ"],["e1","wK"],["e5","bK"]], ok: { kind: "list", moves: [["a2","c4"]] },
          prompt: "Set the crook a knight's leap from the king.", success: "See his box shrink. Keep that strange distance and he can never bite the crook." } },
      { setting: "The Shepherd Walks", flavor: "The sheep is penned in the corner; now the shepherd himself must cross the field.",
        explain: "A queen alone cannot mate: march your king toward the pen, one square closer every move.",
        ex: { type: "move", pieces: [["e2","wK"],["g5","wQ"],["h8","bK"]], ok: { kind: "kingCloser", target: "h8" },
          prompt: "March your king one step toward the pen.", success: "The queen holds the fence; the king brings the mate. Every step matters." } },
      { setting: "The Dusk Pen", flavor: "No script now, no marked answer. A bare king, your queen, your king, and ten moves to finish it.",
        explain: "Play the whole ending yourself: shrink the box a knight's leap at a time, march your king, then mate at the edge, never freezing him without check.",
        ex: { type: "duel", pieces: [["e5","wK"],["a1","wQ"],["e8","bK"]], goal: "mate", moveLimit: 10,
          prompt: "Box, march, mate. The full ending, in your own hands.",
          moveHint: "Keep the queen a knight's leap from his king. Bring your own king close. Check only when it's mate.",
          successText: "You did not follow a mate. You built one, move by move, against a running king. That is the oldest ending in the world, and now it is yours." } }
    ]
  }
];

/* CLUB NIGHTS (bosses), each shows the finished thing before you build it */
const BOSSES = [
  {
    id: "gauntlet", ch: 1, name: "The Gauntlet",
    needs: ["board","pawn","rook","bishop","knight","queen","king"],
    tagline: "Three waves march on the club. See their fire before it lands, then answer it.",
    vision: {
      pieces: [["h4","bQ"],["d4","bP"],["f6","bN"],["e8","bK"],["f2","wP"],["g2","wP"],["h2","wP"],["g1","wK"],["f1","wR"],["f3","wN"]],
      caption: "The finished picture: every enemy strike-square known, every answer already chosen. This is what a defended position looks like."
    },
    intro: [
      { s: "n", t: "Bells. Not the lesson bells. The deep ones under the floor." },
      { s: "n", t: "The Marching Host tests every new student. Three waves. They are not gentle." },
      { s: "n", t: "Before each wave strikes, mark every square it attacks. Then, and only then, answer." },
      { s: "n", t: "See first. Strike second." }
    ],
    phases: [
      {
        label: "First Wave, The Tower",
        form: "wardsight",
        text: "A rook rolls into the center and levels its gaze at your pawns. Mark every square it attacks.",
        ex: { type: "mark", pieces: [["d5", "bR"], ["d7", "bP"], ["d3", "wP"], ["f5", "wB"], ["c3", "wN"], ["g1", "wK"], ["e8", "bK"]], from: "d5", mode: "strikes" }
      },
      {
        label: "First Wave, The Answer",
        form: "casting",
        text: "Its reach is marked and your bishop stands inside it. One of your pieces can end this safely.",
        ex: {
          type: "move",
          pieces: [["d5", "bR"], ["d7", "bP"], ["d3", "wP"], ["f5", "wB"], ["c3", "wN"], ["g1", "wK"], ["e8", "bK"]],
          ok: { kind: "captureOn", sq: "d5" },
          prompt: "Take the rook.",
          success: "The knight leapt where no line led, and the rook fell. Wave one breaks."
        }
      },
      {
        label: "Second Wave, The Hare Descends",
        form: "wardsight",
        text: "An enemy knight circles above the center, choosing its landing. Mark all eight of its stars before it drops.",
        ex: { type: "mark", pieces: [["e5", "bN"], ["g1", "wK"], ["e8", "bK"]], from: "e5", mode: "strikes" }
      },
      {
        label: "Second Wave, At the Gate",
        form: "casting",
        text: "It landed on f3, inside your walls, one leap from your king. The alarm sounds. Answer it.",
        ex: {
          type: "move",
          pieces: [["f3", "bN"], ["g2", "wP"], ["g1", "wK"], ["e8", "bK"]],
          ok: { kind: "captureOn", sq: "f3" },
          prompt: "You are in check. Silence it.",
          success: "Your smallest soldier swallowed the knight whole. Never forget that pawns bite."
        }
      },
      {
        label: "Third Wave, The Pale Crown",
        form: "wardsight",
        text: "An enemy queen sweeps down the h-file toward your king. Mark every square of her reach. All of it.",
        ex: { type: "mark", pieces: [["h4", "bQ"], ["d4", "bP"], ["f6", "bN"], ["e8", "bK"], ["f2", "wP"], ["g2", "wP"], ["h2", "wP"], ["g1", "wK"], ["f1", "wR"], ["f3", "wN"]], from: "h4", mode: "strikes" }
      },
      {
        label: "Third Wave, The Answer",
        form: "casting",
        text: "Twelve lines of attack, and yet she has drifted one leap too close to your quiet knight. End the Gauntlet.",
        ex: {
          type: "move",
          pieces: [["h4", "bQ"], ["d4", "bP"], ["f6", "bN"], ["e8", "bK"], ["f2", "wP"], ["g2", "wP"], ["h2", "wP"], ["g1", "wK"], ["f1", "wR"], ["f3", "wN"]],
          ok: { kind: "captureOn", sq: "h4" },
          altMsgs: { "g2g3": "A brave prod, but prodding lets her feast first. Strike her down NOW, one of your pieces already reaches her." },
          prompt: "Cut down the pale crown.",
          success: "The knight again. The quiet piece nobody counts. The Host retreats."
        }
      }
    ],
    outro: [
      { s: "n", t: "The bells under the floor go still. Smoke, but no fire." },
      { s: "n", t: "You saw every attack before it landed. That is the entire secret of defense, and most players never learn it." },
      { s: "n", t: "Adequately done. The second chapter opens." }
    ]
  },
  {
    id: "requiem",
    ch: 2,
    name: "The Back-Rank Requiem",
    needs: ["check", "mate", "castle", "promotion", "truce"],
    tagline: "Three sleeping kings. Three mates. End each in one move.",
    vision: {
      pieces: [["h8", "wR"], ["a8", "bK"], ["a7", "bP"], ["b7", "bP"], ["g1", "wK"]],
      caption: "The finished picture: a king trapped behind its own unmoved pawns. You will build this three times tonight."
    },
    intro: [
      { s: "n", t: "No waves tonight. Three courts, each one move from silence." },
      { s: "n", t: "For each one: find the mate. Check the three doors, move, block, capture, and shut them all with a single move." },
    ],
    phases: [
      {
        label: "First Court, The Sleeping Wall",
        form: "casting",
        text: "The enemy king dozes in the corner behind its own pawns. One open file remains.",
        ex: {
          type: "move",
          pieces: [["h1", "wR"], ["a8", "bK"], ["a7", "bP"], ["b7", "bP"], ["g1", "wK"]],
          ok: { kind: "mate" },
          prompt: "Deliver mate in one move.",
          success: "Its own wall held the doors shut for you. Requiem, first movement."
        }
      },
      {
        label: "Second Court, The Ladder",
        form: "casting",
        text: "One of your rooks already bars the seventh rank. The second rook ends the game.",
        ex: {
          type: "move",
          pieces: [["a7", "wR"], ["b1", "wR"], ["d8", "bK"], ["g1", "wK"]],
          ok: { kind: "mate" },
          prompt: "Climb the last rung.",
          success: "One rook holds the floor, the other takes the ceiling. The ladder never misses."
        }
      },
      {
        label: "Third Court, The Escort",
        form: "casting",
        text: "Your own king stands guard at the pen. Let the queen lay her hand upon theirs.",
        ex: {
          type: "move",
          pieces: [["g6", "wK"], ["b2", "wQ"], ["g8", "bK"]],
          ok: { kind: "mate" },
          prompt: "The final move. Play it.",
          success: "Guarded, adjacent, inescapable. You did not find that mate. You built it."
        }
      }
    ],
    outro: [
      { s: "n", t: "Three courts, three silences." },
      { s: "n", t: "Cleanly done." }
    ]
  },
  {
    id: "snare",
    ch: 3,
    name: "The Threefold Snare",
    needs: ["value", "fork", "pin", "skewer"],
    tagline: "Fork, pin, and skewer, one of each, laid on real boards.",
    vision: {
      pieces: [["b6", "wN"], ["c8", "bK"], ["a8", "bR"], ["g1", "wK"]],
      caption: "The finished picture: a sprung twin snare, check to the king, claim on the rook. Tonight you lay all three great snares."
    },
    intro: [
      { s: "n", t: "The Host tested your eyes. The Requiem tested your mates. Tonight: your teeth." },
      { s: "n", t: "Three boards. On one lives a fork, on one a pin, on one a skewer. No labels." },
      { s: "n", t: "Weigh the pieces. Name the prongs. Then strike." }
    ],
    phases: [
      {
        label: "First Board",
        form: "casting",
        text: "The enemy king huddles near its corner rook. Somewhere on this board, one leap wounds them both.",
        ex: { type: "exchange", pieces: [["d5", "wN"], ["c8", "bK"], ["a8", "bR"], ["g1", "wK"]], steps: [
          { ok: { kind: "list", moves: [["d5", "b6"]] }, prompt: "Find the snare and spring it.", success: "Check, laid without a hint. Now hear the answer." },
          { ok: { kind: "capType", ts: ["r"] }, prompt: "Finish the conversation: harvest.", success: "Sprung AND harvested. Even if the king takes back, a knight for a rook is an argument you win." }
        ] }
      },
      {
        label: "Second Board",
        form: "casting",
        text: "A knight guards the line to its own king. There is a pin that freezes it in place.",
        ex: {
          type: "move",
          pieces: [["f1", "wB"], ["c6", "bN"], ["e8", "bK"], ["g1", "wK"]],
          ok: { kind: "list", moves: [["f1", "b5"]] },
          prompt: "Stitch it still.",
          success: "Absolutely pinned. It will stand there, useless, while you build around it."
        }
      },
      {
        label: "Third Board",
        form: "casting",
        text: "The king stands before its treasure on one long diagonal. Pierce the line.",
        ex: { type: "exchange", pieces: [["a1", "wR"], ["g1", "wK"], ["d5", "bK"], ["d8", "bQ"]], steps: [
          { ok: { kind: "list", moves: [["a1", "d1"]] }, prompt: "Pierce the first to reach the second.", success: "Check on the open file. It will run, or throw its own queen across the line. Either way..." },
          { ok: { kind: "capType", ts: ["q"] }, prompt: "Take the queen, wherever she stands.", success: "Nine points fall, and even a rook traded for a queen is good arithmetic. Fork, pin, and skewer: yours, complete." }
        ] }
      }
    ],
    outro: [
      { s: "n", t: "Three finished boards." },
      { s: "n", t: "All three laid cold, on boards never seen before. One chapter remains. Then the Long Game." }
    ]
  }
];

const WRONG_POOLS = ["Not that one. Have another look.", "Not quite. No rush; the board is not going anywhere.", "Right instinct, wrong square. Trace the line with your eyes first.", "Not it. Take your time, it is still there."];
const RIGHT_POOLS = ["Good.", "That is it.", "Clean.", "That is the move.", "Nice spot."];
const STUCK_LINES = ["Take a breath. Whole board first, then the piece, then where it can go.", "Say the rule out loud, then play it. The mouth teaches the fingers.", "Once more, slowly."];
const RANK_LINES = [["Inked. A rough pass still counts. Review it when your hands are steadier."], ["Clean. A slip or two, nothing a second pass will not fix."], ["Brilliant. Clean all the way through."]];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

const RANKS = [
  { name: "Inked" }, { name: "Clean" }, { name: "Brilliant" }
];
const PLAYER_TITLES = [
  { pct: 0, t: "Walk-In" }, { pct: 20, t: "New Regular" },
  { pct: 40, t: "Club Regular" }, { pct: 60, t: "Board Two" },
  { pct: 80, t: "Board One" }, { pct: 100, t: "Club Champion" }
];
const FORM_NAME = { find: "Naming", trace: "Tracing", mark_moves: "Mapping", mark_strikes: "Reading", mark_ring: "Reading", move: "Playing", exchange: "Call and Answer", duel: "The Duel" };
const TOTAL_UNITS = 22; /* 18 pages + 3 club nights + the Long Game */

/* SHARED UI */
const KEYFRAMES = `
* { -webkit-font-smoothing: antialiased; }
button:active { transform: scale(0.96); }
.tp-press:active { transform: translateY(1px); filter: brightness(0.96); }
.paper:nth-child(odd) { transform: rotate(-0.3deg); }
.paper:nth-child(even) { transform: rotate(0.25deg); }
@keyframes tp-drop { 0% { transform: scale(1.4) translateY(-7px); } 100% { transform: scale(1) translateY(0); } }
@keyframes tp-toast { 0% { transform: translateY(-16px); opacity: 0; } 10% { transform: translateY(0); opacity: 1; } 85% { opacity: 1; } 100% { opacity: 0; } }
@keyframes tp-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
@keyframes tp-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
`;

function btnStyle(kind) {
  const base = {
    fontFamily: T.mono, fontSize: 14, padding: "10px 22px", borderRadius: 8,
    cursor: "pointer", letterSpacing: 0.5, display: "inline-flex",
    alignItems: "center", gap: 8, transition: "transform .12s, filter .12s"
  };
  if (kind === "prime") return Object.assign(base, {
    background: T.blue, color: T.ink,
    border: "1px solid " + T.blueDeep, fontWeight: 600, boxShadow: "inset 0 1px 0 " + T.sheen + ", inset 0 -1px 0 " + T.wellSoft
  });
  if (kind === "ghost") return Object.assign(base, {
    background: "transparent", color: T.paper, border: "1px solid " + T.onSoft, boxShadow: "inset 0 1px 0 " + T.sheenFaint
  });
  return Object.assign(base, {
    background: T.onGhost, color: T.paper, border: "1px solid " + T.blueLine
  });
}
const SFX = (() => {
  let ctx = null, on = false;
  const ac = () => {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; } }
    if (ctx && ctx.state === "suspended") { try { ctx.resume(); } catch (e) {} }
    return ctx;
  };
  const env = (freq, type, t0, dur, vol, slide) => {
    const c = ac(); if (!c) return;
    const o = c.createOscillator(); const g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, c.currentTime + t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, c.currentTime + t0 + dur);
    g.gain.setValueAtTime(0.0001, c.currentTime + t0);
    g.gain.linearRampToValueAtTime(vol, c.currentTime + t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t0 + dur);
    o.connect(g); g.connect(c.destination);
    o.start(c.currentTime + t0); o.stop(c.currentTime + t0 + dur + 0.03);
  };
  const safe = (f) => { if (!on) return; try { f(); } catch (e) {} };
  return {
    setOn: (v) => { on = v; if (v) ac(); },
    isOn: () => on,
    move: () => safe(() => env(330, "triangle", 0, 0.06, 0.07, 250)),
    capture: () => safe(() => { env(190, "square", 0, 0.1, 0.06, 110); env(640, "triangle", 0, 0.05, 0.045); }),
    good: () => safe(() => { env(523, "sine", 0, 0.11, 0.08); env(659, "sine", 0.08, 0.11, 0.08); env(784, "sine", 0.16, 0.2, 0.08); }),
    bad: () => safe(() => env(170, "sawtooth", 0, 0.16, 0.04, 130)),
    chime: () => safe(() => { env(880, "sine", 0, 0.28, 0.06); env(1318, "sine", 0.06, 0.32, 0.045); }),
    check: () => safe(() => env(988, "triangle", 0, 0.13, 0.06)),
    win: () => safe(() => [523, 659, 784, 1046].forEach((f, i) => env(f, "sine", i * 0.11, 0.22, 0.08)))
  };
})();



function CelebrateOnce() {
  useEffect(() => { SFX.win(); }, []);
  return null;
}

function Btn(props) {
  return (
    <button onClick={props.onClick} disabled={props.disabled}
      style={Object.assign({}, btnStyle(props.kind), props.disabled ? { opacity: 0.45, cursor: "default" } : null, props.style)}>
      {props.children}
    </button>
  );
}
function Card(props) {
  return (
    <div style={Object.assign({
      background: T.paperCard, color: T.ink, borderRadius: "13px 10px 14px 9px", padding: 18,
      border: "1px solid " + T.beigeDeep, boxShadow: "inset 0 1px 0 " + T.sheen + ", inset 0 0 0 1px " + T.inkLine,
      fontFamily: T.serif
    }, props.style)} className={"paper" + (props.className ? " " + props.className : "")}>
      {props.children}
    </div>
  );
}
function RankCount({ n, size }) {
  return <span style={{ fontFamily: T.mono, fontSize: size || 15, color: T.beigeDeep }}>{(n + 1) + "/3"}</span>;
}
function Meter({ pct, h }) {
  return (
    <div style={{ background: T.well, borderRadius: 99, height: h || 12, overflow: "hidden", border: "1px solid " + T.beigeLine }}>
      <div style={{ width: Math.max(2, pct) + "%", height: "100%", background: T.beige, transition: "width .6s" }} />
    </div>
  );
}
function TypeText({ text }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const id = setInterval(() => setN((x) => (x >= text.length ? x : x + 2)), 16);
    return () => clearInterval(id);
  }, [text]);
  const done = n >= text.length;
  return (
    <span onClick={() => setN(text.length)} style={{ cursor: done ? "inherit" : "pointer" }}>
      {text.slice(0, n)}
    </span>
  );
}
function SpeakerLine({ line }) {
  const isC = line.s === "c";
  return (
    <div style={{ display: "flex", alignItems: "flex-start", animation: "tp-fade .5s both" }}>
      <div style={{
        background: isC ? T.paper : "transparent",
        color: isC ? T.ink : T.onHi,
        fontStyle: isC ? "normal" : "italic",
        border: isC ? "1px solid " + T.beigeDeep : "none",
        borderRadius: 12, padding: isC ? "10px 14px" : "4px 2px",
        fontFamily: T.serif, fontSize: 16, lineHeight: 1.6, maxWidth: 560
      }}>
        {isC ? <TypeText text={line.t} /> : line.t}
      </div>
    </div>
  );
}
function Cutscene({ lines, onDone, doneLabel }) {
  const [shown, setShown] = useState(1);
  const endRef = useRef(null);
  useEffect(() => { if (endRef.current) endRef.current.scrollIntoView?.({ behavior: "smooth", block: "nearest" }); }, [shown]);
  const all = shown >= lines.length;
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "30px 16px 60px", display: "flex", flexDirection: "column", gap: 16 }}>
      {lines.slice(0, shown).map((l, i) => <SpeakerLine key={i} line={l} />)}
      <div ref={endRef} style={{ textAlign: "center", marginTop: 10 }}>
        {!all ? (
          <Btn kind="ghost" onClick={() => setShown(shown + 1)}>Continue</Btn>
        ) : (
          <Btn kind="prime" onClick={onDone}>{doneLabel || "Continue"} </Btn>
        )}
      </div>
    </div>
  );
}
/* ---------------- the Board ---------------- */
function Board({ board, cell, onSquare, marks, glow, wrong, selected, dots, last, dim, checkSq }) {
  const c = cell || 42;
  const marksSet = marks || new Set();
  const glowSet = glow || new Set();
  const dotsSet = dots || new Set();
  const squares = [];
  for (let i = 0; i < 64; i++) {
    const r = rowOf(i), col = colOf(i);
    const light = (r + col) % 2 === 0;
    const p = board[i];
    const isLast = last && (last[0] === i || last[1] === i);
    const isGlow = glowSet.has(i);
    const isMark = marksSet.has(i);
    const isSel = selected === i;
    const isWrong = wrong === i;
    let bg = light ? T.boardLight : T.boardDark;
    if (isLast) bg = light ? T.lastLight : T.lastDark;
    if (isGlow) bg = light ? T.hintLight : T.hintDark;
    if (isMark) bg = light ? T.markLight : T.markDark;
    if (isWrong) bg = T.roseBoard;
    squares.push(
      <div key={i} onClick={onSquare ? () => onSquare(i) : undefined}
        style={{
          width: c, height: c, background: bg, position: "relative",
          cursor: onSquare ? "pointer" : "default", userSelect: "none",
          outline: isSel ? "2px solid " + T.blueDeep : "none", outlineOffset: -2,
          boxShadow: isSel ? "inset 0 0 0 3px " + T.blueLine : "none",
          animation: isWrong ? "tp-shake .3s" : "none",
          opacity: dim ? 0.85 : 1
        }}>
        {col === 0 && (
          <span style={{ position: "absolute", top: 1, left: 3, fontSize: c * 0.22, color: light ? T.fileLight : T.fileDark, fontFamily: T.mono }}>{8 - r}</span>
        )}
        {r === 7 && (
          <span style={{ position: "absolute", bottom: 0, right: 3, fontSize: c * 0.22, color: light ? T.fileLight : T.fileDark, fontFamily: T.mono }}>{FILES[col]}</span>
        )}
        {checkSq === i && (
          <span style={{ position: "absolute", inset: 2, borderRadius: 8, pointerEvents: "none",
            border: "2.5px solid " + T.roseBoard }} />
        )}
        {p && (
          <span style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: c * 0.72, lineHeight: 1,
            animation: last && last[1] === i ? "tp-drop .16s ease-out" : "none",
            color: p.c === "w" ? T.paper : T.ink,
            textShadow: p.c === "w"
              ? "0 1px 2px " + T.pieceShade + ", 0 0 5px " + T.wellDeep
              : "0 1px 1px " + T.sheenSoft
          }}>{GLYPH[p.t]}</span>
        )}
        {isMark && !p && (
          <span style={{ position: "absolute", inset: 6, border: "2.5px solid " + T.beigeInk, borderRadius: "50%", animation: "tp-fade .25s both" }} />
        )}
        {isMark && p && (
          <span style={{ position: "absolute", top: 3, right: 3, width: 7, height: 7, borderRadius: "50%", background: T.beigeLight }} />
        )}
        {dotsSet.has(i) && (
          <span style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none"
          }}>
            <span style={{
              width: p ? c * 0.86 : c * 0.3, height: p ? c * 0.86 : c * 0.3, borderRadius: "50%",
              border: p ? "2.5px solid " + T.blue : "none",
              background: p ? "transparent" : T.blue,
            }} />
          </span>
        )}
      </div>
    );
  }
  return (
    <div style={{
      position: "relative", width: c * 8 + 22, margin: "0 auto", padding: 8,
      background: T.duskUp,
      borderRadius: 12, border: "1px solid " + T.beigeLine,
      boxShadow: "inset 0 0 0 1px " + T.beigeEdge + ", inset 0 0 24px " + T.wellDeep
    }}>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(8, " + c + "px)",
        border: "2px solid " + T.beigeDeep, borderRadius: 8, overflow: "hidden",
        boxShadow: "0 0 0 1px " + T.beigeEdge,
        width: c * 8
      }}>
        {squares}
      </div>
    </div>
  );
}

/* EXERCISES, the forms of practice */
function answersFor(ex) {
  const st = mkState(ex.pieces, ex.opts);
  if (ex.type !== "mark") return new Set();
  const i = sq(ex.from);
  if (ex.mode === "moves") {
    const p = st.board[i];
    const st2 = Object.assign({}, st, { turn: p.c });
    return new Set(legalMoves(st2).filter((m) => m.from === i).map((m) => m.to));
  }
  if (ex.mode === "strikes") {
    const p = st.board[i];
    return new Set(attacksFrom(st.board, i).filter((t) => !(st.board[t] && st.board[t].c === p.c)));
  }
  /* ring: squares beside the enemy king that white controls */
  const bk = kingIdx(st.board, "b");
  const r = rowOf(bk), c = colOf(bk);
  const ring = [];
  for (const [dr, dc] of KM) if (onB(r + dr, c + dc)) ring.push((r + dr) * 8 + c + dc);
  return new Set(ring.filter((t) => attacked(st.board, t, "w")));
}
function checkPredicate(state, m, ok) {
  switch (ok.kind) {
    case "list": return ok.moves.some(([f, t]) => sq(f) === m.from && sq(t) === m.to);
    case "mate": return statusOf(apply(state, m)) === "checkmate";
    case "captureOn": return !!m.cap && m.to === sq(ok.sq);
    case "captureBy": return !!m.cap && state.board[m.from].t === ok.t;
    case "castle": return m.castle === ok.side;
    case "promo": return !!m.promo;
    case "promoCap": return !!m.promo && !!m.cap;
    case "ep": return !!m.ep;
    case "any": return true;
    case "block": return state.board[m.from].t !== "k" && !m.cap;
    case "capType": {
      let capped = state.board[m.to];
      if (m.ep) capped = { t: "p" };
      return !!m.cap && !!capped && ok.ts.includes(capped.t);
    }
    case "kingCloser":
      if (state.board[m.from].t !== "k") return false;
      return cheb(m.to, sq(ok.target)) < cheb(m.from, sq(ok.target));
    default: return false;
  }
}
function demoGlowFor(ex) {
  const st = mkState(ex.pieces, ex.opts);
  const g = new Set();
  if (ex.type === "find") { ex.targets.forEach((t) => g.add(sq(t))); return g; }
  if (ex.type === "trace") { g.add(sq(ex.from)); ex.path.forEach((t) => g.add(sq(t))); return g; }
  if (ex.type === "mark") { g.add(sq(ex.from)); answersFor(ex).forEach((t) => g.add(t)); return g; }
  if (ex.type === "exchange") {
    const sats0 = legalMoves(st).filter((m) => checkPredicate(st, m, ex.steps[0].ok));
    if (sats0.length) { g.add(sats0[0].from); g.add(sats0[0].to); }
    return g;
  }
  if (ex.type === "duel") {
    st.board.forEach((p, i) => { if (p && p.c === "w") g.add(i); });
    return g;
  }
  const sats = legalMoves(st).filter((m) => checkPredicate(st, m, ex.ok));
  if (ex.ok.kind === "any" || ex.ok.kind === "kingCloser" || ex.ok.kind === "block") {
    sats.forEach((m) => { g.add(m.from); g.add(m.to); });
  } else if (sats.length) { g.add(sats[0].from); g.add(sats[0].to); }
  return g;
}
function formOf(ex) {
  if (ex.type === "mark") return FORM_NAME["mark_" + ex.mode];
  return FORM_NAME[ex.type];
}
function FeedbackLine({ msg, tone }) {
  if (!msg) return <div style={{ minHeight: 46 }} />;
  return (
    <div key={msg} style={{ display: "flex", gap: 8, alignItems: "center", minHeight: 46, animation: "tp-fade .3s both" }}>
      <div style={{
        fontFamily: T.serif, fontSize: 14, fontStyle: "italic",
        color: tone === "bad" ? T.rose : (tone === "good" ? T.good : T.onHi)
      }}>{msg}</div>
    </div>
  );
}
function ExercisePlayer({ ex, cell, onMistake, onDone }) {
  const base = useMemo(() => mkState(ex.pieces, ex.opts), [ex]);
  const answers = useMemo(() => answersFor(ex), [ex]);
  const [found, setFound] = useState(() => new Set());
  const [ptr, setPtr] = useState(0);
  const [wrong, setWrong] = useState(null);
  const [msg, setMsg] = useState("");
  const [tone, setTone] = useState("");
  const [stepIdx, setStepIdx] = useState(0);
  const [live, setLive] = useState(null);
  const [note, setNote] = useState("");
  const [locked, setLocked] = useState(false);
  const [selected, setSelected] = useState(null);
  const [resultState, setResultState] = useState(null);
  const [finished, setFinished] = useState(false);
  const wrongTimer = useRef(null);
  const wrongCount = useRef(0);
  const timers = useRef([]);
  const legal = useMemo(() => {
    if (ex.type === "move") return resultState ? [] : legalMoves(base);
    if (ex.type === "exchange" || ex.type === "duel") {
      if (finished || locked || resultState) return [];
      const st = live || base;
      return st.turn === "w" && statusOf(st) === "play" ? legalMoves(st) : [];
    }
    return [];
  }, [ex, base, resultState, live, finished, locked]);
  useEffect(() => {
    setFound(new Set()); setPtr(0); setWrong(null); setMsg(""); setTone("");
    setSelected(null); setResultState(null); setFinished(false); wrongCount.current = 0;
    setStepIdx(0); setLive(null); setNote(""); setLocked(false);
    timers.current.forEach(clearTimeout); timers.current = [];
  }, [ex]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  /* the duel: the board speaks its half */
  useEffect(() => {
    if (ex.type !== "duel" || finished) return;
    const st = live || base;
    if (statusOf(st) !== "play" || st.turn !== "b") return;
    setLocked(true);
    const id = setTimeout(() => {
      const m = bestMove(st, 2);
      if (m) {
        const s2 = apply(st, m);
        setLive(s2);
        if (m.cap) SFX.capture(); else SFX.move();
        setNote("The board answers: " + s2.hist[s2.hist.length - 1]);
      }
      setLocked(false);
    }, 520);
    timers.current.push(id);
    return () => clearTimeout(id);
  }, [live, base, ex, finished]);
  /* the duel: goals, traps, and limits */
  useEffect(() => {
    if (ex.type !== "duel" || finished) return;
    const st = live || base;
    const stat = statusOf(st);
    const reset = (text) => {
      onMistake(); setTone("bad"); setMsg(text); setNote("");
      const id = setTimeout(() => { setLive(null); setSelected(null); }, 1600);
      timers.current.push(id);
    };
    if (stat === "checkmate" && st.turn === "b") { SFX.win(); finish(ex.successText); return; }
    if (stat === "stalemate") { reset("Grey. You froze him without a check, the exact trap I warned you of. Count his breathing squares. Again."); return; }
    if (stat !== "play" && stat !== "checkmate") { reset("The pieces drifted into a truce. Keep your heavy pieces safe and herd with purpose. Again."); return; }
    if (ex.moveLimit && st.hist.length >= ex.moveLimit * 2 && st.turn === "w") { reset("Too many moves, the king is laughing at us. Tighten the box, bring your own king closer. Again."); }
  }, [live, base, ex, finished]);
  const flashWrong = (i, text) => {
    SFX.bad();
    setWrong(i);
    if (wrongTimer.current) clearTimeout(wrongTimer.current);
    wrongTimer.current = setTimeout(() => setWrong(null), 420);
    wrongCount.current += 1;
    const stuck = wrongCount.current >= 3 && wrongCount.current % 3 === 0;
    setMsg(text || (stuck ? pick(STUCK_LINES) : pick(WRONG_POOLS)));
    setTone("bad");
    onMistake();
  };
  const finish = (text) => {
    SFX.good();
    setFinished(true); setMsg(text || pick(RIGHT_POOLS));
    setTone("good");
  };
  /* ---- find ---- */
  if (ex.type === "find") {
    const target = ex.targets[ptr];
    const click = (i) => {
      if (finished) return;
      if (i === sq(target)) {
        const nf = new Set(found); nf.add(i); setFound(nf);
        if (ptr + 1 >= ex.targets.length) finish();
        else { setPtr(ptr + 1); setMsg(pick(RIGHT_POOLS)); setTone("good"); SFX.move(); }
      } else flashWrong(i);
    };
    return (
      <div>
        <div style={{ textAlign: "center", fontFamily: T.serif, color: T.paper, marginBottom: 10, fontSize: 16 }}>
          {finished ? "All squares named." : (<span>Touch the square <b style={{ color: T.beige, fontSize: 22 }}>{target}</b></span>)}
          <span style={{ opacity: 0.7 }}> &nbsp;·&nbsp; {finished ? ex.targets.length : ptr}/{ex.targets.length} named</span>
        </div>
        <Board board={base.board} cell={cell} onSquare={click} marks={found} wrong={wrong} />
        <FeedbackLine msg={msg} tone={tone} />
        {finished && <div style={{ textAlign: "center" }}><Btn kind="prime" onClick={onDone}>Continue </Btn></div>}
      </div>
    );
  }
  /* ---- trace ---- */
  if (ex.type === "trace") {
    const click = (i) => {
      if (finished) return;
      if (i === sq(ex.path[ptr])) {
        const nf = new Set(found); nf.add(i); setFound(nf);
        if (ptr + 1 >= ex.path.length) finish("The line holds, end to end.");
        else setPtr(ptr + 1);
      } else flashWrong(i);
    };
    return (
      <div>
        <div style={{ textAlign: "center", fontFamily: T.serif, color: T.paper, marginBottom: 10, fontSize: 16 }}>
          Trace the path, square by square &nbsp;·&nbsp; {found.size}/{ex.path.length}
        </div>
        <Board board={base.board} cell={cell} onSquare={click} marks={found} wrong={wrong} glow={new Set([sq(ex.from)])} />
        <FeedbackLine msg={msg} tone={tone} />
        {finished && <div style={{ textAlign: "center" }}><Btn kind="prime" onClick={onDone}>Continue </Btn></div>}
      </div>
    );
  }
  /* ---- mark ---- */
  if (ex.type === "mark") {
    const click = (i) => {
      if (finished) return;
      if (found.has(i)) return;
      if (answers.has(i)) {
        const nf = new Set(found); nf.add(i); setFound(nf);
        if (nf.size >= answers.size) finish("Every star found.");
      } else flashWrong(i);
    };
    return (
      <div>
        <div style={{ textAlign: "center", fontFamily: T.serif, color: T.paper, marginBottom: 10, fontSize: 16 }}>
          Mark every star &nbsp;·&nbsp; <b style={{ color: T.beige }}>{found.size}/{answers.size}</b> found
        </div>
        <Board board={base.board} cell={cell} onSquare={click} marks={found} wrong={wrong} glow={new Set([sq(ex.from)])} />
        {ex.note && finished && (
          <div style={{ fontFamily: T.serif, fontSize: 14, fontStyle: "italic", color: T.good, textAlign: "center", marginTop: 8, maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>{ex.note}</div>
        )}
        <FeedbackLine msg={msg} tone={tone} />
        {finished && <div style={{ textAlign: "center" }}><Btn kind="prime" onClick={onDone}>Continue </Btn></div>}
      </div>
    );
  }
  /* ---- the guided forms: Call and Answer, and the Duel ---- */
  const isDuel = ex.type === "duel";
  const isEx = ex.type === "exchange";
  const actSt = resultState || live || base;
  const step = isEx ? ex.steps[Math.min(stepIdx, ex.steps.length - 1)] : null;
  const dots = selected != null ? new Set(legal.filter((m) => m.from === selected).map((m) => m.to)) : new Set();
  const wrongText = (fromState, m) => {
    const key = nameOf(m.from) + nameOf(m.to);
    const after = apply(fromState, m);
    if (statusOf(after) === "stalemate") return "Frozen. That's stalemate: he has no legal moves and he isn't in check, so your winning game just became a draw. Never trap a king without check.";
    if (ex.altMsgs && ex.altMsgs[key]) return ex.altMsgs[key];
    return "Legal, but not the move this position wants. Watch how the board would answer it.";
  };
  const showAnswer = (fromState, m, text) => {
    const after = apply(fromState, m);
    let preview = after;
    if (statusOf(after) === "play") {
      const r = bestMove(after, 2);
      if (r) preview = apply(after, r);
    }
    setResultState(preview);
    setLocked(true);
    if (preview !== after) setNote("The board answers: " + preview.hist[preview.hist.length - 1]);
    const id = setTimeout(() => { setResultState(null); setNote(""); setLocked(false); }, 1800);
    timers.current.push(id);
    flashWrong(m.to, text);
  };
  const click = (i) => {
    if (finished || locked) return;
    const cur = live || base;
    const p = cur.board[i];
    if (selected != null && dots.has(i)) {
      const m = legal.find((mm) => mm.from === selected && mm.to === i);
      setSelected(null);
      if (isDuel) {
        const nx = apply(cur, m);
        setLive(nx); setNote("");
        if (m.cap) SFX.capture(); else SFX.move();
        if (inCheck(nx, "b")) SFX.check();
        return;
      }
      const okSpec = isEx ? step.ok : ex.ok;
      if (checkPredicate(cur, m, okSpec)) {
        const s1 = apply(cur, m);
        if (m.cap) SFX.capture(); else SFX.move();
        if (isEx && stepIdx < ex.steps.length - 1) {
          setLive(s1);
          setMsg(step.success || pick(RIGHT_POOLS)); setTone("good"); SFX.move();
          setLocked(true);
          const id = setTimeout(() => {
            const r = bestMove(s1, 2);
            if (r) {
              const s2 = apply(s1, r);
              setLive(s2);
              if (r.cap) SFX.capture(); else SFX.move();
              setNote("The board answers: " + s2.hist[s2.hist.length - 1]);
            }
            setStepIdx((x) => x + 1);
            setLocked(false);
          }, 800);
          timers.current.push(id);
        } else {
          if (isEx) setLive(s1); else setResultState(s1);
          finish(isEx ? step.success : ex.success);
          setNote("");
        }
      } else {
        showAnswer(cur, m, wrongText(cur, m));
      }
      return;
    }
    if (p && p.c === "w" && cur.turn === "w") { setSelected(i); setMsg(""); setTone(""); return; }
    if (selected != null) { setSelected(null); return; }
    flashWrong(i);
  };
  const duelInfo = isDuel && !finished ? (() => {
    const st = live || base;
    const breathing = statusOf(st) === "play" ? legalMoves(Object.assign({}, st, { turn: "b" })).length : 0;
    return { moves: Math.max(1, Math.ceil(st.hist.length / 2) + (st.turn === "w" ? 1 : 0)), breathing, turn: st.turn };
  })() : null;
  return (
    <div>
      <div style={{ textAlign: "center", fontFamily: T.serif, color: T.paper, marginBottom: 10, fontSize: 16 }}>
        {finished ? (isDuel ? "The duel is done." : "Locked in.") : ((isEx ? step.prompt : ex.prompt) || "Find the move.")}
      </div>
      {isEx && !finished && (
        <div style={{ textAlign: "center", fontFamily: T.mono, fontSize: 11, letterSpacing: 0.5, color: T.good, marginBottom: 8 }}>
          CALL {Math.min(stepIdx + 1, ex.steps.length)} OF {ex.steps.length} · THE BOARD WILL ANSWER
        </div>
      )}
      {duelInfo && (
        <div style={{ textAlign: "center", fontFamily: T.mono, fontSize: 12.5, color: T.onBody, marginBottom: 8 }}>
          Move {Math.min(duelInfo.moves, ex.moveLimit)} of {ex.moveLimit} · {duelInfo.turn === "w" ? "your move" : "the reply is coming..."}
          {duelInfo.breathing > 0 && duelInfo.breathing <= 9 && (
            <span style={{ color: duelInfo.breathing <= 2 ? T.rose : T.good }}> · his breathing squares: {duelInfo.breathing}</span>
          )}
        </div>
      )}
      <Board board={actSt.board} cell={cell} onSquare={click} wrong={wrong} selected={selected} dots={dots} last={actSt.last} checkSq={statusOf(actSt) !== "play" ? null : (inCheck(actSt, actSt.turn) ? kingIdx(actSt.board, actSt.turn) : null)} />
      {note && (
        <div style={{ fontFamily: T.serif, fontSize: 12.5, fontStyle: "italic", color: T.good, textAlign: "center", marginTop: 6, animation: "tp-fade .3s both" }}>{note}</div>
      )}
      {!finished && ex.moveHint && (
        <div style={{ fontFamily: T.serif, fontSize: 12.5, fontStyle: "italic", color: T.onMute, textAlign: "center", marginTop: 6 }}>{ex.moveHint}</div>
      )}
      {isDuel && !finished && (
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <Btn kind="ghost" onClick={() => { setLive(null); setNote(""); setSelected(null); }} style={{ fontSize: 12.5, padding: "6px 12px" }}>Restart the duel</Btn>
        </div>
      )}
      <FeedbackLine msg={msg} tone={tone} />
      {finished && <div style={{ textAlign: "center" }}><Btn kind="prime" onClick={onDone}>Continue </Btn></div>}
    </div>
  );
}

/* LESSON, study each setting, then do it yourself */
function Lesson({ concept, cell, onComplete, onExit }) {
  const [phase, setPhase] = useState("intro"); /* intro | ctx | hook | dues | done */
  const [ctxIdx, setCtxIdx] = useState(0);
  const [sub, setSub] = useState("study"); /* study | do */
  const [mistakes, setMistakes] = useState(0);
  const rankIdx = mistakes === 0 ? 2 : mistakes <= 2 ? 1 : 0;
  const ctx = concept.contexts[ctxIdx];
  const doneLine = useMemo(() => (phase === "done" ? pick(RANK_LINES[rankIdx]) : ""), [phase]);
  const header = (
    <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div>
          <div style={{ fontFamily: T.mono, color: T.paper, fontSize: 16, fontWeight: 600, letterSpacing: 0.5 }}>{concept.name}</div>
          <div style={{ fontFamily: T.serif, color: T.onMute, fontSize: 12.5 }}>Chapter {concept.ch} · {CHAPTERS[concept.ch - 1].title}</div>
        </div>
      </div>
      <Btn kind="ghost" onClick={onExit} style={{ padding: "6px 12px", fontSize: 12.5 }}>Leave</Btn>
    </div>
  );
  if (phase === "intro") {
    return (
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "24px 14px" }}>
        {header}
        <Card>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ fontSize: 16, lineHeight: 1.6 }}><TypeText text={concept.intro} /></div>
          </div>
        </Card>
        <div style={{ textAlign: "center", marginTop: 18 }}>
          <Btn kind="prime" onClick={() => { setPhase("ctx"); setCtxIdx(0); setSub("study"); }}>
            Start 
          </Btn>
        </div>
      </div>
    );
  }
  if (phase === "ctx") {
    const glow = sub === "study" ? demoGlowFor(ctx.ex) : null;
    const demoBoard = mkState(ctx.ex.pieces, ctx.ex.opts).board;
    return (
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "24px 14px" }}>
        {header}
        <div style={{ textAlign: "center", marginBottom: 10 }}>
          <span style={{
            fontFamily: T.mono, fontSize: 11, letterSpacing: 0.5, color: ACC[concept.ch],
            border: "1px solid " + ACC[concept.ch], borderRadius: 99, padding: "3px 12px"
          }}>
            SETTING {ctxIdx + 1} OF {concept.contexts.length} · {ctx.setting.toUpperCase()} · {formOf(ctx.ex).toUpperCase()}
          </span>
        </div>
        <div style={{ fontFamily: T.serif, fontStyle: "italic", color: T.onHi, textAlign: "center", fontSize: 14, marginBottom: 4 }}>{ctx.flavor}</div>
        <div style={{ fontFamily: T.serif, color: T.good, textAlign: "center", fontSize: 14, marginBottom: 14 }}>{ctx.explain}</div>
        {sub === "study" ? (
          <div>
            <Board board={demoBoard} cell={cell} glow={glow} dim />
            <div style={{ textAlign: "center", marginTop: 14 }}>
              <div style={{ fontFamily: T.serif, fontSize: 12.5, fontStyle: "italic", color: T.onBody, marginBottom: 10 }}>Study the marked pattern on the board until your eyes find it without hunting. Then play it.</div>
              <Btn kind="prime" onClick={() => setSub("do")}>{ctx.ex.type === "duel" ? "Begin" : ctx.ex.type === "exchange" ? "Begin the exchange" : "My turn"}</Btn>
            </div>
          </div>
        ) : (
          <ExercisePlayer key={concept.id + "-" + ctxIdx} ex={ctx.ex} cell={cell}
            onMistake={() => setMistakes((m) => m + 1)}
            onDone={() => {
              if (ctxIdx + 1 < concept.contexts.length) { setCtxIdx(ctxIdx + 1); setSub("study"); }
              else setPhase("hook");
            }} />
        )}
      </div>
    );
  }
  if (phase === "hook") {
    return (
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "24px 14px" }}>
        {header}
        <div style={{ textAlign: "center", fontFamily: T.mono, color: T.beige, letterSpacing: 0.5, fontSize: 12.5, marginBottom: 12 }}>THE MEMORY HOOK · CARRY IT LIKE A COIN</div>
        <div style={{ textAlign: "center", fontFamily: T.serif, fontSize: 12.5, fontStyle: "italic", color: T.onMute, marginBottom: 10 }}>
          Say it, see it, know when to reach for it. Three grips on the same idea.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Card style={{ background: T.paperCard, borderColor: T.blueDeep }}><div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 0.5, color: T.blueDeep, fontWeight: 600, marginBottom: 4 }}>SAY IT PLAINLY</div>{concept.hook.plain}</Card>
          <Card style={{ background: T.paperCard, borderColor: T.roseDeep }}><div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 0.5, color: T.roseDeep, fontWeight: 600, marginBottom: 4 }}>SEE IT</div><em>{concept.hook.image}</em></Card>
          <Card style={{ background: T.paperCard, borderColor: T.blueInk }}><div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 0.5, color: T.blueInk, fontWeight: 600, marginBottom: 4 }}>REACH FOR IT WHEN</div>{concept.hook.when}</Card>
        </div>
        {concept.depth && (
          <Card style={{ marginTop: 12, borderColor: T.beigeInk, background: T.paperWarm }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 0.5, color: T.beigeInk, fontWeight: 600, marginBottom: 6 }}>MARGIN NOTES · FOR WHEN YOU'RE READY</div>
            {concept.depth.map((d, i) => (
              <div key={i} style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 6 }}>{d}</div>
            ))}
          </Card>
        )}
        <div style={{ textAlign: "center", marginTop: 18 }}>
          <Btn kind="prime" onClick={() => setPhase("dues")}>To your dues</Btn>
        </div>
      </div>
    );
  }
  if (phase === "dues") {
    return (
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "24px 14px" }}>
        {header}
        <Card style={{ borderColor: T.beigeInk }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 0.5, color: T.beigeInk, fontWeight: 600 }}>CLUB DUES · THE REAL WORLD</div>
          </div>
          <div style={{ fontSize: 16, lineHeight: 1.6 }}>{concept.dues}</div>
          <div style={{ fontSize: 12.5, fontStyle: "italic", color: T.inkSoft, marginTop: 10, borderTop: "1px solid " + T.inkLine, paddingTop: 8 }}>
            The honest part: the page only becomes yours when your hands play it on a real board. The game cannot do that part for you.
          </div>
        </Card>
        <div style={{ textAlign: "center", marginTop: 18, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Btn kind="prime" onClick={() => setPhase("done")}>Mark it done</Btn>
          <Btn kind="ghost" onClick={() => setPhase("done")}>Not tonight</Btn>
        </div>
      </div>
    );
  }
  /* done */
  return (
    <div style={{ maxWidth: 620, margin: "0 auto", padding: "24px 14px", textAlign: "center" }}>
      {header}
      <div style={{ animation: "tp-fade .3s both", display: "inline-block", marginTop: 12 }}>
        <div style={{
          width: 110, height: 110, borderRadius: "50%", margin: "0 auto",
          background: T.beigeWash,
          border: "2px solid " + T.beige, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
        </div>
      </div>
      <CelebrateOnce />
      <div style={{ fontFamily: T.mono, color: T.paper, fontSize: 19, marginTop: 14, letterSpacing: 0.5 }}>Inked into the notebook: {concept.name}</div>
      <div style={{ marginTop: 8 }}><RankCount n={rankIdx} size={20} /></div>
      <div style={{ fontFamily: T.serif, color: T.beige, fontSize: 14, marginTop: 4 }}>{RANKS[rankIdx].name} rank{mistakes > 0 ? " · " + mistakes + " loose " + (mistakes === 1 ? "move" : "moves") : " · flawless"}</div>
      <div style={{ marginTop: 16 }}>
        <FeedbackLine msg={doneLine} tone="good" />
      </div>
      <div style={{ marginTop: 8 }}>
        <Btn kind="prime" onClick={() => onComplete(concept.id, rankIdx)}>Back to the club</Btn>
      </div>
    </div>
  );
}

/* TRIALS (boss runs) */
function BossRun({ boss, cell, onComplete, onExit }) {
  const [stage, setStage] = useState("intro");
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  if (stage === "intro") {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 14px" }}>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{ fontFamily: T.mono, color: T.paper, fontSize: 19, letterSpacing: 0.5 }}>{boss.name}</div>
          <div style={{ fontFamily: T.serif, color: T.onMute, fontSize: 14, fontStyle: "italic" }}>{boss.tagline}</div>
        </div>
        <div style={{ margin: "14px 0" }}>
          <Board board={boardFrom(boss.vision.pieces)} cell={Math.min(cell, 30)} dim />
          <div style={{ fontFamily: T.serif, fontSize: 12.5, color: T.good, textAlign: "center", marginTop: 8, maxWidth: 460, marginLeft: "auto", marginRight: "auto", fontStyle: "italic" }}>
            {boss.vision.caption}
          </div>
        </div>
        <Cutscene lines={boss.intro} onDone={() => setStage("phase")} doneLabel="Begin the trial" />
        <div style={{ textAlign: "center" }}>
          <Btn kind="ghost" onClick={onExit} style={{ fontSize: 12.5 }}>Retreat for now</Btn>
        </div>
      </div>
    );
  }
  if (stage === "phase") {
    const ph = boss.phases[phaseIdx];
    return (
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "24px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: T.serif, color: T.paper, fontSize: 14, fontWeight: 600 }}>{boss.name}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: T.mono, fontSize: 12.5, color: T.rose }}>{mistakes} {mistakes === 1 ? "slip" : "slips"}</span>
          </div>
        </div>
        <div style={{ textAlign: "center", marginBottom: 10 }}>
          <span style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 0.5, color: ACC[boss.ch], border: "1px solid " + ACC[boss.ch], borderRadius: 99, padding: "3px 12px" }}>
            {ph.label.toUpperCase()} · {phaseIdx + 1}/{boss.phases.length}
          </span>
        </div>
        <div style={{ fontFamily: T.serif, fontStyle: "italic", color: T.onHi, textAlign: "center", fontSize: 14, marginBottom: 12, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>{ph.text}</div>
        {mistakes >= 6 && (
          <div style={{ fontFamily: T.serif, fontSize: 12.5, color: T.rose, textAlign: "center", marginBottom: 8 }}>
            The position frays. Positions can be rebuilt. Keep playing.
          </div>
        )}
        <ExercisePlayer key={boss.id + "-" + phaseIdx} ex={ph.ex} cell={cell}
          onMistake={() => setMistakes((m) => m + 1)}
          onDone={() => {
            if (phaseIdx + 1 < boss.phases.length) setPhaseIdx(phaseIdx + 1);
            else setStage("outro");
          }} />
      </div>
    );
  }
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 14px" }}>
      <div style={{ textAlign: "center", fontFamily: T.mono, color: T.beige, fontSize: 19, letterSpacing: 0.5, marginBottom: 6, animation: "tp-fade .3s both" }}>
        Match complete
      </div>
      <Cutscene lines={boss.outro} onDone={() => onComplete(mistakes)} doneLabel="Back to the club" />
    </div>
  );
}

/* THE LONG GAME, full game vs the Pale Automaton */
function Trial({ cell, onEnd, onExit }) {
  const fresh = () => mkState("start", { castling: { K: true, Q: true, k: true, q: true } });
  const [st, setSt] = useState(fresh);
  const [selected, setSelected] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [whispers, setWhispers] = useState(3);
  const [whisperGlow, setWhisperGlow] = useState(null);
  const [comment, setComment] = useState("It is awake. It moves second, and it does not forgive twice. Play your first move: e4 or d4.");
  const flags = useRef({ cap: false, check: false, castle: false, promo: false, queen: false });
  const status = useMemo(() => statusOf(st), [st]);
  const legal = useMemo(() => (status === "play" && st.turn === "w" ? legalMoves(st) : []), [st, status]);
  const dots = selected != null ? new Set(legal.filter((m) => m.from === selected).map((m) => m.to)) : new Set();
  const playerChecked = status === "play" && st.turn === "w" && inCheck(st, "w");

  useEffect(() => {
    if (status !== "play" || st.turn !== "b") return;
    setThinking(true);
    const id = setTimeout(() => {
      const m = bestMove(st, 2);
      if (m) {
        const next = apply(st, m);
        setSt(next);
        if (m.cap) SFX.capture(); else SFX.move();
        if (inCheck(next, "w")) SFX.check();
        if (statusOf(next) === "play") {
          if (inCheck(next, "w") && !flags.current.check) {
            flags.current.check = true;
            setComment("The alarm. Walk the three doors, move, block, capture, and take the calmest one.");
          } else if (!next.board.some((p) => p && p.c === "w" && p.t === "q") && !flags.current.queen && st.board.some((p) => p && p.c === "w" && p.t === "q")) {
            flags.current.queen = true;
            setComment("Your queen falls. Breathe. Games are won from worse, arithmetic still exists. Count what remains.");
          }
        }
      }
      setThinking(false);
    }, 450);
    return () => clearTimeout(id);
  }, [st, status]);

  const clickSquare = (i) => {
    if (status !== "play" || st.turn !== "w" || thinking) return;
    const p = st.board[i];
    if (selected != null && dots.has(i)) {
      const m = legal.find((mm) => mm.from === selected && mm.to === i);
      setSelected(null);
      const next = apply(st, m);
      setSt(next);
      if (m.cap) SFX.capture(); else SFX.move();
      if (inCheck(next, "b")) SFX.check();
      if (m.castle && !flags.current.castle) { flags.current.castle = true; setComment("Castled before the storm. Your king sleeps behind its pawns. Good."); }
      else if (m.promo && !flags.current.promo) { flags.current.promo = true; setComment("A promotion, in the middle of the trial. The smallest piece, crowned."); }
      else if (m.cap && !flags.current.cap) { flags.current.cap = true; setComment("First blood to you. It will not sulk. Watch its reply like a hawk."); }
      else if (inCheck(next, "b")) setComment("You sound the alarm on it for once. Press, but count your defenders first.");
      return;
    }
    if (p && p.c === "w") { setSelected(i); return; }
    setSelected(null);
  };
  const whisper = () => {
    if (whispers <= 0 || status !== "play" || st.turn !== "w" || thinking) return;
    const m = bestMove(st, 2);
    if (!m) return;
    setWhispers(whispers - 1);
    setWhisperGlow(new Set([m.from, m.to]));
    setComment("Look here. " + PIECE_NAME[st.board[m.from].t] + " from " + nameOf(m.from) + ". Work out why.");
    setTimeout(() => setWhisperGlow(null), 2200);
  };
  const matDiff = useMemo(() => {
    let d = 0;
    for (const p of st.board) if (p && p.t !== "k") d += p.c === "w" ? VAL[p.t] : -VAL[p.t];
    return Math.round(d / 100);
  }, [st]);
  const ended = status !== "play";
  const result = !ended ? null : status === "checkmate" ? (st.turn === "b" ? "win" : "lose") : "draw";

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "20px 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontFamily: T.mono, color: T.paper, fontSize: 16, letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 8 }}>
          The Long Game
        </div>
        <Btn kind="ghost" onClick={onExit} style={{ padding: "6px 12px", fontSize: 12.5 }}>Withdraw</Btn>
      </div>
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", justifyContent: "center" }}>
        <div>
          <div style={{ fontFamily: T.serif, fontSize: 12.5, color: T.onMute, textAlign: "center", marginBottom: 4, minHeight: 18 }}>
            {thinking ? "The Pale Automaton considers..." : playerChecked ? "" : ended ? "" : "Your move. You play White."}
          </div>
          {playerChecked && !ended && (
            <div style={{ fontFamily: T.serif, color: T.rose, textAlign: "center", fontSize: 14, marginBottom: 4, animation: "tp-fade .3s both" }}>
              THE ALARM SOUNDS, move, block, or capture.
            </div>
          )}
          <Board board={st.board} cell={cell} onSquare={clickSquare} selected={selected} dots={dots} last={st.last} glow={whisperGlow || undefined} checkSq={inCheck(st, st.turn) ? kingIdx(st.board, st.turn) : null} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontFamily: T.serif, fontSize: 16, color: T.onHi, maxWidth: cell * 8, marginLeft: "auto", marginRight: "auto" }}>
            <span>{st.caps.w.map((p, i) => <span key={i} style={{ color: T.ink, textShadow: "0 1px 1px " + T.sheenSoft }}>{GLYPH[p.t]}</span>)}</span>
            <span style={{ fontFamily: T.mono, fontSize: 12.5, color: matDiff === 0 ? T.onMute : matDiff > 0 ? T.good : T.rose }}>
              {matDiff === 0 ? "even" : (matDiff > 0 ? "+" + matDiff + " you" : matDiff + " you")}
            </span>
            <span>{st.caps.b.map((p, i) => <span key={i} style={{ color: T.paper, textShadow: "0 1px 2px " + T.pieceShade }}>{GLYPH[p.t]}</span>)}</span>
          </div>
        </div>
        <div style={{ width: 270, display: "flex", flexDirection: "column", gap: 12 }}>
          <Card style={{ padding: 12 }}>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ fontSize: 14, lineHeight: 1.6, fontStyle: "italic" }}>{comment}</div>
            </div>
          </Card>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Btn onClick={whisper} disabled={whispers <= 0 || ended || thinking} style={{ fontSize: 12.5, padding: "8px 14px", borderColor: T.blueLine, color: T.blueLight }}>
              Whisper ({whispers})
            </Btn>
            <Btn kind="ghost" onClick={() => { setSt(fresh()); setSelected(null); setWhispers(3); flags.current = { cap: false, check: false, castle: false, promo: false, queen: false }; setComment("Again, then. Use what you learned."); }} style={{ fontSize: 12.5, padding: "8px 14px" }}>
              Restart
            </Btn>
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 12.5, color: T.onBody, lineHeight: 1.6 }}>
            {st.hist.length === 0 ? <em>No moves yet. The whole game is unwritten.</em> :
              st.hist.slice(-8).map((h, i) => <div key={i}>{st.hist.length - Math.min(8, st.hist.length) + i + 1}. {h}</div>)}
          </div>
        </div>
      </div>
      {ended && (
        <div style={{ textAlign: "center", marginTop: 16, animation: "tp-fade .3s both" }}>
          {result === "win" && <CelebrateOnce />}
          <div style={{ fontFamily: T.mono, fontSize: 19, color: result === "win" ? T.beige : result === "lose" ? T.rose : T.blueLight, letterSpacing: 0.5, marginBottom: 10 }}>
            {result === "win" ? "CHECKMATE, THE AUTOMATON FALLS" : result === "lose" ? "CHECKMATE, THE MACHINE TAKES THIS ONE" : "THE POSITION FREEZES, A DRAW"}
          </div>
          <Btn kind="prime" onClick={() => onEnd(result)}>Continue </Btn>
        </div>
      )}
    </div>
  );
}

/* TEMPO (hub) */
function Modal({ onClose, children }) {
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: T.overlay, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560, width: "100%", maxHeight: "86vh", overflowY: "auto", animation: "tp-fade .25s both" }}>
        {children}
      </div>
    </div>
  );
}
function conceptUnlocked(idx, ledger) {
  const c = CONCEPTS[idx];
  if (c.ch >= 2 && !ledger.bosses.gauntlet) return false;
  if (c.ch >= 3 && !ledger.bosses.requiem) return false;
  if (c.ch >= 4 && !ledger.bosses.snare) return false;
  if (idx === 0) return true;
  return !!ledger.done[CONCEPTS[idx - 1].id];
}
function unitsOf(ledger) {
  return Object.keys(ledger.done).length + Object.keys(ledger.bosses).length + (ledger.trialDone ? 1 : 0);
}

const CARDS = [
  { id: "immortal", rarity: 3, title: "The Immortal Game, 1851", sub: "Anderssen vs Kieseritzky, London", text: "Anderssen gave away both rooks, a bishop, and his queen, then mated with three minor pieces. The most famous sacrifice spree ever played." },
  { id: "opera", rarity: 3, title: "The Opera Game, 1858", sub: "Morphy vs the Duke and Count, Paris", text: "Played in an opera box during the show. Morphy developed every piece, sacrificed his queen, and mated in seventeen moves. The best first game anyone can study." },
  { id: "evergreen", rarity: 3, title: "The Evergreen Game, 1852", sub: "Anderssen vs Dufresne, Berlin", text: "A quiet little pawn move set up a queen sacrifice and a mate so pretty the game earned a nickname that has lasted 170 years." },
  { id: "century", rarity: 3, title: "The Game of the Century, 1956", sub: "Byrne vs Fischer, New York", text: "Fischer was thirteen. He left his queen hanging on purpose and won with a windmill of discovered checks. Thirteen." },
  { id: "deepblue", rarity: 3, title: "Deep Blue vs Kasparov, 1997", sub: "Game 6, New York", text: "The first time a machine beat a reigning world champion in a match. Nineteen moves. The thing in the back room hums when you read this out loud." },
  { id: "kimmortal", rarity: 3, title: "Kasparov's Immortal, 1999", sub: "Kasparov vs Topalov, Wijk aan Zee", text: "A king hunt across the entire board, calculated around fifteen moves deep. Widely called the greatest single game ever played." },
  { id: "philidor", rarity: 2, title: "Francois-Andre Philidor", sub: "1726 to 1795", text: "A famous composer who was also the strongest player of his century. 'Pawns are the soul of chess.' Your pawn page is named after this line." },
  { id: "morphy", rarity: 2, title: "Paul Morphy", sub: "The Pride of New Orleans", text: "He beat everyone in Europe by simply developing faster than them, then quit chess at twenty-two. Speed of development is still the first law." },
  { id: "capablanca", rarity: 2, title: "Jose Raul Capablanca", sub: "The Chess Machine", text: "Learned at four by watching his father play. Lost only 34 serious games in his entire life. His endgames look less like play and more like gravity." },
  { id: "menchik", rarity: 2, title: "Vera Menchik", sub: "First Women's World Champion", text: "Held the title from 1927 until her death, defending it eight times. Men who lost to her were jokingly inducted into the Vera Menchik Club. It got crowded." },
  { id: "fischer", rarity: 2, title: "Bobby Fischer", sub: "The Match of the Century, 1972", text: "Won twenty games in a row against the best players alive on his way to the world title. 'Tactics flow from a superior position.'" },
  { id: "kasparov", rarity: 2, title: "Garry Kasparov", sub: "Fifteen Years at Number One", text: "The dominant player of the late twentieth century, and the first champion to lose to a machine. He kept playing anyway. That part is the lesson." },
  { id: "polgar", rarity: 2, title: "Judit Polgar", sub: "Strongest Woman Ever to Play", text: "Beat eleven world champions across her career, including Kasparov. Never once entered the women's championship. She didn't need to." },
  { id: "carlsen", rarity: 2, title: "Magnus Carlsen", sub: "The Modern Endgame", text: "World champion at twenty-two, famous for squeezing wins out of positions everyone else has already called drawn. Proof the endgame page matters." },
  { id: "lasker", rarity: 1, title: "Look for a Better One", sub: "Emanuel Lasker", text: "'When you see a good move, look for a better one.' Twenty-seven years as world champion says listen to him." },
  { id: "chernev", rarity: 1, title: "Every Master", sub: "Irving Chernev", text: "'Every master was once a beginner.' It's painted by the door of this club for a reason." },
  { id: "tarrasch", rarity: 1, title: "Rooks Behind Passers", sub: "Siegbert Tarrasch", text: "'Rooks belong behind passed pawns.' Yours or theirs. It works both directions." },
  { id: "nimzo", rarity: 1, title: "The Threat", sub: "Aron Nimzowitsch", text: "'The threat is stronger than the execution.' Making them worry is often worth more than cashing in." },
  { id: "tarta1", rarity: 1, title: "Never Resign", sub: "Savielly Tartakower", text: "'No one ever won a game by resigning.' Play it out. At your level, opponents hand games back constantly." },
  { id: "tarta2", rarity: 1, title: "The Waiting Blunders", sub: "Savielly Tartakower", text: "'The blunders are all there on the board, waiting to be made.' After every enemy move, ask what changed." },
  { id: "spielmann", rarity: 1, title: "Book, Magician, Machine", sub: "Rudolf Spielmann", text: "'Play the opening like a book, the middlegame like a magician, the endgame like a machine.'" },
  { id: "reinfeld", rarity: 1, title: "The Pin", sub: "Fred Reinfeld", text: "'The pin is mightier than the sword.' A bad pun and real advice. Pile onto what cannot move." },
  { id: "touch", rarity: 1, title: "Touch Move", sub: "The Oldest House Rule", text: "In serious chess, touch a piece and you must move it. Train your eyes to move before your hands do." },
  { id: "luft", rarity: 1, title: "Luft", sub: "Club Slang", text: "German for air: the escape hole you make for your castled king. One pawn step prevents every back rank mate ever invented." }
];
const RARITY = {
  1: { name: "HOUSE WISDOM", col: T.blueDeep,   ink: T.inkSoft },
  2: { name: "MASTER",       col: T.blue,       ink: T.blueInk },
  3: { name: "IMMORTAL",     col: T.beigeLight, ink: T.beigeInk },
};

function Cabinet({ ledger, onPull }) {
  const [reveal, setReveal] = useState(null);
  const chips = ledger.chips || 0;
  const owned = ledger.cards || {};
  const count = Object.keys(owned).length;
  const pull = () => {
    if (chips < 40) return;
    setReveal(onPull());
  };
  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <div style={{ fontFamily: T.serif, fontStyle: "italic", color: T.onMute, fontSize: 14 }}>
          The cabinet is full of things worth knowing. Forty chips a story. Some of them are legendary.
        </div>
        <div style={{ fontFamily: T.mono, color: T.beige, fontSize: 12.5, letterSpacing: 0.5, marginTop: 8 }}>
          {chips} CHIPS · {count}/{CARDS.length} COLLECTED
        </div>
        <div style={{ marginTop: 10 }}>
          <Btn kind="prime" onClick={pull} disabled={chips < 40}>
            Ask for a story · 40 chips
          </Btn>
        </div>
      </div>
      {reveal && reveal.card && (
        <div style={{ position: "relative", animation: "tp-fade .3s both", marginBottom: 16 }}>
          <Card style={{
            borderColor: RARITY[reveal.card.rarity].ink,
            background: reveal.card.rarity === 3 ? T.paperBeige : reveal.card.rarity === 2 ? T.paperBlue : T.paperCard,
            position: "relative", overflow: "hidden"
          }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 0.5, color: RARITY[reveal.card.rarity].ink, fontWeight: 600 }}>{RARITY[reveal.card.rarity].name}</div>
            <div style={{ fontFamily: T.serif, fontSize: 17, margin: "3px 0 1px" }}>{reveal.card.title}</div>
            <div style={{ fontSize: 12.5, fontStyle: "italic", color: T.inkSoft, marginBottom: 8 }}>{reveal.card.sub}</div>
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>{reveal.card.text}</div>
          </Card>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8 }}>
        {[3, 2, 1].map((r) => CARDS.filter((c) => c.rarity === r).map((c) => owned[c.id] ? (
          <div key={c.id} style={{ borderRadius: 12, padding: "8px 10px", border: "1px solid " + RARITY[r].col, background: r === 3 ? T.beigeWash : T.well, boxShadow: "none" }}>
            <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 0.5, color: RARITY[r].col }}>{RARITY[r].name}</div>
            <div style={{ fontFamily: T.serif, color: T.paper, fontSize: 12.5 }}>{c.title}</div>
          </div>
        ) : (
          <div key={c.id} style={{ borderRadius: 12, padding: "8px 10px", border: "1px dashed " + T.onGhost, background: T.wellSoft }}>
            <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 0.5, color: T.onSoft }}>{RARITY[r].name}</div>
            <div style={{ fontFamily: T.serif, color: T.onFaint, fontSize: 12.5 }}>? ? ?</div>
          </div>
        )))}
      </div>
    </div>
  );
}

const SALON = [
  { id: "storm", deck: 1, title: "The Pawn Storm",
    pieces: [["g1", "wK"], ["f2", "wP"], ["g2", "wP"], ["h2", "wP"], ["a2", "wP"], ["b2", "wP"], ["c3", "wP"], ["d4", "wP"], ["f1", "wR"], ["a1", "wR"], ["e3", "wB"], ["d2", "wQ"], ["f3", "wN"], ["c8", "bK"], ["a7", "bP"], ["b7", "bP"], ["c7", "bP"], ["e6", "bP"], ["g4", "bP"], ["h4", "bP"], ["d8", "bR"], ["h8", "bR"], ["d7", "bQ"], ["f6", "bN"]], spots: ["g4", "h4", "a2", "b2"], sit: "You castled kingside. He castled queenside, and now his pawns are marching at your king: g4, h4, g5.",
    principle: "Races are won by racing", deep: "Opposite-side castling turns chess into a footrace, and you count attacking tempos, not material. The books call these mutual pawn storms. The first player to hesitate usually loses.",
    protocol: [
      { k: "NOTICE", t: "Kings on opposite wings. That single fact rewrites every evaluation on the board: this is now a race, and races are scored in tempos, not points." },
      { k: "CANDIDATES", t: "Three plans volunteer: push my a and b pawns at his king, trade queens to defuse, or dig in and defend. Passive defense I discard on principle before calculating a single move." },
      { k: "COMPARE", t: "I count. His storm needs g5, g6, and an open file: call it five tempos to real threats. My b4, b5, b6 lever arrives in four, because his king's pawns already moved and mine have not. I am faster." },
      { k: "VERIFY", t: "Before committing I hunt for his best answer, not the one I hope for: can g5 come with tempo on a piece of mine? If yes, my count is wrong and I recount before touching anything." },
    ],
    cog: "De Groot's classic think-aloud studies found masters do not search deeper than club players: they perceive better. 'Opposite castling means race' is recognized before conscious thought, and it silently swaps in a different evaluation function.",
    options: [
      { t: "Counter-storm his king", eff: 3, why: "Every move you spend watching is a move he spends attacking. Push YOUR pawns at HIS king and make him blink first." },
      { t: "Defend with every piece", eff: 1, why: "Pure defense loses the race. He attacks for free while you tie your own pieces in knots." },
      { t: "Offer a queen trade", eff: 2, why: "Most storms die without a queen to crown them. If he declines, you lost nothing." },
      { t: "Grab a far-away pawn", eff: 1, why: "While you snack on the a-pawn, he checkmates you. Material means nothing to a mated king." }
    ],
    follow: { sit: "He insists. g5 crashes in anyway, and lines start cracking open near your king.", pieces: [["g1", "wK"], ["f2", "wP"], ["h2", "wP"], ["a2", "wP"], ["b2", "wP"], ["c3", "wP"], ["d4", "wP"], ["f1", "wR"], ["a1", "wR"], ["e3", "wB"], ["d2", "wQ"], ["f3", "wN"], ["c8", "bK"], ["a7", "bP"], ["b7", "bP"], ["c7", "bP"], ["e6", "bP"], ["g3", "bP"], ["h4", "bP"], ["d8", "bR"], ["h8", "bR"], ["d7", "bQ"], ["f6", "bN"]], spots: ["g3", "h4", "f3", "e3"],
      options: [
        { t: "Trade off each attacker as it arrives", eff: 3, why: "Every trade is a bucket of water on his fire. An attack with no attackers is just weather." },
        { t: "Push your counter-pawns even faster", eff: 2, why: "Still a race, and you are still in it. But now some defensive housekeeping buys you tempo too." },
        { t: "Walk your king across the board", eff: 1, why: "Kings do not outrun pawn storms in the open. He would be checked the whole way." }
      ] } },
  { id: "outpost", deck: 1, title: "The Outpost Knight",
    pieces: [["g1", "wK"], ["a2", "wP"], ["b2", "wP"], ["e3", "wP"], ["f2", "wP"], ["g2", "wP"], ["h2", "wP"], ["c1", "wR"], ["f1", "wR"], ["e2", "wB"], ["d2", "wQ"], ["g8", "bK"], ["a7", "bP"], ["b7", "bP"], ["e6", "bP"], ["f7", "bP"], ["g7", "bP"], ["h7", "bP"], ["d5", "bN"], ["c8", "bB"], ["f8", "bR"], ["d8", "bQ"]], spots: ["d5", "e6"], sit: "His knight has settled on d5, protected by a pawn. No pawn of yours can ever kick it.",
    principle: "Remove the permanent piece", deep: "An outpost is a square a piece can hold forever because no enemy pawn can ever attack it. Steinitz taught that a knight on a protected central outpost outweighs almost anything. Permanent problems get traded away.",
    protocol: [
      { k: "NOTICE", t: "My eye snags on d5 before anything else: a knight my pawns can never speak to again. Permanent features outrank temporary ones, so it jumps the queue." },
      { k: "CANDIDATES", t: "Evict it, ignore it, trade it, or copy it. Eviction dies immediately: no pawn can ever reach the square, and piling pieces onto a pawn-guarded knight loses material by simple arithmetic." },
      { k: "COMPARE", t: "Trading costs my good bishop, which stings, so I price the alternative: leave it, and every future plan of his gets a free anchor. A one-time payment against a permanent tax. I pay once." },
      { k: "VERIFY", t: "Last check, his side of the deal: after bishop takes knight, the pawn recaptures. A file opens for his rook and a fixed pawn appears on d5. New position, new problems: I confirm I like those problems before I trade." },
    ],
    cog: "Chase and Simon's chunking experiments showed masters hold tens of thousands of board patterns: 'protected knight on the sixth' is retrieved as one chunk, arriving complete with its evaluation and its standard cure attached, no search required.",
    options: [
      { t: "Trade it off, whatever it costs", eff: 3, why: "It organizes his whole game from that square. Give a bishop for it if you must. Remove the tenant." },
      { t: "Ignore it and play elsewhere", eff: 1, why: "It is not decoration. It watches six squares in your camp and every plan he makes will lean on it." },
      { t: "Pile attackers onto it", eff: 1, why: "It is guarded by a pawn. Every capture there loses material. You cannot bully a paid-up tenant." },
      { t: "Build your own outpost", eff: 2, why: "Counterplay in kind is honest chess. But his is installed and yours is a promise. Slower." }
    ],
    follow: { sit: "You gave your bishop for the knight. He recaptured with the pawn, and now a fixed pawn sits on d5 while his rook's file has opened.", pieces: [["g1", "wK"], ["a2", "wP"], ["b2", "wP"], ["e3", "wP"], ["f2", "wP"], ["g2", "wP"], ["h2", "wP"], ["c1", "wR"], ["f1", "wR"], ["d2", "wQ"], ["g8", "bK"], ["a7", "bP"], ["b7", "bP"], ["d5", "bP"], ["f7", "bP"], ["g7", "bP"], ["h7", "bP"], ["c8", "bB"], ["e8", "bR"], ["d8", "bQ"]], spots: ["d5", "d4"],
      options: [
        { t: "Blockade and besiege the new d5 pawn", eff: 3, why: "The tenant became a fence post. A fixed pawn on an open board is a target that can never run." },
        { t: "Contest the newly opened file", eff: 2, why: "Sensible housekeeping. Files matter. But the pawn is the lasting weakness the trade created for you." },
        { t: "Regret the trade", eff: 1, why: "The knight was worse than the bishop. No refunds, no regrets, next move." }
      ] } },
  { id: "poison", deck: 1, title: "The Poisoned Pawn",
    pieces: [["e1", "wK"], ["a1", "wR"], ["h1", "wR"], ["c3", "wN"], ["f3", "wN"], ["c4", "wB"], ["c1", "wB"], ["b3", "wQ"], ["a2", "wP"], ["b2", "wP"], ["c2", "wP"], ["d3", "wP"], ["e4", "wP"], ["f2", "wP"], ["g2", "wP"], ["h2", "wP"], ["e8", "bK"], ["a8", "bR"], ["h8", "bR"], ["c6", "bN"], ["g8", "bN"], ["d7", "bB"], ["f8", "bB"], ["d8", "bQ"], ["a7", "bP"], ["b7", "bP"], ["c7", "bP"], ["d6", "bP"], ["e5", "bP"], ["f7", "bP"], ["g7", "bP"], ["h7", "bP"]], spots: ["b7", "b3"], sit: "Move six. His b7 pawn stands undefended, and your queen on b3 can march up and take it right now.",
    principle: "Time is the currency of openings", deep: "The most famous poisoned pawn lives in the Najdorf Sicilian, where even world champions burned their fingers. The pawn is real. So is the cage that closes while your queen carries it home.",
    protocol: [
      { k: "NOTICE", t: "A free pawn on b7, and my alarm rings louder the freer it looks. Opening gifts are priced in tempo, so the first question is what the shopkeeper charges." },
      { k: "CANDIDATES", t: "Take it now, take it only after calculating the escape, or decline and develop. Naive greed and total abstinence are both lazy answers: the honest one runs the numbers." },
      { k: "COMPARE", t: "Cost of capture: my queen travels in, and after his rook hits her on b8 she spends two more moves coming home while he develops with every hit. Four tempos for one pawn, in the phase where tempo is the entire economy." },
      { k: "VERIFY", t: "The exception check: can I calculate the full escape to a quiet position? Champions have taken this exact pawn with the route mapped end to end. If my calculation fogs anywhere along the line, the fog is my answer." },
    ],
    cog: "This is dual-process thinking in one decision: fast pattern memory flags the trap instantly, and slow calculation is invited only to hunt for the exception. Expertise is spending expensive attention exactly where cheap recognition says it might pay.",
    options: [
      { t: "Decline, develop a piece", eff: 3, why: "Early queen trips cost the one thing openings are about: time. His rook swings to b8 with tempo and he develops free moves while your queen swims home." },
      { t: "Take it immediately", eff: 1, why: "They named it the poisoned pawn for a reason. Greed without calculation is how queens get lost." },
      { t: "Take it after calculating the exit", eff: 2, why: "Masters do take it, with the escape counted to the last move. If you can truly calculate it, greed is a skill." },
      { t: "Offer a queen trade instead", eff: 1, why: "Trading queens six moves in, for no reason, answers a question nobody asked." }
    ] },
  { id: "file", deck: 1, title: "The Open File",
    pieces: [["g1", "wK"], ["a1", "wR"], ["f1", "wR"], ["d3", "wB"], ["c2", "wQ"], ["a2", "wP"], ["b2", "wP"], ["c3", "wP"], ["f2", "wP"], ["g2", "wP"], ["h2", "wP"], ["g8", "bK"], ["a8", "bR"], ["f8", "bR"], ["d6", "bB"], ["c7", "bQ"], ["a7", "bP"], ["b7", "bP"], ["c6", "bP"], ["f7", "bP"], ["g7", "bP"], ["h7", "bP"]], spots: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8"], sit: "The center pawns have all been traded. One open file runs down the middle of the board, unclaimed.",
    principle: "Files are claimed, not shared", deep: "Rooks starve behind pawns and feast on open files. Tarrasch taught that the file is only the doorway: the seventh rank behind it is the feast. Whoever arrives first rarely leaves.",
    protocol: [
      { k: "NOTICE", t: "One open file, and it lands like an open door in a hallway of walls. My rooks are my worst-employed pieces, and the board just published their job listing." },
      { k: "CANDIDATES", t: "Claim it this move, prepare doubling first, or play elsewhere and claim later. 'Later' assumes his cooperation, and I never build plans on the opponent's cooperation." },
      { k: "COMPARE", t: "First arrival matters because files change hands only through recapture. If my rook lands first with support ready, his challenge merely replaces my doorman with another of mine." },
      { k: "VERIFY", t: "I look one step past the file: which entry square on the seventh does it feed, and is it guarded? A file leading nowhere is a corridor without rooms. This one leads to his queenside pawns. Good corridor." },
    ],
    cog: "Experts encode moves as destinations with futures attached: the file is perceived as a corridor to the seventh rank, one bound concept. Eye-tracking shows master gaze leaping to the far entry square within the first fixations.",
    options: [
      { t: "Rook to the file, first", eff: 3, why: "Whoever owns the only open file owns the seventh rank next. Files go to whoever arrives first." },
      { t: "Double both rooks on it later", eff: 2, why: "Doubling is the right SECOND step. It starts with claiming the file before he does." },
      { t: "Push your wing pawns", eff: 1, why: "You are decorating the edges while he moves into the only house on the street." },
      { t: "March your king to the center", eff: 1, why: "With heavy pieces on the board, a centered king is a target. That plan waits for the endgame." }
    ],
    follow: { sit: "Your rook owns the file. Now his rook steps up to challenge it, offering the trade.", pieces: [["g1", "wK"], ["a1", "wR"], ["e1", "wR"], ["d3", "wB"], ["c2", "wQ"], ["a2", "wP"], ["b2", "wP"], ["c3", "wP"], ["f2", "wP"], ["g2", "wP"], ["h2", "wP"], ["g8", "bK"], ["a8", "bR"], ["e8", "bR"], ["d6", "bB"], ["c7", "bQ"], ["a7", "bP"], ["b7", "bP"], ["c6", "bP"], ["f7", "bP"], ["g7", "bP"], ["h7", "bP"]], spots: ["e1", "e8", "a1"],
      options: [
        { t: "Keep a claimant: support or double", eff: 3, why: "The file belongs to whoever can RECAPTURE on it. Back your rook up and the trade only replaces your doorman." },
        { t: "Trade, then invade with the queen", eff: 2, why: "Workable if your queen truly inherits the file. Heavier pieces make clumsier doormen, though." },
        { t: "Retreat off the file", eff: 1, why: "You just handed over the only open file with a bow on it." }
      ] } },
  { id: "uprook", deck: 1, title: "Winning Won Games",
    pieces: [["g1", "wK"], ["e2", "wQ"], ["d1", "wR"], ["c1", "wR"], ["e3", "wB"], ["a2", "wP"], ["b2", "wP"], ["f2", "wP"], ["g2", "wP"], ["h3", "wP"], ["g8", "bK"], ["h4", "bQ"], ["g4", "bN"], ["d6", "bB"], ["f5", "bP"], ["g5", "bP"], ["a7", "bP"], ["b7", "bP"]], spots: ["h4", "g4"], sit: "You are up a whole rook. He is swinging wildly, sacrificing pawns, creating chaos everywhere.",
    principle: "The winning side simplifies", deep: "Convert by trading pieces and keeping pawns: every swap drains his attack, and your extra rook wins any quiet ending by itself. Risk is a gift you hand to the losing player.",
    protocol: [
      { k: "NOTICE", t: "I am up a rook, and I can feel the pull to punish him faster. I name the feeling out loud so I can refuse it: excitement is not an evaluation." },
      { k: "CANDIDATES", t: "Attack harder, simplify by trading pieces, or hoard everything. When winning, I shrink the menu on purpose: I want the version of this game with the fewest branches in it." },
      { k: "COMPARE", t: "Each piece trade prunes his tree and mine. Chaos needs pieces the way fire needs fuel, and my extra rook wins any quiet ending by itself, so every simplification is strictly profit." },
      { k: "VERIFY", t: "Now try to break it: what is his most annoying refusal? He dodges trades and checks forever. So I pre-decide the refund: which piece I hand back to buy silence. Choosing the payment before the argument is technique." },
    ],
    cog: "Risk preference should invert with the score, but loss aversion tempts winners to keep gambling with house money. Strong players consciously flip the policy: when ahead, minimize variance; when lost, maximize it. The emotion says attack; the policy says prune.",
    options: [
      { t: "Trade pieces, keep pawns", eff: 3, why: "Every trade drains his attack and walks the game toward an ending your rook wins alone." },
      { t: "Attack even harder", eff: 1, why: "You have everything to lose and he has nothing. Complications are his only hope. Deny them." },
      { t: "Trade pawns, keep pieces", eff: 1, why: "Backwards. Pawns are your future queens. Keep them, and shed the pieces his chaos needs." },
      { t: "Give a little back for calm", eff: 2, why: "Returning an exchange to kill every threat is how professionals convert. Boring wins count the same." }
    ],
    follow: { sit: "He refuses every trade you offer and keeps his queen out, checking your king again and again.", pieces: [["g1", "wK"], ["e2", "wQ"], ["d1", "wR"], ["c1", "wR"], ["e3", "wB"], ["a2", "wP"], ["b2", "wP"], ["f2", "wP"], ["g2", "wP"], ["h3", "wP"], ["g8", "bK"], ["h4", "bQ"], ["g4", "bN"], ["d6", "bB"], ["f5", "bP"], ["g5", "bP"], ["a7", "bP"], ["b7", "bP"]], spots: ["h4", "e3"],
      options: [
        { t: "Give material back to force quiet", eff: 3, why: "Toss a piece on the fire to end the checks. Up a rook, you can pay for silence and still win easily." },
        { t: "Walk the king to a pawn shelter", eff: 2, why: "Solid. A king tucked behind pawns starves a queen of checks, eventually." },
        { t: "Chase his queen with your rook", eff: 1, why: "Lone rooks that chase queens tend to meet forks. Patience, not pursuit." }
      ] } },
  { id: "raid", deck: 1, title: "The Early Queen Raid",
    pieces: [["e1", "wK"], ["d1", "wQ"], ["a1", "wR"], ["h1", "wR"], ["b1", "wN"], ["g1", "wN"], ["c1", "wB"], ["f1", "wB"], ["a2", "wP"], ["b2", "wP"], ["c2", "wP"], ["d2", "wP"], ["e4", "wP"], ["f2", "wP"], ["g2", "wP"], ["h2", "wP"], ["e8", "bK"], ["h4", "bQ"], ["a8", "bR"], ["h8", "bR"], ["b8", "bN"], ["g8", "bN"], ["c8", "bB"], ["f8", "bB"], ["a7", "bP"], ["b7", "bP"], ["c7", "bP"], ["d7", "bP"], ["e5", "bP"], ["f7", "bP"], ["g7", "bP"], ["h7", "bP"]], spots: ["h4", "f2"], sit: "Move two, and his queen swings out early, leering at your weakest pawn.",
    principle: "Punish early queens with tempo", deep: "Every developing move that attacks his queen is a move played for free. This is the engine that refutes every cheap opening trap ever set, including the four-move mate aimed at f7.",
    protocol: [
      { k: "NOTICE", t: "Queen out on move two. My threat detector fires first, so I do the beginner-proof step: find her actual targets and name them out loud before deciding how scared to be. One target: f7." },
      { k: "CANDIDATES", t: "Block with a pawn, defend with a developing piece, chase with my own queen, or mirror him. Any candidate that defends WITHOUT developing goes to the back of the line unexamined." },
      { k: "COMPARE", t: "The scoring rule is tempo: a move guarding f7 that also develops a knight earns two salaries at once. Her early trip means every future hit on her pays me again. She is not a threat. She is an installment plan." },
      { k: "VERIFY", t: "I calculate the mate attempt itself, once, to the end: after my move, does the four-move mate still function anywhere? My calm has to be earned by a concrete line, not assumed from a principle." },
    ],
    cog: "Threats hijack attention because salience detection is wired deep, and novices answer the loud thing with the first move they see. The trained pause between alarm and answer is executive inhibition, exercised on sixty-four squares.",
    options: [
      { t: "Develop a piece that defends", eff: 3, why: "Guard the threat WITH a developing move and his early queen becomes your gift: hit her, develop free." },
      { t: "Push a pawn to hit her", eff: 2, why: "It defends and gains a tempo, which is honest. It also loosens your king's blanket a little." },
      { t: "Bring your queen out to argue", eff: 1, why: "Now two queens waste time and yours started later. Never copy a mistake out of pride." },
      { t: "Attack her with your rook pawn", eff: 1, why: "Edge pawn moves defend nothing here. She sidesteps and the threat remains." }
    ] },
  { id: "wing", deck: 1, title: "The Wing Attack",
    pieces: [["g1", "wK"], ["a2", "wP"], ["b2", "wP"], ["c4", "wP"], ["d4", "wP"], ["e3", "wP"], ["f2", "wP"], ["g2", "wP"], ["h2", "wP"], ["f1", "wR"], ["a1", "wR"], ["d3", "wB"], ["d1", "wQ"], ["f3", "wN"], ["g8", "bK"], ["a7", "bP"], ["b7", "bP"], ["c6", "bP"], ["d6", "bP"], ["e6", "bP"], ["f7", "bP"], ["g5", "bP"], ["h5", "bP"], ["f8", "bR"], ["a8", "bR"], ["e7", "bB"], ["d8", "bQ"], ["f6", "bN"]], spots: ["g5", "h5", "d5", "e4"], sit: "The center is still fluid, and he launches his pawns down the kingside anyway.",
    principle: "Meet the flank in the center", deep: "The classical law: a wing attack is answered by a central break. It works because an open center makes his wing army commuters, suddenly needed at home and far from work.",
    protocol: [
      { k: "NOTICE", t: "His pawns march on the wing, and my first glance goes the other way, to the center: open, closed, or fluid? Wing gestures mean nothing until the center says what kind of game this is." },
      { k: "CANDIDATES", t: "Break in the center, race on the opposite wing, or lock the middle and absorb. The center's status does my pruning for me: a fluid center puts the break on the table and takes the race off it." },
      { k: "COMPARE", t: "Geometry decides: his wing army stands far from the middle. If files open there, his pieces become commuters, needed at home and stationed abroad. My break costs one pawn lever. Walking them back costs three moves." },
      { k: "VERIFY", t: "The prophylactic question before I strike: what does he want the center to do? If his last quiet move supported locking it, he read the same law I did, and I break one move sooner than planned." },
    ],
    cog: "Prophylaxis is theory of mind on sixty-four squares: you model what he intends before you count what he threatens. The gaze studies back this up. Masters park their eyes on the opponent's half of the plan, while novices watch their own pieces like worried parents.",
    options: [
      { t: "Strike in the center", eff: 3, why: "Open the middle and his army is on the wrong side of the map, with his own king behind thin walls." },
      { t: "Race him on the other wing", eff: 1, why: "Wing versus wing only works when the center is locked. Here the center is a door he left open." },
      { t: "Lock the center, then defend", eff: 2, why: "If YOU seal the center his plan becomes legitimate but slow, and you can meet it calmly." },
      { t: "Castle into the storm", eff: 1, why: "You would move your king to the exact address his pawns are marching toward." }
    ],
    follow: { sit: "You broke the center open. Now both armies stare down open lines in every direction.", pieces: [["g1", "wK"], ["a2", "wP"], ["b2", "wP"], ["c4", "wP"], ["e3", "wP"], ["f2", "wP"], ["g2", "wP"], ["h2", "wP"], ["f1", "wR"], ["a1", "wR"], ["d3", "wB"], ["d1", "wQ"], ["f3", "wN"], ["g8", "bK"], ["a7", "bP"], ["b7", "bP"], ["c6", "bP"], ["e6", "bP"], ["f7", "bP"], ["g5", "bP"], ["h5", "bP"], ["f8", "bR"], ["a8", "bR"], ["e7", "bB"], ["d8", "bQ"], ["f6", "bN"]], spots: ["d5", "e5", "d1", "d8"],
      options: [
        { t: "Occupy the central files first", eff: 3, why: "You opened the doors, so walk through first. Initiative on open lines decides these positions." },
        { t: "Trade queens to calm the board", eff: 2, why: "Reasonable if his attack still smolders. But you opened the center to USE it, not to sell it." },
        { t: "Go back to defending the wing", eff: 1, why: "The wing stopped mattering the moment the middle opened. Old plans expire." }
      ] } },
  { id: "cramp", deck: 1, title: "The Cramped Position",
    pieces: [["g1", "wK"], ["c2", "wQ"], ["a1", "wR"], ["e1", "wR"], ["b1", "wN"], ["d2", "wN"], ["c1", "wB"], ["f1", "wB"], ["a2", "wP"], ["b2", "wP"], ["d3", "wP"], ["e3", "wP"], ["f2", "wP"], ["g2", "wP"], ["h2", "wP"], ["g8", "bK"], ["d4", "bP"], ["e4", "bP"], ["c5", "bP"], ["f5", "bP"], ["a7", "bP"], ["b7", "bP"], ["g7", "bP"], ["h7", "bP"], ["c6", "bN"], ["e6", "bN"], ["d6", "bB"], ["c8", "bB"], ["a8", "bR"], ["f8", "bR"], ["d8", "bQ"]], spots: ["b1", "c1", "d2", "e1"], sit: "You have no space. Your pieces are stepping on each other. He offers to trade a pair of knights.",
    principle: "Cramped players trade", deep: "Capablanca's housekeeping rule: fewer pieces need fewer squares. The side with space avoids trades to keep the squeeze, so when a cramped player is offered one, the answer is usually thank you.",
    protocol: [
      { k: "NOTICE", t: "My pieces are queuing for the same three squares. Cramp is not a mood, it is countable: I tally usable squares per piece, and the number is embarrassing." },
      { k: "CANDIDATES", t: "Accept his knight trade, decline to keep tension, or push a pawn to buy room. Declining scores worst on the only metric that matters here: squares per remaining piece." },
      { k: "COMPARE", t: "The arithmetic of relief: each trade removes one of my tenants without removing any rooms. His logic is the mirror image of mine, which is exactly why the offer was a small mistake." },
      { k: "VERIFY", t: "Trades have side effects, so I check what his recapture improves: does taking back activate his rook or repair his structure? Relief that gifts him an open file needs a second appraisal." },
    ],
    cog: "Working memory holds a handful of items, and tangled positions overflow it fast: blunders cluster in cramped games. Simplification is cognitive offloading, shrinking the position until it fits back inside the window where humans calculate honestly.",
    options: [
      { t: "Accept the trade gladly", eff: 3, why: "Every swap turns your closet into a room. The crowded side welcomes the moving van." },
      { t: "Push a pawn to claim space", eff: 2, why: "The other classic cure. Space can be taken back by force, checked twice in a tangled house." },
      { t: "Decline and keep pieces on", eff: 1, why: "Keeping pieces favors the side with room to use them. That side is not you." },
      { t: "Trade only the queens", eff: 1, why: "Queens are not what is stepping on your toes. Trade the crowd, not the ballroom." }
    ] },
  { id: "premature", deck: 1, title: "The Premature Attack",
    pieces: [["g1", "wK"], ["f1", "wR"], ["a1", "wR"], ["f3", "wN"], ["c3", "wN"], ["e2", "wB"], ["c1", "wB"], ["d1", "wQ"], ["a2", "wP"], ["b2", "wP"], ["c2", "wP"], ["d3", "wP"], ["e4", "wP"], ["f2", "wP"], ["g2", "wP"], ["h2", "wP"], ["e8", "bK"], ["h4", "bQ"], ["c5", "bB"], ["b8", "bN"], ["g8", "bN"], ["a8", "bR"], ["h8", "bR"], ["c8", "bB"], ["a7", "bP"], ["b7", "bP"], ["c7", "bP"], ["d6", "bP"], ["e5", "bP"], ["f7", "bP"], ["g7", "bP"], ["h7", "bP"]], spots: ["h4", "c5", "f2"], sit: "He has developed two pieces, castled nothing, and launched a direct attack on your king anyway.",
    principle: "Attacks need attackers", deep: "Count attackers against defenders before you ever panic. Unsound attacks do not merely fail: they rebound, because the charging pieces left holes at home and a king with no bodyguards.",
    protocol: [
      { k: "NOTICE", t: "He attacks with two developed pieces, and I make myself count instead of flinch: attackers versus defenders in the actual sector, right now. Two against three. The number says bluff." },
      { k: "CANDIDATES", t: "Defend precisely while developing, trade off his active pair, or counter-sacrifice for chaos. Chaos I reject on identity: the sounder position wants the quieter board." },
      { k: "COMPARE", t: "Every precise defensive move of mine is also a developing move; every attacking move of his borrows from an empty account. The gap compounds each tempo, so time itself is on my payroll." },
      { k: "VERIFY", t: "The hook check before each defense: does this move hand him a new target to switch toward? Attacks rebound hardest against defenders who never returned a single free weakness." },
    ],
    cog: "Kotov's discipline from Think Like a Grandmaster: list every candidate BEFORE analyzing any, because a mind that dives into the first line anchors there. The premature attacker skipped the census. The defender wins by taking one.",
    options: [
      { t: "Defend precisely, develop, wait", eff: 3, why: "Meet each threat with a useful move and his assault runs out of soldiers, leaving his own king home alone." },
      { t: "Trade off his two active pieces", eff: 2, why: "Removing the only attackers ends the attack by arithmetic. Less ambitious than punishing him, very safe." },
      { t: "Counter-sacrifice immediately", eff: 1, why: "Answering unsound chaos with your own makes the game fair again. Never make it fair. Make it correct." },
      { t: "Run your king early", eff: 1, why: "Your king was fine. Moving it donates the tempo his attack was missing." }
    ],
    follow: { sit: "His attack fizzled, exactly as you read it. Now his overextended pieces are drifting backward in disorder.", pieces: [["g1", "wK"], ["f1", "wR"], ["a1", "wR"], ["f3", "wN"], ["c3", "wN"], ["e2", "wB"], ["c1", "wB"], ["d1", "wQ"], ["a2", "wP"], ["b2", "wP"], ["c2", "wP"], ["d3", "wP"], ["e4", "wP"], ["f2", "wP"], ["g2", "wP"], ["h2", "wP"], ["e8", "bK"], ["e7", "bQ"], ["b6", "bB"], ["b8", "bN"], ["g8", "bN"], ["a8", "bR"], ["h8", "bR"], ["c8", "bB"], ["a7", "bP"], ["b7", "bP"], ["c7", "bP"], ["d6", "bP"], ["e5", "bP"], ["f7", "bP"], ["g7", "bP"], ["h7", "bP"]], spots: ["d4", "f5"],
      options: [
        { t: "Strike now, while he is tangled", eff: 3, why: "A rebounding attack is a broken formation. The punishment window opens the moment his pieces turn around." },
        { t: "Consolidate one more move", eff: 2, why: "Careful and decent. But windows close. One safety move, then the bill comes due." },
        { t: "Offer peace", eff: 1, why: "Never offer peace to a routed army." }
      ] } },
  { id: "passer", deck: 1, title: "The Passed Pawn",
    pieces: [["g2", "wK"], ["d1", "wR"], ["a4", "wP"], ["f2", "wP"], ["g3", "wP"], ["h4", "wP"], ["g7", "bK"], ["d8", "bR"], ["f7", "bP"], ["g6", "bP"], ["h5", "bP"]], spots: ["a4", "a1", "a2", "a3"], sit: "A rook endgame. Your a-pawn is passed, and both rooks are still deciding where to live.",
    principle: "Rooks belong behind passers", deep: "Tarrasch's most quoted law, and it works both directions: behind YOUR passer the rook pushes and grows stronger with every step. Behind HIS, it drags on the pawn like an anchor.",
    protocol: [
      { k: "NOTICE", t: "A passed pawn changes what every piece is FOR. My rook stops being a fighter and auditions for exactly one role: escort. The only question is which side of the pawn it stands on." },
      { k: "CANDIDATES", t: "Rook behind, rook in front, king escort, or push and pray. Front and behind look symmetric to the untrained eye, which is precisely why the rule exists: the geometry says they are opposites." },
      { k: "COMPARE", t: "I walk the pawn forward in my head. From behind, each step lengthens my rook's reach. From in front, each step shortens it until my rook is a wall my own pawn built. One plan compounds. The other decays." },
      { k: "VERIFY", t: "Mirror check: where does HIS rook belong? Also behind my pawn. The post is contested real estate, and in contested real estate, arriving second means arriving never." },
    ],
    cog: "Heuristics like Tarrasch's compress a thousand endgames into one cached instruction, freeing calculation for exceptions. Expertise is not attending to more: it is attending to less, correctly. The rule is compiled experience.",
    options: [
      { t: "Put your rook behind it", eff: 3, why: "From behind, the rook escorts the pawn forward and its scope grows with every step the pawn takes." },
      { t: "Put your rook in front of it", eff: 1, why: "The rook becomes the pawn's prisoner: every advance shortens its own view, and it ends passive in the corner." },
      { t: "Walk your king over to escort", eff: 2, why: "Real endgame technique, just the second act here. The rook takes its post first." },
      { t: "Shove it forward unsupported", eff: 2, why: "Passed pawns must be pushed, says the proverb, but pushed WITH support. Unescorted sprinters get arrested." }
    ] },
  { id: "badb", deck: 2, title: "The Bad Bishop",
    pieces: [["g1", "wK"], ["d2", "wB"], ["c3", "wP"], ["d4", "wP"], ["e5", "wP"], ["a2", "wP"], ["f2", "wP"], ["g2", "wP"], ["h2", "wP"], ["e1", "wR"], ["d1", "wQ"], ["g8", "bK"], ["e4", "bN"], ["b7", "bB"], ["d5", "bP"], ["e6", "bP"], ["f7", "bP"], ["g7", "bP"], ["h7", "bP"], ["a7", "bP"], ["b6", "bP"], ["e8", "bR"], ["d7", "bQ"]], spots: ["d2", "c3", "d4", "e5", "e4"], sit: "Your bishop stares at the back of its own pawn chain. His knight, meanwhile, is dancing.",
    principle: "Trade your worst piece", deep: "A bishop walled in by its own pawns is a tall pawn. Suba's consolation says bad bishops protect good pawns, so it can earn its keep as a guard. But given any chance, you trade the bad one and keep the poetry.",
    protocol: [
      { k: "NOTICE", t: "I audit my pieces like a payroll: who actually earns their squares? The bishop behind its own pawn chain earns nothing, and honest bookkeeping refuses to average that away." },
      { k: "CANDIDATES", t: "Trade it, free it by rerouting pawns, park it as a guard, or ignore it. Ignoring loses the audit: a bad piece is a standing tax on every plan that includes it." },
      { k: "COMPARE", t: "Price each cure: the trade costs a tempo, rerouting costs structure, guarding costs ambition. Then price doing nothing: fighting seven against eight forever. Every cure is cheaper than the disease." },
      { k: "VERIFY", t: "Before trading I confirm which of HIS pieces leaves in the deal: swapping my worst for his worst changes nothing. My tall pawn must purchase his dancer, or the trade waits." },
    ],
    cog: "The Einstellung effect: a familiar frame ('material is equal') blinds players to the functional count, where a buried bishop is half a piece. Experts read positions as jobs rather than head counts, and that way of reading is the skill.",
    options: [
      { t: "Trade it off or break it out", eff: 3, why: "The cure for a bad piece: swap it for one of his good ones, or reroute your pawns so it breathes again." },
      { t: "Keep it as a bodyguard", eff: 2, why: "Bad bishops protect good pawns. As a humble defender it earns its keep. Expect no poetry from it." },
      { t: "Trade your active pieces instead", eff: 1, why: "Then you are left holding only the bad one. You trade your worst piece, never your best." },
      { t: "Put more pawns on its color", eff: 1, why: "You are bricking up its last windows." }
    ] },
  { id: "pair", deck: 2, title: "The Two Bishops",
    pieces: [["g1", "wK"], ["d3", "wB"], ["e3", "wB"], ["d1", "wR"], ["a2", "wP"], ["f2", "wP"], ["g2", "wP"], ["h2", "wP"], ["g8", "bK"], ["e6", "bB"], ["f6", "bN"], ["d8", "bR"], ["a7", "bP"], ["f7", "bP"], ["g7", "bP"], ["h7", "bP"]], spots: ["d3", "e3"], sit: "The board is wide open, and you own both bishops against his bishop and knight.",
    principle: "The pair loves open air", deep: "Two bishops cover both colors at once and strike both wings in a single move. Steinitz converted the pair by restricting the knight square by square until it had nowhere respectable left to stand.",
    protocol: [
      { k: "NOTICE", t: "Two bishops on an open board, and I feel the geometry before I can say it: both colors answer to me, and his knight needs three moves to reach anywhere it is wanted." },
      { k: "CANDIDATES", t: "Preserve the pair and widen the game, cash one bishop for a concession, or advance pawns to cage the knight. Cashing out without concrete profit repeals my own advantage." },
      { k: "COMPARE", t: "The pair scores by distance: play on both wings and my bishops commute at light speed while his knight buys local tickets. Every widening of the front compounds the interest." },
      { k: "VERIFY", t: "A knight-square census before each pawn move: my advances must STEAL his stops, never donate one. A single careless push that grants his knight an outpost refunds the entire pair." },
    ],
    cog: "Masters evaluate mobility as futures, not present moves: the pair's value lives in positions five moves away. Holding tomorrow's geometry inside today's glance is trained pattern projection, the quiet cousin of calculation.",
    options: [
      { t: "Keep them, stretch the game wide", eff: 3, why: "Avoid trades, play on both wings at once, and let his knight arrive late to everything." },
      { t: "Take squares from his knight", eff: 2, why: "Careful pawn advances that deny the knight its stops make the pair even stronger." },
      { t: "Trade one bishop for the knight", eff: 1, why: "That returns the whole advantage for free. The pair is only a pair while there are two." },
      { t: "Close the center with pawns", eff: 1, why: "Closed positions are knight country. You would be flooding your own advantage." }
    ] },
  { id: "isolani", deck: 2, title: "The Isolated Pawn",
    pieces: [["g1", "wK"], ["d1", "wR"], ["f1", "wR"], ["e2", "wN"], ["c1", "wB"], ["c2", "wQ"], ["a2", "wP"], ["b2", "wP"], ["e3", "wP"], ["f2", "wP"], ["g2", "wP"], ["h2", "wP"], ["g8", "bK"], ["d5", "bP"], ["a7", "bP"], ["b7", "bP"], ["f7", "bP"], ["g7", "bP"], ["h7", "bP"], ["d8", "bR"], ["f8", "bR"], ["e6", "bB"], ["d7", "bQ"], ["f6", "bN"]], spots: ["d5", "d4"], sit: "His center pawn stands alone. No neighboring pawn of his can ever defend it again.",
    principle: "Restrain, blockade, destroy", deep: "Nimzowitsch's famous recipe from My System. The square in front of an isolated pawn is sacred: no enemy pawn can ever chase your piece from it, and a blockaded pawn is a prisoner awaiting trial.",
    protocol: [
      { k: "NOTICE", t: "His center pawn has no neighbors, and my attention slides past the pawn to the square in front of it. The pawn is the prisoner. That square is the lock." },
      { k: "CANDIDATES", t: "Blockade the square, besiege the pawn at once, or trade down toward an ending. Immediate siege without the blockade lets the prisoner lunge forward and buy freedom with its own funeral." },
      { k: "COMPARE", t: "Nimzowitsch's order of operations: restrain, blockade, destroy. The sequence matters because each step makes the next one safe: a blockaded pawn cannot advance, so the siege proceeds without counterplay." },
      { k: "VERIFY", t: "The dynamic audit: an isolani pays rent in piece activity while pieces remain. I confirm his activity has answers BEFORE trading toward the ending, or the static win arrives after the dynamic loss." },
    ],
    cog: "This is hierarchical planning: a stored plan with its steps in order, pulled out whole and put to work. The expert does not rediscover the plan at the board: thinking is reserved for this position's exceptions to the template.",
    options: [
      { t: "Blockade the square in front", eff: 3, why: "A knight parked in front of it can never be pawn-kicked, the pawn can never walk, and the siege can begin at leisure." },
      { t: "Steer toward an endgame", eff: 2, why: "Isolated pawns grow weaker as pieces leave the board. Every trade brings its trial closer." },
      { t: "Attack it with everything now", eff: 1, why: "Unblockaded, it simply advances, sacrifices itself, and frees his whole game while your pieces stare." },
      { t: "Win it at any cost", eff: 1, why: "Losing material to win a pawn is called losing. The pawn is a project, not an emergency." }
    ] },
  { id: "seventh", deck: 2, title: "The Seventh Rank",
    pieces: [["g1", "wK"], ["e1", "wR"], ["a2", "wP"], ["b2", "wP"], ["f2", "wP"], ["g2", "wP"], ["h2", "wP"], ["g8", "bK"], ["c8", "bR"], ["a7", "bP"], ["b7", "bP"], ["f7", "bP"], ["g7", "bP"], ["h7", "bP"]], spots: ["e7", "b7", "f7"], sit: "Your rook can land on his second rank, in among his unmoved pawns, and nothing can kick it.",
    principle: "The seventh rank feeds rooks", deep: "A rook on the seventh eats pawns sideways and cages the enemy king on its back row at the same time. Two rooks there are called pigs on the seventh, and they eat everything.",
    protocol: [
      { k: "NOTICE", t: "The seventh rank stands open, and I picture my rook there before calculating anything: pawns attackable sideways, a king fenced on its own back row. Two revenues, one address." },
      { k: "CANDIDATES", t: "Occupy now, prepare doubling first, or cash the rank in for a single pawn. Cashing out is a mispricing: the rank is an annuity, not a coin." },
      { k: "COMPARE", t: "Against every other square my rook could take: nothing else attacks targets that cannot flee AND restricts the enemy king in the same breath. Dual-purpose squares win comparisons by default." },
      { k: "VERIFY", t: "The eviction check: can anything challenge my rook there, and if his rook contests, who recaptures? A seventh rank held for one move is theater. Held for five, it is the game." },
    ],
    cog: "Dual-purpose scoring is expert shorthand: one move billed to two accounts at once. Sit a master in front of this position and the trackers catch it. The eyes land on the double-duty square inside the first seconds, before a single line gets calculated.",
    options: [
      { t: "Plant it there immediately", eff: 3, why: "It attacks pawns that cannot advance out of danger and fences the king at once. Rook heaven has an address." },
      { t: "Double both rooks there", eff: 2, why: "The dream, when time allows. It starts with the first rook claiming the rank." },
      { t: "Only if it wins a pawn at once", eff: 1, why: "The rank's value is lasting pressure, not loose change. You are pricing a house by its doormat." },
      { t: "Trade it for his defending rook", eff: 1, why: "You would be selling the best-placed piece on the board at cost." }
    ],
    follow: { sit: "Your rook feasts on the seventh. His king starts crawling out through the corner to escape the cage.", pieces: [["g1", "wK"], ["e7", "wR"], ["a2", "wP"], ["b2", "wP"], ["f2", "wP"], ["g2", "wP"], ["h2", "wP"], ["f8", "bK"], ["c8", "bR"], ["a7", "bP"], ["b7", "bP"], ["f7", "bP"], ["g7", "bP"], ["h7", "bP"]], spots: ["e7", "f8", "e8"],
      options: [
        { t: "Cut the escape with checks and fences", eff: 3, why: "The rank is a fence as much as a feast. A king cut off on the back rows stays in checkmate range." },
        { t: "Grab another pawn meanwhile", eff: 2, why: "Profitable, but a king that escapes the cage devalues the whole rank. Fence first, feast second." },
        { t: "Chase the king with the rook alone", eff: 1, why: "One piece never mates a walking king. Herd it, do not chase it." }
      ] } },
  { id: "color", deck: 2, title: "The Weak Squares",
    pieces: [["g1", "wK"], ["c4", "wB"], ["g5", "wN"], ["b3", "wQ"], ["e1", "wR"], ["a2", "wP"], ["b2", "wP"], ["e4", "wP"], ["f2", "wP"], ["g2", "wP"], ["h2", "wP"], ["g8", "bK"], ["a7", "bP"], ["b7", "bP"], ["c7", "bP"], ["d6", "bP"], ["f6", "bP"], ["g6", "bP"], ["h7", "bP"], ["e7", "bB"], ["f8", "bR"], ["a8", "bR"], ["d7", "bQ"]], spots: ["e6", "f7", "f5", "h5"], sit: "He traded away his light-squared bishop, and now the light squares around his king have no keeper.",
    principle: "Squares, not pieces", deep: "When a bishop leaves, every square of its color becomes a little orphaned. Pieces you park on those squares can never be challenged by their natural enemy again. Strong players attack squares first and pieces second.",
    protocol: [
      { k: "NOTICE", t: "His light-squared bishop left the board, and for a moment I stop seeing pieces and see colors: a lattice of light squares around his king with no natural keeper left alive." },
      { k: "CANDIDATES", t: "Invade the bare color with knight and queen, fix his pawns onto the opposite color first, or trade my own light bishop. That last one is listed only so I can reject it on principle." },
      { k: "COMPARE", t: "Permanence ranks the plans: whatever I place on his bare color can never meet its natural enemy again. Freezing his pawns on dark squares widens the orphanage; the invasion collects afterward." },
      { k: "VERIFY", t: "The substitute-defender check: knights and queens can still guard single light squares, at a price. I map which invasion square his knight can reach, and enter through the door it cannot." },
    ],
    cog: "Perceiving 'the light squares' as one object is chunking at its purest: a distributed set bound into a single attended structure. That re-binding of the board into wholes is what ten thousand studied patterns actually purchases.",
    options: [
      { t: "March pieces onto those squares", eff: 3, why: "Your knight or queen on his bare light squares can never be met by the piece built to evict them. Move in permanently." },
      { t: "Fix his pawns on dark squares", eff: 2, why: "Pawns frozen on dark squares can never cover light ones again. You are widening the orphanage." },
      { t: "Trade your light bishop too", eff: 1, why: "Your light bishop is the invasion's landlord: the one piece he can never oppose. Keep it like treasure." },
      { t: "Attack his dark squares instead", eff: 1, why: "Those are the guarded ones. You are knocking on the only locked door in the house." }
    ] },
  { id: "queentrade", deck: 2, title: "The Queen Trade Question",
    pieces: [["g1", "wK"], ["g4", "wQ"], ["f3", "wN"], ["d3", "wB"], ["e1", "wR"], ["f1", "wR"], ["a2", "wP"], ["b2", "wP"], ["e4", "wP"], ["f2", "wP"], ["g2", "wP"], ["h4", "wP"], ["g8", "bK"], ["g6", "bQ"], ["e7", "bB"], ["f8", "bR"], ["a8", "bR"], ["d7", "bN"], ["a7", "bP"], ["b7", "bP"], ["c7", "bP"], ["f7", "bP"], ["g7", "bP"], ["h7", "bP"]], spots: ["g4", "g6"], sit: "Your attack on his king is gathering. He calmly offers to trade queens.",
    principle: "The attacker keeps queens", deep: "The queen is the mating engine, and defenders beg for its removal precisely because most attacks die without it. Trade her only when it wins material outright or walks straight into a won ending.",
    protocol: [
      { k: "NOTICE", t: "Mid-attack, he offers the queen trade, and I read the offer itself as data: defenders propose trades the way drowning men propose swimming lessons." },
      { k: "CANDIDATES", t: "Decline and press, accept for concrete profit, or accept and attack with the leftovers. While attacking, decline is the default: the exceptions must prove themselves in a written line." },
      { k: "COMPARE", t: "Mate threats price the queen far beyond her nine points: no other piece covers enough squares to weave a net alone. Rooks continuing the attack knock politely where she kicked doors down." },
      { k: "VERIFY", t: "The exception audit, concretely: does accepting win material by force, or land me in an ending I can NAME as won? If no line ends in a number or a known ending, the offer dies unmourned." },
    ],
    cog: "Reading an offer as evidence is inverse planning: working out what he believes from what he just did. Negotiation research documents the same habit. The proposal reveals the proposer, and strong players bill him for the information.",
    options: [
      { t: "Decline and keep the engine", eff: 3, why: "No piece delivers mate like the queen. His offer is the defender's oldest plea: refuse it and press on." },
      { t: "Accept only for clear profit", eff: 2, why: "The honest exception: if the trade wins material or reaches a winning ending, take the sure thing." },
      { t: "Accept happily", eff: 1, why: "You just sold the attack's engine at asking price. He exhales, and your initiative becomes a memory." },
      { t: "Trade and attack with rooks", eff: 1, why: "Rooks alone knock politely where the queen kicked doors. The attack loses its teeth." }
    ] },
  { id: "space", deck: 2, title: "The Space Advantage",
    pieces: [["g1", "wK"], ["c4", "wP"], ["d5", "wP"], ["e5", "wP"], ["f4", "wP"], ["a2", "wP"], ["b2", "wP"], ["g2", "wP"], ["h2", "wP"], ["d1", "wQ"], ["a1", "wR"], ["f1", "wR"], ["c3", "wN"], ["e3", "wB"], ["g8", "bK"], ["a7", "bP"], ["b7", "bP"], ["c7", "bP"], ["d6", "bP"], ["f7", "bP"], ["g7", "bP"], ["h7", "bP"], ["e7", "bB"], ["e8", "bR"], ["d8", "bQ"], ["b8", "bN"], ["a8", "bR"]], spots: ["c4", "d5", "e5", "f4"], sit: "Your pawns stand tall across the middle. His whole army lives in three cramped rows.",
    principle: "Space squeezes, trades relieve", deep: "The side with space keeps pieces on the board, because his pieces trip over each other while yours stroll. Squeeze first, improve every piece, and only then open the position on your terms.",
    protocol: [
      { k: "NOTICE", t: "My pawns hold the middle and his army breathes through a straw. I convert the feeling into a count: his knight owns two squares, mine owns six. Space is mobility, itemized." },
      { k: "CANDIDATES", t: "Squeeze and improve, break through immediately, or trade pieces to simplify. Trading is the trap candidate: it ventilates the man I am smothering." },
      { k: "COMPARE", t: "Patience compounds here: every improving move widens the mobility gap while his pieces shuffle in place. The breakthrough gains value each move I delay it, which makes waiting the aggressive choice." },
      { k: "VERIFY", t: "The counterplay scan, every single move: cramped armies live for one freeing pawn break. I name his break, script my answer to it in advance, and only then continue improving." },
    ],
    cog: "Waiting on a payoff while it grows is hard: impatience is the documented human default. The squeeze trains the rare inversion: valuing an option more for not cashing it yet.",
    options: [
      { t: "Avoid trades and squeeze slowly", eff: 3, why: "Each of his pieces has fewer squares than yours. Keep the crowd in his house and improve at leisure." },
      { t: "Prepare the breakthrough patiently", eff: 2, why: "The break is the plan eventually. Rushed, it releases every prisoner at once." },
      { t: "Trade pieces to simplify", eff: 1, why: "Every trade is a window opened in his crowded house. Why ventilate the man you are smothering?" },
      { t: "Push every pawn forward", eff: 1, why: "Overextension leaves holes behind the lines, and cramped armies are excellent at sneaking into holes." }
    ] },
  { id: "oppbishops", deck: 2, title: "The Opposite Bishops",
    pieces: [["g1", "wK"], ["e3", "wB"], ["a4", "wP"], ["b3", "wP"], ["f2", "wP"], ["g2", "wP"], ["h2", "wP"], ["g8", "bK"], ["d5", "bB"], ["b6", "bP"], ["f7", "bP"], ["g7", "bP"], ["h7", "bP"]], spots: ["a4", "a6"], sit: "Only bishops remain, one each, living on opposite colors. You are up a single pawn.",
    principle: "Opposite bishops need two doors", deep: "His bishop can blockade one pawn on its own color forever, which is why one extra pawn so often draws these endings. Victory needs two separate threats, far apart, stretching one bishop past its reach.",
    protocol: [
      { k: "NOTICE", t: "Opposite-colored bishops, and my extra pawn gets a formal correction: his bishop is a permanent goalkeeper on one color, so the default result just slid toward a draw. I believe the structure, not the scoreboard." },
      { k: "CANDIDATES", t: "Manufacture a second distant target, force a pure pawn ending, or push the passer and hope. Hope is not a plan: the pawn walks exactly until it reaches his bishop's color, then retires." },
      { k: "COMPARE", t: "One goalkeeper, two goals: threats on opposite wings stretch a single bishop past its geometry. The win condition here is not force. It is distance." },
      { k: "VERIFY", t: "The fortress check before every trade: some of these endings are drawn even two pawns up if the blockade square is the wrong color for me. I verify my target squares are ones his bishop can never touch." },
    ],
    cog: "Downgrading your own chances against the grain of desire is active debiasing: motivated reasoning wants the extra pawn to matter. This ending is a laboratory drill in believing the position's structure over your own scoreboard.",
    options: [
      { t: "Create a second target far away", eff: 3, why: "One bishop cannot hold two doors on opposite wings. Stretch him until something tears." },
      { t: "Trade into a pure pawn ending", eff: 2, why: "If you can ever force it, the draw evaporates instantly. Forcing it is the hard part." },
      { t: "Push the extra pawn straight on", eff: 1, why: "It walks until it reaches his bishop's color, then stands blockaded until the end of time." },
      { t: "Attack his bishop", eff: 1, why: "Bishops on open boards simply step away. You cannot arrest the goalkeeper." }
    ] },
  { id: "fianchetto", deck: 2, title: "The Fianchetto Fortress",
    pieces: [["g1", "wK"], ["e3", "wB"], ["d2", "wQ"], ["f3", "wN"], ["e1", "wR"], ["a2", "wP"], ["b2", "wP"], ["c2", "wP"], ["e4", "wP"], ["f2", "wP"], ["g2", "wP"], ["h4", "wP"], ["g8", "bK"], ["g7", "bB"], ["f7", "bP"], ["g6", "bP"], ["h7", "bP"], ["a7", "bP"], ["b7", "bP"], ["c7", "bP"], ["d6", "bP"], ["f6", "bN"], ["f8", "bR"], ["a8", "bR"], ["d7", "bQ"]], spots: ["g7", "h6", "f6"], sit: "His king hides behind a fianchetto: bishop tucked on the long diagonal, pawns curled around it.",
    principle: "Kill the guard, use his squares", deep: "The fianchetto bishop is the soul of that castle: it guards every dark hole the pawn curl creates. Trade it off, and h6 and f6 stop being walls and become doorways.",
    protocol: [
      { k: "NOTICE", t: "His king's shelter has one load-bearing wall: the fianchettoed bishop. My eyes go straight to it, because a fortress is exactly as strong as its keystone." },
      { k: "CANDIDATES", t: "Trade off that bishop, lever the pawn curl with my edge pawn, or sacrifice into it immediately. The instant sacrifice fails the preparation test: intact guards refute donations." },
      { k: "COMPARE", t: "Sequencing by dependency: with the guard alive, the dark squares are walls; with it gone, they are doorways. Every follow-up plan I own gets cheaper after the trade, so the trade goes first." },
      { k: "VERIFY", t: "I price his refusal: dodging my exchange offer usually misplaces his bishop or loosens the curl anyway. Offers the opponent cannot decline profitably are the best offers in chess." },
    ],
    cog: "Finding the keystone is causal reasoning about structure: not 'what is strong' but 'what everything else depends on'. Experts prune attacking trees by dependency, striking the node with the most downstream children first.",
    options: [
      { t: "Trade off the fianchetto bishop", eff: 3, why: "Remove the keeper and the dark squares around his king rot. Every invasion after that walks through open doors." },
      { t: "Storm with your edge pawn", eff: 2, why: "The classic lever: march the h-pawn to pry the curl open. Strongest with queens still on the board." },
      { t: "Sacrifice on the curl at once", eff: 1, why: "Unprepared sacrifices against intact fortresses are donations. Kill the guard first." },
      { t: "Check along the other diagonal", eff: 1, why: "Wrong color entirely. His fortress never even notices." }
    ] },
  { id: "devlead", deck: 2, title: "The Development Lead",
    pieces: [["g1", "wK"], ["f1", "wR"], ["a1", "wR"], ["f3", "wN"], ["c3", "wN"], ["c4", "wB"], ["c1", "wB"], ["d1", "wQ"], ["a2", "wP"], ["b2", "wP"], ["c2", "wP"], ["d2", "wP"], ["e4", "wP"], ["f2", "wP"], ["g2", "wP"], ["h2", "wP"], ["e8", "bK"], ["a8", "bR"], ["h8", "bR"], ["g8", "bN"], ["c6", "bN"], ["c8", "bB"], ["f8", "bB"], ["d8", "bQ"], ["a7", "bP"], ["b7", "bP"], ["c7", "bP"], ["d7", "bP"], ["e5", "bP"], ["f7", "bP"], ["g7", "bP"], ["h7", "bP"]], spots: ["e8", "d4"], sit: "You are three developing moves ahead, and his king still stands in the center, uncastled.",
    principle: "Open lines while he sleeps", deep: "A lead in development melts a little every move, so it must be spent, not saved. Morphy's whole career was this one idea: open the center against an uncastled king and arrive with everything.",
    protocol: [
      { k: "NOTICE", t: "I count developed pieces like a clock: mine four, his one, king in the center. A development lead is perishable goods, and the sell-by date is the move he castles." },
      { k: "CANDIDATES", t: "Open the center now, freeze his king in place first, or bank a pawn. Banking converts a melting asset into a snack, which evicts it from the list instantly." },
      { k: "COMPARE", t: "The lead's exchange rate: against a centered king, open lines outprice material, which is why the classical masters shed pawns for files without blinking. Three tempos of lead buys one forced crisis. I spend it now." },
      { k: "VERIFY", t: "Before opening anything I confirm the doors swing toward HIS king and not mine: symmetry cuts both ways. If a file would open onto my own uncastled squares, I castle first and spend the lead one move later." },
    ],
    cog: "Advantages spoil, and the expert treats them that way: act at the peak. De Groot's interviews catch masters saying exactly this urgency out loud, while amateurs describe the same position as static.",
    options: [
      { t: "Open the center now", eff: 3, why: "Files and diagonals toward a stuck king are worth more than material. Spend the lead before it evaporates." },
      { t: "Prevent his castling first", eff: 2, why: "Prophylaxis with teeth: keep the king stuck, then open the lines. A patient cousin of the main idea." },
      { t: "Grab a pawn", eff: 1, why: "You are spending a crown on a snack. The lead buys attacks, not groceries." },
      { t: "Keep developing quietly", eff: 1, why: "You are already dressed and he is still waking up. More grooming just gives him time." }
    ],
    follow: { sit: "The center burst open, exactly on schedule. His king stands on its home square with bare files all around it.", pieces: [["g1", "wK"], ["f1", "wR"], ["a1", "wR"], ["f3", "wN"], ["c3", "wN"], ["c4", "wB"], ["c1", "wB"], ["d1", "wQ"], ["a2", "wP"], ["b2", "wP"], ["c2", "wP"], ["d2", "wP"], ["f2", "wP"], ["g2", "wP"], ["h2", "wP"], ["e8", "bK"], ["a8", "bR"], ["h8", "bR"], ["g8", "bN"], ["c6", "bN"], ["c8", "bB"], ["f8", "bB"], ["d8", "bQ"], ["a7", "bP"], ["b7", "bP"], ["c7", "bP"], ["d7", "bP"], ["f7", "bP"], ["g7", "bP"], ["h7", "bP"]], spots: ["e8", "e1", "e5"],
      options: [
        { t: "Pile everything toward his king", eff: 3, why: "Every piece points at the stuck king. This is where development leads go to become checkmates." },
        { t: "Sacrifice a pawn for one more line", eff: 2, why: "Morphy's own habit. Against a centered king, open lines outprice pawns every day of the week." },
        { t: "Trade queens", eff: 1, why: "The stuck king's best friend is the queen trade. Never do the defense's job for it." }
      ] } }
];
const SANDBOX_PRESETS = [
  { id: "game", name: "A real game", desc: "Full board against the engine. Take-backs allowed, hints free, nobody keeping score.", pieces: "start", opts: { castling: { K: true, Q: true, k: true, q: true } } },
  { id: "qend", name: "Queen endgame", desc: "King and queen against a bare king. Box, march, mate.", pieces: [["e1","wK"],["d1","wQ"],["e8","bK"]] },
  { id: "rend", name: "Rook endgame", desc: "One rook needs its king. Practice the wall and the ladder.", pieces: [["e1","wK"],["a1","wR"],["e8","bK"]] },
  { id: "race", name: "Pawn race", desc: "Three pawns each, opposite wings. First crown usually wins the argument.", pieces: [["e1","wK"],["a2","wP"],["b2","wP"],["c2","wP"],["e8","bK"],["f7","bP"],["g7","bP"],["h7","bP"]] },
  { id: "feast", name: "The feast", desc: "Loose pieces everywhere. Practice spotting what hangs, and what bites back.", pieces: [["g1","wK"],["d1","wQ"],["a1","wR"],["c1","wB"],["b1","wN"],["h8","bK"],["b6","bN"],["e5","bP"],["f6","bB"],["a5","bR"],["h5","bP"],["c7","bP"]] },
  { id: "walk", name: "Open floor", desc: "One of each piece and all the room in the world. Just walk them around.", pieces: [["d3","wQ"],["d5","wN"],["a1","wR"],["f3","wB"],["e2","wP"],["g1","wK"],["h8","bK"]] }
];

const PHRASEBOOK = [
  { g: "At the board", items: [
    { t: "hang / hanging", d: "Leaving a piece undefended where it can be taken for free.", u: "I hung my bishop on move ten and never recovered." },
    { t: "blunder", d: "A game-losing mistake. Written ?? in notation.", u: "One blunder in a totally winning position. Classic." },
    { t: "en prise", d: "French for a piece sitting where it can be captured. The old-school way to say hanging.", u: "Your rook's en prise, by the way." },
    { t: "tempo", d: "One unit of useful time. Gaining a tempo means forcing them to react while you improve.", u: "That check wins a tempo on the queen." },
    { t: "zugzwang", d: "German: a position where every legal move makes things worse, but you must move anyway.", u: "He was fine until zugzwang. Then everything lost." },
    { t: "zwischenzug", d: "An in-between move: instead of the expected recapture, you slip in a bigger threat first. Also called an intermezzo.", u: "He didn't take back. Check first, THEN take. Cruel." },
    { t: "battery", d: "Two pieces stacked on one line, like a queen behind a bishop, firing together.", u: "Set up the battery on the long diagonal and he resigned." },
    { t: "gambit", d: "Offering a pawn or more in the opening to gain time or attack.", u: "I keep declining the Queen's Gambit and I keep suffering for it." },
    { t: "book / out of book", d: "Known opening theory. Leaving it means you're both thinking for yourselves now.", u: "I was out of book by move six and it showed." },
    { t: "swindle", d: "Saving a lost game through pure trickery. Spoken with respect.", u: "Dead lost, then swindled a draw with a stalemate trap. No shame whatsoever." },
    { t: "hope chess", d: "Playing a move hoping they miss your threat, instead of checking their best reply. The cardinal sin.", u: "That wasn't a plan, that was hope chess." },
    { t: "cheese", d: "Cheap tricks that only work if unseen. Wins games, teaches nothing.", u: "The four-move mate is pure cheese." },
    { t: "patzer / woodpusher", d: "Affectionate words for weak or casual players. Use warmly or not at all.", u: "We're all patzers compared to the engine." },
    { t: "flag", d: "To lose on time, or make your opponent lose on time. The clock's little flag used to fall.", u: "Completely winning and I got flagged. Do not speak to me." },
    { t: "j'adoube", d: "What you say before straightening a piece, so the touch-move rule doesn't apply. French for I adjust.", u: "J'adoube. ...I was just centering it, relax." }
  ] },
  { g: "Online", items: [
    { t: "bullet / blitz / rapid / classical", d: "Time controls: bullet is under 3 minutes for the whole game, blitz around 3 to 5, rapid 10 to 30, classical is the long stuff.", u: "I only tilt in bullet. And blitz. Fine, everywhere." },
    { t: "premove", d: "Entering your move during their turn so it plays instantly. Saves time, causes disasters.", u: "Premoved the recapture and hung mate in one." },
    { t: "mouse slip", d: "Dropping a piece on the wrong square online. The classic excuse.", u: "That wasn't a blunder, it was a mouse slip. I swear." },
    { t: "berserk", d: "On lichess arenas: voluntarily halving your own clock for extra points. Glorious and reckless.", u: "He berserked against the top seed and won. Legend." },
    { t: "dirty flagging", d: "Playing a dead-drawn or lost position purely to win on the clock. Legal. Contentious. Effective.", u: "No shame in a dirty flag in bullet. Some shame in rapid." },
    { t: "smurf / sandbagging", d: "A smurf is a strong player on a low-rated account. Sandbagging is losing on purpose to drop rating. Both frowned on.", u: "Twenty moves of theory from an 800? That's a smurf." },
    { t: "puzzle rush / puzzle storm", d: "Solving puzzles against the clock: Puzzle Rush on chess.com, Puzzle Storm on lichess. The community's shared gym.", u: "New Puzzle Storm personal best. My evening is complete." },
    { t: "eval / the bar", d: "The engine's judgment of the position, measured in pawns. The eval bar looms over every streamed game.", u: "The bar says plus three. My heart says I'm losing." },
    { t: "!! ?! ? ??", d: "Annotation marks: !! brilliant, ! great, ?! inaccuracy, ? mistake, ?? blunder. Post-game reports grade every move with these.", u: "One brilliant, two blunders. A balanced diet." },
    { t: "Botez Gambit", d: "Community joke for hanging your queen outright, named after the streaming Botez sisters. Everyone plays it eventually.", u: "Move 14: the Botez Gambit makes its appearance." },
    { t: "bongcloud", d: "The meme opening where the king walks up on move two. Played only ironically, and sometimes by grandmasters, also ironically.", u: "He bongclouded in the title match. The clip is historic." },
    { t: "gg", d: "Good game. Say it when you finish, win or lose. Begging for rematches only after your wins is noticed, and judged.", u: "gg wp (well played). Then close the tab with dignity." }
  ] },
  { g: "Titles and ratings", items: [
    { t: "Elo / rating", d: "Your number. Roughly: 400 brand new, 800 casual, 1200 solid club player, 2000 expert, 2500 and up is grandmaster country.", u: "Rating is a weather report, not a verdict." },
    { t: "GM, IM, FM, NM", d: "Grandmaster, International Master, FIDE Master, National Master. Earned over the board, held for life.", u: "An IM walked into the club once. We still talk about it." },
    { t: "OTB", d: "Over the board: real chess with real pieces and a real clock, as opposed to online.", u: "My online rating and my OTB rating do not speak to each other." }
  ] },
  { g: "Speaking notation", items: [
    { t: "the letters", d: "K king, Q queen, R rook, B bishop, N knight (K was taken). Pawns get no letter at all.", u: "Out loud it's just knight f3. Nobody says the N." },
    { t: "x, +, #", d: "x means captures, + means check, # means checkmate. exd5 is the e-pawn takes on d5.", u: "He wrote Qxf7# on the scoresheet and shook my hand. Rude." },
    { t: "O-O and O-O-O", d: "Castling short (kingside) and castling long (queenside). Spoken as castles or castles long.", u: "He castled long, so it's a race now." },
    { t: "e8=Q", d: "Promotion: the pawn reaches the last rank and writes its own coronation.", u: "e8=Q, and suddenly the endgame page pays rent." }
  ] }
];

const Phrasebook = ({ onExit }) => (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <Btn kind="ghost" onClick={onExit} style={{ fontSize: 12.5, padding: "6px 12px" }}>Back</Btn>
        <div style={{ fontFamily: T.mono, fontSize: 12.5, letterSpacing: 0.5, color: T.beige }}>THE PHRASEBOOK</div>
        <div style={{ width: 64 }} />
      </div>
      <div style={{ textAlign: "center", fontFamily: T.serif, fontStyle: "italic", color: T.onMute, fontSize: 14, marginBottom: 16 }}>
        Half of joining a club is the vocabulary. Learn these and nobody at any board, wooden or pixel, will read you as a tourist. One rule: patzer is said with affection or not at all.
      </div>
      {PHRASEBOOK.map((grp, gi) => (
        <div key={gi} style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: T.mono, fontSize: 12.5, letterSpacing: 0.5, color: T.beige, marginBottom: 8 }}>{grp.g.toUpperCase()}</div>
          {grp.items.map((it, i) => (
            <Card key={i} style={{ padding: "10px 14px", marginBottom: 7 }}>
              <div style={{ fontFamily: T.serif, fontSize: 12.5, color: T.ink, marginBottom: 2 }}>{it.t}</div>
              <div style={{ fontFamily: T.serif, fontSize: 12.5, lineHeight: 1.6, marginBottom: 4 }}>{it.d}</div>
              <div style={{ fontFamily: T.serif, fontSize: 12.5, fontStyle: "italic", color: T.inkSoft }}>"{it.u}"</div>
            </Card>
          ))}
        </div>
      ))}
    </div>
);

function SalonBoard({ pieces, spots }) {
  const st = useMemo(() => mkState(pieces, {}), [pieces]);
  const glow = useMemo(() => new Set((spots || []).map((n) => sq(n))), [spots]);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 10 }}>
      <Board board={st.board} cell={30} onSquare={() => {}} glow={glow.size ? glow : undefined} last={null} />
      {glow.size > 0 && (
        <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: 11, color: T.onMute, marginTop: 5 }}>
          The lit squares are what this argument is about.
        </div>
      )}
    </div>
  );
}

function SalonRun({ onExit, onDone }) {
  const [deck, setDeck] = useState(null);
  const [seed, setSeed] = useState(0);
  const rounds = useMemo(() => {
    if (!deck) return [];
    const pool = SALON.filter((s) => s.deck === deck);
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
    return pool.slice(0, 6).map((s) => {
      const shuf = (arr) => {
        const o = arr.map((x) => x);
        for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = o[i]; o[i] = o[j]; o[j] = t; }
        return o;
      };
      return { s, opts: shuf(s.options), fopts: s.follow ? shuf(s.follow.options) : null };
    });
  }, [deck, seed]);
  const maxScore = useMemo(() => rounds.reduce((n, r) => n + 2 + (r.s.follow ? 2 : 0), 0), [rounds]);
  const [idx, setIdx] = useState(0);
  const [stage, setStage] = useState("main");
  const [chosen, setChosen] = useState(null);
  const [fchosen, setFchosen] = useState(null);
  const [score, setScore] = useState(0);
  const [brill, setBrill] = useState(0);
  const [ended, setEnded] = useState(false);
  const doneRef = useRef(false);
  const EFFTAG = { 3: { w: "MASTERSTROKE", c: T.beigeInk }, 2: { w: "SOUND", c: T.blueInk }, 1: { w: "DUBIOUS", c: T.roseDeep } };
  const PICKLINE = {
    3: ["Masterstroke. That is the exact argument.", "Yes. Say it that confidently at a real board.", "Perfect. You did not guess. I could tell."],
    2: ["Sound. Not the sharpest card, but sound.", "Playable. A master would nudge you one card over.", "Decent. You would survive. Surviving is underrated."],
    1: ["Have a read of the masterstroke's why.", "That one drops the thread. Look at what beats it.", "Dubious, and the table noticed. Worth another look."]
  };
  useEffect(() => {
    if (ended && !doneRef.current) { doneRef.current = true; onDone && onDone(score, maxScore); }
  }, [ended]);
  const scoreFor = (eff) => (eff === 3 ? 2 : eff === 2 ? 1 : 0);
  const applyPick = (eff) => {
    setScore((x) => x + scoreFor(eff));
    if (eff === 3) { setBrill((b) => b + 1); SFX.good(); } else if (eff === 2) SFX.chime(); else SFX.bad();
  };
  if (!deck) {
    return (
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <Btn kind="ghost" onClick={onExit} style={{ fontSize: 12.5, padding: "6px 12px" }}>Back</Btn>
          <div style={{ fontFamily: T.mono, fontSize: 12.5, letterSpacing: 0.5, color: T.beige }}>THE MIDNIGHT SALON</div>
          <div style={{ width: 64 }} />
        </div>
        <div style={{ textAlign: "center", fontFamily: T.serif, fontStyle: "italic", color: T.onMute, fontSize: 14, marginBottom: 16 }}>
          An old club tradition. No boards, no clocks: strategy against strategy, argued until one side runs out of reasons. Pick your table.
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          <div className="tp-press paper" onClick={() => { setDeck(1); setSeed((x) => x + 1); SFX.chime(); }}
            style={{ cursor: "pointer", borderRadius: 12, padding: "14px 16px", border: "1px solid " + T.blueLine, background: T.well }}>
            <div style={{ fontFamily: T.mono, color: T.blue, fontSize: 14, letterSpacing: 0.5 }}>THE FIRST TABLE</div>
            <div style={{ fontFamily: T.serif, color: T.onBody, fontSize: 12.5 }}>The fundamentals: storms and open files, plus what a free pawn really costs. Several arguments push back after your first answer.</div>
          </div>
          <div className="tp-press paper" onClick={() => { setDeck(2); setSeed((x) => x + 1); SFX.chime(); }}
            style={{ cursor: "pointer", borderRadius: 12, padding: "14px 16px", border: "1px solid " + T.blueLine, background: T.well }}>
            <div style={{ fontFamily: T.mono, color: T.blueSoft, fontSize: 14, letterSpacing: 0.5 }}>THE DEEP TABLE</div>
            <div style={{ fontFamily: T.serif, color: T.onBody, fontSize: 12.5 }}>The subtler laws. Weak squares, bad bishops. And the question of when a queen should leave the room.</div>
          </div>
        </div>
      </div>
    );
  }
  if (ended) {
    const line = score === maxScore
      ? "A perfect salon. Every argument, the sharpest card. I have chalk older than most players who can do that."
      : score >= maxScore * 0.7
        ? "A strong evening. You are starting to hear WHY moves work, which is worth more than the moves."
        : "A rough salon, which is the useful kind. Every masterstroke you missed tonight is a game you will win later.";
    return (
      <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", padding: "36px 8px" }}>
        <div style={{ fontFamily: T.mono, color: T.beige, fontSize: 17, letterSpacing: 0.5, margin: "14px 0 8px" }}>THE SALON CLOSES</div>
        <div style={{ fontFamily: T.mono, color: T.paper, fontSize: 14, letterSpacing: 0.5, marginBottom: 8 }}>INSIGHT: {score} / {maxScore} · MASTERSTROKES: {brill}</div>
        <div style={{ fontFamily: T.serif, color: T.paper, fontSize: 14, lineHeight: 1.6, marginBottom: 14 }}>{line}</div>
        <div style={{ textAlign: "left", margin: "0 auto 18px", maxWidth: 420 }}>
          <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 0.5, color: T.beige, marginBottom: 6, textAlign: "center" }}>PRINCIPLES ARGUED TONIGHT</div>
          {rounds.map((r, i) => (
            <div key={i} style={{ fontFamily: T.serif, fontSize: 12.5, color: T.onBody, padding: "3px 0" }}>{r.s.principle}</div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <Btn kind="ghost" onClick={() => { setDeck(null); setIdx(0); setStage("main"); setChosen(null); setFchosen(null); setScore(0); setBrill(0); setEnded(false); doneRef.current = false; }}>Another table</Btn>
          <Btn kind="prime" onClick={onExit}>Return to the club</Btn>
        </div>
      </div>
    );
  }
  const { s, opts, fopts } = rounds[idx];
  const inFollow = stage === "follow";
  const activeOpts = inFollow ? fopts : opts;
  const activeChosen = inFollow ? fchosen : chosen;
  const pick = (k) => {
    if (activeChosen != null) return;
    if (inFollow) setFchosen(k); else setChosen(k);
    applyPick(activeOpts[k].eff);
  };
  const advance = () => {
    SFX.move();
    if (!inFollow && s.follow) { setStage("follow"); return; }
    if (idx + 1 >= rounds.length) { setEnded(true); return; }
    setIdx(idx + 1); setStage("main"); setChosen(null); setFchosen(null);
  };
  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <Btn kind="ghost" onClick={onExit} style={{ fontSize: 12.5, padding: "6px 12px" }}>Leave</Btn>
        <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 0.5, color: T.beige }}>THE MIDNIGHT SALON · {idx + 1} OF {rounds.length}</div>
        <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 0.5, color: T.onMute, width: 70, textAlign: "right" }}>{score}</div>
      </div>
      <div key={stage + idx} style={{ animation: "tp-fade .3s both", borderRadius: 16, padding: "14px 16px", marginBottom: 12,
        background: inFollow ? T.duskWarm : T.duskCool,
        border: "1px solid " + (inFollow ? T.roseLine : T.blueLine) }}>
        <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 0.5, color: inFollow ? T.rose : T.blue, marginBottom: 4 }}>
          {inFollow ? "THE TABLE PRESSES" : "THE TABLE PLAYS: " + s.title.toUpperCase()}
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 14, lineHeight: 1.6, color: T.paper }}>{inFollow ? s.follow.sit : s.sit}</div>
        <SalonBoard pieces={inFollow ? (s.follow.pieces || s.pieces) : s.pieces} spots={inFollow ? (s.follow.spots || []) : (s.spots || [])} />
      </div>
      <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: 12.5, color: T.onMute, textAlign: "center", marginBottom: 10 }}>
        {activeChosen == null ? (inFollow ? "The argument continues. Answer it." : "Lay your answer on the velvet.") : PICKLINE[activeOpts[activeChosen].eff][(idx + (inFollow ? 1 : 0)) % 3]}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {activeOpts.map((o, k) => {
          const revealed = activeChosen != null;
          const isPick = activeChosen === k;
          const tag = EFFTAG[o.eff];
          return (
            <div key={stage + k} className="tp-press paper" onClick={() => pick(k)}
              style={{ cursor: activeChosen == null ? "pointer" : "default", borderRadius: 12, padding: "10px 12px",
                background: revealed && o.eff === 3 ? T.paperBeige : T.paperCard,
                border: "1.5px solid " + (isPick ? T.beigeInk : revealed ? tag.c + "88" : T.inkLine),
                opacity: revealed && !isPick && o.eff === 1 ? 0.75 : 1, transition: "all .25s" }}>
              <div style={{ fontFamily: T.serif, fontSize: 12.5, color: T.ink, lineHeight: 1.4 }}>{o.t}</div>
              {revealed && (
                <div style={{ animation: "tp-fade .35s both" }}>
                  <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 0.5, color: tag.c, margin: "5px 0 3px" }}>
                    {tag.w}
                  </div>
                  <div style={{ fontFamily: T.serif, fontSize: 11, lineHeight: 1.4, color: T.inkSoft }}>{o.why}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {activeChosen != null && !inFollow && (
        <div style={{ marginTop: 12, borderRadius: 12, padding: "10px 14px", border: "1px solid " + T.beigeLine,
          background: T.beigeWash, animation: "tp-fade .4s both" }}>
          <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 0.5, color: T.beige, marginBottom: 3 }}>THE PRINCIPLE · {s.principle.toUpperCase()}</div>
          <div style={{ fontFamily: T.serif, fontSize: 12.5, lineHeight: 1.6, color: T.paper }}>{s.deep}</div>
        </div>
      )}
      {activeChosen != null && !inFollow && (
        <div style={{ marginTop: 10, borderRadius: 12, padding: "12px 14px", border: "1px solid " + T.blueLine,
          background: T.wellDeep, animation: "tp-fade .45s both" }}>
          <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 0.5, color: T.blue, marginBottom: 8 }}>HOW HE THINKS IT THROUGH</div>
          {s.protocol.map((p, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 7, animation: "tp-fade .4s both", animationDelay: (0.2 + i * 0.45) + "s", opacity: 0 }}>
              <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 0.5, color: T.blue, minWidth: 78, paddingTop: 2 }}>{p.k}</div>
              <div style={{ fontFamily: T.serif, fontSize: 12.5, lineHeight: 1.6, color: T.paper, fontStyle: "italic" }}>{p.t}</div>
            </div>
          ))}
          <div style={{ marginTop: 9, paddingTop: 9, borderTop: "1px solid " + T.blueEdge, animation: "tp-fade .4s both", animationDelay: (0.2 + s.protocol.length * 0.45) + "s", opacity: 0 }}>
            <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 0.5, color: T.blueSoft, marginBottom: 3 }}>WHY MINDS DO THIS</div>
            <div style={{ fontFamily: T.serif, fontSize: 12.5, lineHeight: 1.6, color: T.onHi }}>{s.cog}</div>
          </div>
        </div>
      )}
      {activeChosen != null && (
        <div style={{ textAlign: "center", marginTop: 14 }}>
          <Btn kind="prime" onClick={advance}>
            {!inFollow && s.follow ? "He presses on" : idx + 1 >= rounds.length ? "Close the salon" : "Next argument"} 
          </Btn>
        </div>
      )}
    </div>
  );
}

function Sandbox({ cell, onExit, onReward }) {
  const [preset, setPreset] = useState(null);
  const [stack, setStack] = useState([]);
  const [selected, setSelected] = useState(null);
  const [hintGlow, setHintGlow] = useState(null);
  const [threats, setThreats] = useState(false);
  const [gentle, setGentle] = useState(false);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const st = stack.length ? stack[stack.length - 1] : null;
  const status = st ? statusOf(st) : "play";
  const begin = (p) => {
    setPreset(p);
    setStack([mkState(p.pieces, p.opts || {})]);
    setSelected(null); setHintGlow(null); SFX.chime();
  };
  useEffect(() => {
    if (!st || status !== "play" || st.turn !== "b") return;
    const id = setTimeout(() => {
      const m = bestMove(st, gentle ? 1 : 2);
      if (!m) return;
      const next = apply(st, m);
      setStack((s) => s.concat([next]));
      if (m.cap) SFX.capture(); else SFX.move();
      if (inCheck(next, "w")) SFX.check();
    }, 460);
    timers.current.push(id);
    return () => clearTimeout(id);
  }, [st, status, gentle]);
  const legal = useMemo(() => (st && st.turn === "w" && status === "play" ? legalMoves(st) : []), [st, status]);
  const dots = selected != null ? new Set(legal.filter((m) => m.from === selected).map((m) => m.to)) : new Set();
  const click = (i) => {
    if (!st) return;
    const p = st.board[i];
    if (selected != null && dots.has(i)) {
      const m = legal.find((mm) => mm.from === selected && mm.to === i);
      setSelected(null); setHintGlow(null);
      const next = apply(st, m);
      setStack((s) => s.concat([next]));
      if (m.cap) SFX.capture(); else SFX.move();
      if (inCheck(next, "b")) SFX.check();
      if (statusOf(next) === "checkmate") { SFX.win(); onReward && onReward(20, "back table checkmate"); }
      return;
    }
    if (p && p.c === "w" && st.turn === "w") { setSelected(i); return; }
    setSelected(null);
  };
  const undo = () => {
    setStack((s) => s.slice(0, Math.max(1, s.length - (s.length >= 3 ? 2 : 1))));
    setSelected(null); setHintGlow(null); SFX.move();
  };
  const hint = () => {
    if (!st || st.turn !== "w" || status !== "play") return;
    const m = bestMove(st, 2);
    if (!m) return;
    setHintGlow(new Set([m.from, m.to])); SFX.chime();
    const id = setTimeout(() => setHintGlow(null), 2200);
    timers.current.push(id);
  };
  const threatSet = useMemo(() => {
    if (!threats || !st) return null;
    const s = new Set();
    st.board.forEach((p, i) => {
      if (p && p.c === "b") {
        for (const t of attacksFrom(st.board, i)) {
          if (st.board[t] && st.board[t].c === "w") s.add(t);
        }
      }
    });
    return s;
  }, [threats, st]);
  const tool = { fontSize: 12.5, padding: "7px 11px" };
  if (!preset) {
    return (
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <Btn kind="ghost" onClick={onExit} style={tool}>Back</Btn>
          <div style={{ fontFamily: T.mono, fontSize: 12.5, letterSpacing: 0.5, color: T.beige }}>THE BACK TABLE</div>
          <div style={{ width: 64 }} />
        </div>
        <div style={{ textAlign: "center", fontFamily: T.serif, fontStyle: "italic", color: T.onMute, fontSize: 14, marginBottom: 16 }}>
          The far table is always free. Set it up however you like. Take moves back, use hints, break things. That is what it is for.
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {SANDBOX_PRESETS.map((p) => (
            <div key={p.id} className="tp-press" onClick={() => begin(p)}
              style={{ cursor: "pointer", borderRadius: 12, padding: "12px 16px", border: "1px solid " + T.beigeLine, background: T.well }}>
              <div style={{ fontFamily: T.mono, color: T.paper, fontSize: 14, letterSpacing: 0.5 }}>{p.name}</div>
              <div style={{ fontFamily: T.serif, color: T.onMute, fontSize: 12.5 }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  const banner = status === "checkmate" ? (st.turn === "b" ? "Checkmate. Yours." : "Checkmate. Its game this time.")
    : status === "stalemate" ? "Stalemate. Half a point each."
    : status === "draw" ? "A draw." : null;
  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      {status === "checkmate" && st.turn === "b" && <CelebrateOnce />}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <Btn kind="ghost" onClick={() => setPreset(null)} style={tool}>Setups</Btn>
        <div style={{ fontFamily: T.mono, fontSize: 12.5, letterSpacing: 0.5, color: T.beige }}>THE BACK TABLE</div>
        <Btn kind="ghost" onClick={onExit} style={tool}>Leave</Btn>
      </div>
      <div style={{ textAlign: "center", fontFamily: T.serif, fontSize: 14, color: banner ? T.beige : T.onBody, marginBottom: 8, minHeight: 18 }}>
        {banner || (st.turn === "w" ? (inCheck(st, "w") ? "Check on you. Answer it." : "Your move. Nobody's watching.") : "It's thinking...")}
      </div>
      <Board board={st.board} cell={cell} onSquare={click} selected={selected} dots={dots} last={st.last}
        glow={hintGlow || undefined} marks={threatSet && threatSet.size ? threatSet : undefined}
        checkSq={status === "play" && inCheck(st, st.turn) ? kingIdx(st.board, st.turn) : null} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 10 }}>
        <Btn kind="ghost" onClick={undo} disabled={stack.length <= 1} style={tool}>Take back</Btn>
        <Btn kind="ghost" onClick={hint} style={tool}>Hint</Btn>
        <Btn kind="ghost" onClick={() => { setThreats(!threats); SFX.move(); }} style={Object.assign({}, tool, threats ? { borderColor: T.beige, color: T.beige } : null)}>Threats</Btn>
        <Btn kind="ghost" onClick={() => { setGentle(!gentle); SFX.move(); }} style={Object.assign({}, tool, gentle ? { borderColor: T.beige, color: T.beige } : null)}>Gentle</Btn>
        <Btn kind="ghost" onClick={() => begin(preset)} style={tool}>Reset</Btn>
      </div>
      {threats && (
        <div style={{ textAlign: "center", fontFamily: T.serif, fontStyle: "italic", fontSize: 12.5, color: T.onMute, marginTop: 6 }}>
          Highlighted squares: your pieces the engine is attacking right now.
        </div>
      )}
      {st.hist.length > 0 && (
        <div style={{ fontFamily: T.serif, fontSize: 12.5, color: T.onMute, marginTop: 10, lineHeight: 1.6, textAlign: "center" }}>
          {st.hist.join("  ")}
        </div>
      )}
    </div>
  );
}

function DrillRun({ ledger, cell, onExit, onReward }) {
  const set = useMemo(() => {
    const pool = [];
    for (const c of CONCEPTS) {
      if (ledger.done[c.id] === undefined) continue;
      for (const ctx of c.contexts) if (ctx.ex.type !== "duel") pool.push({ c, ctx });
    }
    const picks = []; const used = new Set();
    while (picks.length < Math.min(5, pool.length)) {
      const j = Math.floor(Math.random() * pool.length);
      if (used.has(j)) continue;
      used.add(j); picks.push(pool[j]);
    }
    return picks;
  }, []);
  const [idx, setIdx] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  useEffect(() => {
    if (idx >= set.length && set.length > 0 && onReward) onReward(mistakes === 0 ? 40 : 25, mistakes === 0 ? "flawless cold drill" : "cold drill");
  }, [idx]);
  if (idx >= set.length) {
    const line = mistakes === 0
      ? "Five exercises, cold, no warning, and you didn't slip once. That's what knowing it cold looks like."
      : mistakes <= 3
        ? "A few slips, and that's exactly why we drill. What you just repaired sticks better than it did before."
        : "The dim ones showed themselves tonight. Good. Now you know which ones to review. Forgetting a little first is how remembering becomes permanent.";
    return (
      <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", padding: "40px 8px" }}>
        <div style={{ fontFamily: T.mono, color: T.beige, fontSize: 17, letterSpacing: 0.5, margin: "14px 0 8px" }}>THE DRILL IS DONE</div>
        <div style={{ fontFamily: T.serif, color: T.paper, fontSize: 16, lineHeight: 1.6, marginBottom: 8 }}>{line}</div>
        <div style={{ fontFamily: T.serif, color: T.onMute, fontSize: 12.5, fontStyle: "italic", marginBottom: 18 }}>
          {mistakes === 0 ? "Five for five." : mistakes + (mistakes === 1 ? " slip" : " slips") + " across five exercises."} Mixed practice on old pages is worth double the same minutes on new ones.
        </div>
        <Btn kind="prime" onClick={onExit}>Return to the club</Btn>
      </div>
    );
  }
  const { c, ctx } = set[idx];
  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <Btn kind="ghost" onClick={onExit} style={{ fontSize: 12.5, padding: "6px 12px" }}>Leave</Btn>
        <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 0.5, color: T.beige }}>COLD DRILL · {idx + 1} OF {set.length}</div>
        <div style={{ width: 70 }} />
      </div>
      <div style={{ textAlign: "center", fontFamily: T.mono, fontSize: 12.5, letterSpacing: 0.5, color: ACC[c.ch], marginBottom: 4 }}>FROM: {c.name.toUpperCase()}</div>
      <div style={{ textAlign: "center", fontFamily: T.serif, fontSize: 12.5, color: T.onMute, fontStyle: "italic", marginBottom: 12 }}>{ctx.explain}</div>
      <ExercisePlayer key={idx} ex={ctx.ex} cell={cell}
        onMistake={() => setMistakes((m) => m + 1)}
        onDone={() => setIdx(idx + 1)} />
    </div>
  );
}

function RadarChart({ axes }) {
  const S = 260, C = S / 2, R = 88;
  const n = axes.length;
  const pt = (i, r) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [C + Math.cos(a) * r, C + Math.sin(a) * r];
  };
  const poly = (r) => axes.map((_, i) => pt(i, r).join(",")).join(" ");
  const dataPoly = axes.map((ax, i) => pt(i, Math.max(0.04, ax.v) * R).join(",")).join(" ");
  return (
    <svg width={S} height={S} viewBox={"0 0 " + S + " " + S} style={{ display: "block", margin: "0 auto" }}>
      {[0.25, 0.5, 0.75, 1].map((r) => (
        <polygon key={r} points={poly(r * R)} fill="none" stroke={T.blueEdge} strokeWidth="0.8" />
      ))}
      {axes.map((_, i) => {
        const [x, y] = pt(i, R);
        return <line key={i} x1={C} y1={C} x2={x} y2={y} stroke={T.blueEdge} strokeWidth="0.8" />;
      })}
      <polygon points={dataPoly} fill={T.beigeWash} stroke={T.beige} strokeWidth="1.6" strokeLinejoin="round" style={{ animation: "tp-fade .6s both" }} />
      {axes.map((ax, i) => {
        const [x, y] = pt(i, Math.max(0.04, ax.v) * R);
        return <circle key={i} cx={x} cy={y} r="2.6" fill={T.beige} />;
      })}
      {axes.map((ax, i) => {
        const [x, y] = pt(i, R + 20);
        return (
          <text key={i} x={x} y={y} textAnchor="middle" fontFamily={T.mono} fontSize="8.5" fill={T.blue} letterSpacing="1">
            {ax.label}
            <tspan x={x} dy="10" fill={T.beige} fontSize="8">{Math.round(ax.v * 100)}%</tspan>
          </text>
        );
      })}
    </svg>
  );
}

function Hub({ ledger, onLesson, onBoss, onTrial, onDrill, onSandbox, onSalon, onPull, onPhrasebook }) {
  const [tab, setTab] = useState("notebook");
  const [codex, setCodex] = useState(null);
  const units = unitsOf(ledger);
  const pct = Math.round((units / TOTAL_UNITS) * 100);
  const title = PLAYER_TITLES.filter((t) => pct >= t.pct).pop().t;
  const trialReady = CONCEPTS.every((c) => ledger.done[c.id]) && BOSSES.every((b) => ledger.bosses[b.id]);
  const tabBtn = (id, label) => (
    <button onClick={() => setTab(id)} style={{
      fontFamily: T.mono, fontSize: 14, letterSpacing: 0.5, padding: "8px 14px",
      background: tab === id ? T.blueEdge : "transparent",
      color: tab === id ? T.blueDeep : T.onBody,
      border: "none", borderBottom: tab === id ? "2px solid " + T.blueDeep : "2px solid transparent",
      cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6
    }}>{label}</button>
  );
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "20px 12px 60px" }}>
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <div style={{ position: "relative", display: "inline-block", padding: "5px 13px" }}>
          <span style={{ position: "absolute", top: 0, left: 0, width: 7, height: 7, borderTop: "1px solid " + T.onFaint, borderLeft: "1px solid " + T.onFaint }} />
          <span style={{ position: "absolute", top: 0, right: 0, width: 7, height: 7, borderTop: "1px solid " + T.onFaint, borderRight: "1px solid " + T.onFaint }} />
          <span style={{ position: "absolute", bottom: 0, left: 0, width: 7, height: 7, borderBottom: "1px solid " + T.onFaint, borderLeft: "1px solid " + T.onFaint }} />
          <span style={{ position: "absolute", bottom: 0, right: 0, width: 7, height: 7, borderBottom: "1px solid " + T.onFaint, borderRight: "1px solid " + T.onFaint }} />
          <div style={{ fontFamily: T.mono, fontSize: 22, color: T.paper, letterSpacing: 0.5 }}>TEMPO</div>
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 12.5, color: T.onBody, letterSpacing: 0.5, marginTop: 3 }}>{title} · {units}/{TOTAL_UNITS} inked · {ledger.chips || 0} chips</div>
        <div style={{ maxWidth: 380, margin: "8px auto 0" }}><Meter pct={pct} /></div>
      </div>
      <div style={{ textAlign: "center", borderBottom: "1px solid " + T.beigeEdge, marginBottom: 16 }}>
        {tabBtn("notebook", "Notebook")}{tabBtn("trials", "Club Nights")}{tabBtn("cabinet", "Cabinet")}{tabBtn("profile", "Profile")}
      </div>

      {tab === "notebook" && Object.keys(ledger.done).length >= 4 && (
        <div onClick={onDrill}
          style={{ cursor: "pointer", borderRadius: 16, padding: "12px 16px", marginBottom: 20,
            border: "1px solid " + T.beigeLine, background: T.well,
            display: "flex", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: T.mono, color: T.beige, fontSize: 12.5, letterSpacing: 0.5 }}>THE COLD DRILL</div>
            <div style={{ fontFamily: T.serif, color: T.onBody, fontSize: 12.5 }}>Five shuffled exercises from pages you already own. Memory is a muscle. Surprise it.</div>
          </div>
        </div>
      )}
      {tab === "notebook" && (
        <div className="tp-press" onClick={onPhrasebook}
          style={{ cursor: "pointer", borderRadius: 16, padding: "12px 16px", marginBottom: 18,
            border: "1px solid " + T.beigeLine, background: T.well,
            display: "flex", alignItems: "center", gap: 12 }}>
          <div>
            <div style={{ fontFamily: T.mono, color: T.beigeDeep, fontSize: 12.5, letterSpacing: 0.5 }}>THE PHRASEBOOK</div>
            <div style={{ fontFamily: T.serif, color: T.onBody, fontSize: 12.5 }}>How the regulars actually talk. Blitz, blunders, swindles, and how to say Nf3 out loud.</div>
          </div>
        </div>
      )}
      {tab === "notebook" && CHAPTERS.map((chp) => {
        const list = CONCEPTS.map((c, i) => ({ c, i })).filter((x) => x.c.ch === chp.n);
        return (
          <div key={chp.n} style={{ marginBottom: 22 }}>
            <div style={{ fontFamily: T.mono, color: ACC[chp.n], fontSize: 16, letterSpacing: 0.5 }}>Chapter {chp.n} · {chp.title}</div>
            <div style={{ fontFamily: T.serif, color: T.onMute, fontSize: 12.5, marginBottom: 10, fontStyle: "italic" }}>{chp.sub}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {list.map(({ c, i }) => {
                const doneRank = ledger.done[c.id];
                const unlocked = conceptUnlocked(i, ledger);
                if (doneRank !== undefined) {
                  return (
                    <div key={c.id} onClick={() => setCodex(c)} style={{
                      width: 158, background: T.paperWarm, borderRadius: 12,
                      border: "1.5px solid " + T.blueDeep, padding: "12px 10px", cursor: "pointer",
                      textAlign: "center"
                    }}>
                      <div style={{ fontFamily: T.serif, fontSize: 14, color: T.ink, fontWeight: 600, margin: "4px 0 3px" }}>{c.name}</div>
                      <RankCount n={doneRank} size={13} />
                      <div style={{ fontFamily: T.serif, fontSize: 11, color: T.inkSoft, marginTop: 3 }}>tap to open the codex</div>
                    </div>
                  );
                }
                if (unlocked) {
                  return (
                    <div key={c.id} onClick={() => onLesson(c)} style={{
                      width: 158, background: T.onGhost, borderRadius: 12,
                      border: "1.5px solid " + ACC[c.ch], padding: "12px 10px", cursor: "pointer",
                      textAlign: "center"
                    }}>
                      <div style={{ fontFamily: T.serif, fontSize: 14, color: T.paper, fontWeight: 600, margin: "4px 0 3px" }}>{c.name}</div>
                      <div style={{ fontFamily: T.serif, fontSize: 12.5, color: ACC[c.ch] }}>Open this page</div>
                    </div>
                  );
                }
                return (
                  <div key={c.id} style={{
                    width: 158, background: T.well, borderRadius: 12,
                    border: "1px solid " + T.onGhost, padding: "12px 10px", textAlign: "center", opacity: 0.85
                  }}>
                    <Lock size={20} color={T.onSoft} />
                    <div style={{ fontFamily: T.mono, fontSize: 14, color: T.onSoft, margin: "4px 0 3px", letterSpacing: 0.5 }}>? ? ?</div>
                    <div style={{ fontFamily: T.serif, fontSize: 11, color: T.onMute, fontStyle: "italic", lineHeight: 1.4 }}>{c.lockedHint}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {tab === "trials" && (
        <div className="tp-press" onClick={onSandbox}
          style={{ cursor: "pointer", borderRadius: 16, padding: "12px 16px", marginBottom: 18,
            border: "1px solid " + T.beigeLine, background: T.well,
            display: "flex", alignItems: "center", gap: 12 }}>
          <div>
            <div style={{ fontFamily: T.mono, color: T.blue, fontSize: 12.5, letterSpacing: 0.5 }}>THE BACK TABLE</div>
            <div style={{ fontFamily: T.serif, color: T.onBody, fontSize: 12.5 }}>Open board, six setups, take-backs and hints. Break things. Nobody's keeping score.</div>
          </div>
        </div>
      )}
      {tab === "trials" && (
        <div className="tp-press" onClick={onSalon}
          style={{ cursor: "pointer", borderRadius: 16, padding: "12px 16px", marginBottom: 18,
            border: "1px solid " + T.beigeLine, background: T.well,
            display: "flex", alignItems: "center", gap: 12 }}>
          <div>
            <div style={{ fontFamily: T.mono, color: T.blueSoft, fontSize: 12.5, letterSpacing: 0.5 }}>THE MIDNIGHT SALON</div>
            <div style={{ fontFamily: T.serif, color: T.onBody, fontSize: 12.5 }}>Strategy against strategy, cards on the velvet. Every card argues its own why.</div>
          </div>
        </div>
      )}
      {tab === "trials" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {BOSSES.map((b) => {
            const done = !!ledger.bosses[b.id];
            const missing = b.needs.filter((id) => !ledger.done[id]);
            const ready = missing.length === 0;
            return (
              <div key={b.id} style={{
                background: done ? T.paperWarm : T.well,
                border: "1.5px solid " + (done ? T.blueDeep : ready ? ACC[b.ch] : T.onGhost),
                borderRadius: 12, padding: 14, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap"
              }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontFamily: T.serif, fontSize: 14, fontWeight: 600, color: done ? T.ink : T.paper }}>{b.name}</div>
                  <div style={{ fontFamily: T.serif, fontSize: 12.5, fontStyle: "italic", color: done ? T.inkSoft : T.onMute }}>
                    {done ? "Sealed and sung." : ready ? b.tagline : "Locked, " + missing.length + " page" + (missing.length === 1 ? "" : "s") + " of its chapter still dark."}
                  </div>
                </div>
                {done ? <span style={{ color: T.beigeDeep, fontSize: 16, fontWeight: 600 }}>✓</span> :
                  <Btn kind={ready ? "prime" : "ghost"} disabled={!ready} onClick={() => onBoss(b)} style={{ fontSize: 12.5, padding: "8px 16px" }}>
                    {ready ? "Face it" : <Lock size={14} />}
                  </Btn>}
              </div>
            );
          })}
          <div style={{
            background: ledger.trialDone ? T.paperBeige : T.wellDeep,
            border: "2px solid " + (ledger.trialDone ? T.blueDeep : trialReady ? T.beigeDeep : T.onGhost),
            borderRadius: 12, padding: 16, textAlign: "center"
          }}>
            <div style={{ fontFamily: T.mono, fontSize: 17, letterSpacing: 0.5, color: ledger.trialDone ? T.ink : T.paper, margin: "4px 0" }}>THE LONG GAME</div>
            <div style={{ fontFamily: T.serif, fontSize: 12.5, fontStyle: "italic", color: ledger.trialDone ? T.inkSoft : T.onMute, maxWidth: 440, margin: "0 auto 10px" }}>
              {ledger.trialDone
                ? "The Pale Automaton hums an old lullaby now, when the light is low. You may sit with it whenever you wish."
                : "A full game of chess against the Pale Automaton itself, every page, every law, one board. The finished thing all of this builds: you, playing."}
            </div>
            {ledger.trialDone ? (
              <Btn kind="ghost" onClick={onTrial} style={{ fontSize: 12.5, color: T.ink, borderColor: T.beigeDeep, background: T.beigeWash }}>Play it again</Btn>
            ) : (
              <Btn kind={trialReady ? "prime" : "ghost"} disabled={!trialReady} onClick={onTrial}>
                {trialReady ? "Wake the Automaton" : "Every page and trial must burn first"}
              </Btn>
            )}
          </div>
        </div>
      )}

      {tab === "cabinet" && <Cabinet ledger={ledger} onPull={onPull} />}
      {tab === "profile" && (() => {
        const chDone = (n) => CONCEPTS.filter((c) => c.ch === n && ledger.done[c.id] !== undefined).length;
        const chAll = (n) => CONCEPTS.filter((c) => c.ch === n).length;
        const doneVals = Object.values(ledger.done);
        const precision = doneVals.length ? doneVals.reduce((a, b) => a + b, 0) / (doneVals.length * 2) : 0;
        const nights = Object.keys(ledger.bosses).length + (ledger.trialDone ? 1 : 0);
        const axes = [
          { label: "RULES", v: (chDone(1) + chDone(2)) / (chAll(1) + chAll(2)) },
          { label: "TACTICS", v: chDone(3) / chAll(3) },
          { label: "ENDINGS", v: chDone(4) / chAll(4) },
          { label: "PRECISION", v: precision },
          { label: "STRATEGY", v: ledger.salonBest || 0 },
          { label: "CULTURE", v: Object.keys(ledger.cards || {}).length / CARDS.length }
        ];
        const stat = (label, val, wide) => (
          <div style={{ gridColumn: wide ? "1 / span 2" : undefined, borderRadius: 12, padding: "8px 12px", background: T.well, border: "1px solid " + T.beigeEdge }}>
            <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: 0.5, color: T.blue }}>{label}</div>
            <div style={{ fontFamily: T.mono, fontSize: 14, color: T.paper }}>{val}</div>
          </div>
        );
        return (
          <div>
            <div style={{ textAlign: "center", marginBottom: 4 }}>
              <div style={{ fontFamily: T.mono, fontSize: 16, letterSpacing: 0.5, color: T.beige }}>{title.toUpperCase()}</div>
              <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: 12.5, color: T.onMute }}>The club ledger.</div>
            </div>
            <RadarChart axes={axes} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 6 }}>
              {stat("PAGES", units + " / " + TOTAL_UNITS, true)}
              {stat("CLUB NIGHTS", nights + " / 4")}
              {stat("CHIPS", "" + (ledger.chips || 0))}
              {stat("CABINET", Object.keys(ledger.cards || {}).length + " / " + CARDS.length)}
              {stat("SALON BEST", Math.round((ledger.salonBest || 0) * 100) + "%")}
              {stat("HONORS", Object.keys(ledger.ach || {}).length)}
            </div>
            <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: 12.5, color: T.onMute, textAlign: "center", marginTop: 12 }}>
              Precision is your average mark per page. Strategy is your best salon. The shape tells you where to spend your next evening.
            </div>
          </div>
        );
      })()}
      {codex && (
        <Modal onClose={() => setCodex(null)}>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <b style={{ fontSize: 16 }}>{codex.name}</b>
                <RankCount n={ledger.done[codex.id]} size={14} />
              </div>
              <button onClick={() => setCodex(null)} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", fontFamily: T.mono, fontSize: 11, letterSpacing: 0.5, color: T.inkSoft, padding: 4 }}>CLOSE</button>
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 0.5, color: T.blueDeep, fontWeight: 600 }}>SAY IT PLAINLY</div>
            <div style={{ fontSize: 14, marginBottom: 8 }}>{codex.hook.plain}</div>
            <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 0.5, color: T.roseDeep, fontWeight: 600 }}>SEE IT</div>
            <div style={{ fontSize: 14, marginBottom: 8, fontStyle: "italic" }}>{codex.hook.image}</div>
            <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 0.5, color: T.blueInk, fontWeight: 600 }}>REACH FOR IT WHEN</div>
            <div style={{ fontSize: 14, marginBottom: 8 }}>{codex.hook.when}</div>
            {codex.depth && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 0.5, color: T.beigeInk, fontWeight: 600 }}>MARGIN NOTES</div>
                {codex.depth.map((d, i) => <div key={i} style={{ fontSize: 14, marginBottom: 4 }}>{d}</div>)}
              </div>
            )}
            <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 0.5, color: T.beigeInk, fontWeight: 600 }}>CLUB DUES</div>
            <div style={{ fontSize: 14, marginBottom: 12 }}>{codex.dues}</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Btn kind="ghost" onClick={() => { const c = codex; setCodex(null); onLesson(c); }} style={{ fontSize: 12.5, color: T.ink, borderColor: T.beigeDeep }}>
                Replay
              </Btn>
            </div>
          </Card>
        </Modal>
      )}
    </div>
  );
}

/* APP */
export default function App() {
  const [screen, setScreen] = useState({ name: "hub" });
  const [ledger, setLedger] = useState({ done: {}, bosses: {}, trialDone: false, chips: 60, cards: {}, ach: {}, salonBest: 0 });
  useEffect(() => {
    try { const raw = localStorage.getItem("tempo-save"); if (raw) setLedger((old) => Object.assign({}, old, JSON.parse(raw))); } catch (e) {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem("tempo-save", JSON.stringify(ledger)); } catch (e) {}
  }, [ledger]);
  const [cell, setCell] = useState(42);
  const [soundOn, setSoundOn] = useState(false);
  const [toasts, setToasts] = useState([]);
  const honorPinned = useRef(new Set());
  const toast = (text) => {
    const id = Math.random();
    setToasts((t) => t.concat([{ id, text }]));
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  };
  const gainChips = (n, why) => {
    setLedger((old) => Object.assign({}, old, { chips: (old.chips || 0) + n }));
    SFX.chime();
    toast("+" + n + " chips \u00b7 " + why);
  };
  const pinHonor = (id, name, bonus) => {
    if (honorPinned.current.has(id)) return;
    honorPinned.current.add(id);
    if (ledger.ach && ledger.ach[id]) return;
    setLedger((old) => old.ach && old.ach[id] ? old : Object.assign({}, old, { ach: Object.assign({}, old.ach, { [id]: true }), chips: (old.chips || 0) + bonus }));
    SFX.good();
    toast(name + " \u00b7 +" + bonus + " chips");
  };
  const doPull = () => {
    if ((ledger.chips || 0) < 40) return null;
    const seq = [1, 2, 3].flatMap((r) => CARDS.filter((c) => c.rarity === r));
    const card = seq.find((c) => !(ledger.cards || {})[c.id]);
    if (!card) return null;
    setLedger((o) => Object.assign({}, o, {
      chips: (o.chips || 0) - 40,
      cards: Object.assign({}, o.cards, { [card.id]: true })
    }));
    SFX.chime();
    const newCount = Object.keys(ledger.cards || {}).length + 1;
    if (newCount >= 6) pinHonor("collector", "Honors board: Collector", 30);
    if (newCount >= CARDS.length) pinHonor("shelf", "Honors board: The Full Cabinet", 100);
    return { card };
  };
  useEffect(() => {
    const fit = () => setCell(Math.max(34, Math.min(46, Math.floor((window.innerWidth - 36) / 8))));
    fit(); window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const completeConcept = (id, rankIdx) => {
    setLedger((old) => {
      const p = Object.assign({}, old, { done: Object.assign({}, old.done) });
      const isNew = p.done[id] === undefined;
      p.done[id] = p.done[id] === undefined ? rankIdx : Math.max(p.done[id], rankIdx);
      p.chips = (p.chips || 0) + (isNew ? 30 + rankIdx * 5 : 10);
      setScreen({ name: "hub" });
      return p;
    });
    const wasNew = ledger.done[id] === undefined;
    toast("+" + (wasNew ? 30 + rankIdx * 5 : 10) + " chips \u00b7 " + (wasNew ? "page inked" : "reviewed"));
    if (wasNew && Object.keys(ledger.done).length === 0) pinHonor("first", "Honors board: First Page", 20);
    if (rankIdx === 2) pinHonor("flawless", "Honors board: Flawless", 25);
  };
  const completeBoss = (b) => {
    pinHonor("night", "Honors board: Club Night Survivor", 20);
    gainChips(50, "club night won");
    setLedger((old) => {
      const p = Object.assign({}, old, { bosses: Object.assign({}, old.bosses) });
      p.bosses[b.id] = true;
      return p;
    });
    setScreen({ name: "hub" });
  };
  const startTrial = () => setScreen({ name: "trial" });
  const endTrial = (result) => {
    if (result === "win") { pinHonor("slayer", "Honors board: The Automaton Falls", 60); gainChips(120, "the Long Game"); }
    else if (result === "draw") gainChips(50, "half a point off the machine");
    if (result === "win") {
      setLedger((old) => Object.assign({}, old, { trialDone: true }));
      setScreen({ name: "hub" });
    } else {
      setScreen({ name: "trial" });
    }
  };

  const bg = {
    minHeight: "100vh",
    fontFamily: T.serif,
    background: T.dusk,
    position: "relative", overflowX: "hidden"
  };
  let body = null;
  if (screen.name === "hub") {
    body = <Hub ledger={ledger}
      onLesson={(c) => setScreen({ name: "lesson", id: c.id })}
      onBoss={(b) => setScreen({ name: "boss", id: b.id })}
      onTrial={startTrial}
      onDrill={() => setScreen({ name: "drill" })}
      onSandbox={() => setScreen({ name: "sandbox" })}
      onSalon={() => setScreen({ name: "salon" })}
      onPhrasebook={() => { setScreen({ name: "phrasebook" }); pinHonor("lingo", "Honors board: Speaks the Language", 15); }}
      onPull={doPull} />;
  } else if (screen.name === "phrasebook") {
    body = <Phrasebook onExit={() => setScreen({ name: "hub" })} />;
  } else if (screen.name === "salon") {
    body = <SalonRun onExit={() => setScreen({ name: "hub" })} onDone={(score, max) => {
      setLedger((old) => Object.assign({}, old, { salonBest: Math.max(old.salonBest || 0, max > 0 ? score / max : 0) }));
      gainChips(10 + score * 3, "salon night");
      pinHonor("salon", "Honors board: Salon Debut", 25);
      if (score === max) pinHonor("salonp", "Honors board: The Perfect Argument", 50);
    }} />;
  } else if (screen.name === "sandbox") {
    body = <Sandbox cell={cell} onExit={() => setScreen({ name: "hub" })} onReward={gainChips} />;
  } else if (screen.name === "drill") {
    body = <DrillRun ledger={ledger} cell={cell} onExit={() => setScreen({ name: "hub" })} onReward={gainChips} />;
  } else if (screen.name === "lesson") {
    const c = CONCEPTS.find((x) => x.id === screen.id);
    body = <Lesson key={c.id} concept={c} cell={cell}
      onComplete={completeConcept} onExit={() => setScreen({ name: "hub" })} />;
  } else if (screen.name === "boss") {
    const b = BOSSES.find((x) => x.id === screen.id);
    body = <BossRun key={b.id} boss={b} cell={cell}
      onComplete={() => completeBoss(b)} onExit={() => setScreen({ name: "hub" })} />;
  } else if (screen.name === "trial") {
    body = <Trial cell={cell} onEnd={endTrial} onExit={() => setScreen({ name: "hub" })} />;
  }
  return (
    <div style={bg}>
      <style>{KEYFRAMES}</style>
      <div style={{ position: "fixed", top: 10, left: 0, right: 0, zIndex: 90, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, pointerEvents: "none" }}>
        {toasts.map((t) => (
          <div key={t.id} style={{ animation: "tp-toast 3s ease both", background: T.overlay, border: "1px solid " + T.beigeDeep, color: T.paper, borderRadius: 99, padding: "7px 16px", fontFamily: T.mono, fontSize: 11, letterSpacing: 0.5 }}>
            {t.text}
          </div>
        ))}
      </div>
      <button onClick={() => { SFX.setOn(!soundOn); setSoundOn(!soundOn); }}
        style={{ position: "fixed", right: 12, bottom: 12, zIndex: 80, width: 40, height: 40, borderRadius: 99,
          border: "1px solid " + T.beigeLine, background: T.overlay, color: soundOn ? T.beige : T.onSoft,
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        <span style={{ fontSize: 11, letterSpacing: 0.5 }}>{soundOn ? "SOUND" : "MUTED"}</span>
      </button>
      <div style={{ position: "relative", zIndex: 1 }}>{body}</div>
    </div>
  );
}
