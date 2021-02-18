import { Context } from 'telegraf';

import { getHaiku } from '../utils/haiku';
import { generateImage } from '../utils/generate-image';
import mainLogger from '../logger';

export default async (context: Context, next: () => Promise<void>): Promise<void> => {
	const logger = mainLogger.child({
		updateId: context.update.update_id,
	});

	logger.verbose('Started processing');

	const mc = context.update[context.updateType];
	const { text, caption, entities } = mc;

	const messageText = text || caption;

	const haiku = getHaiku(messageText);

	if (!haiku) {
		return;
	}

	logger.verbose('Generating image...');

	const image = await generateImage({
		logger,
		message: {
			entities,
			avatar: true,
			from: context.from,
			text: haiku
		},
		backgroundColor: '#1b1429',
		width: 512,
		height: 512,
		scale: 2,
	});

	logger.verbose('Replying with generated sticker');

	await context.replyWithSticker({
		source: image,
	}, {
		reply_to_message_id: mc.message_id
	});

	logger.verbose('Finished processing');

	await next();
};
