import { Client, IntentsBitField, Partials, REST } from "discord.js";

export class CommandsModel {
	private readonly discordAppInstance: Client<boolean>;
	private readonly restInstance: REST;
	protected readonly testerRoleId: string = "1210951770696585226";
	protected readonly approveIconId: string = "1210951055245053973";
	protected static readonly commands = [
		{
			name: "ping",
			description: "Pokazuje aktualny ping bota",
		},
		{
			name: "acceptrules",
			description:
				"Komenda wysyłająca wiadomość umożliwiającą akceptację zasad. Tylko dla administracji",
		},
		{
			name: "createticket",
			description:
				"Komenda umożliwiająca na zgłoszenie buga w aplikacji bądź pomysłu na jej usprawnienie",
		},
		{
			name: "sendrules",
			description:
				"Komenda wysyłająca na kanał aktualne zasady. Tylko dla administracji",
		},
	];
	constructor() {
		require("dotenv").config();
		this.discordAppInstance = new Client({
			intents: [
				IntentsBitField.Flags.Guilds,
				IntentsBitField.Flags.GuildMembers,
				IntentsBitField.Flags.GuildMessageReactions,
				IntentsBitField.Flags.GuildModeration,
				IntentsBitField.Flags.MessageContent,
				IntentsBitField.Flags.GuildIntegrations,
				IntentsBitField.Flags.AutoModerationExecution,
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
