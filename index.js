const {
    Client,
    GatewayIntentBits,
    ChannelType,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    Events
} = require("discord.js");

const fs = require("fs");
const path = require("path");
const config = require("./config");

if (!config.TOKEN) {
    throw new Error("BOT_TOKEN não configurado no arquivo .env");
}

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "tickets.json");

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "{}");
}

let tickets = {};
try {
    tickets = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
} catch (error) {
    console.error("Não foi possível ler tickets.json:", error);
    tickets = {};
}

const claimLocks = new Set();

function saveTickets() {
    const tempFile = DATA_FILE + ".tmp";
    fs.writeFileSync(tempFile, JSON.stringify(tickets, null, 2));
    fs.renameSync(tempFile, DATA_FILE);
}

const TICKET_TYPES = {
    denuncias: {
        name: "Denúncias",
        description: "Faça suas denúncias aqui!",
        emoji: "🚨",
        staff: config.STAFF_TICKET
    },
    duvidas: {
        name: "Dúvidas",
        description: "Tire suas dúvidas aqui!",
        emoji: "❓",
        staff: config.STAFF_TICKET
    },
    recrutamento: {
        name: "Recrutamento",
        description: "Faça seu recrutamento aqui!",
        emoji: "📋",
        staff: config.STAFF_TICKET
    },
    transferencias: {
        name: "Transferências",
        description: "Faça sua transferencia aqui!",
        emoji: "🔄",
        staff: config.STAFF_TICKET
    },
    xfacc: {
        name: "Xfacc",
        description: "Atendimento de facções e assuntos de RP.",
        emoji: "🏴",
        staff: config.STAFF_XFACC
    }
};

function makeTopic(ownerId, type, claimedBy = "-") {
    return `RP_TICKET|${ownerId}|${type}|${claimedBy}`;
}

function parseTopic(topic) {
    if (!topic || !topic.startsWith("RP_TICKET|")) return null;
    const parts = topic.split("|");
    if (parts.length !== 4) return null;

    return {
        ownerId: parts[1],
        type: parts[2],
        claimedBy: parts[3]
    };
}

async function reconcileTickets() {
    for (const guild of client.guilds.cache.values()) {
        await guild.channels.fetch().catch(() => null);

        for (const channel of guild.channels.cache.values()) {
            if (channel.type !== ChannelType.GuildText) continue;
            const metadata = parseTopic(channel.topic);
            if (!metadata || !TICKET_TYPES[metadata.type]) continue;

            tickets[channel.id] = {
                guildId: guild.id,
                ...metadata
            };
        }
    }

    for (const channelId of Object.keys(tickets)) {
        let found = false;

        for (const guild of client.guilds.cache.values()) {
            const channel = await guild.channels.fetch(channelId).catch(() => null);
            if (channel) {
                found = true;
                break;
            }
        }

        if (!found) delete tickets[channelId];
    }

    saveTickets();
    console.log("Sistema de tickets recuperado!");
}

function memberHasRole(member, roleIds) {
    if (!member) return false;
    return roleIds.some(id => member.roles?.cache?.has(id));
}

async function validateRoles(guild, roleIds) {
    await guild.roles.fetch();
    const missing = roleIds.filter(id => !guild.roles.cache.has(id));

    if (missing.length) {
        throw new Error(`Cargos não encontrados: ${missing.join(", ")}`);
    }
}

function ticketComponents(claimed = false) {
    const claimButton = new ButtonBuilder()
        .setCustomId("ticket_claim")
        .setLabel(claimed ? "Reivindicado" : "Reivindicar")
        .setEmoji("🙋")
        .setStyle(ButtonStyle.Success)
        .setDisabled(claimed);

    const closeButton = new ButtonBuilder()
        .setCustomId("ticket_close")
        .setLabel("Fechar")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger);

    return [new ActionRowBuilder().addComponents(claimButton, closeButton)];
}

function createTicketPanel() {
    const embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle("🎫 CENTRAL DE ATENDIMENTO")
        .setDescription([
            "Bem-vindo à central de atendimento!",
            "",
            "Selecione abaixo o departamento desejado.",
            "Um canal privado será criado automaticamente.",
            "",
            "📌 **Informações importantes:**",
            "• Escolha a categoria correta.",
            "• Explique sua situação com clareza.",
            "• Aguarde um membro da equipe.",
            "• Não abra tickets desnecessários.",
            "",
            "Nossa equipe estará disponível para ajudar!"
        ].join("\\n"))
        .setFooter({ text: "Sistema de Atendimento • Roleplay" })
        .setTimestamp();

    const menu = new StringSelectMenuBuilder()
        .setCustomId("ticket_select")
        .setPlaceholder("Selecione uma categoria...")
        .addOptions(
            Object.entries(TICKET_TYPES)
                .filter(([key]) => key !== "xfacc")
                .map(([key, value]) => ({
                    label: value.name,
                    description: value.description,
                    value: key,
                    emoji: value.emoji
                }))
        );

    return {
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(menu)]
    };
}

