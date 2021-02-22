function syllableCountEn(text: string): number {
	let word = text.toLowerCase();
	if (word.length <= 3) {
		return 1;
	}
	word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
	word = word.replace(/^y/, '');
	return word.match(/[aeiouy]{1,2}/g)?.length ?? 0;
}

function syllableCountCyrillic(text: string): number {
	return text.match(/[аеёиоуыэюяіїє]/ig)?.length ?? 0;
}

export const syllableCount = (text: string): number => syllableCountEn(text) + syllableCountCyrillic(text);

/**
 * https://github.com/vitalyavolyn/haiku-detector/blob/main/detector.js
 */

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
