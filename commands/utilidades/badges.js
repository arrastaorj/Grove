const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ComponentType
} = require("discord.js")


const client = require("../../index")
const comandos = require("../../database/models/comandos")

const collectors = new Map(); // Armazenar coletores ativos


module.exports = {
    data: new SlashCommandBuilder()
        .setName('badges')
        .setDescription('Veja todas as insígnias que os membros possuem neste servidor'),

    async execute(interaction) {

        const canalID = await comandos.findOne({ guildId: interaction.guild.id });

        // Verifica se o resultado da consulta é null
        if (!canalID) {
            return interaction.reply({
                content: `> \`-\` <a:alerta:1163274838111162499> Um administrador ainda não configurou o canal para a utilização dos comandos.`,
                ephemeral: true
            });
        }

        // Desestruturação para obter canal1
        const { canal1: canalPermitido } = canalID;


        // Verifica se o canal foi cadastrado ou foi resetado
        if (!canalPermitido) {
            return interaction.reply({
                content: `> \`-\` <a:alerta:1163274838111162499> Um administrador ainda não configurou o canal para a utilização dos comandos.`,
                ephemeral: true
            });
        }

        if (interaction.channel.id !== canalPermitido) {
            return interaction.reply({
                content: `> \`-\` <a:alerta:1163274838111162499> Você está tentando usar um comando no canal de texto errado, tente usá-lo no canal correto. <#${canalPermitido}>.`,
                ephemeral: true
            });
        }

        const userId = interaction.user.id;
        // Verificar se já existe um coletor ativo para o usuário
        if (collectors.has(userId)) {
            const { timeout, startTime } = collectors.get(userId);
            const timeElapsed = Date.now() - startTime;
            const timeRemaining = timeout - timeElapsed;

            // Convertendo o tempo restante para segundos
            const secondsRemaining = Math.ceil(timeRemaining / 1000);

            return interaction.reply({
                content: `\`-\` <a:alerta:1163274838111162499> Você já iniciou uma solicitação com o sistema de AutoRole. Aguarde ${secondsRemaining} segundos antes de tentar novamente.`,
                ephemeral: true
            })
        }

        let counts = {};

        // Contando as insígnias dos membros
        for (const member of interaction.guild.members.cache.values()) {
            const user = await client.users.fetch(member.user.id);
            const badges = user.flags?.toArray() || [];
            badges.forEach(badge => counts[badge] = (counts[badge] || 0) + 1);

        }

        function generateBadgeDescription(counts) {
            return `
                <:discordstaff:1285332089176195164> Discord Staff: \`${counts['Staff'] || 0}\`
                <:discordpartner:1285332063574036584> Partner: \`${counts['Partner'] || 0}\`
                <:olddiscordmod:1285332360191017122> Certified Moderator: \`${counts['CertifiedModerator'] || 0}\`
                <:hypesquadevents:1285332266419224586> HypeSquad Events: \`${counts['Hypesquad'] || 0}\`
                <:hypesquadbravery:1285332158306717749> HypeSquad Bravery: \`${counts['HypeSquadOnlineHouse1'] || 0}\`
                <:hypesquadbrilliance:1285332237071679582> HypeSquad Brilliance: \`${counts['HypeSquadOnlineHouse2'] || 0}\`
                <:hypesquadbalance:1285332202111893595> HypeSquad Balance: \`${counts['HypeSquadOnlineHouse3'] || 0}\`
                <:discordbughunter1:1285331941037572116> Bug Hunter: \`${counts['BugHunterLevel1'] || 0}\`
                <:discordbughunter2:1285331960905859203> Bug Hunter Gold: \`${counts['BugHunterLevel2'] || 0}\`
                <:activedeveloper:1285331864848175175> Active Developer: \`${counts['ActiveDeveloper'] || 0}\`
                <:discordbotdev:1285331912763900006> Early Verified Bot Developer: \`${counts['VerifiedDeveloper'] || 0}\`
                <:discordearlysupporter:1285331982045282325> Early Supporter: \`${counts['PremiumEarlySupporter'] || 0}\`
                <:VerifiedApp:1285332872173191188> Bot Verificado: \`${counts['VerifiedBot'] || 0}\``
        }

        // Criando embed de exibição das insígnias
        const embed1 = new EmbedBuilder()
            .setColor("#ba68c8")
            .setAuthor({ name: `Badges - ${interaction.guild.name}`, iconURL: client.user.displayAvatarURL() })
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setDescription(generateBadgeDescription(counts))

        const menu = new StringSelectMenuBuilder()
            .setCustomId("badges")
            .setPlaceholder("Badges")
            .addOptions(
                Object.entries(counts).map(([key, value]) => ({
                    label: `${key} (${value})`,
                    emoji: getEmojiForBadge(key), // Adicione uma função para obter o emoji correto
                    value: key,
                }))
            );

        const row = new ActionRowBuilder().addComponents(menu);

        const msg = await interaction.reply({ embeds: [embed1], components: [row] });

        const timeoutDuration = 60000; // 60 segundos
        const startTime = Date.now(); // Marca o momento em que o coletor foi iniciado
        const filter = i => i.user.id === interaction.user.id;


        // Coletor para interações com o menu de seleção
        const collector = msg.createMessageComponentCollector({ componentType: ComponentType.StringSelect, filter, time: timeoutDuration })

        // Armazenar o coletor no Map com o tempo de início e duração
        collectors.set(userId, { collector, timeout: timeoutDuration, startTime });

        collector.on('collect', async (interaction) => {

            const badgeType = interaction.values[0];
            const members = interaction.guild.members.cache
                .filter(member => member.user.flags?.toArray().includes(badgeType))
                .map(member => member.user.username);

            const description = members.length > 0
                ? `Usuários com este emblema dentro do servidor:\n\n> ${members.join('\n> ')}`
                : `Nenhum membro encontrado`;

            const embed = new EmbedBuilder()
                .setColor("#ba68c8")
                .setTitle(`${getEmojiForBadge(badgeType)} ${badgeType} (${counts[badgeType] || 0})`)
                .setDescription(description);

            await interaction.reply({ embeds: [embed], ephemeral: true });

        })
        collector.on('end', async (collected, reason) => {
            const originalMessage = await interaction.fetchReply().catch(() => null);

            if (!originalMessage) {
                return collectors.delete(userId)
            }

            if (reason === 'time') {
                await interaction.editReply({
                    components: []
                });
            } else {
                await interaction.editReply({
                    components: []
                });
            }

            collectors.delete(userId)
        })
    }
}

function getEmojiForBadge(badge) {
    const badgeEmojis = {

        'Partner': '<:discordpartner:1285332063574036584>',
        'CertifiedModerator': '<:olddiscordmod:1285332360191017122>',
        'Hypesquad': '<:hypesquadevents:1285332266419224586>',
        'HypeSquadOnlineHouse1': '<:hypesquadbravery:1285332158306717749>',
        'HypeSquadOnlineHouse2': '<:hypesquadbrilliance:1285332237071679582>',
        'HypeSquadOnlineHouse3': '<:hypesquadbalance:1285332202111893595>',
        'BugHunterLevel1': '<:discordbughunter1:1285331941037572116>',
        'BugHunterLevel2': '<<:discordbughunter2:1285331960905859203>',
        'ActiveDeveloper': '<:activedeveloper:1285331864848175175>',
        'VerifiedDeveloper': '<:discordbotdev:1285331912763900006>',
        'PremiumEarlySupporter': '<:discordearlysupporter:1285331982045282325>',
        'VerifiedBot': '<:VerifiedApp:1285332872173191188>',
    };
    return badgeEmojis[badge] || '❓'; // Retorna um emoji padrão caso o badge não esteja mapeado
}
