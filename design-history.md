# Tempo: design notes

August 2026.

An interactive chess course in one React file, built for a complete beginner who learns through games. The README says what the game is. This is a short note on how it looks, and why.

## The shape of it

One file. No dependencies beyond React. Engine, content and interface all live together, and the constraint did most of the work: when there is nowhere to hide a flourish, you stop writing flourishes.

Two non-text marks in the whole interface: the pieces and a lock. No gradients. The white pieces carry a thin outline, because cream on cream is not a contrast. Everything else is type, rule and color.

## What it is made of

Two voices. Lora explains and IBM Plex Mono reports, so prose sits in the serif and every label, count and readout sits in the mono. One emphasis weight across both, and only weights that are actually loaded. Two reading measures: one for prose, a tighter one for anything compact.

Two accents on a dark blue ground. Light blue leads and carries the interface, the buttons and labels and structure, the house talking. Beige warms, and marks the things you earn. Rose is held back for a single meaning: wrong. The board is slate and beige so it belongs to the page rather than sitting on top of it.

Every color is named in one table, and nothing appears on screen that is not named there. Accents that have to sit on cream get a darker ink weight, because one value cannot do both jobs and stay readable.

## What I would keep

The engine being real. Exercises are checked by the rules of chess rather than by scripts, so a legal-but-losing move gets refuted by an actual reply on the board. Watching the punishment teaches. A red X does not.

Real vocabulary. Everything goes by its true name, so everything learned here still works at a club or on lichess.

Pointing outward. The dues are real tasks, mostly go and play. The last thing in the course is a full game, not a quiz.

Restraint as a feature. Irregular card corners, a faint tilt on the paper, machined insets on the buttons. Those read as craft. Anything more decorative came out.

## What it taught me

Ornament arrives in layers, and it hides. You clear the obvious pass, then a subtler one turns up underneath it, then a third. The last of it never shows up in a search. You find it by looking.

Names drift away from the things they name. A color called one thing and set to another will sit there for months being quietly wrong, and so will a component named after something that was cut.

And after every cut, check what the cut left behind. A removed thing tends to leave its name, its wrapper, or its gap sitting there, still doing nothing.

## The name

In chess a tempo is the smallest unit of time, one move, and gaining one means your opponent spends their turn answering you. That is what a page of this course is meant to do.
