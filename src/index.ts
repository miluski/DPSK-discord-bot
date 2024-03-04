import { CommandsController } from "./CommandsController";

const connect = new CommandsController();
connect.loginToApp();
connect.setBotPresence();
connect.setInteraction();