const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder
} = require('discord.js')

const fs = require('fs')
const comandos = require("../../database/models/comandos.js")
const client = require("../../index")
module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Veja todos os meus comandos disponíveis.'),

    async execute(interaction) {

        const canalID = await comandos.findOne({ guildId: interaction.guild.id });

        // Verifica se o resultado da consulta é null
        if (!canalID) {
            return interaction.reply({
                content: `> \`-\` <:NA_Intr004:1289442144255213618> Um administrador ainda não configurou o canal para a utilização dos comandos.`,
                ephemeral: true
            });
        }

        // Desestruturação para obter canal1
        const { canal1: canalPermitido } = canalID;


        // Verifica se o canal foi cadastrado ou foi resetado
        if (!canalPermitido) {
            return interaction.reply({
                content: `> \`-\` <:NA_Intr004:1289442144255213618> Um administrador ainda não configurou o canal para a utilização dos comandos.`,
                ephemeral: true
            });
        }

        if (interaction.channel.id !== canalPermitido) {
            return interaction.reply({
                content: `> \`-\` <:NA_Intr004:1289442144255213618> Você está tentando usar um comando no canal de texto errado, tente usá-lo no canal correto. <#${canalPermitido}>.`,
                ephemeral: true
            });
        }


        const optionsArr = []

        const commandsFolder = fs.readdirSync('./commands')
        for (const category of commandsFolder) {
            optionsArr.push({ label: `${category}`, description: `Veja os comandos de ${category}`, value: `${category}` })
        }

        const embed = new EmbedBuilder()
            .setTitle(`Central de Ajuda`)
            .setColor("#ba68c8")
            .setDescription(`Clique em uma das opções abaixo para ver meus comandos.`)

        const menu = new ActionRowBuilder()
            .setComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('menu-help')
                    .addOptions(optionsArr)
            )

        await interaction.reply({ embeds: [embed], components: [menu] }).then(async (msg) => {

            const collector = msg.createMessageComponentCollector({ time: 60000 })

            collector.on('collect', async (i) => {


                if (i.user.id != interaction.user.id) return i.reply({
                    content: `> \`-\` <:NA_Intr004:1289442144255213618> Somente a pessoa que executou o comando (\`${interaction.user.tag}\`) pode interagir com ele.`,
                    ephemeral: true
                });

                i.deferUpdate();
                const selected = i.values[0]
                const commandsArr = []
                const commandsFiles = fs.readdirSync(`./commands/${selected}`)

                for (const command of commandsFiles) {
                    if (command.endsWith('.js')) {
                        commandsArr.push(command.replace(/.js/g, ''))
                    }
                }

                embed.setDescription(`Veja os comandos da categoria} ${selected}`)
                embed.setFields([
                    { name: `Comandos (/)`, value: `\`\`\`${commandsArr.join(', ')}\`\`\`` }
                ])

                interaction.editReply({ embeds: [embed] })
            })
        })
    }
}
