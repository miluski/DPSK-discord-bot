import {
	ActionRowBuilder,
	CacheType,
	CommandInteraction,
	EmbedBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} from "discord.js";

export class CreateTicketCommand {
	private readonly interaction: CommandInteraction<CacheType>;
	constructor(interaction: CommandInteraction<CacheType>) {
		this.interaction = interaction;
		this.execute();
	}
	private async execute(): Promise<void> {
		const embed = this.getStartEmbed();
		const ticketTypeSelectMenu = this.getTicketTypeSelectMenu();
		await this.interaction.reply({
			embeds: [embed],
			components: [<any>ticketTypeSelectMenu],
			ephemeral: true,
		});
		
	}
	private getStartEmbed(): EmbedBuilder {
		const { user, guild } = this.interaction;
		const guildName = guild?.name;
		const guildAvatar = guild?.iconURL();
		const userAvatar = user.avatarURL();
		const userId = user.id;
		const embed = new EmbedBuilder()
			.setTitle("Ticket")
			.setDescription(
				`Cześć <@${userId}>! Rozpocząłeś procedurę zgłaszania problemu lub propozycji dotyczącej aplikacji DPSK Children day!\n
				Aby kontynuować, wybierz rodzaj zgłoszenia poniżej:`
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
	private getTicketTypeSelectMenu(): ActionRowBuilder {
		const select = new StringSelectMenuBuilder()
			.setCustomId("ticketTypes")
			.setPlaceholder("Wybierz typ zgłoszenia")
			.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel("⚠️Bug")
					.setDescription(
						"Ticket będzie dotyczył napotkanego problemu w aplikacji"
					)
					.setValue("⚠️Bug"),
				new StringSelectMenuOptionBuilder()
					.setLabel("💡Propozycja")
					.setDescription(
						"Ticket będzie dotyczył sugerowanych zmian w aplikacji"
					)
					.setValue("💡Propozycja"),
				new StringSelectMenuOptionBuilder()
					.setLabel("❓Pomoc")
					.setDescription(
						"Ticket będzie zapytaniem o pomoc administracji aplikacji"
					)
					.setValue("❓Pomoc")
			);
		return new ActionRowBuilder().addComponents(select);
	}
}
