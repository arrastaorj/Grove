const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js')


module.exports = async (interaction) => {
    if (!interaction.isButton() && !interaction.isModalSubmit()) return;

    const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('ativar')
            .setLabel('Ativar')
            .setStyle(ButtonStyle.Success)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId('desativar')
            .setLabel('Desativar')
            .setStyle(ButtonStyle.Danger)
    );

    const buttons2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('ativar')
            .setLabel('Ativar')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('desativar')
            .setLabel('Desativar')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(true)
    );

    const modal = new ModalBuilder()
        .setCustomId('model')
        .setTitle('Painel SlowMode')
        .setComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('ativarSlow')
                    .setLabel('Tempo de Slow')
                    .setPlaceholder('exemplo: (10 = 10 segundos)')
                    .setMinLength(1)
                    .setMaxLength(5)
                    .setValue('10')
                    .setRequired(true)
                    .setStyle(TextInputStyle.Short)
            )
        );

    // Lógica para os botões
    if (interaction.isButton()) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({
                content: `> \`-\` <a:alerta:1163274838111162499> Você não tem permissão para interagir com os buttons.`,
                ephemeral: true,
            });
        }

        const channel = interaction.channel;

        try {
            // Tenta editar a mensagem, mas se não conseguir, envia uma resposta de erro
            if (interaction.customId === 'desativar') {
                await channel.setRateLimitPerUser(0);
                await interaction.message.edit({ components: [buttons2] });
                return interaction.reply({
                    content: '> `+` Modo lento desativado com sucesso!',
                    ephemeral: true,
                });
            } else if (interaction.customId === 'ativar') {
                await interaction.showModal(modal);
            }
        } catch (error) {
            if (error.code === 10008) {
                return interaction.reply({
                    content: '> `-` Não foi possível encontrar a mensagem original para editar.',
                    ephemeral: true,
                });
            }
            console.error(error);
        }
    }

    // Lógica para o modal
    if (interaction.isModalSubmit() && interaction.customId === 'model') {
        await interaction.deferUpdate();
        let valor = interaction.fields.getTextInputValue('ativarSlow');

        if (!/^\d+$/.test(valor)) {
            return await interaction.followUp({
                content: '> `-` <a:alerta:1163274838111162499> Por favor, forneça um número válido.',
                ephemeral: true,
            });
        }

        valor = parseInt(valor);
        const channel = interaction.channel;

        try {
            await channel.setRateLimitPerUser(valor);
            await interaction.message.edit({
                components: [buttons],
            });

            return interaction.followUp({
                content: `> \`+\` Modo lento ativado com sucesso!\n> \`+\` SlowMode de: **${valor}s**`,
                ephemeral: true,
            });
        } catch (error) {
            console.error(error);
            return interaction.followUp({
                content: 'Erro ao configurar o SlowMode.',
                ephemeral: true,
            });
        }
    }
};
