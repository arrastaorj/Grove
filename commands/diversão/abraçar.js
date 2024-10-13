const {
    SlashCommandBuilder,
    EmbedBuilder,

} = require('discord.js');

const client = require("../../index");
const comandos = require("../../database/models/comandos");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('abraçar')
        .setDescription('Dê um abraço em um usuário.')
        .addUserOption(option =>
            option
                .setName("usuário")
                .setDescription("O usuário que deseja abraçar.")
                .setRequired(true)
        ),

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

        const user = interaction.options.getUser('usuário')

        // Lista de URLs de GIFs de abraçar
        const gifs = [
            'https://i.gifer.com/Yx3F.gif',
            'https://i.gifer.com/DVYy.gif',
            'https://i.gifer.com/8TTN.gif',
            'https://i.gifer.com/UHIY.gif',
            'https://i.gifer.com/Tr6r.gif',
            'https://i.gifer.com/9rYi.gif',
            'https://i.gifer.com/DLqn.gif',
            'https://i.gifer.com/1oZV.gif',
            'https://i.gifer.com/EBW.gif',
            'https://i.gifer.com/KaPD.gif',
            'https://i.gifer.com/KXuw.gif',
            'https://i.gifer.com/JrKm.gif',
            'https://i.gifer.com/VoAe.gif',
            'https://i.gifer.com/YUvi.gif',
            'https://i.gifer.com/Ptwo.gif',
            'https://i.gifer.com/F0.gif',
            'https://i.gifer.com/Dw64.gif',
            'https://i.gifer.com/9vG0.gif',
            'https://i.gifer.com/4Pla.gif',
            'https://i.gifer.com/9VF.gif'
        ];

        // Selecionar um GIF aleatório
        const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

        // Criar a embed com o GIF
        const embed = new EmbedBuilder()
            .setColor("#FFC0CB")
            .setDescription(`${interaction.user} deu um abraço em ${user}!`)
            .setImage(randomGif);

        // Enviar a embed como resposta
        await interaction.reply({ embeds: [embed] });


    }
}
