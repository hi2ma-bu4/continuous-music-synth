import { INITIAL_KEY } from "../constants";
import { CHORDS, NOTE_NAMES, PROGRESSIONS, RHYTHMS } from "../data";
import type { BarContext, MelodyEvent } from "../types";

export class MusicGenerator {
	private barCounter = 0;
	private chordName = "I";
	private currentKey = INITIAL_KEY;
	private previousLead = 72;
	private progression = [...PROGRESSIONS[0]];
	private progressionIndex = 0;

	public createBarContext(autoModulate: boolean): BarContext {
		this.barCounter += 1;

		if (autoModulate && this.barCounter % 8 === 0 && Math.random() < 0.75) {
			this.modulateKey();
		}

		this.nextChord();

		return {
			barCounter: this.barCounter,
			chord: this.buildChord(this.chordName),
			chordName: this.chordName,
			currentKey: this.currentKey,
			kime: this.createKime(),
			kimeBeat: this.randomFrom([1, 2, 3]),
		};
	}

	public createMelody(chord: number[]): MelodyEvent[] {
		const rhythm = this.randomFrom(RHYTHMS);
		const result: MelodyEvent[] = [];
		let beat = 0;

		for (const duration of rhythm) {
			let note = this.randomFrom(chord) + 12;

			if (Math.random() < 0.25) {
				note += 12;
			}

			note = this.nearestLead(note);

			result.push({
				beat,
				duration,
				note,
			});

			beat += duration;
		}

		return result;
	}

	public getChordName(): string {
		return this.chordName;
	}

	public getCurrentKey(): number {
		return this.currentKey;
	}

	public getKeyName(): string {
		return NOTE_NAMES[this.currentKey % NOTE_NAMES.length];
	}

	public reset(rootKey = this.currentKey): void {
		this.barCounter = 0;
		this.chordName = "I";
		this.currentKey = this.clampKey(rootKey);
		this.previousLead = 72;
		this.progression = [...PROGRESSIONS[0]];
		this.progressionIndex = 0;
	}

	public setCurrentKey(rootKey: number): void {
		this.currentKey = this.clampKey(rootKey);
	}

	private buildChord(name: string): number[] {
		const chord = CHORDS[name];

		if (!chord) {
			throw new Error(`Unknown chord: ${name}`);
		}

		return chord.map((interval) => this.currentKey + interval);
	}

	private clampKey(rootKey: number): number {
		return Math.max(36, Math.min(60, Math.round(rootKey)));
	}

	private createKime(): boolean {
		return Math.random() < 0.12;
	}

	private modulateKey(): void {
		const moves = [-7, -5, -2, 2, 5, 7];

		this.currentKey += this.randomFrom(moves);

		while (this.currentKey < 36) {
			this.currentKey += 12;
		}

		while (this.currentKey > 60) {
			this.currentKey -= 12;
		}
	}

	private nearestLead(note: number): number {
		while (note - this.previousLead > 7) {
			note -= 12;
		}

		while (this.previousLead - note > 7) {
			note += 12;
		}

		this.previousLead = note;

		return note;
	}

	private nextChord(): void {
		this.chordName = this.progression[this.progressionIndex] ?? "I";
		this.progressionIndex += 1;

		if (this.progressionIndex >= this.progression.length) {
			this.progressionIndex = 0;
			this.progression = [...this.randomFrom(PROGRESSIONS)];
		}
	}

	private randomFrom<T>(values: readonly T[]): T {
		return values[Math.floor(Math.random() * values.length)] as T;
	}
}
