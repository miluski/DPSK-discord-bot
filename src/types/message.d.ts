import { MessageReaction, PartialMessageReaction, User, PartialUser } from "discord.js";

export type Message = {
	reaction: MessageReaction | PartialMessageReaction;
	user: User | PartialUser;
    event: string;
};
