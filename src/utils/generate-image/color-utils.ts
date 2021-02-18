import { createCanvas } from 'canvas';

export const normalizeColor = (rawColor: string): string => {
	const canvas = createCanvas(0, 0);
	const canvasCtx = canvas.getContext('2d');

	canvasCtx.fillStyle = rawColor;

	return canvasCtx.fillStyle;
};

const addLight = (color: string, amount: number): string => {
	const cc = parseInt(color, 16) + amount;
	const c = (cc > 255) ? 255 : (cc);

	if (c.toString(16).length > 1) {
		return c.toString(16);
	}

	return `0${c.toString(16)}`;
};

export const lighten = (rawColor: string, rawAmount: number): string => {
	const color = (rawColor.indexOf('#') >= 0) ? rawColor.substring(1, rawColor.length) : rawColor;
	const amount = Math.floor((255 * rawAmount) / 100); // TODO may be error? parseInt(, 10)

	return `#${addLight(color.substring(0, 2), amount)}${addLight(color.substring(2, 4), amount)}${addLight(color.substring(4, 6), amount)}`;
};

// https://codepen.io/andreaswik/pen/YjJqpK
export const isLight = (color: string): boolean => {
	let r: number;
	let g: number;
	let b: number;

	// Check the format of the color, HEX or RGB?
	if (color.match(/^rgb/)) {
		// If HEX --> store the red, green, blue values in separate variables
		const [, rR, gR, bR] = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);

		r = parseInt(rR, 10);
		g = parseInt(gR, 10);
		b = parseInt(bR, 10);
	} else {
		// If RGB --> Convert it to HEX: http://gist.github.com/983661
		const colorInt = parseInt(`0x${color.slice(1).replace(color.length < 5 && /./g, '$&$&')}`, 16);

		r = colorInt >> 16;
		g = (colorInt >> 8) & 255;
		b = colorInt & 255;
	}

	// HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
	const hsp = Math.sqrt(
		0.299 * (r * r)
		+ 0.587 * (g * g)
		+ 0.114 * (b * b)
	);

	// Using the HSP value, determine whether the color is light or dark
	return hsp > 127.5;
};

// eslint-disable-next-line max-len
// https://github.com/telegramdesktop/tdesktop/blob/67d08c2d4064e04bec37454b5b32c5c6e606420a/Telegram/SourceFiles/data/data_peer.cpp#L43
type Palette = {
	dark: string;
	light: string;
	avatar: string;
};

const userColorPalettes = [
	{ dark: '#fb6169', light: '#862a23', avatar: '#c03d33' },
	{ dark: '#85de85', light: '#37791f', avatar: '#4fad2d' },
	{ dark: '#f3bc5c', light: '#916604', avatar: '#d09306' },
	{ dark: '#65bdf3', light: '#0f608f', avatar: '#168acd' },
	{ dark: '#b48bf2', light: '#5d2f95', avatar: '#8544d6' },
	{ dark: '#ff5694', light: '#8f2c50', avatar: '#cd4073' },
	{ dark: '#62d4e3', light: '#1c6979', avatar: '#2996ad' },
	{ dark: '#faa357', light: '#904812', avatar: '#ce671b' },
] as Palette[];

const nameMap = [0, 7, 4, 1, 6, 3, 5];

const getUserPaletteById = (userId: number): Palette => {
	const nameIndex = Math.max(0, Math.min(Math.floor(userId), 7));
	const nameColorIndex = nameMap[nameIndex];

	return userColorPalettes[nameColorIndex];
};

export const getUserAvatarColor = (index: number): string => getUserPaletteById(index).avatar;

export const getUserColor = (index: number, light: boolean): string => {
	const palette = getUserPaletteById(index);

	return light
		? palette.light
		: palette.dark;
};
