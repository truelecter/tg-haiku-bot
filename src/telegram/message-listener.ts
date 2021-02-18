import { Context } from 'telegraf';

import { getHaiku } from '../utils/haiku';
import { generateImage } from '../utils/generate-image';

export default async (context: Context): Promise<void> => {
	const mc = context.update[context.updateType];
	const { text, caption, entities } = mc;

	const messageText = text || caption;

	const haiku = getHaiku(messageText);

	if (!haiku) {
		return;
	}

	const { image } = await generateImage({
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

	await context.replyWithSticker({
		source: image,
	}, {
		reply_to_message_id: mc.message_id
	});
};
