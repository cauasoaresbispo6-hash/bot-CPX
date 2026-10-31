const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require("discord.js");

const commands = [
    new SlashCommandBuilder()
        .setName("painel")
        .setDescription("Gerenciar os painéis do servidor")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(sub =>
            sub.setName("ticket")
                .setDescription("Enviar painel de tickets")
        )
        .addSubcommand(sub =>
            sub.setName("xfacc")
                .setDescription("Enviar painel de facções")
        )
];

module.exports = commands;
