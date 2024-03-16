import { CommandInteraction, CacheType } from "discord.js";

export class PingCommand {
    private readonly interaction: CommandInteraction<CacheType>;
    constructor(interaction: CommandInteraction<CacheType>) {
        this.interaction = interaction;
        this.execute().catch(error => {
            console.error("Error executing PingCommand:", error);
        });
    }
    private async execute(): Promise<void> {
        try {
            const receivedTimestamp = Date.now();
            await this.interaction.reply({
                embeds: [
                    {
                        title: "Pong!",
                        description: `Aktualne opóźnienie wynosi: ${
                            receivedTimestamp - this.interaction.createdTimestamp 
                        } ms`,
                        color: 0xff0000,
                    },
                ],
            });
        } catch (error) {
            console.error("Error executing ping command:", error);
        }
    }
}
