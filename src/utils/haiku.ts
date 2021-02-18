/**
 * https://github.com/vitalyavolyn/haiku-detector/blob/main/detector.js
 */

import { syllabify } from 'syllables-ru';

const vowelsRegex = /[аеёиоуыэюя]/ig;

const syllableCount = (text: string) => syllabify(text)
	.replace(/\s+/g, ' ')
	.split(' ')
	.reduce((acc, v) => acc + (
		v.split('·').length === 1
		// Пропускаем предлоги и т.п. без гласных
			? (v.match(vowelsRegex) ? 1 : 0)
			: v.split('·').length
	), 0);

export const getHaiku = (text: string | null): string | null => {
	if (!text) return null;
	if (syllableCount(text) !== 17) return null;

	// TODO: переделывать числа в слова, чтобы считать слоги в них
	if (/\d/.test(text)) return null;

	const words = text.replace(/\s+/g, ' ').split(' ');
	const haiku = [[], [], []];
	let paragraph = 0;

	for (const word of words) {
		haiku[paragraph].push(word);

		const paragraphSyllableCount = syllableCount(haiku[paragraph].join(' '));
		const maxSyllables = [5, 7, 5];

		if (paragraphSyllableCount === maxSyllables[paragraph]) {
			paragraph++;
			continue;
		}

		if (paragraphSyllableCount > maxSyllables[paragraph]) {
			return null;
		}
	}

	return haiku.map(line => line.join(' ')).join('\n');
};
