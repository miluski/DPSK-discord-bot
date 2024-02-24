import { Events, GuildMember, Role, Routes } from "discord.js";
import { ConnectionModel } from "./ConnectionModel";
import { commands } from "./CommandsModel";
import { PingCommand } from "./commands/ping";
import { AcceptRulesCommand } from "./commands/acceptRules";
import { Message } from "./types/message";

export class ConnectionController extends ConnectionModel {
	public loginToApp(): void {
		this.getDiscordAppInstanceReference().on("ready", () => {
			console.log("DPSK-Bot is online!");
		});
		this.getDiscordAppInstanceReference().login(process.env.DISCORD_TOKEN);
		(async () => {
			await this.setCommandList();
		})();
	}
	private async setCommandList() {
		try {
			console.log("Started refreshing application (/) commands.");
			const appId = process.env.APP_ID ?? "";
			const restInstance = this.getRestInstance();
			const existingCommands: any = await restInstance.get(
				Routes.applicationCommands(appId)
			);
			for (const command of existingCommands) {
				await restInstance.delete(Routes.applicationCommand(appId, command.id));
			}
			await restInstance.put(Routes.applicationCommands(appId), {
				body: commands,
			});
			console.log("Successfully reloaded application (/) commands.");
		} catch (error) {
			console.error(error);
		}
	}
	public setInteraction(): void {
		this.getDiscordAppInstanceReference().on(
			Events.InteractionCreate,
			async (interaction) => await this.handleInteraction(interaction)
		);
		this.getDiscordAppInstanceReference().on(
			Events.MessageReactionAdd,
			async (reaction, user) => {
				this.handleMessageReaction({
					reaction: reaction,
					user: user,
					event: Events.MessageReactionAdd,
				});
			}
		);
		this.getDiscordAppInstanceReference().on(
			Events.MessageReactionRemove,
			async (reaction, user) => {
				this.handleMessageReaction({
					reaction: reaction,
					user: user,
					event: Events.MessageReactionRemove,
				});
			}
		);
	}
	private async handleInteraction(interaction: any) {
		if (interaction.isChatInputCommand()) {
			switch (interaction.commandName) {
				case "ping":
					new PingCommand(interaction);
					break;
				case "acceptrules":
					interaction.member.roles.cache.some(
						(role: Role) => role.name === "Pan terminator"
					)
						? new AcceptRulesCommand(interaction)
						: interaction.reply({
								content: "Nie masz uprawnień do użycia tej komendy!",
								ephemeral: true,
						  });
					break;
			}
		}
	}
	private async handleMessageReaction(message: Message) {
		const member = await this.getMember({ ...message });
		const isSelectedEmojiValid =
			message.reaction.emoji.id === this.approveIconId;
		const isMemberValid = member != null && !message.user.bot;
		const isAddedEmoji = message.event === Events.MessageReactionAdd;
		isSelectedEmojiValid && isAddedEmoji && isMemberValid
			? member?.roles.add(this.testerRoleId)
			: member?.roles.remove(this.testerRoleId);
		isSelectedEmojiValid ? null : message.reaction.remove();
	}
	private async getMember(message: Message): Promise<GuildMember | null> {
		const member = await message.reaction.message.guild?.members.fetch(
			message.user.id
		);
		return member ?? null;
	}
}