function createXfaccPanel() {
    const embed = new EmbedBuilder()
        .setColor("#9B59B6")
        .setTitle("🏴 CENTRAL DE FACÇÕES")
        .setDescription([
            "Bem-vindo ao atendimento de facções!",
            "",
            "Utilize o botão abaixo para abrir",
            "um atendimento exclusivo de Xfacc.",
            "",
            "📌 **Orientações:**",
            "• Informe o nome da facção.",
            "• Explique o assunto desejado.",
            "• Aguarde a equipe responsável.",
            "",
            "Atendimento exclusivo para assuntos de RP."
        ].join("\\n"))
        .setFooter({ text: "Central Xfacc • Roleplay" })
        .setTimestamp();

    const button = new ButtonBuilder()
        .setCustomId("open_xfacc")
        .setLabel("Abrir atendimento Xfacc")
        .setEmoji("🏴")
        .setStyle(ButtonStyle.Primary);

    return {
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(button)]
    };
}

async function findExistingTicket(guild, ownerId, type) {
    await guild.channels.fetch().catch(() => null);

    return guild.channels.cache.find(channel => {
        if (channel.type !== ChannelType.GuildText) return false;
        const metadata = parseTopic(channel.topic);
        return metadata &&
            metadata.ownerId === ownerId &&
            metadata.type === type;
    });
}

async function openTicket(interaction, type) {
    await interaction.deferReply({ ephemeral: true });

    try {
        const guild = interaction.guild;
        const user = interaction.user;
        const settings = TICKET_TYPES[type];

        if (!settings) throw new Error("Categoria inválida.");

        await validateRoles(guild, settings.staff);

        const existing = await findExistingTicket(guild, user.id, type);
        if (existing) {
            return interaction.editReply({
                content: `Você já possui um ticket aberto: ${existing}`
            });
        }

        const permissions = [
            {
                id: guild.id,
                deny: [PermissionFlagsBits.ViewChannel]
            },
            {
                id: user.id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.AttachFiles,
                    PermissionFlagsBits.EmbedLinks
                ]
            },
            {
                id: client.user.id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.ManageChannels
                ]
            },
            ...settings.staff.map(roleId => ({
                id: roleId,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory
                ]
            }))
        ];

        const username = user.username
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "")
            .slice(0, 35) || "usuario";

        let parent = null;
        if (config.TICKET_CATEGORY_ID) {
            parent = await guild.channels.fetch(config.TICKET_CATEGORY_ID);
            if (!parent || parent.type !== ChannelType.GuildCategory) {
                throw new Error("Categoria de tickets inválida.");
            }
        }

        const channel = await guild.channels.create({
            name: `ticket-${type}-${username}`.slice(0, 100),
            type: ChannelType.GuildText,
            topic: makeTopic(user.id, type),
            permissionOverwrites: permissions,
            parent: parent?.id || undefined,
            reason: `Ticket aberto por ${user.tag}`
        });

        tickets[channel.id] = {
            guildId: guild.id,
            ownerId: user.id,
            type,
            claimedBy: "-"
        };
        saveTickets();

        const embed = new EmbedBuilder()
            .setColor("#2ECC71")
            .setTitle(`${settings.emoji} ${settings.name}`)
            .setDescription([
                `Olá ${user}! Seu atendimento foi criado.`,
                "",
                `**Categoria:** ${settings.name}`,
                "**Responsável:** Aguardando atendimento",
                "",
                "Descreva abaixo o motivo do seu contato.",
                "Um membro da equipe irá atendê-lo em breve."
            ].join("\\n"))
            .addFields(
                {
                    name: "👤 Autor do ticket",
                    value: `${user.tag} (${user.id})`
                },
                {
                    name: "📌 Status",
                    value: "Aguardando atendimento"
                }
            )
            .setFooter({ text: "Sistema de Tickets • Roleplay" })
            .setTimestamp();

        await channel.send({
            content: `${user}`,
            embeds: [embed],
            components: ticketComponents(false),
            allowedMentions: { users: [user.id] }
        });

        return interaction.editReply({
            content: `✅ Seu ticket foi criado com sucesso: ${channel}`
        });
    } catch (error) {
        console.error("Erro ao abrir ticket:", error);
        return interaction.editReply({
            content: "❌ Não foi possível criar seu ticket. Verifique as permissões do bot e os cargos configurados."
        });
    }
}

