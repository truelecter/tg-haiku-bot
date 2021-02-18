import {
	createLogger, format, transports, Logger
} from 'winston';
import { SPLAT } from 'triple-beam';

const loggingFormat = format.printf((info) => {
	const {
		timestamp, label, level, message, ...extra
	} = info;

	let msg = message;
	const splat = extra[SPLAT] || [];
	const updateId = extra.updateId || null as string | null;

	let splatText = '';

	for (const spl of splat) {
		// False trigger for whatever reason
		// noinspection SuspiciousTypeOfGuard
		if (spl instanceof Error) {
			splatText += `\n${spl.stack}`;

			msg = msg.replace(spl.message, '');
		} else {
			splatText += JSON.stringify(spl, null, 4);
		}
	}

	if (updateId) {
		return `${timestamp} [${label}:${level}] {${updateId}} ${msg} ${splatText}`;
	}

	return `${timestamp} [${label}:${level}] ${msg} ${splatText}`;
});

function makeLogger(label: string): Logger {
	return createLogger({
		format: format.combine(
			format.colorize(),
			format.align(),
			format.label({ label }),
			format.timestamp(),
			loggingFormat,
		),
		transports: [new transports.Console()],
		level: 'debug',
	});
}

export type ILogger = Logger;

export default makeLogger('GENERAL');
