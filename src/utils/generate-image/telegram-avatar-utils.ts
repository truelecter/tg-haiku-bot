import { Image } from 'canvas';
import { URL } from 'url';

import loadCanvasImage from './load-canvas-image';
import { getTelegrafInstance } from '../config';
import { MessageAuthor } from './common-types';

export const downloadTelegramAvatarImage = async (user: MessageAuthor): Promise<Image> => {
	let userPhotoUrl: URL | string;

	if (!userPhotoUrl) {
		const chat = await getTelegrafInstance().telegram.getChat(user.id);
		let userPhoto;

		if (chat && chat.photo && chat.photo.big_file_id) {
			userPhoto = chat.photo.big_file_id;
		}

		if (userPhoto) {
			userPhotoUrl = await getTelegrafInstance().telegram.getFileLink(userPhoto);
		} else if (user.username) {
			userPhotoUrl = `https://telega.one/i/userpic/320/${user.username}.jpg`;
		} else {
			throw new Error('User has no avatar available');
		}
	}

	if (userPhotoUrl) {
		if (typeof userPhotoUrl === 'string') {
			return loadCanvasImage(userPhotoUrl);
		}

		return loadCanvasImage(userPhotoUrl.toString());
	}

	throw new Error('User has no avatar available');
};
