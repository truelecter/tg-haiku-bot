import { createCanvas } from 'canvas';
import sharp from 'sharp';

import generateQuote from './generate-quote';
import loadCanvasImage from './load-canvas-image';
import { normalizeColor } from './color-utils';
import { Message } from './common-types';

export interface IImageGeneratorParams {
	message: Message;
	backgroundColor?: string;
	width?: number;
	height?: number;
	scale?: number;
}

export type ImageGenerationResult = {
	image: Buffer;
	width: number;
	height: number;
};

export const generateImage = async (parm: IImageGeneratorParams): Promise<ImageGenerationResult> => {
	const backgroundColor = normalizeColor(parm.backgroundColor);

	const canvasQuote = await generateQuote({
		backgroundColor,
		message: parm.message,
		rawWidth: parm.width,
		rawHeight: parm.height,
		rawScale: parm.scale
	});

	const downPadding = 75;
	const maxWidth = 512;
	const maxHeight = 512;

	const imageQuoteSharp = sharp(canvasQuote.toBuffer());

	if (canvasQuote.height > canvasQuote.width) {
		imageQuoteSharp.resize({ height: maxHeight });
	} else {
		imageQuoteSharp.resize({ width: maxWidth });
	}

	const canvasImage = await loadCanvasImage(await imageQuoteSharp.toBuffer());

	const canvasPadding = createCanvas(canvasImage.width, canvasImage.height + downPadding);
	const canvasPaddingCtx = canvasPadding.getContext('2d');

	canvasPaddingCtx.drawImage(canvasImage, 0, 0);

	const imageSharp = sharp(canvasPadding.toBuffer());

	if (canvasPadding.height >= canvasPadding.width) {
		imageSharp.resize({ height: maxHeight });
	} else {
		imageSharp.resize({ width: maxWidth });
	}

	const image = await imageSharp.webp({ lossless: true, force: true }).toBuffer();

	const { width, height } = await sharp(image).metadata();

	return {
		image,
		width,
		height
	};
};
