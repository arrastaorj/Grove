const {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
} = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sugestão')
        .setDescription('Envie uma sugestão para nossa equipe.'),


    async execute(interaction) {

        const modal = new ModalBuilder()
            .setCustomId('modal_sugestao')
            .setTitle(`dfgdfg`)
        const sugestao3 = new TextInputBuilder()
            .setCustomId('sugestão')
            .setLabel(`dfgdfgdf`)
            .setStyle(TextInputStyle.Paragraph)

        const firstActionRow = new ActionRowBuilder().addComponents(sugestao3)
        modal.addComponents(firstActionRow)
        await interaction.showModal(modal)

    }
}
