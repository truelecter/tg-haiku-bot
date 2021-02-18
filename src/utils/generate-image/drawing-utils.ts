import { Canvas, createCanvas, Image } from 'canvas';
import EmojiDbLib from 'emoji-db';

import getEmojiImageText from './emoji-image';
import loadCanvasImage from './load-canvas-image';

const emojiDb = new EmojiDbLib({ useDefaultDb: true });

export function drawAvatar(avatarImage: Image): Canvas {
	const avatarSize = avatarImage.naturalHeight;

	const canvas = createCanvas(avatarSize, avatarSize);
	const canvasCtx = canvas.getContext('2d');

	const avatarX = 0;
	const avatarY = 0;

	canvasCtx.beginPath();
	canvasCtx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
	canvasCtx.clip();
	canvasCtx.closePath();
	canvasCtx.restore();
	canvasCtx.drawImage(avatarImage, avatarX, avatarY, avatarSize, avatarSize);

	return canvas;
}

export function drawReplyLine(lineWidth: number, height: number, color: string): Canvas {
	const canvas = createCanvas(20, height);
	const context = canvas.getContext('2d');
	context.beginPath();
	context.moveTo(10, 0);
	context.lineTo(10, height);
	context.lineWidth = lineWidth;
	context.strokeStyle = color;
	context.stroke();

	return canvas;
}

export function drawRoundRect(color: string, w: number, h: number, rawRadius: number): Canvas {
	const x = 0;
	const y = 0;
	let r = rawRadius;

	const canvas = createCanvas(w, h);
	const canvasCtx = canvas.getContext('2d');

	canvasCtx.fillStyle = color;

	if (w < 2 * r) {
		r = w / 2;
	}

	if (h < 2 * r) {
		r = h / 2;
	}

	canvasCtx.beginPath();
	canvasCtx.moveTo(x + r, y);
	canvasCtx.arcTo(x + w, y, x + w, y + h, r);
	canvasCtx.arcTo(x + w, y + h, x, y + h, r);
	canvasCtx.arcTo(x, y + h, x, y, r);
	canvasCtx.arcTo(x, y, x + w, y, r);
	canvasCtx.closePath();

	canvasCtx.fill();

	return canvas;
}

export function makeImageRound(image: Image, rawRadius: number): Canvas {
	const w = image.width;
	const h = image.height;
	let r = rawRadius;

	const canvas = createCanvas(w, h);
	const canvasCtx = canvas.getContext('2d');

	const x = 0;
	const y = 0;

	if (w < 2 * r) {
		r = w / 2;
	}
	if (h < 2 * r) {
		r = h / 2;
	}

	canvasCtx.beginPath();
	canvasCtx.moveTo(x + r, y);
	canvasCtx.arcTo(x + w, y, x + w, y + h, r);
	canvasCtx.arcTo(x + w, y + h, x, y + h, r);
	canvasCtx.arcTo(x, y + h, x, y, r);
	canvasCtx.arcTo(x, y, x + w, y, r);
	canvasCtx.clip();
	canvasCtx.closePath();
	canvasCtx.restore();
	canvasCtx.drawImage(image, x, y);

	return canvas;
}

type MessageEntityType = 'bold' | 'italic' | 'strikethrough' | 'underline' | 'pre' | 'code' | 'mention'
| 'text_mention' | 'hashtag' | 'email' | 'phone_number' | 'bot_command' | 'url' | 'text_link';

interface IMessageEntity {
	type: MessageEntityType;
	offset: number;
	length: number;
}

interface DrawMultilineTextParams {
	text: string;
	entities?: string | IMessageEntity[];
	fontSize: number;
	fontColor: string;
	textX: number;
	textY: number;
	maxWidth: number;
	maxHeight: number;
}

