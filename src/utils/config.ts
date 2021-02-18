import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';

let instance = null as Telegraf | null;

export const setTelegrafInstance = (telegraf: Telegraf): void => {
	instance = telegraf;
};

export const getTelegrafInstance = (): Telegraf => {
	if (instance === null) {
		throw new TypeError('Instance was not set yet');
	}

	return instance;
};

export const init = async (): Promise<void> => {
	dotenv.config();
};

export const getToken = (): string => {
	const token = process.env.HAIKU_BOT_TOKEN;

	if (typeof token === 'undefined') {
		throw new TypeError('HAIKU_BOT_TOKEN environment variable is not set!');
	}

	return token;
};
