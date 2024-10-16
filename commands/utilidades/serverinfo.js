const {
    SlashCommandBuilder,
    EmbedBuilder,
    ChannelType
} = require('discord.js');

const client = require("../../index");
const comandos = require("../../database/models/comandos");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server')
        .setDescription('Veja as informações do servidor.')
        .addSubcommand(subcommand =>
            subcommand
                .setName("info")
                .setDescription("Veja as informações do servidor.")
        ),

    async execute(interaction) {

        // Verifica se o canal correto foi configurado
        const canalID = await comandos.findOne({ guildId: interaction.guild.id });
        if (!canalID || !canalID.canal1) {
            return interaction.reply({
                content: `> \`-\` <:NA_Intr004:1289442144255213618> Um administrador ainda não configurou o canal para a utilização dos comandos.`,
                ephemeral: true
            });
        }

        const canalPermitido = canalID.canal1;
        if (interaction.channel.id !== canalPermitido) {
            return interaction.reply({
                content: `> \`-\` <:NA_Intr004:1289442144255213618> Você está tentando usar um comando no canal de texto errado, tente usá-lo no canal correto. <#${canalPermitido}>.`,
                ephemeral: true
            });
        }

        const { guild } = interaction;

        const {
            createdTimestamp,
            ownerId,
            description,
            members,
            memberCount,
            channels,
        } = guild;

        const botcount = members.cache.filter((member) => member.user.bot).size;
        const getChannelTypeSize = (type) => channels.cache.filter((channel) => type.includes(channel.type)).size;

        const totalchannels = getChannelTypeSize([
            ChannelType.GuildText,
            ChannelType.GuildVoice,
            ChannelType.GuildStageVoice,
            ChannelType.GuildPublicThread,
            ChannelType.GuildPrivateThread,
            ChannelType.GuildForum,
            ChannelType.GuildNews,
            ChannelType.GuildCategory,
            ChannelType.GuildNewsThread,
        ]);

        const embed = new EmbedBuilder()
            .setColor("#ba68c8")
            .setImage(guild.bannerURL({ size: 1024 }))
            .setAuthor({ name: guild.name, iconURL: guild.iconURL({ dynamic: true }) })
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                {
                    name: `📝 Descrição`,
                    value: `${guild.description || `Não possui`}`
                },
                {
                    name: `📊 Informações Gerais`,
                    value: [
                        `**Nome:** ${guild.name}`,
                        `**ID:** \`\`${guild.id}\`\``,
                        `**Criado em:** <t:${~~(createdTimestamp / 1000)}> (<t:${~~(createdTimestamp / 1000)}:R>)`,
                        `**Dono:** <@${ownerId}>`,
                        `**URL:** \`\`${guild.vanityURLCode || `Não possui`}\`\``,
                    ].join("\n")
                },
                {
                    name: `📚 Canais (${totalchannels})`,
                    value: [
                        `📝 Texto: ${getChannelTypeSize([ChannelType.GuildText, ChannelType.GuildForum, ChannelType.GuildNews])}`,
                        `🔊 Voz: ${getChannelTypeSize([ChannelType.GuildStageVoice, ChannelType.GuildVoice])}`,
                        `📌 Tópicos: ${getChannelTypeSize([ChannelType.GuildPublicThread, ChannelType.GuildPrivateThread, ChannelType.GuildNewsThread])}`,
                        `📂 Categorias: ${getChannelTypeSize([ChannelType.GuildCategory])}`
                    ].join("\n"),
                    inline: true,
                },
                {
                    name: `🚀 Objetivos do servidor`,
                    value: [
                        `**Nível de impulso:** ${guild.premiumTier}`,
                        `**Total de impulsos:** ${guild.premiumSubscriptionCount}`,
                    ].join("\n"),
                    inline: true,
                },
                {
                    name: `👥 Membros`,
                    value: [
                        `**Usuários:** ${guild.memberCount - botcount}`,
                        `**Bots:** ${botcount}`,
                    ].join("\n"),
                    inline: true,
                },
                { name: `🎨 Banner do servidor`, value: guild.bannerURL() ? "** **" : `Esse servidor não possui um banner` }
            );

        await interaction.reply({ embeds: [embed] });

    }
}
