import { User } from 'telegraf/typings/telegram-types';

export type MessageEntityType = 'bold' | 'italic' | 'strikethrough' | 'underline' | 'pre' | 'code' | 'mention'
| 'text_mention' | 'hashtag' | 'email' | 'phone_number' | 'bot_command' | 'url' | 'text_link';

export interface IMessageEntity {
	type: MessageEntityType;
	offset: number;
	length: number;
}

export type MessageAuthor = User;

export type Message = {
	chatId?: number;
	from: MessageAuthor;
	text: string;
	entities: IMessageEntity[] | string;
	avatar: boolean;
};
