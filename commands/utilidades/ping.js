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

        const cmd = await comandos.findOne({
            guildId: interaction.guild.id
        })

        let cmd1 = cmd.canal1

        if (cmd1 === null || cmd1 === false || !client.channels.cache.get(cmd1) || cmd1 === interaction.channel.id) {
            // Criar um embed para a resposta
            const pingEmbed = new EmbedBuilder()
                .setColor('#0099FF') // Cor do embed
                .setDescription(`> \`+\` 👋 Olá ${interaction.user}, meu **ping** está em \`${client.ws.ping}ms\` e minha **latencia** está em \`${Date.now() - interaction.createdTimestamp}ms\``)

                .setTimestamp();

            // Responder com o embed
            await interaction.reply({ embeds: [pingEmbed], ephemeral: true })

        } else if (interaction.channel.id !== cmd1) {
            interaction.reply({
                content: `> \`-\` <a:alerta:1163274838111162499> Você está tentando usar um comando no canal de texto errado, tente usá-lo no canal correto. <#${cmd1}>.`,
                ephemeral: true
            })
        }

    }
}
