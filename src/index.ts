import { Telegraf } from 'telegraf';

import { init as initConfig, getToken, setTelegrafInstance } from './utils/config';
import onText from './telegram/message-listener';

(async () => {
	await initConfig();

	const token = getToken();

	const bot = new Telegraf(token);
	setTelegrafInstance(bot);

	bot.on(['text', 'message', 'edited_message'], onText);

	return bot.launch();
})().catch(e => console.log(e));
