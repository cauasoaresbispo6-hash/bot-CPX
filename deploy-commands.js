require("dotenv").config();

const { REST, Routes } = require("discord.js");
const commands = require("./commands");

const { BOT_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!BOT_TOKEN || !CLIENT_ID) {
    throw new Error("Preencha BOT_TOKEN e CLIENT_ID no arquivo .env.");
}

const rest = new REST({ version: "10" }).setToken(BOT_TOKEN);

(async () => {
    try {
        const body = commands.map(command => command.toJSON());

        if (GUILD_ID) {
            await rest.put(
                Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
                { body }
            );
            console.log("Comandos registrados no servidor!");
        } else {
            await rest.put(
                Routes.applicationCommands(CLIENT_ID),
                { body }
            );
            console.log("Comandos globais registrados!");
        }
    } catch (error) {
        console.error("Erro ao registrar comandos:", error);
        process.exitCode = 1;
    }
})();
