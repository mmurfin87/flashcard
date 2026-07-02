export type Letter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
export type Accidental = 'natural' | 'sharp' | 'flat';
export type Clef = 'treble' | 'bass';

export interface NoteSpec {
  letter: Letter;
  accidental: Accidental;
  octave: number;
}

const LETTER_TO_STEP: Record<Letter, number> = {
  C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6,
};

const STEP_TO_LETTER: Letter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

// Diatonic position: a single integer that increases by one for every
// consecutive staff line/space step (C0 = 0, D0 = 1, ... B0 = 6, C1 = 7, ...).
function diatonicPosition(letter: Letter, octave: number): number {
  return LETTER_TO_STEP[letter] + 7 * octave;
}

function letterOctaveFromDiatonic(pos: number): { letter: Letter; octave: number } {
  const octave = Math.floor(pos / 7);
  const step = pos - octave * 7;
  return { letter: STEP_TO_LETTER[step]!, octave };
}

// Bottom staff line reference notes.
const CLEF_REFERENCE: Record<Clef, { letter: Letter; octave: number }> = {
  treble: { letter: 'E', octave: 4 }, // bottom line
  bass: { letter: 'G', octave: 2 }, // bottom line
};

// How far (in diatonic steps from the bottom line) the practice range
// extends for each clef. -2 = one ledger line below staff, 10 = one
// ledger line above staff.
const RANGE_MIN = -2;
const RANGE_MAX = 10;

/**
 * Position of a note relative to the clef's bottom staff line, measured in
 * diatonic steps (each step is half a line-spacing on the rendered staff).
 */
export function relativeStaffPosition(note: NoteSpec, clef: Clef): number {
  const ref = CLEF_REFERENCE[clef];
  return diatonicPosition(note.letter, note.octave) - diatonicPosition(ref.letter, ref.octave);
}

/** All distinct (letter, octave) combinations playable on a given clef. */
export function letterOctavesForClef(clef: Clef): Array<{ letter: Letter; octave: number }> {
  const ref = CLEF_REFERENCE[clef];
  const refPos = diatonicPosition(ref.letter, ref.octave);
  const result: Array<{ letter: Letter; octave: number }> = [];
  for (let r = RANGE_MIN; r <= RANGE_MAX; r++) {
    result.push(letterOctaveFromDiatonic(refPos + r));
  }
  return result;
}

const ACCIDENTALS: Accidental[] = ['natural', 'sharp', 'flat'];

export function randomNoteForClef(clef: Clef): NoteSpec {
  const options = letterOctavesForClef(clef);
  const pick = options[Math.floor(Math.random() * options.length)]!;
  const accidental = ACCIDENTALS[Math.floor(Math.random() * ACCIDENTALS.length)]!;
  return { letter: pick.letter, accidental, octave: pick.octave };
}

export function accidentalSymbol(accidental: Accidental): string {
  if (accidental === 'sharp') return '♯'; // ♯
  if (accidental === 'flat') return '♭'; // ♭
  return '';
}

export function noteLabel(note: NoteSpec): string {
  return `${note.letter}${accidentalSymbol(note.accidental)}${note.octave}`;
}
