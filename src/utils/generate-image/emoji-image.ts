import { resolve as pathResolve } from 'path';
import { readFile, existsSync } from 'fs';
import { promisify } from 'util';

const readFileAsync = promisify(readFile);

export type EmojiType = string;
export type EmojiJSON = Record<EmojiType, string>;

let emojiImageJson: EmojiJSON = {};
let loaded = false;

async function loadFile() {
	const emojiJsonFilePath = pathResolve(__dirname, '../../../../assets/emoji-image.json');

	try {
		if (existsSync(emojiJsonFilePath)) {
			emojiImageJson = JSON.parse(await readFileAsync(emojiJsonFilePath, 'utf-8'));
		} else {
			console.error(`${emojiJsonFilePath} does not exist!`);
		}
		loaded = true;
	} catch (e) {
		console.error('Unable to read emojis json: ', e);
	}
}

export default async (emojiName: string): Promise<string | undefined> => {
	if (!loaded) {
		await loadFile();
	}

	return emojiImageJson[emojiName];
};
