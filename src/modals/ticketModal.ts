import {
	CommandInteraction,
	CacheType,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ActionRowBuilder,
} from "discord.js";

export class TicketModal {
	private readonly interaction: CommandInteraction<CacheType>;
	private readonly problemType: string;
	constructor(interaction: CommandInteraction<CacheType>, problemType: string) {
		this.interaction = interaction;
		this.problemType = problemType;
		this.interaction.deleteReply();
		this.showModal();
	}
	private showModal(): void {
		const modal = this.getModal();
		this.interaction.showModal(modal);
	}
	private getModal(): ModalBuilder {
		const problemDescription = this.getProblemDescriptionTextInput();
		const modal = new ModalBuilder()
			.setCustomId("ticketModal")
			.setTitle(`${this.problemType} ticket`)
		modal.addComponents(<any>problemDescription);
		return modal;
	}
	private getProblemDescriptionTextInput(): ActionRowBuilder {
		const problemDescription = new TextInputBuilder()
			.setCustomId("problemDescription")
			.setLabel("Opis problemu")
			.setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMinLength(50);
		const problemDescriptionActionRow = new ActionRowBuilder().addComponents(
			problemDescription
		);
		return problemDescriptionActionRow;
	}
}
