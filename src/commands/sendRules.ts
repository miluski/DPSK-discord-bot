import {
	CacheType,
	CommandInteraction,
	EmbedBuilder,
} from "discord.js";
import { Rule } from "../types/rule";

export class SendRulesCommand {
	private readonly interaction: CommandInteraction<CacheType>;
	private readonly approveIconId: string = "<a:approve:1210951055245053973>";
	private readonly rulesArray: Array<Rule> = [
		{
			name: "Zasada 1",
			value: "Wszystko co znajduje się na obrębie tego discorda w postaci tekstowej lub wypowiedzianej głosowo pozostaje na tym discordzie. W przypadku złamania danej zasady zostaną wyciągnięte odpowiednie konsekwencje.",
		},
		{
			name: "Zasada 2",
			value: "Do raportowania problemów lub propozycji służy komenda /createticket oraz kanał tickety. Developerzy zastrzegają sobie prawo do odrzucenia nowego zgłoszenia inaczej ticketu bez podania powodu.",
		},
		{
			name: "Zasada 3",
			value: "Opiekunem testerów platformy Android jest <@346735619889823744>, a Opiekunami testów na platformie iOS są <@525693901349060639> oraz <@461227481366528030>. Proszę kierować swoje problemy do odpowiednich osób jeśli ticket nie wystarczy.",
		},
		{
			name: "Zasada 4",
			value:
				"Oferty pomocy przy developie aplikacji będą z reguły odrzucane - team developerski został wybrany na samym początku tworzenia aplikacji i na tym etapie jej rozwoju wolimy nie wpuszczać w swoje szeregi nowych osób. Jednakże, nie wykluczamy opcji przyjęcia kogoś nowego do grona.",
		},
		{
			name: "Zasada 5",
			value: "Konieczność stosowania się do powyższych zasad wchodzi w życie zaraz po ich akceptacji i automatycznym otrzymaniu roli Testera. Za złamanie którejkolwiek zasad grożą srogie konsekwencje np.: w postaci usunięcia z grona testerów",
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
		await this.interaction.reply({
			embeds: [rulesEmbed],
			fetchReply: true,
		});
	}
	private getRulesEmbed(): EmbedBuilder {
		const rulesText = new EmbedBuilder()
			.setDescription("Zasady alphatestów")
			.setColor(0xff0000)
			.addFields(this.rulesArray);
		return rulesText;
	}
}

