import { TRACKS } from "./constants";
import type { TrackEnabledState, TrackName } from "./types";

export interface AppElements {
	autoModulate: HTMLInputElement;
	chordText: HTMLSpanElement;
	keyText: HTMLSpanElement;
	menuButton: HTMLButtonElement;
	roll: HTMLDivElement;
	rootSlider: HTMLInputElement;
	rootValue: HTMLDivElement;
	trackToggleInputs: Record<TrackName, HTMLInputElement>;
	transportButton: HTMLButtonElement;
	uiPanel: HTMLDivElement;
	viewport: HTMLDivElement;
}

export function renderAppShell(root: HTMLDivElement): void {
	const legend = TRACKS.map(
		(track) => `
        <label class="trackToggle">
            <input type="checkbox" id="toggle_${track.name}" checked>
            <div class="legendColor ${track.cssClass}"></div>
            ${track.label}
        </label>
    `,
	).join("");

	root.innerHTML = `
        <button id="menuButton">☰</button>

        <div id="uiPanel">
            <div class="panelInner">
                <div class="row">
                    <button id="transportButton">START</button>
                </div>

                <div class="row">
                    <label>
                        <input
                            type="checkbox"
                            id="autoModulate"
                            checked
                        >
                        自動転調
                    </label>
                </div>

                <div class="row">
                    ROOT

                    <input
                        type="range"
                        id="rootSlider"
                        min="36"
                        max="60"
                        value="48"
                    >

                    <div
                        id="rootValue"
                        class="value"
                    >
                        48
                    </div>
                </div>

                <div class="legend">
                    ${legend}
                </div>
            </div>
        </div>

        <div id="statusHud" aria-live="polite">
            <div class="statusCard">
                <span class="statusLabel">KEY</span>
                <span id="keyText" class="value statusValue">C</span>
            </div>
            <div class="statusCard">
                <span class="statusLabel">CHORD</span>
                <span id="chordText" class="value statusValue">I</span>
            </div>
        </div>

        <div id="playhead"></div>

        <div id="rollViewport">
            <div id="roll"></div>
        </div>
    `;
}

export function queryAppElements(root: ParentNode = document): AppElements {
	const trackToggleInputs = TRACKS.reduce<Record<TrackName, HTMLInputElement>>(
		(inputs, track) => {
			inputs[track.name] = getById(root, `toggle_${track.name}`, HTMLInputElement);
			return inputs;
		},
		{
			strings: document.createElement("input"),
			brass: document.createElement("input"),
			wood: document.createElement("input"),
			lead: document.createElement("input"),
			arp: document.createElement("input"),
			bass: document.createElement("input"),
			drums: document.createElement("input"),
		},
	);

	return {
		autoModulate: getById(root, "autoModulate", HTMLInputElement),
		chordText: getById(root, "chordText", HTMLSpanElement),
		keyText: getById(root, "keyText", HTMLSpanElement),
		menuButton: getById(root, "menuButton", HTMLButtonElement),
		roll: getById(root, "roll", HTMLDivElement),
		rootSlider: getById(root, "rootSlider", HTMLInputElement),
		rootValue: getById(root, "rootValue", HTMLDivElement),
		trackToggleInputs,
		transportButton: getById(root, "transportButton", HTMLButtonElement),
		uiPanel: getById(root, "uiPanel", HTMLDivElement),
		viewport: getById(root, "rollViewport", HTMLDivElement),
	};
}

export function syncTrackInputs(inputs: Record<TrackName, HTMLInputElement>, trackState: TrackEnabledState): void {
	for (const track of TRACKS) {
		inputs[track.name].checked = trackState[track.name];
	}
}

function getById<T extends HTMLElement>(root: ParentNode, id: string, type: { new (): T }): T {
	const element = root.querySelector(`#${id}`);

	if (!(element instanceof type)) {
		throw new Error(`The required element #${id} is missing.`);
	}

	return element;
}
