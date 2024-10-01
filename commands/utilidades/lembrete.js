const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js')

const client = require("../../index")
const comandos = require("../../database/models/comandos")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lembrete')
        .setDescription('Define um lembrete para o futuro.')
        .addStringOption(option =>
            option
                .setName("mensagem")
                .setDescription("Mensagem do lembrete.")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName("tempo")
                .setDescription("Tempo em minutos.")
                .setRequired(true)
        ),

    async execute(interaction) {

        const canalID = await comandos.findOne({ guildId: interaction.guild.id });

        // Verifica se o resultado da consulta é null
        if (!canalID) {
            return interaction.reply({
                content: `> \`-\` <a:alerta:1163274838111162499> Um administrador ainda não configurou o canal para a utilização dos comandos.`,
                ephemeral: true
            });
        }

        // Desestruturação para obter canal1
        const { canal1: canalPermitido } = canalID;


        // Verifica se o canal foi cadastrado ou foi resetado
        if (!canalPermitido) {
            return interaction.reply({
                content: `> \`-\` <a:alerta:1163274838111162499> Um administrador ainda não configurou o canal para a utilização dos comandos.`,
                ephemeral: true
            });
        }

        if (interaction.channel.id !== canalPermitido) {
            return interaction.reply({
                content: `> \`-\` <a:alerta:1163274838111162499> Você está tentando usar um comando no canal de texto errado, tente usá-lo no canal correto. <#${canalPermitido}>.`,
                ephemeral: true
            });
        }

        const mensagem = interaction.options.getString('mensagem');
        const tempo = interaction.options.getInteger('tempo');


        // Verificação se o tempo é um número válido
        if (isNaN(tempo) || tempo <= 0) {
            return interaction.reply({
                content: 'O tempo inserido é inválido. Por favor, insira um número positivo válido para os minutos.',
                ephemeral: true
            });
        }

        // Embed de confirmação do lembrete
        const confirmEmbed = new EmbedBuilder()
            .setColor('#ba68c8') // Verde
            .setTitle('Lembrete Definido!')
            .setDescription(`⏳ Irei lembrar você em **${tempo} minutos**.`)
            .addFields(
                { name: '📝 Mensagem', value: mensagem },
                { name: '⌚ Tempo', value: `${tempo} minutos` },
                { name: '👤 Usuário', value: `${interaction.user}` },
            )
            .setFooter({ text: '🔔 Você será notificado em breve!' })
            .setTimestamp();

        // Envia o embed de confirmação ao usuário
        await interaction.reply({
            embeds: [confirmEmbed],
            ephemeral: true
        });

        // Configurar o lembrete
        setTimeout(() => {
            // Embed do lembrete no DM
            const lembreteEmbed = new EmbedBuilder()
                .setColor('#ba68c8') // Laranja
                .setTitle('Seu Lembrete!')
                .setDescription(`🔔 **${mensagem}**`)
                .addFields(
                    { name: '⌛ Tempo Passado', value: `${tempo} minutos` },
                    { name: '📅 Lembrete Definido', value: `<t:${Math.floor(Date.now() / 1000)}:R>` } // Formatação de tempo relativa
                )
                .setFooter({ text: '⏰ Lembre-se de completar sua tarefa!' })
                .setTimestamp();

            // Enviar o lembrete via DM
            interaction.user.send({ embeds: [lembreteEmbed] }).catch(err => {
                console.log("Erro ao enviar DM:", err);
            });
        }, tempo * 60000); // Converter minutos para milissegundos

    }
}
