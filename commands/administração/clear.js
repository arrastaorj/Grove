const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    PermissionsBitField,
    EmbedBuilder
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Limpe as mensagens de um chat.')
        .addIntegerOption(option =>
            option.setName('numero')
                .setDescription('O número de mensagens a serem limpas (máximo 100)')
                .setRequired(true)
        ),

    async execute(interaction) {

        const messageCount = interaction.options.getInteger('numero')


        if (messageCount < 1 || messageCount > 100) {
            return interaction.reply({ content: `> \`-\` <:NA_Intr004:1289442144255213618> Ocorreu um erro inesperado, Você precisa fornecer um numero de 1 a 100`, ephemeral: true })
        }

        // Verificação de permissões
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return await interaction.reply({
                content: `> \`-\` <:NA_Intr004:1289442144255213618> Não posso concluir este comando pois você não possui permissão.`,
                ephemeral: true
            });
        }

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({
                content: `> \`-\` <:NA_Intr004:1289442144255213618> Não posso concluir o comando pois não recebi permissão para gerenciar este servidor (Administrador)`,
                ephemeral: true
            });
        }


        try {

            const messagesToDelete = await interaction.channel.messages.fetch({ limit: messageCount })

            const deletableMessages = messagesToDelete.filter(message => {
                const daysAgo = (Date.now() - message.createdTimestamp) / (1000 * 60 * 60 * 24)
                return !message.pinned && daysAgo <= 14
            })

            if (deletableMessages.size === 0) {
                return interaction.reply({ content: `> \`-\` <:NA_Intr004:1289442144255213618> Não há mensagens a serem excluídas, pois todas estão fixadas ou têm mais de 14 dias.`, ephemeral: true })
            }

            await interaction.channel.bulkDelete(messagesToDelete, true)


            const deletedCount = deletableMessages.size
            const notDeletedCount = messageCount - deletedCount

            let responseMessage = ''

            if (deletedCount === 1) {
                responseMessage = `Uma mensagem foi removida com sucesso.`
            } else if (deletedCount > 1) {
                responseMessage = `${deletedCount} mensagens foram removidas com sucesso.`
            }

            if (notDeletedCount === 1) {
                responseMessage += `<:NA_Intr004:1289442144255213618> Além disso, uma mensagem não pôde ser removida por ser mais antiga do que 14 dias.`
            } else if (notDeletedCount > 1) {
                responseMessage += `<:NA_Intr004:1289442144255213618> Além disso, ${notDeletedCount} mensagens não puderam ser removidas por serem mais antigas do que 14 dias.`
            }

            const embed = new EmbedBuilder()
                .setTitle('Relatório de Exclusões')
                .setDescription(`> \`+\` **${responseMessage}**`)
                .setTimestamp()
                .setFooter({ text: `Limpado por: ${interaction.member.user.username}`, iconURL: interaction.member.displayAvatarURL({ dynamic: true }) })
                .setColor('#41b2b0')

            interaction.reply({ embeds: [embed], ephemeral: true })

        } catch (error) {
            interaction.reply({
                content: `> \`-\` <:NA_Intr004:1289442144255213618> O Discord não permite a exclusão de mensagens com mais de 14 dias`,
                ephemeral: true,
            })
        }

    }
}
