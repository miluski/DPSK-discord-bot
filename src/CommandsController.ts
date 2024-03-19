import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	Client,
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
		const discordAppInstance: Client<boolean> | undefined =
			this.getDiscordAppInstanceReference();
		try {
			if (discordAppInstance) {
				discordAppInstance.on("ready", () => {
					console.log("DPSK-Bot is online!");
				});
				discordAppInstance.login(process.env.DISCORD_TOKEN);
				this.setCommandList();
			} else {
				console.log("Discord app instance is undefined");
			}
		} catch (error) {
			console.error("Error occurred during login:", error);
		}
	}

	private async setCommandList() {
		try {
			console.log("Started refreshing application (/) commands.");
			const appId = process.env.APP_ID ?? "";
			const restInstance = this.getRestInstance();
			if (restInstance) {
				const existingCommands: any = await restInstance.get(
					Routes.applicationCommands(appId)
				);
				for (const command of existingCommands) {
					await restInstance.delete(
						Routes.applicationCommand(appId, command.id)
					);
				}
				await restInstance.put(Routes.applicationCommands(appId), {
					body: CommandsModel.commands,
				});
				console.log("Successfully reloaded application (/) commands.");
			} else {
				throw new Error("Rest instance is null");
			}
		} catch (error) {
			console.error("Error occurred while setting command list:", error);
		}
	}
	public setBotPresence(): void {
		try {
			const discordAppInstance: Client<boolean> | undefined =
				this.getDiscordAppInstanceReference();
			if (discordAppInstance) {
				discordAppInstance.on(Events.ClientReady, () => {
					discordAppInstance.user?.setPresence({
						status: "dnd",
					});
				});
			} else {
				console.log("Discord app instance is undefined");
			}
		} catch (error) {
			console.error("Error occurred while setting bot presence:", error);
		}
	}

	public setInteraction(): void {
		try {
			const discordAppInstance: Client<boolean> | undefined =
				this.getDiscordAppInstanceReference();
			if (discordAppInstance) {
				discordAppInstance.on(
					Events.InteractionCreate,
					async (interaction) => await this.handleInteraction(interaction)
				);
				discordAppInstance.on(
					Events.MessageReactionAdd,
					async (reaction, user) => {
						this.handleMessageReaction({
							reaction: reaction,
							user: user,
							event: Events.MessageReactionAdd,
						});
					}
				);
				discordAppInstance.on(
					Events.MessageReactionRemove,
					async (reaction, user) => {
						this.handleMessageReaction({
							reaction: reaction,
							user: user,
							event: Events.MessageReactionRemove,
						});
					}
				);
			} else {
				console.log("Discord app instance is undefined");
			}
		} catch (error) {
			console.error("Error occurred while setting interactions:", error);
		}
	}
	private async handleInteraction(interaction: any) {
		try {
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
		} catch (error) {
			console.error("Error occurred while handling interaction:", error);
		}
	}

	private async handleMessageReaction(message: Message) {
		try {
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
		} catch (error) {
			console.error("Error occurred while handling message reaction:", error);
		}
	}

	private async getMember(message: Message): Promise<GuildMember | null> {
		try {
			const member = await message.reaction.message.guild?.members.fetch(
				message.user.id
			);
			return member ?? null;
		} catch (error) {
			console.error("Error occurred while getting member:", error);
			return null;
		}
	}

	private handleChatInputCommand(interaction: any) {
		try {
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
				case "sendrules":
					interaction.member.roles.cache.some((role: Role) =>
						role.permissions.has("Administrator")
					)
						? new SendRulesCommand(interaction)
						: interaction.reply({
								content: "Nie masz uprawnień do użycia tej komendy!",
								ephemeral: true,
						  });
					break;
			}
		} catch (error) {
			console.error("Error occurred while handling chat input command:", error);
		}
	}
	private handleSelectOptionFromStringMenu(interaction: any): void {
		try {
			interaction.customId === "ticketTypes"
				? ((this.selectedProblemType = interaction.values[0]),
				  new TicketModal(interaction, this.selectedProblemType))
				: null;
		} catch (error) {
			console.error(
				"Error occurred while handling select option from string menu:",
				error
			);
		}
	}
	private async handleSubmitModal(interaction: any): Promise<void> {
		try {
			const ticketNumber = this.getRandomString();
			const problemDescription =
				interaction.fields.getTextInputValue("problemDescription");
			const embed = this.getPrivateMessageEmbed(interaction, ticketNumber);
			const ticketEmbed = this.getTicketEmbed(interaction, ticketNumber);
			const finalEmbed = this.getFinalReplyEmbed(interaction, ticketNumber, problemDescription);
			const confirmButtom = this.getConfirmButton();
			const declineButton = this.getDeclineButton();
			const ticketComponentsRow = new ActionRowBuilder().addComponents(
				confirmButtom,
				declineButton
			);
			if (interaction.customId === "ticketModal") {
				(async () => {
					try {
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
							await interaction.reply({ embeds: [finalEmbed] });
						}
					} catch (error) {
						console.error("Error occurred while handling submit modal:", error);
					}
				})();
			}
		} catch (error) {
			console.error("Error occurred while handling submit modal:", error);
		}
	}
	private getPrivateMessageEmbed(
		interaction: any,
		ticketNumber: string
	): EmbedBuilder {
		try {
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
		} catch (error) {
			console.error(
				"Error occurred while getting private message embed:",
				error
			);
			return new EmbedBuilder();
		}
	}
	private getRandomString() {
		try {
			const characters = "0123456789abcdefghijklmnopqrstuwxyz";
			let result = "";
			for (let i = 0; i < 5; i++) {
				const randomIndex = Math.floor(Math.random() * characters.length);
				result += characters[randomIndex];
			}
			return result;
		} catch (error) {
			console.error("Error occurred while getting random string:", error);
			return "";
		}
	}
	private getTicketEmbed(interaction: any, ticketNumber: string): EmbedBuilder {
		try {
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
		} catch (error) {
			console.error("Error occurred while getting ticket embed:", error);
			return new EmbedBuilder();
		}
	}
	private getConfirmButton(): ButtonBuilder {
		try {
			const confirm = new ButtonBuilder()
				.setCustomId("confirm")
				.setLabel("Zaakceptuj")
				.setStyle(ButtonStyle.Success);
			return confirm;
		} catch (error) {
			console.error("Error occurred while getting confirm button:", error);
			return new ButtonBuilder();
		}
	}
	private getDeclineButton(): ButtonBuilder {
		try {
			const cancel = new ButtonBuilder()
				.setCustomId("cancel")
				.setLabel("Odrzuć")
				.setStyle(ButtonStyle.Danger);
			return cancel;
		} catch (error) {
			console.error("Error occurred while getting decline button:", error);
			return new ButtonBuilder();
		}
	}
	private getPrivateErrorMessageEmbed(): EmbedBuilder {
		try {
			const embed = new EmbedBuilder()
				.setTitle(`Błąd`)
				.setDescription(`Tej komendy można użyć jedynie na serwerze discord!`)
				.setColor(0xff0000)
				.setTimestamp();
			return embed;
		} catch (error) {
			console.error(
				"Error occurred while getting private error message embed:",
				error
			);
			return new EmbedBuilder();
		}
	}
	private getFinalReplyEmbed(
		interaction: any,
		ticketNumber: string,
		ticketContent: string
	): EmbedBuilder {
		try {
			const { user, guild } = interaction;
			const guildName = guild?.name;
			const guildAvatar = guild?.iconURL();
			const userAvatar = user.avatarURL();
			const embed = new EmbedBuilder()
				.setDescription(
					`Do systemu wpłynęło nowe zgłoszenie o sygnaturze:\n**Ticket-${interaction.user.username}-${ticketNumber}**\n\n**Treść zgłoszenia**:${ticketContent}`
				)
				.setColor(0xff0000)
				.setThumbnail(userAvatar)
				.setTimestamp()
				.setFooter({
					text: guildName ?? "",
					iconURL: guildAvatar ?? undefined,
				});
			return embed;
		} catch (error) {
			console.error("Error occurred while getting final reply embed:", error);
			return new EmbedBuilder();
		}
	}
	private handleButtonClick(interaction: any) {
		try {
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
			const discordAppInstance: Client<boolean> | undefined =
				this.getDiscordAppInstanceReference();
			if (discordAppInstance) {
				discordAppInstance.users.fetch(userId).then((user) => {
					user.send({ embeds: [responseEmbed] });
				});
			} else {
				console.log("Discord app instance is undefined");
			}
		} catch (error) {
			console.error("Error occurred while handling button click:", error);
		}
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
