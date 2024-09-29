const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js')
const { readdirSync } = require("fs")
require("moment-duration-format")


const client = require("../../index")
const comandos = require("../../database/models/comandos")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('grove')
        .setDescription('Veja as informações sobre minha vida.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Veja as informações sobre minha vida.')
        ),

    async execute(interaction) {

        const cmd = await comandos.findOne({
            guildId: interaction.guild.id
        })

        if (!cmd) return interaction.reply({
            content: `> \`-\` <a:alerta:1163274838111162499> Um Adminitrador ainda não configurou o canal para uso de comandos!`,
            ephemeral: true
        })


        let cmd1 = cmd.canal1

        if (cmd1 === null || cmd1 === true || !client.channels.cache.get(cmd1) || cmd1 === interaction.channel.id) {

            function formatTime(milliseconds) {
                const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
                const hours = Math.floor(milliseconds / (1000 * 60 * 60) % 24);
                const minutes = Math.floor(milliseconds / (1000 * 60) % 60);
                const seconds = Math.floor(milliseconds / 1000 % 60);

                return `${days}d, ${hours}h, ${minutes}m, ${seconds}s`;
            }


            var commands = []
            readdirSync("././commands/").forEach((dir) => {
                var dircmds = readdirSync(`././commands/${dir}/`).filter((file) =>
                    file.endsWith(".js")
                );

                commands = commands.concat(dircmds)
            })

            const embed = new EmbedBuilder()
                .setAuthor({ name: `Olá, eu sou a Grove. Prazer em conhecê-lo! ✨`, iconURL: client.user.displayAvatarURL() })
                .setColor("#ba68c8")
                .setTitle("Informações sobre mim")
                .setThumbnail(client.user.displayAvatarURL())
                .setDescription(`Atualmente, faço parte de **${client.guilds.cache.size}** servidores e ofereço **${commands.length}** comandos para facilitar sua experiência.

                    Fui criada em <t:${Math.round(client.user.createdTimestamp / 1000)}> com a missão de unificar gerenciamento, administração e utilidades em um só lugar.
                    
                    Atualmente, estou gerenciando **${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)}** membros.`)

                .addFields(
                    {
                        name: `Tempo Online`,
                        value: `${formatTime(client.uptime)}`,
                        inline: true,
                    },
                    {
                        name: `Ping`,
                        value: `${Math.round(client.ws.ping)}ms`,
                        inline: true,
                    },
                )


            interaction.reply({
                embeds: [embed],
                components: [
                    new ActionRowBuilder().addComponents(

                        new ButtonBuilder()
                            .setLabel("Convite")
                            .setURL("https://dsc.gg/grovebot")
                            .setStyle(ButtonStyle.Link),

                        // new ButtonBuilder()
                        //     .setLabel("Website")
                        //     .setURL("https://akaneweb.netlify.app/")
                        //     .setStyle(ButtonStyle.Link),

                        new ButtonBuilder()
                            .setLabel("Top.gg")
                            .setURL("https://top.gg/bot/1053482665942196224/vote")
                            .setStyle(ButtonStyle.Link),

                        new ButtonBuilder()
                            .setLabel("Suporte")
                            .setURL("https://discord.gg/4CB7AjQDAS")
                            .setStyle(ButtonStyle.Link),

                    )
                ]
            })

        }
        else if (interaction.channel.id !== cmd1) {
            interaction.reply({
                content: `> \`-\` <a:alerta:1163274838111162499> Você está tentando usar um comando no canal de texto errado, tente usá-lo no canal correto. <#${cmd1}>.`,
                ephemeral: true
            })
        }

    }
}
