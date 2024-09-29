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
        const cmd = await comandos.findOne({
            guildId: interaction.guild.id
        });

        if (!cmd) {
            return interaction.reply({
                content: `> \`-\` <a:alerta:1163274838111162499> Um administrador ainda não configurou o canal para uso de comandos!`,
                ephemeral: true
            });
        }

        let cmd1 = cmd.canal1;

        if (cmd1 === null || cmd1 === false || !client.channels.cache.get(cmd1) || cmd1 === interaction.channel.id) {
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
        } else if (interaction.channel.id !== cmd1) {
            interaction.reply({
                content: `> \`-\` <a:alerta:1163274838111162499> Você está tentando usar um comando no canal de texto errado, tente usá-lo no canal correto: <#${cmd1}>.`,
                ephemeral: true
            });
        }
    }
};
