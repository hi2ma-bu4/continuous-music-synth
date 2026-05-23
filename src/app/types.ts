export type TrackName = "strings" | "brass" | "wood" | "lead" | "arp" | "bass" | "drums";

export type TrackEnabledState = Record<TrackName, boolean>;

export interface MelodyEvent {
	beat: number;
	duration: number;
	note: number;
}

export interface BarContext {
	barCounter: number;
	chord: number[];
	chordName: string;
	currentKey: number;
	kime: boolean;
	kimeBeat: number;
}

export interface BarStateSnapshot {
	chordName: string;
	currentKey: number;
}

export interface UiSnapshot extends BarStateSnapshot {
	autoModulate: boolean;
	keyName: string;
	playing: boolean;
}
