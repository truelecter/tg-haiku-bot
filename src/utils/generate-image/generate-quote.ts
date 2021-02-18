import { Canvas, createCanvas, Image } from 'canvas';
import runes from 'runes';
import LRU from 'lru-cache';

import { ILogger } from '../../logger';

import loadCanvasImage from './load-canvas-image';
import { drawRoundRect, drawMultilineText, drawAvatar } from './drawing-utils';
import { isLight, getUserColor, getUserAvatarColor } from './color-utils';
import { downloadTelegramAvatarImage } from './telegram-avatar-utils';
import { Message, MessageAuthor } from './common-types';

const avatarCache = new LRU<number, Image>({
	max: 20,
	maxAge: 1000 * 60 * 5
});

const generateTextAvatarImage = async (user: MessageAuthor): Promise<Image> => {
	let nameLetters: string;

	if (user.first_name && user.last_name) {
		nameLetters = runes(user.first_name)[0] + runes(user.last_name || '')[0];
	} else {
		const nameWord = (user.first_name || user.username || 'unkekfined').toUpperCase().split(' ');

		if (nameWord.length > 1) {
			nameLetters = runes(nameWord[0])[0] + runes(nameWord.splice(-1)[0])[0];
		} else {
			[nameLetters] = runes(nameWord[0]);
		}
	}

	const avatarColor = getUserAvatarColor(user.id);

	const size = 500;
	const canvas = createCanvas(size, size);
	const context = canvas.getContext('2d');

	context.fillStyle = avatarColor || `#${(Math.random() * 0xFFFFFF << 0).toString(16)}`;
	context.fillRect(0, 0, canvas.width, canvas.height);

	const drawLetters = await drawMultilineText({
		text: nameLetters,
		fontSize: size / 2,
		fontColor: '#FFF',
		textX: 0,
		textY: size,
		maxWidth: size * 5,
		maxHeight: size * 5,
	});
	context.drawImage(drawLetters, (canvas.width - drawLetters.width) / 2, (canvas.height - drawLetters.height) / 1.5);

	return loadCanvasImage(canvas.toBuffer());
};

const getUserAvatarImage = async (user: MessageAuthor): Promise<Image> => {
	const cacheKey = user.id;
	const avatarImageCache = avatarCache.get(cacheKey);

	if (avatarImageCache) {
		return avatarImageCache;
	}

	let avatarImage;

	try {
		avatarImage = await downloadTelegramAvatarImage(user);
	} catch (e) {
		avatarImage = await generateTextAvatarImage(user);
	}

	return avatarImage;
};

interface DrawQuoteParams {
	scale: number;
	backgroundColor: string;
	avatar?: Canvas;
	name?: Canvas;
	text?: Canvas;
}

const drawQuote = async (
	{
		scale = 1,
		backgroundColor,
		avatar,
		name,
		text
	}: DrawQuoteParams,
) => {
	const blockPosX = 55 * scale;
	const blockPosY = 0;

	const indent = 15 * scale;

	const avatarPosX = 0;
	const avatarPosY = 15;
	const avatarSize = 50 * scale;

	let width = 0;
	if (name) width = name.width;
	if (text && width < text.width) width = text.width + indent;

	let height = indent;
	if (text) height += text.height;
	else height += indent;

	if (name) {
		height = name.height;

		if (text) {
			height += text.height;
		} else {
			height += indent;
		}
	}

	width += blockPosX + (indent * 2);
	height += blockPosY;

	let namePosX = blockPosX + indent;
	let namePosY = indent;

	if (!name) {
		namePosX = 0;
		namePosY = -indent;
	}

	const textPosX = blockPosX + indent;
	let textPosY = indent;

	if (name) {
		textPosY = name.height;
	}

	const rectWidth = width - blockPosX;
	const rectPosX = blockPosX;
	const rectPosY = blockPosY;
	const rectRoundRadius = 25 * scale;

	const canvas = createCanvas(width, height);
	const canvasCtx = canvas.getContext('2d');

	if (avatar) {
		canvasCtx.drawImage(avatar, avatarPosX, avatarPosY, avatarSize, avatarSize);
	}

	if (name) {
		const rect = drawRoundRect(backgroundColor, rectWidth, height, rectRoundRadius);

		canvasCtx.drawImage(rect, rectPosX, rectPosY);
		canvasCtx.drawImage(name, namePosX, namePosY);
	}

	if (text) {
		canvasCtx.drawImage(text, textPosX, textPosY);
	}

	return canvas;
};

interface GenerateQuoteParams {
	backgroundColor: string;
	message: Message;
	width?: number;
	height?: number;
	scale?: number;
	logger: ILogger;
}

export default async (
	{
		backgroundColor,
		message,
		width: rawWidth = 512,
		height: rawHeight = 512,
		scale: rawScale = 2,
		logger,
	}: GenerateQuoteParams,
): Promise<Canvas> => {
	if (rawScale <= 0) {
		throw new TypeError('Scale cannot be less than or equal zero');
	}

	const scale = Math.min(rawScale, 20);
	const width = rawWidth * scale;
	const height = rawHeight * scale;
	const isBackgroundLight = isLight(backgroundColor);

	let nameCanvas: Canvas | undefined;
	if (message.from) {
		logger.verbose('Started drawing name');
		const nameColor = getUserColor(message.chatId ?? 1, isBackgroundLight);
		const nameSize = 22 * scale;

		const { first_name: firstName, username, last_name: lastName } = message.from;

		let name: string;

		if (firstName && lastName) {
			name = `${firstName} ${lastName}`;
		} else if (username) {
			name = username;
		} else {
			name = 'Anonymous';
		}

		nameCanvas = await drawMultilineText({
			text: name,
			entities: 'bold',
			fontSize: nameSize,
			fontColor: nameColor,
			textX: 0,
			textY: nameSize,
			maxWidth: width,
			maxHeight: nameSize
		});
		logger.verbose('Finished drawing name');
	}

	let textCanvas: Canvas | undefined;
	if (message.text) {
		logger.verbose('Started drawing message');
		const fontSize = 24 * scale;
		const textColor = isBackgroundLight
			? '#000'
			: '#fff';

		textCanvas = await drawMultilineText({
			text: message.text,
			entities: message.entities,
			fontSize,
			fontColor: textColor,
			textX: 0,
			textY: fontSize,
			maxWidth: width,
			maxHeight: height - fontSize
		});
		logger.verbose('Finished drawing message');
	}

	let avatarCanvas: Canvas | undefined;
	if (message.avatar) {
		logger.verbose('Started drawing avatar');
		const avatarImage = await getUserAvatarImage(message.from);
		logger.verbose('Received avatar image');
		avatarCanvas = await drawAvatar(avatarImage);
		logger.verbose('Finished drawing avatar');
	}

	return drawQuote(
		{
			scale, backgroundColor, avatar: avatarCanvas, name: nameCanvas, text: textCanvas
		},
	);
};
