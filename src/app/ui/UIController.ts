import type { AppElements } from "../dom";
import { syncTrackInputs } from "../dom";
import type { TrackEnabledState, TrackName, UiSnapshot } from "../types";

export interface UIControllerBindings {
	onAutoModulateChange: (enabled: boolean) => void;
	onRootChange: (rootKey: number) => void;
	onToggleTrack: (track: TrackName, enabled: boolean) => void;
	onTransportToggle: () => Promise<void> | void;
}

export class UIController {
	public constructor(private readonly elements: AppElements) {}

	public bind(bindings: UIControllerBindings): void {
		this.elements.menuButton.addEventListener("click", () => {
			this.elements.uiPanel.classList.toggle("closed");
		});

		this.elements.transportButton.addEventListener("click", async () => {
			await bindings.onTransportToggle();
		});

		this.elements.autoModulate.addEventListener("change", () => {
			bindings.onAutoModulateChange(this.elements.autoModulate.checked);
		});

		this.elements.rootSlider.addEventListener("input", () => {
			bindings.onRootChange(Number.parseInt(this.elements.rootSlider.value, 10));
		});

		const trackEntries = Object.entries(this.elements.trackToggleInputs) as [TrackName, HTMLInputElement][];

		for (const [track, input] of trackEntries) {
			input.addEventListener("change", () => {
				bindings.onToggleTrack(track, input.checked);
			});
		}
	}

	public syncTrackState(trackState: TrackEnabledState): void {
		syncTrackInputs(this.elements.trackToggleInputs, trackState);
	}

	public update(snapshot: UiSnapshot): void {
		this.elements.keyText.textContent = snapshot.keyName;
		this.elements.chordText.textContent = snapshot.chordName;
		this.elements.rootSlider.value = `${snapshot.currentKey}`;
		this.elements.rootValue.textContent = `${snapshot.currentKey}`;
		this.elements.autoModulate.checked = snapshot.autoModulate;
		this.elements.transportButton.textContent = snapshot.playing ? "STOP" : "START";
	}
}
