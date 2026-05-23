import type { Compressor, Limiter, MembraneSynth, MetalSynth, MonoSynth, NoiseSynth, PolySynth, Reverb } from "tone";

import { BPM, TIME_SIGNATURE } from "../constants";
import { RHYTHMS } from "../data";
import { MusicGenerator } from "../music/MusicGenerator";
import type { BarStateSnapshot, TrackEnabledState, TrackName } from "../types";

type ToneModule = typeof import("tone");

export interface AudioEngineCallbacks {
	onBarStateChange: (snapshot: BarStateSnapshot) => void;
	onRollNote: (channel: TrackName, midi: number, beat: number, duration: number) => void;
}

interface AudioNodes {
	arp: PolySynth;
	bass: MonoSynth;
	brass: PolySynth;
	compressor: Compressor;
	hat: MetalSynth;
	kick: MembraneSynth;
	lead: PolySynth;
	limiter: Limiter;
	reverb: Reverb;
	snare: NoiseSynth;
	strings: PolySynth;
	wood: PolySynth;
}

export class AudioEngine {
	private autoModulate = true;
	private readonly generator = new MusicGenerator();
	private nodes: AudioNodes | null = null;
	private playing = false;
	private tone: ToneModule | null = null;
	private transportScheduled = false;

	public constructor(
		private readonly trackEnabled: TrackEnabledState,
		private readonly callbacks: AudioEngineCallbacks,
	) {}

	public async unlockAudio(): Promise<void> {
		if (!this.tone) {
			this.tone = await import("tone");
		}

		await this.tone.start();
		this.ensureAudioGraph();
	}

	public beginPlayback(): void {
		this.ensureAudioGraph();
		this.requireTone().Transport.start();
		this.playing = true;
	}

	public getChordName(): string {
		return this.generator.getChordName();
	}

	public getCurrentKey(): number {
		return this.generator.getCurrentKey();
	}

	public getKeyName(): string {
		return this.generator.getKeyName();
	}

	public getTransportBeat(): number {
		if (!this.nodes) {
			return 0;
		}

		const tone = this.requireTone();

		return tone.Transport.ticks / tone.Transport.PPQ;
	}

	public isPlaying(): boolean {
		return this.playing;
	}

	public resetSession(): void {
		if (this.nodes) {
			const tone = this.requireTone();

			tone.Transport.stop();
			tone.Transport.position = 0;
		}

		this.generator.reset(this.generator.getCurrentKey());
		this.playing = false;
		this.callbacks.onBarStateChange(this.createSnapshot());
	}

	public setAutoModulate(enabled: boolean): void {
		this.autoModulate = enabled;
	}

	public setCurrentKey(rootKey: number): void {
		this.generator.setCurrentKey(rootKey);
		this.callbacks.onBarStateChange(this.createSnapshot());
	}

	public setTrackEnabled(track: TrackName, enabled: boolean): void {
		this.trackEnabled[track] = enabled;
	}

	public stopPlayback(): void {
		if (this.nodes) {
			this.requireTone().Transport.stop();
		}

		this.playing = false;
	}

	private addRollNote(channel: TrackName, midi: number, beat: number, duration: number): void {
		if (!this.trackEnabled[channel]) {
			return;
		}

		this.callbacks.onRollNote(channel, midi, beat, duration);
	}

