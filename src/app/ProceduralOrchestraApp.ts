import { AudioEngine } from "./audio/AudioEngine";
import { createInitialTrackState } from "./constants";
import { queryAppElements, renderAppShell } from "./dom";
import { RollRenderer } from "./roll/RollRenderer";
import type { TrackEnabledState, UiSnapshot } from "./types";
import { UIController } from "./ui/UIController";

export class ProceduralOrchestraApp {
	private autoModulate = true;
	private audioEngine: AudioEngine | null = null;
	private rollRenderer: RollRenderer | null = null;
	private trackState: TrackEnabledState = createInitialTrackState();
	private ui: UIController | null = null;

	public constructor(private readonly mount: HTMLDivElement) {}

	public initialize(): void {
		renderAppShell(this.mount);

		const elements = queryAppElements(this.mount);

		this.rollRenderer = new RollRenderer(elements.roll, elements.viewport);
		this.ui = new UIController(elements);
		this.audioEngine = new AudioEngine(this.trackState, {
			onBarStateChange: () => {
				this.syncUi();
			},
			onRollNote: (channel, midi, beat, duration) => {
				this.rollRenderer?.addNote(channel, midi, beat, duration);
			},
		});

		this.audioEngine.setAutoModulate(this.autoModulate);
		this.audioEngine.resetSession();
		this.rollRenderer.reset();

		this.ui.bind({
			onAutoModulateChange: (enabled) => {
				this.autoModulate = enabled;
				this.audioEngine?.setAutoModulate(enabled);
				this.syncUi();
			},
			onRootChange: (rootKey) => {
				if (this.autoModulate) {
					return;
				}

				this.audioEngine?.setCurrentKey(rootKey);
				this.syncUi();
			},
			onToggleTrack: (track, enabled) => {
				this.trackState[track] = enabled;
				this.audioEngine?.setTrackEnabled(track, enabled);
				this.syncUi();
			},
			onTransportToggle: async () => {
				await this.toggleTransport();
			},
		});

		this.syncUi();
	}

	private buildUiSnapshot(): UiSnapshot {
		if (!this.audioEngine) {
			throw new Error("Audio engine is not ready.");
		}

		return {
			autoModulate: this.autoModulate,
			chordName: this.audioEngine.getChordName(),
			currentKey: this.audioEngine.getCurrentKey(),
			keyName: this.audioEngine.getKeyName(),
			playing: this.audioEngine.isPlaying(),
		};
	}

	private syncUi(): void {
		this.ui?.syncTrackState(this.trackState);
		this.ui?.update(this.buildUiSnapshot());
	}

	private async toggleTransport(): Promise<void> {
		if (!this.audioEngine || !this.rollRenderer) {
			return;
		}

		if (!this.audioEngine.isPlaying()) {
			await this.audioEngine.unlockAudio();
			this.audioEngine.resetSession();
			this.rollRenderer.reset();
			this.audioEngine.beginPlayback();
			this.rollRenderer.start(() => this.audioEngine?.getTransportBeat() ?? 0);
		} else {
			this.audioEngine.stopPlayback();
			this.rollRenderer.stop();
		}

		this.syncUi();
	}
}
