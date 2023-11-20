import { getAudioContext, getAudioData, playAudioData } from './mod.mjs'

/** @type {import("./mod.mjs").GetAudioDataParams} */
const params = {
	sampleRate: getAudioContext().sampleRate,
	speed: 0.6,
	pitchShift: 0,
	volume: 0.01,
	parts: {
		melody: {
			waveForm: 'triangle',
			volume: 2,
			fade: 0.6,
			notes: `
				                                  G4 ~  |
				| C5 ~  C5 D5 C5 B4 | A4 ~  F4 ~  A4 ~  |
				| D5 ~  D5 E5 D5 C5 | B4 ~  G4 ~  B4 ~  |
				| E5 ~  E5 F5 E5 D5 | C5 ~  A4 ~  G4 G4 |
				| A4 ~  D5 ~  B4 ~  | C5 ~  ~  ~  ~  ~  |
			`,
		},
		harmony: {
			waveForm: 'square',
			volume: 0.2,
			fade: 0.2,
			notes: `
				                                  G1 ~  |
				| C3 ~  ~  ~  ~  ~  | F3 ~  ~  ~  ~  ~  |
				| G3 ~  F#3~  G3 ~  | E3 ~  ~  ~  ~  ~  |
				| A3 ~  ~  ~  ~  ~  | F3 ~  ~  ~  ~  ~  |
				| G3 ~  F3 ~  E3 ~  | C3 ~  ~  ~  ~  ~  |
			`,
		},
		percussion: {
			waveForm: 'whiteNoise',
			volume: 0.3,
			fade: 0.9,
			notes: `
				                                  .  .  |
				| X  .  X  X  X  .  | X  .  X  .  X  .  |
				| X  .  X  X  X  .  | X  .  X  .  X  .  |
				| X  .  X  X  X  .  | X  .  X  .  X  .  |
				| X  X  X  .  X  .  | X  .  X  X  X  ~  |
				| ~
			`,
		},
	},
}

playAudioData(getAudioData(params))
