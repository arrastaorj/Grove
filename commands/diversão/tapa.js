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
        await interaction.reply({ embeds: [embed] })
    }
}
