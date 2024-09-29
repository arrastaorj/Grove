const {
    SlashCommandBuilder,
    AttachmentBuilder

} = require('discord.js')

const client = require("../../index")
const canvafy = require("canvafy")
const comandos = require("../../database/models/comandos")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tweet')
        .setDescription('Gera uma imagem de estilo tweet com o comentário do usuário.')
        .addStringOption(option =>
            option
                .setName("comentário")
                .setDescription("O comentário para o tweet.")
                .setRequired(true)
        )
        .addUserOption(option =>
            option
                .setName("usuário")
                .setDescription("O usuário para exibir o tweet.")
                .setRequired(true)
        ),

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

        // Obtendo o usuário mencionado ou o próprio autor
        const user = interaction.options.getUser("usuário") || interaction.user;

        // Comentário fornecido pelo usuário
        const comment = interaction.options.getString("comentário");

        // URL do avatar do usuário
        const avatarURL = user.displayAvatarURL({ format: 'png', size: 1024 });

        // Criando a imagem de estilo Tweet usando Canvafy
        const tweetCard = await new canvafy.Tweet()
            .setTheme("dim")  // Tema escuro
            .setUser({ displayName: user.username, username: user.username })
            .setVerified(true)  // Definindo o usuário como verificado
            .setComment(comment)  // Comentário personalizado do usuário
            .setAvatar(avatarURL)  // Avatar do usuário
            .build();

        // Convertendo a imagem em um attachment para enviar no Discord
        const attachment = new AttachmentBuilder(tweetCard, { name: "tweet.png" });

        // Respondendo a interação com a imagem gerada
        await interaction.reply({ files: [attachment] });

    }
}
