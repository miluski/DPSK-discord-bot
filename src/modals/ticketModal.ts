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
        try {
            this.showModal();
        } catch (error) {
            console.error("Error showing modal:", error);
        }
    }
    private showModal(): void {
        try {
            const modal = this.getModal(); 
            this.interaction.showModal(modal); 
        } catch (error) {
            console.error("Error getting modal:", error);
        }
    }
    private getModal(): ModalBuilder {
        try {
            const problemDescription = this.getProblemDescriptionTextInput(); 
            const modal = new ModalBuilder()
                .setCustomId("ticketModal")
                .setTitle(`${this.problemType} ticket`);
            modal.addComponents(<any>problemDescription); 
            return modal;
        } catch (error) {
            console.error("Error creating modal:", error);
            throw error;
        }
    }
    private getProblemDescriptionTextInput(): ActionRowBuilder {
        try {
            const problemDescription = new TextInputBuilder()
                .setCustomId("problemDescription")
                .setLabel("Opis problemu")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true) 
                .setMinLength(30); 
            const problemDescriptionActionRow = new ActionRowBuilder().addComponents(
                problemDescription
            ); 
            return problemDescriptionActionRow;
        } catch (error) {
            console.error("Error creating text input:", error);
            throw error;
        }
    }
}
