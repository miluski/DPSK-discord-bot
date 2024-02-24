import {
	CacheType,
	CommandInteraction,
	EmbedBuilder,
} from "discord.js";
import { Rule } from "../types/rule";

export class AcceptRulesCommand {
	private readonly interaction: CommandInteraction<CacheType>;
	private readonly approveIconId: string = "<a:approve:1210951055245053973>";
	private readonly rulesArray: Array<Rule> = [
		{
			name: "Zasada 1",
			value: "Masz problem? To zapomnij o tym, już go nie masz",
		},
		{
			name: "Zasada 2",
			value: "Znalazłeś buga? To twój telefon źle działa, nie aplikacja",
		},
		{
			name: "Zasada 3",
			value: "👑Android > IOS🤮",
		},
		{
			name: "Zasada 4",
			value:
				"Jeśli pani dyrektor nie dać mudzina premia to mudzina wszczonć bunt",
		},
		{
			name: "Zasada 5",
			value: "TheFilips nubuje",
		},
		{
			name: `Aby zaakceptować powyższe zasady i otrzymać rolę testera, zareaguj na tę wiadomość za pomocą reakcji ${this.approveIconId}`,
			value: " ",
		},
	];
	constructor(interaction: CommandInteraction<CacheType>) {
		this.interaction = interaction;
		this.execute();
	}
	private async execute(): Promise<void> {
		const rulesEmbed = this.getRulesEmbed();
		const message = await this.interaction.reply({
			embeds: [rulesEmbed],
			fetchReply: true,
		});
		await message.react(this.approveIconId);
	}
	private getRulesEmbed(): EmbedBuilder {
		const rulesText = new EmbedBuilder()
			.setDescription("Zasady alphatestów")
			.setColor(0xff0000)
			.addFields(this.rulesArray);
		return rulesText;
	}
}

