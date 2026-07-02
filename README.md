# Note Flashcards

A tiny flashcard app for practicing musical note recognition on the treble
and bass clefs. Built with TypeScript compiled to plain ES modules, no
frameworks, no bundler — just HTML5 + SVG.

## How it works

A note (A–G, with a sharp, flat, or natural modifier) is drawn on a randomly
chosen clef. Guess the letter and accidental; the app tracks your score and
streak.

- Click the accidental (♭ ♮ ♯) then a letter button, or use the keyboard:
  letter keys `A`–`G` to guess, `-`/`+` for flat/sharp, `0` for natural,
  `Space` to skip.
- Choose "Treble", "Bass", or "Both" to control which clef you're quizzed on.

## Development

```bash
npm install
npm run build   # compiles src/*.ts -> dist/*.js
npm run serve   # serves the app at http://localhost:8080
```

Or run `npm run watch` in one terminal to recompile on save while serving
with any static file server (a plain `file://` open won't work since the
app uses ES module imports, which need to be loaded over HTTP).

## Project layout

- `src/notes.ts` — note model and staff-position math (letters, accidentals,
  diatonic step calculations shared by both clefs)
- `src/staff.ts` — renders the staff, clef, ledger lines, accidental, and
  note head as SVG
- `src/app.ts` — UI state, event handling, scoring
- `index.html` / `style.css` — markup and styling
