import { Clef, NoteSpec, accidentalSymbol, relativeStaffPosition } from './notes.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

// Layout constants (SVG user units).
const VIEW_WIDTH = 320;
const VIEW_HEIGHT = 195;
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

// Clef outlines below are the actual glyph paths from the Noto Music font
// (SIL OFL), extracted at build time and baked in as static geometry. We
// draw them as plain SVG paths rather than rendering the Unicode musical
// symbols as text: relying on a browser's font/baseline metrics at
// runtime to position U+1D11E / U+1D122 turned out to vary enough between
// platforms to visibly mis-place the bass clef, since different engines
// resolve the "alphabetic" baseline differently. Baking in the outline
// removes that variable entirely — this renders identically everywhere.
const CLEF_SCALE = 16 / 220; // font units -> SVG units (220 units = 1 staff space, from the bass clef's dot spacing)

const TREBLE_PATH_D =
  'M314-801Q300-854 291-906Q282-958 282-1012Q282-1059 288.50-1100.50Q295-1142 307-1177Q320-1217 341-1252.50Q362-1288 385.50-1311Q409-1334 427-1334Q451-1334 493-1249Q514-1206 524-1156Q534-1106 534-1049Q534-978 515-907.50Q496-837 459.50-775Q423-713 372-666L407-498Q422-500 432-501Q442-502 447-502Q508-502 556-467.50Q604-433 632.50-377Q661-321 661-254Q661-177 621.50-115.50Q582-54 503-25Q508-8 532 117Q538 147 541 164.50Q544 182 545 195Q546 208 546 225Q546 275 521.50 314.50Q497 354 455.50 376Q414 398 363 398Q311 398 271 378.50Q231 359 208 324.50Q185 290 185 245Q185 197 211.50 165Q238 133 287 133Q329 133 355.50 163.50Q382 194 382 236Q382 272 357 299Q332 326 292 326L282 326Q308 365 364 365Q433 365 472 320Q511 275 511 205Q511 188 507 159.50Q503 131 493 91Q483 51 477.50 25Q472-1 470-12Q436-2 390-2Q304-2 222-52Q142-102 96-184Q50-266 50-361Q50-451 91-530Q132-609 192.50-675Q253-741 314-801M341-826Q364-838 390-870.50Q416-903 440-945Q464-987 479-1029.50Q494-1072 494-1106Q494-1142 483-1163Q472-1184 445-1184Q421-1184 398.50-1162Q376-1140 358.50-1103.50Q341-1067 331-1022Q321-977 321-930Q321-898 327.50-872Q334-846 341-826M464-45L398-379Q371-373 347-353.50Q323-334 308.50-306.50Q294-279 294-248Q294-223 307-196.50Q320-170 339-154Q352-142 365-136Q380-129 380-123Q380-120 370-117Q332-126 301.50-151Q271-176 253.50-211.50Q236-247 236-287Q236-330 253.50-370Q271-410 302.50-442Q334-474 374-490L345-641Q229-547 174.50-456.50Q120-366 120-277Q120-212 154-156Q188-100 247-65.50Q306-31 380-31Q400-31 420.50-35Q441-39 464-45M429-383L495-55Q593-97 593-227Q593-270 571-305.50Q549-341 512-362Q475-383 429-383';

const BASS_PATH_D =
  'M57-101L50-123Q216-231 288-301Q336-348 373-408.50Q410-469 431.50-536Q453-603 453-669Q453-728 435-773.50Q417-819 383-845Q349-871 302-871Q284-871 264.50-867Q245-863 224-855Q181-839 158-813.50Q135-788 135-765Q135-756 143-752Q151-748 158-748Q168-748 183-752Q190-754 196.50-755Q203-756 210-756Q248-756 272-733.50Q296-711 296-674Q296-638 266-612Q236-586 195-586Q146-586 111-617Q76-648 76-697Q76-756 109-802Q142-848 198.50-874Q255-900 324-900Q400-900 460-867Q520-834 555.50-776.50Q591-719 591-646Q591-551 538-464Q511-419 476.50-379Q442-339 389-297.50Q336-256 256-208Q176-160 57-101M687-809Q710-809 726-793Q742-777 742-754Q742-731 726-715.50Q710-700 687-700Q664-700 648-715.50Q632-731 632-754Q632-777 648-793Q664-809 687-809M687-589Q710-589 726-573Q742-557 742-534Q742-511 726-495.50Q710-480 687-480Q664-480 648-495.50Q632-511 632-534Q632-557 648-573Q664-589 687-589';

// Font-unit y-coordinate that lands on the reference staff line, found by
// visually calibrating against a real staff: for the treble clef this is
// where the spiral crosses itself around the G4 line; for the bass clef
// it's the midpoint between the two dots, which straddle the F3 line.
const TREBLE_ANCHOR_FONT_Y = -641;
const BASS_ANCHOR_FONT_Y = -644;

function drawTrebleClef(svg: SVGSVGElement): void {
  const gLineY = yForPosition(2); // G4, 2nd line from bottom
  const originX = 82;
  const originY = gLineY - TREBLE_ANCHOR_FONT_Y * CLEF_SCALE - 2 * LINE_GAP;
  const g = svgEl('g', { transform: `translate(${originX} ${originY}) scale(${CLEF_SCALE})` });
  g.appendChild(svgEl('path', { d: TREBLE_PATH_D, class: 'clef' }));
  svg.appendChild(g);
}

function drawBassClef(svg: SVGSVGElement): void {
  const fLineY = yForPosition(6); // F3, 2nd line from top
  const originX = 78;
  const originY = fLineY - BASS_ANCHOR_FONT_Y * CLEF_SCALE;
  const g = svgEl('g', { transform: `translate(${originX} ${originY}) scale(${CLEF_SCALE})` });
  g.appendChild(svgEl('path', { d: BASS_PATH_D, class: 'clef' }));
  svg.appendChild(g);
}

function drawClef(svg: SVGSVGElement, clef: Clef): void {
  if (clef === 'treble') {
    drawTrebleClef(svg);
  } else {
    drawBassClef(svg);
  }
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
