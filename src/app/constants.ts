import type { TrackEnabledState, TrackName } from "./types";

export interface TrackDefinition {
	cssClass: TrackName;
	label: string;
	name: TrackName;
}

export const INITIAL_KEY = 48;
export const INITIAL_SCROLL_TOP = 500;
export const BPM = 132;
export const TIME_SIGNATURE = 4;
export const NOTE_HEIGHT = 14;
export const PIXELS_PER_BEAT = 120;
export const TOTAL_NOTES = 96;
export const GRID_BEATS = 5000;

export const TRACKS: readonly TrackDefinition[] = [
	{ name: "strings", label: "STRINGS", cssClass: "strings" },
	{ name: "brass", label: "BRASS", cssClass: "brass" },
	{ name: "wood", label: "WOOD", cssClass: "wood" },
	{ name: "lead", label: "LEAD", cssClass: "lead" },
	{ name: "arp", label: "ARP", cssClass: "arp" },
	{ name: "bass", label: "BASS", cssClass: "bass" },
	{ name: "drums", label: "DRUMS", cssClass: "drums" },
] as const;

export function createInitialTrackState(): TrackEnabledState {
	return TRACKS.reduce<TrackEnabledState>(
		(state, track) => {
			state[track.name] = true;
			return state;
		},
		{
			strings: true,
			brass: true,
			wood: true,
			lead: true,
			arp: true,
			bass: true,
			drums: true,
		},
	);
}