export const drawMultilineText = async ({
	text,
	entities,
	fontSize,
	fontColor,
	textX,
	textY,
	maxWidth: rawMaxWidth,
	maxHeight: rawMaxHeight
}: DrawMultilineTextParams): Promise<Canvas> => {
	const maxWidth = Math.min(rawMaxWidth, 10_000);
	const maxHeight = Math.min(rawMaxHeight, 10_000);
	const canvas = createCanvas(maxWidth + fontSize, maxHeight + fontSize);
	const canvasCtx = canvas.getContext('2d');

	const chars = text
		.slice(0, 4096)
		.replace(/і/g, 'i')
		.split('');

	const lineHeight = 4 * (fontSize * 0.3);

	const styledChar = [];

	const emojis = emojiDb.searchFromText({ input: text, fixCodePoints: true });

	for (let charIndex = 0; charIndex < chars.length; charIndex++) {
		const char = chars[charIndex];

		styledChar[charIndex] = {
			char,
			style: []
		};

		if (entities && typeof entities === 'string') {
			styledChar[charIndex].style.push(entities);
		}
	}

	if (entities && Array.isArray(entities)) {
		for (const entity of entities) {
			const style = [];

			if (entity.type === 'bold') style.push('bold');
			if (entity.type === 'italic') style.push('italic');
			if (entity.type === 'strikethrough') style.push('strikethrough');
			if (entity.type === 'underline') style.push('underline');
			if (['pre', 'code'].includes(entity.type)) {
				style.push('monospace');
			}
			if (['mention', 'text_mention', 'hashtag', 'email', 'phone_number', 'bot_command', 'url', 'text_link'].includes(entity.type)) {
				style.push('mention');
			}

			for (let charIndex = entity.offset; charIndex < entity.offset + entity.length; charIndex++) {
				styledChar[charIndex].style = styledChar[charIndex].style.concat(style);
			}
		}
	}

	for (let emojiIndex = 0; emojiIndex < emojis.length; emojiIndex++) {
		const emoji = emojis[emojiIndex];

		for (let charIndex = emoji.offset; charIndex < emoji.offset + emoji.length; charIndex++) {
			styledChar[charIndex].emoji = {
				index: emojiIndex,
				code: emoji.found,
			};
		}
	}

	const styledWords = [];

	let stringNum = 0;

	const breakMatch = /<br>|\n|\r/;
	const spaceMatch = /[\f\n\r\t\v\u0020\u1680\u2000-\u200a\u2028\u2029\u205f\u3000]/;

	for (let index = 0; index < styledChar.length; index++) {
		const charStyle = styledChar[index];
		const lastChar = styledChar[index - 1];

		if (
			lastChar && (
				(
					(charStyle.emoji && !lastChar.emoji)
					|| (!charStyle.emoji && lastChar.emoji)
					|| (charStyle.emoji && lastChar.emoji && charStyle.emoji.index !== lastChar.emoji.index)
				)
				|| (
					(charStyle.char.match(breakMatch))
					|| (charStyle.char.match(spaceMatch) && !lastChar.char.match(spaceMatch))
					|| (lastChar.char.match(spaceMatch) && !charStyle.char.match(spaceMatch))
					|| (
						charStyle.style
						&& lastChar.style
						&& charStyle.style.toString() !== lastChar.style.toString()
					)
				)
			)
		) {
			stringNum++;
		}

		if (!styledWords[stringNum]) {
			styledWords[stringNum] = {
				word: charStyle.char
			};

			if (charStyle.style) styledWords[stringNum].style = charStyle.style;
			if (charStyle.emoji) styledWords[stringNum].emoji = charStyle.emoji;
		} else styledWords[stringNum].word += charStyle.char;
	}

	let lineX = textX;
	let lineY = textY;

	let textWidth = 0;

	let breakWrite = false;
	for (let index = 0; index < styledWords.length; index++) {
		const styledWord = styledWords[index];

		let emojiImage;

		if (styledWord.emoji) {
			const emoji = await getEmojiImageText(styledWord.emoji.code);

			if (emoji) {
				emojiImage = await loadCanvasImage(Buffer.from(emoji, 'base64'));
			} else {
				const emojiDataDir = 'assets/emojis/';
				const emojiPng = `${emojiDataDir}${styledWord.emoji.code}.png`;

				try {
					emojiImage = await loadCanvasImage(emojiPng);
				} catch (error) {
					console.log('Unable to load emoji', error);
				}
			}
		}

		let fontType = '';
		let fontName = 'SF-Pro-Text, SF-Pro';
		let fillStyle = fontColor;

		if (styledWord.style.includes('bold')) {
			fontType += 'bold ';
		}
		if (styledWord.style.includes('italic')) {
			fontType += 'italic ';
		}
		if (styledWord.style.includes('monospace')) {
			fontName = 'SF-Mono, SF-Pro';
			fillStyle = '#5887a7';
		}
		if (styledWord.style.includes('mention')) {
			fillStyle = '#6ab7ec';
		}

		canvasCtx.font = `${fontType} ${fontSize}px ${fontName}`;
		canvasCtx.fillStyle = fillStyle;

		if (canvasCtx.measureText(styledWord.word).width > maxWidth - fontSize * 3) {
			while (canvasCtx.measureText(styledWord.word).width > maxWidth - fontSize * 3) {
				styledWord.word = styledWord.word.substr(0, styledWord.word.length - 1);
				if (styledWord.word.length <= 0) break;
			}
			styledWord.word += '…';
		}

		let lineWidth: number;
		const wordWidth = canvasCtx.measureText(styledWord.word).width;

		if (styledWord.emoji) {
			lineWidth = lineX + fontSize;
		} else {
			lineWidth = lineX + wordWidth;
		}

		if (styledWord.word.match(breakMatch) || (lineWidth > maxWidth - fontSize * 2 && wordWidth < maxWidth)) {
			if (styledWord.word.match(spaceMatch) && !styledWord.word.match(breakMatch)) styledWord.word = '';
			if (
				(styledWord.word.match(spaceMatch) || !styledWord.word.match(breakMatch))
				&& lineY + lineHeight > maxHeight
			) {
				while (lineWidth > maxWidth - fontSize * 2) {
					styledWord.word = styledWord.word.substr(0, styledWord.word.length - 1);
					lineWidth = lineX + canvasCtx.measureText(styledWord.word).width;
					if (styledWord.word.length <= 0) break;
				}

				styledWord.word += '…';
				lineWidth = lineX + canvasCtx.measureText(styledWord.word).width;
				breakWrite = true;
			} else {
				if (styledWord.emoji) lineWidth = textX + fontSize + (fontSize * 0.15);
				else lineWidth = textX + canvasCtx.measureText(styledWord.word).width;

				lineX = textX;
				lineY += lineHeight;
			}
		}

		if (lineWidth > textWidth) textWidth = lineWidth;
		if (textWidth > maxWidth) textWidth = maxWidth;

		if (emojiImage) {
			canvasCtx.drawImage(emojiImage, lineX, lineY - fontSize + (fontSize * 0.15), fontSize, fontSize);
		} else {
			canvasCtx.fillText(styledWord.word, lineX, lineY);

			if (styledWord.style.includes('strikethrough')) {
				canvasCtx.fillRect(
					lineX,
					lineY - fontSize / 2.8, canvasCtx.measureText(styledWord.word).width,
					fontSize * 0.1
				);
			}
			if (styledWord.style.includes('underline')) {
				canvasCtx.fillRect(
					lineX,
					lineY + 2, canvasCtx.measureText(styledWord.word).width,
					fontSize * 0.1
				);
			}
		}

		lineX = lineWidth;

		if (breakWrite) break;
	}

	const canvasResize = createCanvas(textWidth, lineY + fontSize);
	const canvasResizeCtx = canvasResize.getContext('2d');

	canvasResizeCtx.drawImage(canvas, 0, 0);

	return canvasResize;
};
