import { CommandInteraction, CacheType } from "discord.js";

export class PingCommand {
	private readonly interaction: CommandInteraction<CacheType>;
	constructor(interaction: CommandInteraction<CacheType>) {
		this.interaction = interaction;
		this.execute();
	}
	private async execute(): Promise<void> {
		const receivedTimestamp = Date.now();
		await this.interaction.reply({
			embeds: [
				{
					title: "Pong!",
					description: `Aktualne opóźnienie wynosi: ${
						this.interaction.createdTimestamp - receivedTimestamp
					} ms`,
					color: 0xff0000,
				},
			],
		});
	}
}
