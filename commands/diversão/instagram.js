const {
    SlashCommandBuilder,
    AttachmentBuilder

} = require('discord.js')

const client = require("../../index")
const canvafy = require("canvafy")
const comandos = require("../../database/models/comandos")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('instagram')
        .setDescription('Exibe uma imagem de estilo Instagram com a foto do usuário.')
        .addUserOption(option =>
            option
                .setName("usuário")
                .setDescription("O usuário para exibir a imagem.")
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


        // Obtendo o usuário mencionado ou o próprio autor
        const user = interaction.options.getUser("usuário") || interaction.user;

        // URL do avatar do usuário
        const avatarURL = user.displayAvatarURL({ format: 'png', size: 1024 });

        // Gerando números aleatórios para curtidas
        const randomLikes = Math.floor(Math.random() * (5000 - 100 + 1)) + 100; // Entre 100 e 5000 curtidas

        // Criando a imagem de estilo Instagram usando Canvafy
        const instagramCard = await new canvafy.Instagram()
            .setTheme("dark") // Tema claro
            .setUser({ username: user.username })
            .setLike({ count: randomLikes, likeText: "likes" })  // Número de curtidas aleatório
            .setVerified(true)  // Definindo como verificado
            .setStory(true)  // Indica que o usuário tem story ativo
            .setPostDate(Date.now() - 1000 * 60 * 60 * 24 * 2)  // Post de 2 dias atrás
            .setAvatar(avatarURL)  // Avatar do usuário
            .setPostImage(avatarURL)  // Você pode usar um link de imagem fixo ou dinâmico
            .setLiked(true)  // Indica que a postagem foi curtida
            .setSaved(true)  // Indica que a postagem foi salva
            .build();

        // Convertendo a imagem em um attachment para enviar no Discord
        const attachment = new AttachmentBuilder(instagramCard, { name: "instagram.png" });

        // Respondendo a interação com a imagem gerada
        await interaction.reply({ files: [attachment] })

    }
}
