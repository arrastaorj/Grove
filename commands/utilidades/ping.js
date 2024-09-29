const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js')

const client = require("../../index")
const comandos = require("../../database/models/comandos")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Responde com Pong!'),

    async execute(interaction) {

        const canalID = await comandos.findOne({
            guildId: interaction.guild.id
        })
        if (!canalID) return interaction.reply({
            content: `> \`-\` <a:alerta:1163274838111162499> Um Adminitrador ainda não configurou o canal para uso de comandos!`,
            ephemeral: true
        })

        let canalPermitido = canalID.canal1
        if (interaction.channel.id !== canalPermitido) {
            return interaction.reply({
                content: `> \`-\` <a:alerta:1163274838111162499> Você está tentando usar um comando no canal de texto errado, tente usá-lo no canal correto. <#${canalPermitido}>.`,
                ephemeral: true
            })
        }

        // Criar um embed para a resposta
        const pingEmbed = new EmbedBuilder()
            .setColor('#0099FF') // Cor do embed
            .setDescription(`> \`+\` 👋 Olá ${interaction.user}, meu **ping** está em \`${client.ws.ping}ms\` e minha **latencia** está em \`${Date.now() - interaction.createdTimestamp}ms\``)

            .setTimestamp();

        // Responder com o embed
        await interaction.reply({ embeds: [pingEmbed], ephemeral: true })

    }
}
