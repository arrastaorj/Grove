const {
    SlashCommandBuilder,
    EmbedBuilder

} = require('discord.js')

const client = require("../../index")
const comandos = require("../../database/models/comandos")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tapa')
        .setDescription('Dê um tapa em um usuário.')
        .addUserOption(option =>
            option
                .setName("usuário")
                .setDescription("O usuário que deseja dar um tapa.")
                .setRequired(true)
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

            const user = interaction.options.getUser('usuário');

            // Lista de URLs de GIFs de tapa
            const gifs = [
                'https://i.imgur.com/fm49srQ.gif',
                'https://i.imgur.com/4MQkDKm.gif',
                'https://i.imgur.com/o2SJYUS.gif',
                'https://i.imgur.com/oOCq3Bt.gif',
                'https://i.imgur.com/Agwwaj6.gif',
                'https://i.imgur.com/YA7g7h7.gif',
                'https://i.imgur.com/mIg8erJ.gif',
                'https://i.imgur.com/oRsaSyU.gif',
                'https://i.imgur.com/kSLODXO.gif',
                'https://i.imgur.com/CwbYjBX.gif'
            ];

            // Selecionar um GIF aleatório
            const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

            // Criar a embed com o GIF
            const embed = new EmbedBuilder()
                .setColor("#ba68c8")
                .setDescription(`${interaction.user} deu um tapa em ${user}!`)
                .setImage(randomGif);

            // Enviar a embed como resposta
            await interaction.reply({ embeds: [embed] });


        }
        else if (interaction.channel.id !== cmd1) {
            interaction.reply({
                content: `> \`-\` <a:alerta:1163274838111162499> Você está tentando usar um comando no canal de texto errado, tente usá-lo no canal correto. <#${cmd1}>.`,
                ephemeral: true
            })
        }


    }
}