	private createNodes(): AudioNodes {
		const tone = this.requireTone();
		const limiter = new tone.Limiter(-1).toDestination();
		const reverb = new tone.Reverb({
			decay: 4,
			wet: 0.12,
		}).connect(limiter);
		const compressor = new tone.Compressor(-18, 3).connect(reverb);

		const strings = new tone.PolySynth(tone.Synth, {
			envelope: {
				attack: 0.12,
				decay: 0.2,
				release: 0.6,
				sustain: 0.85,
			},
			oscillator: {
				type: "fatsine" as never,
			},
			volume: -10,
		}).connect(compressor);

		const brass = new tone.PolySynth(tone.Synth, {
			envelope: {
				attack: 0.03,
				decay: 0.08,
				release: 0.25,
				sustain: 0.75,
			},
			oscillator: {
				type: "triangle",
			},
			volume: -16,
		}).connect(compressor);

		const wood = new tone.PolySynth(tone.Synth, {
			envelope: {
				attack: 0.03,
				decay: 0.08,
				release: 0.25,
				sustain: 0.75,
			},
			oscillator: {
				type: "sine",
			},
			volume: -17,
		}).connect(compressor);

		const lead = new tone.PolySynth(tone.Synth, {
			envelope: {
				attack: 0.015,
				decay: 0.05,
				release: 0.07,
				sustain: 0.16,
			},
			oscillator: {
				type: "triangle",
			},
			volume: -10,
		}).connect(compressor);

		const arp = new tone.PolySynth(tone.Synth, {
			envelope: {
				attack: 0.003,
				decay: 0.025,
				release: 0.02,
				sustain: 0.01,
			},
			oscillator: {
				type: "square",
			},
			volume: -31,
		}).connect(compressor);

		const bass = new tone.MonoSynth({
			envelope: {
				attack: 0.03,
				decay: 0.08,
				release: 0.12,
				sustain: 0.45,
			},
			oscillator: {
				type: "triangle",
			},
			volume: -8,
		}).connect(compressor);

		const kick = new tone.MembraneSynth({
			envelope: {
				attack: 0.03,
				decay: 0.28,
				sustain: 0,
			},
			octaves: 4,
			oscillator: {
				type: "sine",
			},
			pitchDecay: 0.05,
			volume: -1,
		}).connect(limiter);

		const snare = new tone.NoiseSynth({
			envelope: {
				attack: 0.02,
				decay: 0.08,
				sustain: 0,
			},
			noise: {
				type: "pink",
			},
			volume: -13,
		}).connect(reverb);

		const hat = new tone.MetalSynth({
			envelope: {
				attack: 0.01,
				decay: 0.03,
				release: 0.01,
			},
			harmonicity: 1.5,
			modulationIndex: 8,
			octaves: 1,
			resonance: 1200,
			volume: -18,
		}).connect(reverb);

		hat.frequency.value = 200;

		return {
			arp,
			bass,
			brass,
			compressor,
			hat,
			kick,
			lead,
			limiter,
			reverb,
			snare,
			strings,
			wood,
		};
	}

	private createSnapshot(): BarStateSnapshot {
		return {
			chordName: this.generator.getChordName(),
			currentKey: this.generator.getCurrentKey(),
		};
	}

	private ensureAudioGraph(): void {
		const tone = this.requireTone();

		if (!this.nodes) {
			this.nodes = this.createNodes();
		}

		if (!this.transportScheduled) {
			tone.Transport.bpm.value = BPM;
			tone.Transport.timeSignature = TIME_SIGNATURE;

			tone.Transport.scheduleRepeat((time) => {
				this.playBar(time);
			}, "1m");

			this.transportScheduled = true;
		}
	}

	private midiToPitch(midi: number): string {
		return this.requireTone().Frequency(midi, "midi").toNote();
	}

