// @ts-check
/// <reference lib="dom" />

/**
 * Get default AudioContext.
 * Browser only.
 */
export const getAudioContext = (() => {
	/** @type {AudioContext | null} */
	let ac = null
	return () => {
		if (!ac) ac = new AudioContext()
		return ac
	}
})()

/**
 * Play audio data.
 * Browser only.
 *
 * @param {Float32Array} audioData
 * @param {AudioContext} [audioContext]
 */
export function playAudioData(audioData, audioContext = getAudioContext()) {
	const buffer = audioContext.createBuffer(1, audioData.length, audioContext.sampleRate)
	const source = audioContext.createBufferSource()

	buffer.copyToChannel(audioData, 0)

	source.buffer = buffer
	source.connect(audioContext.destination)
	source.start(0)

	return {
		stop: source.stop.bind(source),
		finished: new Promise((res) => source.addEventListener('ended', res)),
	}
}

/**
 * @typedef {{
 * 	sampleRate: number
 * 	parts: Record<string, Part>
 * 	speed?: number
 * 	volume?: number
 * 	pitchShift?: number
 * }} GetAudioDataParams
 */

/**
 * @typedef {{
 * 	notes: string
 * 	waveForm?: WaveForm
 * 	volume?: number
 * 	fade?: number
 * }} Part
 */

/**
 * Get audio data from parts specified as strings.
 *
 * @param {GetAudioDataParams} params
 *
 * @example
 *
 * getAudioData({
 * 	sampleRate: getAudioContext().sampleRate,
 * 	parts: {
 * 		melody: { notes: "G4~ G4 A4~~ G4~~ C5~~ B4~~~~~" },
 * 	},
 * }) => Float32Array<"happy birthday to you...">
 */
export function getAudioData({ parts, speed, pitchShift, volume, sampleRate }) {
	const semitoneModifier = pitchShift ?? 0
	const volumeModifier = volume ?? 1
	const speedModifier = speed ?? 1

	const durationMultiplierSeconds = 0.1
	const octaveMultiplier = 2
	const semitoneMultiplier = octaveMultiplier ** (1 / 12)

	const A = 440
	const scale = Object.fromEntries(
		Object.entries({
			C: -9,
			D: -7,
			E: -5,
			F: -4,
			G: -2,
			A: 0,
			B: 2,
		}).map(([k, v]) => [k, A * semitoneMultiplier ** v]),
	)

	/** @param {string} noteStr */
	function parse(noteStr) {
		return [
			...noteStr.matchAll(
				/(?<letter>[A-Ga-gX_.])(?<modifier>[#b])?(?<octave>\d+)?([\s|]*)(?<length>(?:[~\-][\s|]*)*)/gu,
			),
		].map((x) => {
			const { letter, octave: o, modifier, length } = /** @type {Record<string, string>} */ (x.groups)
			const octave = Number(o ?? 4) + (semitoneModifier / 12)
			const duration = (([...length.matchAll(/[~\-]/g)].length) + 1) /
				speedModifier

			let hz

			if (letter === '_' || letter === '.') {
				hz = 0
			} else if (letter === 'X') {
				hz = 1
			} else {
				hz = scale[letter]
				hz *= modifier === '#' ? semitoneMultiplier : modifier === 'b' ? 1 / semitoneMultiplier : 1
				hz *= octaveMultiplier ** (octave - 4)
			}

			return { hz, duration }
		})
	}

	const partData = Object.values(parts).map((x) => {
		const fn = waveForms[x.waveForm ?? 'sine']
		const noteStr = x.notes
		const volume = (x.volume ?? 1) * volumeModifier
		const fade = x.fade ?? 0

		const audioDatas = parse(noteStr).map(({ hz, duration }) => {
			const seconds = duration * durationMultiplierSeconds
			return getNote({ volume, seconds, hz, fn, fade, sampleRate })
		})

		return concat([new Float32Array(12e3), ...audioDatas])
	})

	return multiplex(partData)
}

/** @typedef {'sine' | 'square' | 'sawtooth' | 'triangle' | 'whiteNoise'} WaveForm */

/** @type {Record<WaveForm, WaveFormFn>} */
const waveForms = (() => {
	// Modified from https://stackoverflow.com/questions/3399925/actionscript-creating-square-triangle-sawtooth-waves-from-math-sin

	/** @param {number} n */
	const sawtooth = (n) => (n - Math.floor(n + 1 / 2)) * 2

	return {
		sine: (x) => Math.sin(x / (1 / (Math.PI * 2))),
		square: (x) => Math.sign(Math.sin(2 * Math.PI * x)),
		sawtooth,
		triangle: (x) => 1 - Math.abs(sawtooth(x - 1 / 4)) * 2,
		whiteNoise: (x) => x === 0 ? 0 : 2 * (Math.random() - 0.5),
	}
})()

/** @param {Float32Array[]} audioDatas */
function concat(audioDatas) {
	const length = audioDatas.reduce((total, arr) => total + arr.length, 0)
	const out = new Float32Array(length)

	let i = 0
	for (const audioData of audioDatas) {
		out.set(audioData, i)
		i += audioData.length
	}

	return out
}

/** @typedef {(n: number) => number} WaveFormFn */

/**
 * @typedef {{
 * 	sampleRate: number
 * 	volume?: number
 * 	seconds: number
 * 	hz: number
 * 	fn: WaveFormFn
 * 	fade?: number
 * }} GetNoteParams
 */

/** * @param {GetNoteParams} params */
function getNote({ volume, seconds, hz, fn, fade, sampleRate }) {
	const sampleFreq = sampleRate / hz
	const length = Math.floor(sampleRate * seconds)

	return Float32Array.from({
		length,
	}, (_, i) => fn(i / sampleFreq) * (volume ?? 1) * (1 - (i / length * (fade ?? 0))))
}

/** @param {Float32Array[]} audioDatas */
function multiplex(audioDatas) {
	const length = Math.max(...audioDatas.map((x) => x.length))
	const out = new Float32Array(length)
	for (let i = 0; i < length; ++i) {
		for (const x of audioDatas) {
			out[i] += x[i] ?? 0
		}
	}

	return out
}
