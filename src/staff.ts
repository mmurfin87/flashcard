import { Clef, NoteSpec, accidentalSymbol, relativeStaffPosition } from './notes.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

// Layout constants (SVG user units).
const VIEW_WIDTH = 320;
const VIEW_HEIGHT = 180;
const STAFF_LEFT = 80;
const STAFF_RIGHT = 300;
const LINE_GAP = 16; // distance between two adjacent staff lines
const TOP_LINE_Y = 60; // y of the top staff line (position 8)
const BOTTOM_LINE_Y = TOP_LINE_Y + 4 * LINE_GAP; // position 0
const NOTE_X = 230;
const NOTE_RX = 9;
const NOTE_RY = 6.5;
const LEDGER_HALF_WIDTH = NOTE_RX + 5;

function yForPosition(position: number): number {
  return BOTTOM_LINE_Y - position * (LINE_GAP / 2);
}

function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number>,
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, String(value));
  }
  return el;
}

function drawStaffLines(svg: SVGSVGElement): void {
  for (let i = 0; i < 5; i++) {
    const y = TOP_LINE_Y + i * LINE_GAP;
    svg.appendChild(
      svgEl('line', {
        x1: STAFF_LEFT,
        y1: y,
        x2: STAFF_RIGHT,
        y2: y,
        class: 'staff-line',
      }),
    );
  }
}

function drawClef(svg: SVGSVGElement, clef: Clef): void {
  // Treble clef curls around the G4 line (2nd from bottom); bass clef dots
  // straddle the F3 line (2nd from top). Font-size/offset tuned so the
  // Unicode glyph lines up with those reference lines.
  const glyph = clef === 'treble' ? '\u{1D11E}' : '\u{1D122}';
  const fontSize = clef === 'treble' ? 100 : 62;
  const x = clef === 'treble' ? 92 : 88;
  const y = clef === 'treble' ? BOTTOM_LINE_Y + 12 : TOP_LINE_Y + LINE_GAP + 6;
  const text = svgEl('text', {
    x,
    y,
    'font-size': fontSize,
    class: 'clef',
  });
  text.textContent = glyph;
  svg.appendChild(text);
}

function drawLedgerLines(svg: SVGSVGElement, position: number): void {
  const positions: number[] = [];
  if (position <= -2) {
    const count = Math.floor(-position / 2);
    for (let k = 1; k <= count; k++) positions.push(-2 * k);
  } else if (position >= 10) {
    const count = Math.floor((position - 8) / 2);
    for (let k = 1; k <= count; k++) positions.push(8 + 2 * k);
  }
  for (const pos of positions) {
    const y = yForPosition(pos);
    svg.appendChild(
      svgEl('line', {
        x1: NOTE_X - LEDGER_HALF_WIDTH,
        y1: y,
        x2: NOTE_X + LEDGER_HALF_WIDTH,
        y2: y,
        class: 'ledger-line',
      }),
    );
  }
}

function drawAccidental(svg: SVGSVGElement, note: NoteSpec, noteY: number): void {
  const symbol = accidentalSymbol(note.accidental);
  if (!symbol) return;
  const text = svgEl('text', {
    x: NOTE_X - 26,
    y: noteY + 6,
    'font-size': 22,
    class: 'accidental',
  });
  text.textContent = symbol;
  svg.appendChild(text);
}

function drawNoteHead(svg: SVGSVGElement, y: number): void {
  svg.appendChild(
    svgEl('ellipse', {
      cx: NOTE_X,
      cy: y,
      rx: NOTE_RX,
      ry: NOTE_RY,
      class: 'note-head',
      transform: `rotate(-20 ${NOTE_X} ${y})`,
    }),
  );
}

export function renderStaff(svg: SVGSVGElement, clef: Clef, note: NoteSpec): void {
  svg.setAttribute('viewBox', `0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`);
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  drawStaffLines(svg);
  drawClef(svg, clef);

  const position = relativeStaffPosition(note, clef);
  const y = yForPosition(position);
  drawLedgerLines(svg, position);
  drawAccidental(svg, note, y);
  drawNoteHead(svg, y);
}
