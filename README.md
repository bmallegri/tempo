# Tempo

![Tempo, the notebook open on a live board](docs/screenshot.png)

An interactive chess course in one React file. Live at [bmallegri.github.io/tempo](https://bmallegri.github.io/tempo/).

I built it for a complete beginner who learns through games, so it is one: notebook pages inked on a live board, club nights against the house, a cabinet of chess history, a searching engine waiting at the end. Wrong-but-legal moves don't get a red X; the board plays the refutation and you watch the punishment land.

In chess, a tempo is the smallest unit of time: a single move. Gain one and your opponent spends their turn answering you instead of playing their own game. A course should work the same way, every page putting you a move ahead.

## Stack

React 18 in one JSX file, no dependencies beyond react and react-dom; Lora and IBM Plex Mono; Vite builds it, Vitest and ESLint check it, and GitHub Actions deploys to Pages.

## Run it locally

Needs Node 20 or newer and npm.

```bash
git clone https://github.com/bmallegri/tempo
cd tempo
npm install
npm run dev
```

Open the printed local URL (usually http://localhost:5173). The other scripts:

```bash
npm test      # the chess rules, and every position in the course
npm run lint  # eslint
npm run build # production build into dist/
npm run preview  # serve the built site
```

## What's inside

The Notebook: 18 concepts in four chapters, with margin notes, worked contexts, and club dues, which are real tasks to go do on lichess. Wrong-but-legal moves get refuted on the board instead of marked wrong.

Club Nights: four boss evenings, ending with the Long Game against the Automaton, a real depth-two engine.

The Back Table: a sandbox with take-backs, hints, and a gentle engine.

Also in here: the Cold Drill, the Cabinet (24 cards of real chess history), the Phrasebook (how the regulars actually talk), and a profile ledger with a five-axis radar.

## Saves

Progress saves to localStorage under `tempo-save`. Fresh start:

```js
localStorage.removeItem("tempo-save"); location.reload();
```

## Layout

- `src/Tempo.jsx`: the entire game in one file: engine, content, interface.
- `src/main.jsx`: mounts it.
- `test/`: the engine against the rules of chess, and every board in the course.

The engine and the content are named exports, so the tests read the real thing rather than a copy. `npm test` will tell you if a position is illegal, if an exercise has no solution, or if a page lost a hook or a setting.

## Planned

The Midnight Salon, strategy argued as a card game, is written and held for the second release. After that, a fifth chapter on openings.

## License

MIT. See [LICENSE](LICENSE).

`design-history.md` is the longer version: how it is put together, and why it looks the way it does.
