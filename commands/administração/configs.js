const {
    SlashCommandBuilder,
    ChannelType,
    PermissionFlagsBits,
    PermissionsBitField,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
} = require('discord.js')

const client = require("../../index")
const ticket = require("../../database/models/ticket")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Veja meus comandos de configuração.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Configure meus comandos.')
        ),


    async execute(interaction) {

        const subcommands = interaction.options.getSubcommand();


        switch (subcommands) {

            case "help": {


                // Verificação de permissões
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                    return await interaction.reply({
                        content: `> \`-\` <:NA_Intr004:1289442144255213618> Não posso concluir este comando pois você não possui permissão.`,
                        ephemeral: true
                    });
                }

                let HelpEmbed = new EmbedBuilder()
                    .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
                    .setDescription(`Olá ${interaction.user}, Veja como configurar meus comandos. Selecione uma categoria abaixo!`)
                    .setColor("#41b2b0")
                    .addFields(
                        {
                            name: `**Observação 1:**`,
                            value: `Comandos que necessitam de cargos superiores aos membros não tem canal de texto definidos para uso de comandos.`,
                            inline: false,


                        },
                        {
                            name: `**Observação 2:**`,
                            value: `Recomendamos utilizalos em canal de texto privados.`,
                            inline: false,


                        },
                        {
                            name: `**Observação 3:**`,
                            value: `Nas configuraçãoes de cargos do seu servidor arraste o Grove para o topo de todos os cargos para que todos os comandos funcionem corretamente. Imagem ilustrativa abaixo.`,
                            inline: false,


                        },

                    )
                    .setFooter({ text: `© ${client.user.username} 2022 | ...` })
                    .setThumbnail(`${interaction.user.displayAvatarURL({ dynamic: true })}`)
                    .setImage(`https://cdn.discordapp.com/attachments/1063231058407079946/1176315644308881539/Captura_de_tela_2023-11-20_211637.png?ex=656e6c50&is=655bf750&hm=1bf9223ae7afbea12aa3525618603318809269d1fe079ee787175665ba1b7b1b&`)
                    .setTimestamp()


                interaction.reply({ embeds: [HelpEmbed], content: `${interaction.user}`, ephemeral: true })

                break
            }
        }

    }
}
