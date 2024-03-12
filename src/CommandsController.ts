import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	EmbedBuilder,
	Events,
	GuildMember,
	Role,
	Routes,
} from "discord.js";
import { CommandsModel } from "./CommandsModel";
import { PingCommand } from "./commands/ping";
import { AcceptRulesCommand } from "./commands/acceptRules";
import { Message } from "./types/message";
import { CreateTicketCommand } from "./commands/createTicket";
import { TicketModal } from "./modals/ticketModal";
import { SendRulesCommand } from "./commands/sendRules";

export class CommandsController extends CommandsModel {
	private selectedProblemType: string = "";
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
				body: CommandsModel.commands,
			});
			console.log("Successfully reloaded application (/) commands.");
		} catch (error) {
			console.error(error);
		}
	}
	public setBotPresence(): void {
		this.getDiscordAppInstanceReference().on(Events.ClientReady, () => {
			this.getDiscordAppInstanceReference().user?.setPresence({
				status: "dnd",
			});
		});
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
		const privateEmbed = this.getPrivateErrorMessageEmbed();
		if (interaction.guild) {
			if (interaction.isChatInputCommand()) {
				this.handleChatInputCommand(interaction);
			}
			if (interaction.isStringSelectMenu()) {
				this.handleSelectOptionFromStringMenu(interaction);
			}
			if (interaction.isModalSubmit()) {
				this.handleSubmitModal(interaction);
			}
			if (interaction.isButton()) {
				this.handleButtonClick(interaction);
			}
		} else {
			interaction.reply({ embeds: [privateEmbed] });
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
			: isAddedEmoji
			? null
			: member?.roles.remove(this.testerRoleId);
		isSelectedEmojiValid ? null : message.reaction.remove();
	}
	private async getMember(message: Message): Promise<GuildMember | null> {
		const member = await message.reaction.message.guild?.members.fetch(
			message.user.id
		);
		return member ?? null;
	}
	private handleChatInputCommand(interaction: any) {
		switch (interaction.commandName) {
			case "ping":
				new PingCommand(interaction);
				break;
			case "acceptrules":
				interaction.member.roles.cache.some((role: Role) =>
					role.permissions.has("Administrator")
				)
					? new AcceptRulesCommand(interaction)
					: interaction.reply({
							content: "Nie masz uprawnień do użycia tej komendy!",
							ephemeral: true,
					  });
				break;
			case "createticket":
				interaction.member.roles.cache.some(
					(role: Role) =>
						role.id === this.testerRoleId ||
						role.permissions.has("Administrator")
				)
					? new CreateTicketCommand(interaction)
					: interaction.reply({
							content: "Nie masz uprawnień do użycia tej komendy!",
							ephemeral: true,
					  });
				break;
			case "sendRules":
				interaction.member.roles.cache.some((role: Role) =>
					role.permissions.has("Administrator")
				)
					? new SendRulesCommand(interaction)
					: null;
				break;
		}
	}
	private handleSelectOptionFromStringMenu(interaction: any): void {
		interaction.customId === "ticketTypes"
			? ((this.selectedProblemType = interaction.values[0]),
			  new TicketModal(interaction, this.selectedProblemType))
			: null;
	}
	private handleSubmitModal(interaction: any): void {
		const ticketNumber = this.getRandomString();
		const embed = this.getPrivateMessageEmbed(interaction, ticketNumber);
		const ticketEmbed = this.getTicketEmbed(interaction, ticketNumber);
		const finalEmbed = this.getFinalReplyEmbed(interaction, ticketNumber);
		const confirmButtom = this.getConfirmButton();
		const declineButton = this.getDeclineButton();
		const ticketComponentsRow = new ActionRowBuilder().addComponents(
			confirmButtom,
			declineButton
		);
		if (interaction.customId === "ticketModal") {
			(async () => {
				await interaction.user.send({ embeds: [embed] });
				const isCreated = await interaction.channel.threads.create({
					name: `Ticket-${interaction.user.username}-${ticketNumber}`,
					archiveAutoDuration: 60,
					type: ChannelType.PrivateThread,
				});
				if (isCreated) {
					const thread = interaction.channel.threads.cache.find(
						(thread: any) => {
							return (
								thread.name ===
								`Ticket-${interaction.user.username}-${ticketNumber}`
							);
						}
					);
					await thread.send({
						embeds: [ticketEmbed],
						components: [ticketComponentsRow],
					});
					await thread.members.add("346735619889823744");
					await thread.members.add("525693901349060639");
					await thread.members.add("461227481366528030");
					interaction.reply({ embeds: [finalEmbed] });
				}
			})();
		}
	}
	private getPrivateMessageEmbed(
		interaction: any,
		ticketNumber: string
	): EmbedBuilder {
		const { user, guild } = interaction;
		const guildName = guild?.name;
		const guildAvatar = guild?.iconURL();
		const userAvatar = user.avatarURL();
		const problemDescription =
			interaction.fields.getTextInputValue("problemDescription");
		const embed = new EmbedBuilder()
			.setTitle("Potwierdzenie zgłoszenia")
			.setDescription(
				`**Sygnatura:\n**Ticket-${interaction.user.username}-${ticketNumber}\n\n**Typ problemu:\n** ${this.selectedProblemType}\n\n**Treść zgłoszenia**:\n${problemDescription}.\n\nPoinformujemy cię, gdy zgłoszenie zostanie przyjęte do realizacji lub zostanie odrzucone.`
			)
			.setColor(0xff0000)
			.setThumbnail(userAvatar)
			.setTimestamp()
			.setFooter({
				text: guildName ?? "",
				iconURL: guildAvatar ?? undefined,
			});
		return embed;
	}
	private getRandomString() {
		const characters = "0123456789abcdefghijklmnopqrstuwxyz";
		let result = "";
		for (let i = 0; i < 5; i++) {
			const randomIndex = Math.floor(Math.random() * characters.length);
			result += characters[randomIndex];
		}
		return result;
	}
	private getTicketEmbed(interaction: any, ticketNumber: string): EmbedBuilder {
		const { user, guild } = interaction;
		const guildAvatar = guild?.iconURL();
		const userAvatar = user.avatarURL();
		const problemDescription =
			interaction.fields.getTextInputValue("problemDescription");
		const embed = new EmbedBuilder()
			.setTitle(`Ticket-${interaction.user.username}-${ticketNumber}`)
			.setDescription(
				`**Osoba zgłaszająca:**\n<@${interaction.user.id}>\n\n**Typ problemu:\n** ${this.selectedProblemType}\n\n**Treść zgłoszenia**:\n${problemDescription}.\n\n`
			)
			.setColor(0xff0000)
			.setThumbnail(userAvatar)
			.setTimestamp()
			.setFooter({
				text: interaction.user.id ?? "",
				iconURL: guildAvatar ?? undefined,
			});
		return embed;
	}
	private getConfirmButton(): ButtonBuilder {
		const confirm = new ButtonBuilder()
			.setCustomId("confirm")
			.setLabel("Zaakceptuj")
			.setStyle(ButtonStyle.Success);
		return confirm;
	}
	private getDeclineButton(): ButtonBuilder {
		const cancel = new ButtonBuilder()
			.setCustomId("cancel")
			.setLabel("Odrzuć")
			.setStyle(ButtonStyle.Danger);
		return cancel;
	}
	private getPrivateErrorMessageEmbed(): EmbedBuilder {
		const embed = new EmbedBuilder()
			.setTitle(`Błąd`)
			.setDescription(`Tej komendy można użyć jedynie na serwerze discord!`)
			.setColor(0xff0000)
			.setTimestamp();
		return embed;
	}
	private getFinalReplyEmbed(
		interaction: any,
		ticketNumber: string
	): EmbedBuilder {
		const { user, guild } = interaction;
		const guildName = guild?.name;
		const guildAvatar = guild?.iconURL();
		const userAvatar = user.avatarURL();
		const embed = new EmbedBuilder()
			.setDescription(
				`Do systemu wpłynęło nowe zgłoszenie o sygnaturze:\n**Ticket-${interaction.user.username}-${ticketNumber}**`
			)
			.setColor(0xff0000)
			.setThumbnail(userAvatar)
			.setTimestamp()
			.setFooter({
				text: guildName ?? "",
				iconURL: guildAvatar ?? undefined,
			});
		return embed;
	}
	private handleButtonClick(interaction: any) {
		const embed = interaction.message.embeds[0];
		const userId = interaction.message.embeds[0].data.footer.text;
		const ticketSignature = interaction.message.embeds[0].data.title;
		const description = `**Opiekun zgłoszenia:**\n<@${interaction.user.id}>\n`
			.concat(embed.data.description)
			.concat("\n\n");
		const editedEmbed = this.getResponseTicketEmbed(interaction, description);
		let responseEmbed = this.getResponseTicketEmbed(interaction, "test");
		if (interaction.customId === "confirm") {
			const embedDescription = `Twoje zgłoszenie o sygnaturze: **${ticketSignature}** zostało przyjęte przez **${interaction.user.username}**`;
			responseEmbed = this.getResponseTicketEmbed(
				interaction,
				embedDescription
			);
			interaction.message.edit({ embeds: [editedEmbed], components: [] });
		} else {
			const embedDescription = `Twoje zgłoszenie o sygnaturze: **${ticketSignature}** zostało odrzucone przez **${interaction.user.username}**`;
			responseEmbed = this.getResponseTicketEmbed(
				interaction,
				embedDescription
			);
			interaction.message.delete();
		}
		this.getDiscordAppInstanceReference()
			.users.fetch(userId)
			.then((user) => {
				user.send({ embeds: [responseEmbed] });
			});
	}
	private getResponseTicketEmbed(
		interaction: any,
		embedDescription: string
	): EmbedBuilder {
		const { user, guild } = interaction;
		const guildName = guild?.name;
		const guildAvatar = guild?.iconURL();
		const userAvatar = user.avatarURL();
		const embed = new EmbedBuilder()
			.setDescription(embedDescription)
			.setColor(0xff0000)
			.setThumbnail(userAvatar)
			.setTimestamp()
			.setFooter({
				text: guildName ?? "",
				iconURL: guildAvatar ?? undefined,
			});
		return embed;
	}
}
