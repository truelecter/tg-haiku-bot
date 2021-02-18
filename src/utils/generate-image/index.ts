import sharp from 'sharp';

import { ILogger } from '../../logger';

import generateQuote from './generate-quote';
import { normalizeColor } from './color-utils';
import { Message } from './common-types';

export interface IImageGeneratorParams {
	logger: ILogger;
	message: Message;
	backgroundColor?: string;
	width?: number;
	height?: number;
	scale?: number;
}

export const generateImage = async (param: IImageGeneratorParams): Promise<Buffer> => {
	const {
		logger,
		message,
		backgroundColor: rawBackground,
		height,
		scale,
		width,
	} = param;

	const backgroundColor = normalizeColor(rawBackground);

	logger.verbose('Started generating quote');

	const canvasQuote = await generateQuote({
		backgroundColor,
		message,
		width,
		height,
		scale,
		logger,
	});

	const maxWidth = 512;
	const maxHeight = 512;

	const imageQuoteSharp = sharp(canvasQuote.toBuffer());
	const { height: canvasHeight, width: canvasWidth } = canvasQuote;

	if (canvasHeight > maxHeight) {
		logger.verbose(`Canvas height ${canvasWidth} exceeds limit of ${maxHeight}. Resizing...`);
		imageQuoteSharp.resize({ height: maxHeight });
	}

	if (canvasWidth > maxWidth) {
		logger.verbose(`Canvas width ${canvasWidth} exceeds limit of ${maxHeight}. Resizing...`);
		imageQuoteSharp.resize({ width: maxWidth });
	}

	return imageQuoteSharp.webp({ lossless: true, force: true }).toBuffer();
};