async function claimTicket(interaction) {
    const channel = interaction.channel;

    if (claimLocks.has(channel.id)) {
        return interaction.reply({
            content: "⏳ Este ticket está sendo reivindicado.",
            ephemeral: true
        });
    }

    claimLocks.add(channel.id);

    try {
        const metadata = parseTopic(channel.topic);
        if (!metadata) {
            return interaction.reply({
                content: "❌ Este canal não é um ticket válido.",
                ephemeral: true
            });
        }

        if (interaction.user.id === metadata.ownerId) {
            return interaction.reply({
                content: "❌ Você não pode reivindicar seu próprio ticket.",
                ephemeral: true
            });
        }

        const settings = TICKET_TYPES[metadata.type];
        if (!settings) {
            return interaction.reply({
                content: "❌ Categoria de ticket inválida.",
                ephemeral: true
            });
        }

        if (!memberHasRole(interaction.member, settings.staff)) {
            return interaction.reply({
                content: "❌ Você não tem autorização para reivindicar este ticket.",
                ephemeral: true
            });
        }

        if (metadata.claimedBy !== "-") {
            return interaction.reply({
                content: `❌ Este ticket já foi reivindicado por <@${metadata.claimedBy}>.`,
                ephemeral: true
            });
        }

        await channel.setTopic(
            makeTopic(metadata.ownerId, metadata.type, interaction.user.id)
        );

        tickets[channel.id] = {
            guildId: interaction.guildId,
            ownerId: metadata.ownerId,
            type: metadata.type,
            claimedBy: interaction.user.id
        };
        saveTickets();

        await interaction.update({
            components: ticketComponents(true)
        });

        await channel.send({
            content: `🙋 **Atendimento assumido por ${interaction.user}!**`,
            allowedMentions: { users: [interaction.user.id] }
        });
    } catch (error) {
        console.error("Erro ao reivindicar:", error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: "❌ Erro ao reivindicar o ticket.",
                ephemeral: true
            }).catch(() => {});
        }
    } finally {
        claimLocks.delete(channel.id);
    }
}

async function closeTicket(interaction) {
    const channel = interaction.channel;
    const metadata = parseTopic(channel.topic);

    if (!metadata) {
        return interaction.reply({
            content: "❌ Este canal não é um ticket válido.",
            ephemeral: true
        });
    }

    const settings = TICKET_TYPES[metadata.type];
    if (!settings) {
        return interaction.reply({
            content: "❌ Categoria inválida.",
            ephemeral: true
        });
    }

    const isOwner = interaction.user.id === metadata.ownerId;
    const isStaff = memberHasRole(interaction.member, settings.staff);

    if (!isOwner && !isStaff) {
        return interaction.reply({
            content: "❌ Você não pode fechar este ticket.",
            ephemeral: true
        });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
        delete tickets[channel.id];
        saveTickets();

        await channel.delete(`Ticket fechado por ${interaction.user.tag}`);
        // O canal é removido, portanto a resposta ephemeral pode não ser necessária.
    } catch (error) {
        console.error("Erro ao fechar ticket:", error);
        await interaction.editReply({
            content: "❌ Não foi possível fechar o ticket. Verifique as permissões do bot."
        }).catch(() => {});
    }
}

client.once(Events.ClientReady, async () => {
    console.log(`Bot conectado como ${client.user.tag}`);
    await reconcileTickets();
});

client.on(Events.InteractionCreate, async interaction => {
    try {
        if (interaction.isChatInputCommand()) {
            if (interaction.commandName !== "painel") return;

            const subcommand = interaction.options.getSubcommand();

            if (subcommand === "ticket") {
                return interaction.reply(createTicketPanel());
            }

            if (subcommand === "xfacc") {
                return interaction.reply(createXfaccPanel());
            }
        }

        if (interaction.isStringSelectMenu() &&
            interaction.customId === "ticket_select") {
            const type = interaction.values[0];

            if (!TICKET_TYPES[type] || type === "xfacc") {
                return interaction.reply({
                    content: "❌ Categoria inválida.",
                    ephemeral: true
                });
            }

            return openTicket(interaction, type);
        }

        if (interaction.isButton()) {
            if (interaction.customId === "open_xfacc") {
                return openTicket(interaction, "xfacc");
            }
            if (interaction.customId === "ticket_claim") {
                return claimTicket(interaction);
            }
            if (interaction.customId === "ticket_close") {
                return closeTicket(interaction);
            }
        }
    } catch (error) {
        console.error("Erro na interação:", error);

        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: "❌ Ocorreu um erro inesperado.",
                ephemeral: true
            }).catch(() => {});
        }
    }
});

client.login(config.TOKEN);
