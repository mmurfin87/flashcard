import {
  Accidental,
  Clef,
  Letter,
  NoteSpec,
  noteLabel,
  notesEqual,
  randomNoteForClef,
} from './notes.js';
import { renderStaff } from './staff.js';

interface Stats {
  correct: number;
  total: number;
  streak: number;
  bestStreak: number;
}

const BEST_STREAK_KEY = 'note-flashcards.bestStreak';

class FlashcardApp {
  private svg: SVGSVGElement;
  private letterButtons: HTMLButtonElement[];
  private accidentalButtons: HTMLButtonElement[];
  private clefRadios: HTMLInputElement[];
  private feedbackEl: HTMLElement;
  private scoreEl: HTMLElement;
  private streakEl: HTMLElement;
  private bestStreakEl: HTMLElement;
  private nextButton: HTMLButtonElement;

  private selectedAccidental: Accidental = 'natural';
  private clefMode: Clef | 'both' = 'both';
  private currentClef: Clef = 'treble';
  private currentNote: NoteSpec;
  private awaitingNext = false;
  private stats: Stats = {
    correct: 0,
    total: 0,
    streak: 0,
    bestStreak: Number(localStorage.getItem(BEST_STREAK_KEY) ?? 0),
  };

  constructor() {
    this.svg = document.querySelector('#staff') as SVGSVGElement;
    this.letterButtons = Array.from(document.querySelectorAll('[data-letter]'));
    this.accidentalButtons = Array.from(document.querySelectorAll('[data-accidental]'));
    this.clefRadios = Array.from(document.querySelectorAll('input[name="clef-mode"]'));
    this.feedbackEl = document.querySelector('#feedback') as HTMLElement;
    this.scoreEl = document.querySelector('#score') as HTMLElement;
    this.streakEl = document.querySelector('#streak') as HTMLElement;
    this.bestStreakEl = document.querySelector('#best-streak') as HTMLElement;
    this.nextButton = document.querySelector('#next-button') as HTMLButtonElement;

    this.currentClef = this.pickClef();
    this.currentNote = randomNoteForClef(this.currentClef);

    this.bindEvents();
    this.updateAccidentalUI();
    this.updateStatsUI();
    this.draw();
  }

  private pickClef(): Clef {
    if (this.clefMode === 'both') {
      return Math.random() < 0.5 ? 'treble' : 'bass';
    }
    return this.clefMode;
  }

  private bindEvents(): void {
    for (const button of this.accidentalButtons) {
      button.addEventListener('click', () => {
        this.selectedAccidental = button.dataset.accidental as Accidental;
        this.updateAccidentalUI();
      });
    }

    for (const button of this.letterButtons) {
      button.addEventListener('click', () => {
        this.handleGuess(button.dataset.letter as Letter);
      });
    }

    for (const radio of this.clefRadios) {
      radio.addEventListener('change', () => {
        if (radio.checked) {
          this.clefMode = radio.value as Clef | 'both';
          this.newQuestion();
        }
      });
    }

    this.nextButton.addEventListener('click', () => this.newQuestion());

    window.addEventListener('keydown', (event) => {
      const key = event.key.toUpperCase();
      if (['A', 'B', 'C', 'D', 'E', 'F', 'G'].includes(key)) {
        this.handleGuess(key as Letter);
      } else if (key === '#' || key === '+') {
        this.selectedAccidental = 'sharp';
        this.updateAccidentalUI();
      } else if (event.key === '-') {
        this.selectedAccidental = 'flat';
        this.updateAccidentalUI();
      } else if (event.key === '0' || event.key === 'n') {
        this.selectedAccidental = 'natural';
        this.updateAccidentalUI();
      } else if (event.code === 'Space') {
        event.preventDefault();
        this.newQuestion();
      }
    });
  }

  private updateAccidentalUI(): void {
    for (const button of this.accidentalButtons) {
      button.classList.toggle('active', button.dataset.accidental === this.selectedAccidental);
    }
  }

  private handleGuess(letter: Letter): void {
    if (this.awaitingNext) return;

    const guess: NoteSpec = { letter, accidental: this.selectedAccidental, octave: this.currentNote.octave };
    const isCorrect = notesEqual(guess, this.currentNote);

    this.stats.total += 1;
    if (isCorrect) {
      this.stats.correct += 1;
      this.stats.streak += 1;
      this.stats.bestStreak = Math.max(this.stats.bestStreak, this.stats.streak);
      localStorage.setItem(BEST_STREAK_KEY, String(this.stats.bestStreak));
    } else {
      this.stats.streak = 0;
    }
    this.updateStatsUI();
    this.showFeedback(isCorrect);
    this.awaitingNext = true;

    window.setTimeout(() => {
      this.awaitingNext = false;
      this.newQuestion();
    }, 900);
  }

  private showFeedback(isCorrect: boolean): void {
    this.feedbackEl.textContent = isCorrect ? 'Correct!' : `Not quite — that was ${noteLabel(this.currentNote)}`;
    this.feedbackEl.className = isCorrect ? 'feedback correct' : 'feedback incorrect';
  }

  private updateStatsUI(): void {
    this.scoreEl.textContent = `${this.stats.correct} / ${this.stats.total}`;
    this.streakEl.textContent = String(this.stats.streak);
    this.bestStreakEl.textContent = String(this.stats.bestStreak);
  }

  private newQuestion(): void {
    this.currentClef = this.pickClef();
    this.currentNote = randomNoteForClef(this.currentClef);
    this.feedbackEl.textContent = '';
    this.feedbackEl.className = 'feedback';
    this.draw();
  }

  private draw(): void {
    renderStaff(this.svg, this.currentClef, this.currentNote);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new FlashcardApp();
});
