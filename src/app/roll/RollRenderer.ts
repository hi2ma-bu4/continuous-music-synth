import { GRID_BEATS, INITIAL_SCROLL_TOP, NOTE_HEIGHT, PIXELS_PER_BEAT, TOTAL_NOTES } from "../constants";
import type { TrackName } from "../types";

export class RollRenderer {
	private animationFrameId: number | null = null;

	public constructor(
		private readonly roll: HTMLDivElement,
		private readonly viewport: HTMLDivElement,
	) {}

	public addNote(channel: TrackName, midi: number, beat: number, duration: number): void {
		const note = document.createElement("div");

		note.className = `note ${channel}`;
		note.style.left = `${beat * PIXELS_PER_BEAT}px`;
		note.style.top = `${this.midiToY(midi)}px`;
		note.style.width = `${Math.max(6, duration * PIXELS_PER_BEAT - 2)}px`;
		note.style.height = "10px";

		this.roll.appendChild(note);
	}

	public centerInitialView(): void {
		this.viewport.scrollTop = INITIAL_SCROLL_TOP;
	}

	public reset(): void {
		this.stop();
		this.roll.replaceChildren();
		this.createGrid();
		this.centerInitialView();
	}

	public start(getBeat: () => number): void {
		this.stop();

		const animate = (): void => {
			const beat = getBeat();
			const center = window.innerWidth / 2;

			this.roll.style.transform = `translateX(${center - beat * PIXELS_PER_BEAT}px)`;
			this.animationFrameId = window.requestAnimationFrame(animate);
		};

		animate();
	}

	public stop(): void {
		if (this.animationFrameId !== null) {
			window.cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}
	}

	private createGrid(): void {
		for (let beatIndex = 0; beatIndex < GRID_BEATS; beatIndex += 1) {
			const beat = document.createElement("div");

			beat.className = "beatLine";
			beat.style.left = `${beatIndex * PIXELS_PER_BEAT}px`;

			this.roll.appendChild(beat);

			if (beatIndex % 4 === 0) {
				const bar = document.createElement("div");

				bar.className = "barLine";
				bar.style.left = `${beatIndex * PIXELS_PER_BEAT}px`;

				this.roll.appendChild(bar);
			}
		}

		for (let noteIndex = 0; noteIndex < TOTAL_NOTES; noteIndex += 1) {
			const line = document.createElement("div");

			line.className = "gridLine";
			line.style.top = `${noteIndex * NOTE_HEIGHT}px`;

			this.roll.appendChild(line);
		}
	}

	private midiToY(midi: number): number {
		return (TOTAL_NOTES - (midi - 12)) * NOTE_HEIGHT;
	}
}
