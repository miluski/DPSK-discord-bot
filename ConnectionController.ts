import { CacheType, CommandInteraction, Routes } from "discord.js";
import { ConnectionModel } from "./ConnectionModel";
import { commands } from "./CommandsModel";

export class ConnectionController extends ConnectionModel {
	public loginToApp(): void {
		this.getDiscordAppInstanceReference().on("ready", () => {
			console.log("DPSK-Bot is online!");
		});
		this.getDiscordAppInstanceReference().login(process.env.DISCORD_TOKEN);
        (async() => {
            await this.setCommandList();
        })();
	}
	private async setCommandList() {
		try {
			console.log("Started refreshing application (/) commands.");
			await this.getRestInstance().put(
				Routes.applicationCommands(process.env.APP_ID ?? ""),
				{ body: commands }
			);
			console.log("Successfully reloaded application (/) commands.");
		} catch (error) {
			console.error(error);
		}
	}
	public setInteraction(): void {
		this.getDiscordAppInstanceReference().on(
			"interactionCreate",
			async (interaction) =>
				await this.handleInteraction(<CommandInteraction<CacheType>>interaction)
		);
	}
	private async handleInteraction(interaction: CommandInteraction<CacheType>) {
		if (interaction.isChatInputCommand()) {
			switch (interaction.commandName) {
				case "ping":
					interaction.reply("Pong");
					break;
			}
		}
	}
}
