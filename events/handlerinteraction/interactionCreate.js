const client = require('../../index');
const sugestaoHandler = require('../interactions/sugestão')
const automodHandler = require('../interactions/automod')
const slowmodeHandler = require('../interactions/slowmode')
const ticketHandler = require('../interactions/ticket')
const selectCargosHandler = require('../interactions/selectCargos')
const embedHandler = require('../interactions/embed')

client.on("interactionCreate", async (interaction) => {

    if (interaction.isCommand()) {
        const command = client.slashCommands.get(interaction.commandName);
        if (!command) {
            return interaction.reply({ content: 'Comando não encontrado!', ephemeral: true });
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Houve um erro ao executar o comando!', ephemeral: true });
        }
    }

    else if (interaction.isModalSubmit()) {
        await sugestaoHandler(interaction)
    }


    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'palavra-chave-modal' || interaction.customId === 'mencao-spam-modal') {
            await automodHandler(interaction);
        }
    }

    if (interaction.isButton() || interaction.isModalSubmit()) {

        if (interaction.customId === 'ativar' || interaction.customId === 'desativar' || interaction.customId === 'model') {
            await slowmodeHandler(interaction);
        }
    }

    if (interaction.isStringSelectMenu()) {

        if (interaction.customId === 'select2') {
            await selectCargosHandler(interaction)
        }
    }

    if (interaction.isButton() || interaction.isModalSubmit()) {
        const ticketButtonIds = [
            'modal_ticket', 'ticket', 'assumirTicket', 'call', 'EncerrarChamado',
            'AdicionarMembro', 'RemoverMembro', 'poke', 'addmembro',
            'removermembrotexto', 'SairdoTicket', 'close', 'reabrir', 'msg', 'deletar',
            'button_name_modal', 'titulo1_modal', 'descricao1_modal', 'titulo2_modal', 'descricao2_modal',
            'imagem01Modal', 'imagem02Modal'
        ];

        if (ticketButtonIds.includes(interaction.customId)) {
            await ticketHandler(interaction);
        }
    }

    if (interaction.isButton() || interaction.isModalSubmit() || interaction.isRoleSelectMenu()) {
        const ticketButtonIds = [
            'CREATOR_SET_TITLE', 'CREATOR_SET_DESCRIPTION', 'CREATOR_SET_COLOR', 'CREATOR_SET_IMAGE', 'CREATOR_SET_THUMBNAIL',
            'CREATOR_SET_AUTHOR', 'CREATOR_SET_FOOTER', 'CREATOR_MENTION_ROLE', 'CREATOR_EXPORT_JSON',
            'CREATOR_IMPORT_JSON', 'CREATOR_SEND', 'limpa', 'CREATOR_BACK', 'RoleSelectMenuBuilder'
        ]

        if (ticketButtonIds.includes(interaction.customId)) {
            await embedHandler(interaction);
        }
    }
})
