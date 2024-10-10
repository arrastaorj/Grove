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
                        content: `> \`-\` <a:alerta:1163274838111162499> Não posso concluir este comando pois você não possui permissão.`,
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

                let painel = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder()
                    .setCustomId('menu')
                    .setPlaceholder(`Selecione uma categoria abaixo.`)
                    .addOptions([{
                        label: `Painel inicial`,
                        description: `Volte para a pagina inicial.`,
                        emoji: '<:voltar:1167104944420175984>',
                        value: 'home',
                    },
                    {
                        label: `Bem-Vindo(a)`,
                        description: `configurar a mensagem de boas-vindas.`,
                        emoji: `<:discotoolsxyzicon1:1169631915083583569>`,
                        value: `div`,
                    },
                    {
                        label: `Imagem de bem-vindo(a)`,
                        description: `configurar uma imagem de fundo do Bem-Vindo(a).`,
                        emoji: `<:discotoolsxyzicon3:1169631785261486080>`,
                        value: `util3`,
                    },
                    {
                        label: `Auto-Roles`,
                        description: `configurar cargos automáticos para novos membros.`,
                        emoji: `<:discotoolsxyzicon5:1169631781604053124>`,
                        value: `util2`,
                    },
                    {
                        label: `Comandos`,
                        description: `configurar meu canal de comandos.`,
                        emoji: `<:discotoolsxyzicon2:1169631787106967643>`,
                        value: `util`,
                    },
                    {
                        label: `Memes`,
                        description: `configurar meu canal de memes.`,
                        emoji: `<:discotoolsxyzicon:1169630230953082991>`,
                        value: `mod`,
                    },


                    ])
                )


                interaction.reply({ embeds: [HelpEmbed], content: `${interaction.user}`, components: [painel], ephemeral: true }).then(() => {

                    const filtro = (i) =>
                        i.customId == 'menu'

                    const coletor = interaction.channel.createMessageComponentCollector({
                        filtro
                    })

                    coletor.on('collect', async (collected) => {

                        let valor = collected.values[0]
                        collected.deferUpdate()

                        if (valor === 'home') {
                            interaction.editReply({ embeds: [HelpEmbed], content: `${interaction.user}`, components: [painel], ephemeral: true })

                        }

                        if (valor === 'mod') {

                            let ModEmbed = new EmbedBuilder()

                                .setTitle(`Config Memes`)
                                .setColor("#41b2b0")


                                .setThumbnail(`${client.user.displayAvatarURL({ dynamic: true })}`)

                                .setDescription(`Olá ${interaction.member}, veja como configurar meu canal de memes:`)

                                .addFields(
                                    {
                                        name: `Utilize: </config memes:1160583289464176694> `,
                                        value: `Marque o canal de texto ou cole o ID. Após configurar o canal de memes somente o comando /meme funcionara nesse canal de texto.`,
                                        inline: false,
                                    }
                                )

                                .setFooter({ text: `© ${client.user.username} 2022 | ...` })

                                .setTimestamp()

                            interaction.editReply({ embeds: [ModEmbed], content: `${interaction.user}`, components: [painel], ephemeral: true })

                        }

                        if (valor === 'div') {

                            let DivEmbed = new EmbedBuilder()

                                .setTitle(`Config Memes`)
                                .setColor("#41b2b0")


                                .setThumbnail(`${client.user.displayAvatarURL({ dynamic: true })}`)

                                .setDescription(`Olá ${interaction.member}, veja como configurar meu canal de Bem-Vindo:`)

                                .addFields(
                                    {
                                        name: `Utilize: </config bem-vindo:1160583289464176694>`,
                                        value: `Marque o canal de texto ou cole o ID. Após configurar o canal de bem vindo, todos novos usuarios receberam uma saldação especial.`,
                                        inline: false,
                                    }
                                )


                                .setFooter({ text: `© ${client.user.username} 2022 | ...` })

                                .setTimestamp()

                            interaction.editReply({ embeds: [DivEmbed], content: `${interaction.user}`, components: [painel], ephemeral: true })


                        }

                        if (valor === 'util') {

                            let UtilEmbed = new EmbedBuilder()

                                .setTitle(`Config Comandos`)
                                .setColor("#41b2b0")


                                .setThumbnail(`${client.user.displayAvatarURL({ dynamic: true })}`)

                                .setDescription(`Olá ${interaction.member}, veja como configurar meu canal de comandos:`)

                                .addFields(
                                    {
                                        name: `Utilize: </config comandos:1160583289464176694>`,
                                        value: `Marque o canal de texto ou cole o ID. Após configurar o canal de comandos, Todos os meu comandos de interação com o usuário so funcionaram no canal de texto configurado.`,
                                        inline: false,
                                    },
                                )

                                .setFooter({ text: `© ${client.user.username} 2022 | ...` })

                                .setTimestamp()

                            interaction.editReply({ embeds: [UtilEmbed], content: `${interaction.user}`, components: [painel], ephemeral: true })


                        }
                        if (valor === 'util2') {

                            let UtilEmbed2 = new EmbedBuilder()

                                .setTitle(`Config AutoRole`)
                                .setColor("#41b2b0")


                                .setThumbnail(`${client.user.displayAvatarURL({ dynamic: true })}`)

                                .setDescription(`Olá ${interaction.member}, veja como Configurar o AutoRole:`)

                                .addFields(
                                    {
                                        name: `Utilize: </config autorole:1160583289464176694>`,
                                        value: `Marque o cargo ou cole o ID. Após configurar o cargo, Todos os novos membros receberão um cargo automatico.`,
                                        inline: false,
                                    },
                                )

                                .setFooter({ text: `© ${client.user.username} 2022 | ...` })

                                .setTimestamp()

                            interaction.editReply({ embeds: [UtilEmbed2], content: `${interaction.user}`, components: [painel], ephemeral: true })
                        }
                        if (valor === 'util3') {

                            let UtilEmbed3 = new EmbedBuilder()

                                .setTitle(`Config Fundo Bem-Vindo`)
                                .setColor("#41b2b0")
                                .setThumbnail(`${client.user.displayAvatarURL({ dynamic: true })}`)

                                .setDescription(`Olá ${interaction.member}, Veja como configurar o banner de fundo:`)

                                .addFields(
                                    {
                                        name: `Utilize: </config fbv:1160583289464176694>`,
                                        value: `Anexa um imagem valida - (PNG/JPEG)`,
                                        inline: false,
                                    },
                                )

                                .setFooter({ text: `© ${client.user.username} 2022 | ...` })

                                .setTimestamp()

                            interaction.editReply({ embeds: [UtilEmbed3], content: `${interaction.user}`, components: [painel], ephemeral: true })
                        }

                    })

                })

                break
            }
        }

    }
}
