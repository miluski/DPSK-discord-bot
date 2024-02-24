import { Client, IntentsBitField, Partials, REST } from "discord.js";

export class ConnectionModel {
	private readonly discordAppInstance: Client<boolean>;
	private readonly restInstance: REST;
	protected readonly testerRoleId: string = "1210951770696585226";
	protected readonly approveIconId: string = "1210951055245053973";
	constructor() {
		require("dotenv").config();
		this.discordAppInstance = new Client({
			intents: [
				IntentsBitField.Flags.Guilds,
				IntentsBitField.Flags.GuildMembers,
				IntentsBitField.Flags.GuildMessageReactions,
			],
			partials: [
				Partials.Reaction,
				Partials.Channel,
				Partials.Message,
				Partials.User,
				Partials.GuildMember,
			],
		});
		this.restInstance = new REST({ version: "10" }).setToken(
			process.env.DISCORD_TOKEN ?? ""
		);
	}
	protected getDiscordAppInstanceReference(): Client<boolean> {
		return this.discordAppInstance;
	}
	protected getRestInstance(): REST {
		return this.restInstance;
	}
}
