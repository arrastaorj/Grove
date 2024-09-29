const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ComponentType
} = require("discord.js")


const client = require("../../index")
const comandos = require("../../database/models/comandos")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('badges')
        .setDescription('Veja todas as insígnias que os membros possuem neste servidor'),

    async execute(interaction) {

        const cmd = await comandos.findOne({ guildId: interaction.guild.id });

        if (!cmd) {
            return interaction.reply({ content: `> \`-\` <a:alerta:1163274838111162499> Um Adminitrador ainda não configurou o canal para uso de comandos!`, ephemeral: true });
        }

        const cmd1 = cmd.canal1;
        if (!cmd1 || !client.channels.cache.get(cmd1) || cmd1 === interaction.channel.id) {


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

            // Coletor para interações com o menu de seleção
            const collector = msg.createMessageComponentCollector({ componentType: ComponentType.StringSelect });

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

            });
        } else {
            interaction.reply({ content: `> \`-\` <a:alerta:1163274838111162499> Você está tentando usar um comando no canal de texto errado, tente usá-lo no canal correto. <#${cmd1}>.`, ephemeral: true });
        }
    },
};

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