	private playBar(time: number): void {
		if (!this.nodes) {
			return;
		}

		const tone = this.requireTone();
		const bar = this.generator.createBarContext(this.autoModulate);
		const startBeat = this.getTransportBeat();
		const quarterNoteSeconds = tone.Time("4n").toSeconds();

		this.callbacks.onBarStateChange({
			chordName: bar.chordName,
			currentKey: bar.currentKey,
		});

		if (this.trackEnabled.strings) {
			this.nodes.strings.triggerAttackRelease(
				bar.chord.map((note) => this.midiToPitch(note)),
				bar.kime ? "2n" : "1m",
				time,
			);

			for (const note of bar.chord) {
				this.addRollNote("strings", note, startBeat, bar.kime ? 2 : 4);
			}

			if (bar.kime) {
				this.nodes.strings.triggerAttackRelease(
					bar.chord.map((note) => this.midiToPitch(note + 12)),
					"8n",
					time + quarterNoteSeconds * bar.kimeBeat,
				);
			}
		}

		if (this.trackEnabled.brass) {
			if (bar.kime) {
				this.nodes.brass.triggerAttackRelease(
					bar.chord.map((note) => this.midiToPitch(note + 12)),
					"8n",
					time + quarterNoteSeconds * bar.kimeBeat,
				);
			} else {
				const rhythm = this.randomFrom(RHYTHMS);
				let beat = 0;

				for (const duration of rhythm) {
					if (beat + duration > 4) {
						break;
					}

					const note = this.randomFrom(bar.chord) + 5;

					this.nodes.brass.triggerAttackRelease(this.midiToPitch(note), duration * 0.5, time + quarterNoteSeconds * beat);

					this.addRollNote("brass", note, startBeat + beat, duration);
					beat += duration;
				}
			}
		}

		if (this.trackEnabled.wood) {
			const melody = this.generator.createMelody(bar.chord);

			for (const event of melody) {
				if (bar.kime && event.beat > bar.kimeBeat) {
					continue;
				}

				const note = event.note - 12;

				this.nodes.wood.triggerAttackRelease(this.midiToPitch(note), event.duration * 0.5, time + quarterNoteSeconds * event.beat);

				this.addRollNote("wood", note, startBeat + event.beat, event.duration);
			}
		}

		if (this.trackEnabled.bass) {
			const note = bar.chord[0] - 12;

			this.nodes.bass.triggerAttackRelease(this.midiToPitch(note), bar.kime ? "2n" : "1m", time);

			this.addRollNote("bass", note, startBeat, bar.kime ? 2 : 4);
		}

		if (this.trackEnabled.arp) {
			let beat = 0;
			let index = 0;

			while (beat < 4) {
				const duration = this.randomFrom([0.25, 0.25, 0.5] as const);

				if (beat + duration > 4) {
					break;
				}

				if (bar.kime && beat >= bar.kimeBeat - 0.25 && beat <= bar.kimeBeat + 0.25) {
					beat += duration;
					continue;
				}

				const note = bar.chord[index % bar.chord.length] + 24;

				this.nodes.arp.triggerAttackRelease(this.midiToPitch(note), "32n", time + quarterNoteSeconds * beat);

				this.addRollNote("arp", note, startBeat + beat, duration);
				beat += duration;
				index += 1;
			}
		}

		if (this.trackEnabled.lead) {
			const melody = this.generator.createMelody(bar.chord);

			for (const event of melody) {
				if (bar.kime && event.beat >= bar.kimeBeat - 0.25 && event.beat <= bar.kimeBeat + 0.25) {
					continue;
				}

				this.nodes.lead.triggerAttackRelease(this.midiToPitch(event.note), event.duration * 0.22, time + quarterNoteSeconds * event.beat);

				this.addRollNote("lead", event.note, startBeat + event.beat, event.duration);
			}
		}

		if (this.trackEnabled.drums) {
			for (const beat of [0, 2]) {
				this.nodes.kick.triggerAttackRelease("C1", "8n", time + quarterNoteSeconds * beat);
				this.addRollNote("drums", 36, startBeat + beat, 0.25);
			}

			for (const beat of [1, 3]) {
				this.nodes.snare.triggerAttackRelease("16n", time + quarterNoteSeconds * beat);
				this.addRollNote("drums", 38, startBeat + beat, 0.2);
			}

			for (const beat of [0.5, 1, 1.5, 2, 2.5, 3, 3.5]) {
				this.nodes.hat.triggerAttackRelease("32n", time + quarterNoteSeconds * beat);
				this.addRollNote("drums", 42, startBeat + beat, 0.1);
			}

			if (bar.kime) {
				const kickAccentBeat = this.resolveAccentBeat(bar.kimeBeat, [0, 2]);
				const snareAccentBeat = this.resolveAccentBeat(bar.kimeBeat, [1, 3]);

				this.nodes.kick.triggerAttackRelease("C1", "4n", this.resolveAccentTime(bar.kimeBeat, [0, 2], quarterNoteSeconds, time));
				this.addRollNote("drums", 36, startBeat + kickAccentBeat, 0.35);

				this.nodes.snare.triggerAttackRelease("8n", this.resolveAccentTime(bar.kimeBeat, [1, 3], quarterNoteSeconds, time));
				this.addRollNote("drums", 38, startBeat + snareAccentBeat, 0.25);
			}
		}
	}

	private randomFrom<T>(values: readonly T[]): T {
		return values[Math.floor(Math.random() * values.length)] as T;
	}

	private resolveAccentTime(beat: number, pattern: readonly number[], quarterNoteSeconds: number, barStartTime: number): number {
		const accentTime = barStartTime + quarterNoteSeconds * beat;

		if (pattern.includes(beat)) {
			return accentTime + 0.0001;
		}

		return accentTime;
	}

	private resolveAccentBeat(beat: number, pattern: readonly number[]): number {
		if (pattern.includes(beat)) {
			return beat + 0.0001;
		}

		return beat;
	}

	private requireTone(): ToneModule {
		if (!this.tone) {
			throw new Error("Tone has not been loaded yet.");
		}

		return this.tone;
	}
}
