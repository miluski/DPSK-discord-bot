import { Client, IntentsBitField, REST } from "discord.js";

export class ConnectionModel {
	private readonly discordAppInstance: Client<boolean>;
	private readonly restInstance: REST;
	constructor() {
		require("dotenv").config();
		this.discordAppInstance = new Client({
			intents: [IntentsBitField.Flags.Guilds],
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
