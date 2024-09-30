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
const comandos = require("../../database/models/comandos")
const meme = require("../../database/models/meme")
const fbv = require("../../database/models/fbv")
const ticket = require("../../database/models/ticket")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Veja meus comandos de configuração.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('comandos')
                .setDescription('Definir canal de comandos.')
                .addChannelOption(option =>
                    option.setName('canal')
                        .setDescription('Mencione o canal de texto ou coloque o ID.')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('fbv')
                .setDescription('Definir um wallpaper de fundo do Bem-Vindo(a).')
                .addStringOption(option =>
                    option.setName('imagem')
                        .setDescription('Anexe uma imagem válida. (PNG/JPEG)')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('memes')
                .setDescription('Definir um canal para o uso do comando /meme.')
                .addChannelOption(option =>
                    option.setName('canal')
                        .setDescription('Mencione o canal de texto ou coloque o ID.')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('ticket')
                .setDescription('Configure o menu do ticket.')
                .addChannelOption(option =>
                    option.setName('canal')
                        .setDescription('Canal que a mensagem para criar ticket será enviada.')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText)
                )
                .addChannelOption(option =>
                    option.setName('canal_log')
                        .setDescription('Canal que as logs será enviada.')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText)
                )
                .addChannelOption(option =>
                    option.setName('categoria')
                        .setDescription('Selecione uma categoria a qual os tickets serão criados.')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildCategory)
                )
                .addStringOption(option =>
                    option.setName('nome_botao')
                        .setDescription('Qual o nome do botão que abrirá o ticket?.')
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option.setName('cargo')
                        .setDescription('Cargo que poderá ver os tickets.')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Configure meus comandos.')
        ),


    async execute(interaction) {

        const subcommands = interaction.options.getSubcommand();


        switch (subcommands) {

            case "comandos": {


                // Verificação de permissões
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                    return await interaction.reply({
                        content: `> \`-\` <a:alerta:1163274838111162499> Não posso concluir este comando pois você não possui permissão.`,
                        ephemeral: true
                    });
                }



                const botMember = interaction.guild.members.cache.get(client.user.id)
                if (!botMember.permissions.has(PermissionFlagsBits.ManageMessages)) {
                    return interaction.reply({ content: `> \`-\` <a:alerta:1163274838111162499> Não posso concluir o comandos pois ainda não recebir permissão para gerenciar este servidor (Administrador)`, ephemeral: true })
                }

                const cmd1 = interaction.options.getChannel('canal')

                const user = await comandos.findOne({
                    guildId: interaction.guild.id
                })

                if (!user) {
                    const newCmd = {
                        guildId: interaction.guild.id,
                    }
                    if (cmd1) {
                        newCmd.canal1 = cmd1.id
                    }

                    await comandos.create(newCmd)

                    let cargoNames = []

                    if (cmd1) {
                        cargoNames.push(cmd1)
                    }

                    let LogsAddUser = new EmbedBuilder()
                        .setDescription(`**Canal de comandos configurado:** \n\n> \`+\` ${cargoNames}`)
                        .setTimestamp()
                        .setColor('13F000')
                        .setFooter({ text: `${interaction.member.user.username}`, iconURL: interaction.member.displayAvatarURL({ dynamic: true }) })

                    return interaction.reply({ embeds: [LogsAddUser], ephemeral: true })
                } else {

                    if (!cmd1) {
                        await comandos.findOneAndUpdate({
                            guildId: interaction.guild.id
                        }, { $unset: { "canal1": "" } })
                    } else {
                        await comandos.findOneAndUpdate({
                            guildId: interaction.guild.id
                        }, { $set: { "canal1": cmd1.id } })
                    }

                    let cargoNames = []

                    if (cmd1) {
                        cargoNames.push(cmd1)
                    }


                    let LogsAddUser = new EmbedBuilder()
                        .setDescription(`**Canal de comandos atualizado:** \n\n> \`+\` ${cargoNames}`)
                        .setTimestamp()
                        .setColor('13F000')
                        .setFooter({ text: `${interaction.member.user.username}`, iconURL: interaction.member.displayAvatarURL({ dynamic: true }) })

                    return interaction.reply({ embeds: [LogsAddUser], ephemeral: true })
                }


                break
            }

            //////// fbv Atualizado MongoDB
            case "fbv": {


                // Verificação de permissões
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                    return await interaction.reply({
                        content: `> \`-\` <a:alerta:1163274838111162499> Não posso concluir este comando pois você não possui permissão.`,
                        ephemeral: true
                    });
                }


                const botMember = interaction.guild.members.cache.get(client.user.id)
                if (!botMember.permissions.has(PermissionFlagsBits.ManageMessages)) {
                    return interaction.reply({ content: `> \`-\` <a:alerta:1163274838111162499> Não posso concluir o comandos pois ainda não recebir permissão para gerenciar este servidor (Administrador)`, ephemeral: true })
                }

                const cmd1 = interaction.options.getString('imagem')

                if (cmd1 && !/\.(png|jpeg)$/i.test(cmd1)) {
                    return interaction.reply({ content: 'O link da imagem deve terminar com .png ou .jpeg.\nExemplo: https://i.imgur.com/lCmmOZD.jpeg', ephemeral: true })
                }


                const user = await fbv.findOne({
                    guildId: interaction.guild.id
                })

                if (!user) {
                    const newCmd = {
                        guildId: interaction.guild.id,
                    }
                    if (cmd1) {
                        newCmd.canal1 = cmd1
                    }

                    await fbv.create(newCmd)

                    let cargoNames = []

                    if (cmd1) {
                        cargoNames.push(cmd1)
                    }

                    let LogsAddUser = new EmbedBuilder()
                        .setDescription(`**Imagem de Boas-Vindas configurada:** \n\n> \`+\` Nome: **${cmd1.name}** \n\n > \`+\` Altura: **${cmd1.height}** \n\n > \`+\` Largura: **${cmd1.width}**`)
                        .setImage(cmd1)
                        .setTimestamp()
                        .setColor('13F000')
                        .setFooter({ text: `${interaction.member.user.username}`, iconURL: interaction.member.displayAvatarURL({ dynamic: true }) })

                    return interaction.reply({ embeds: [LogsAddUser], ephemeral: true })
                } else {

                    if (!cmd1) {
                        await fbv.findOneAndUpdate({
                            guildId: interaction.guild.id
                        }, { $unset: { "canal1": "" } })
                    } else {
                        await fbv.findOneAndUpdate({
                            guildId: interaction.guild.id
                        }, { $set: { "canal1": cmd1 } })
                    }

                    let cargoNames = []

                    if (cmd1) {
                        cargoNames.push(cmd1)
                    }


                    let LogsAddUser = new EmbedBuilder()
                        .setDescription(`**Imagem de Boas-Vindas atualizado:** \n\n> \`+\` Nome: **${cmd1.name}** \n\n > \`+\` Altura: **${cmd1.height}** \n\n > \`+\` Largura: **${cmd1.width}**`)
                        .setImage(cmd1.url)
                        .setTimestamp()
                        .setColor('13F000')
                        .setFooter({ text: `${interaction.member.user.username}`, iconURL: interaction.member.displayAvatarURL({ dynamic: true }) })

                    return interaction.reply({ embeds: [LogsAddUser], ephemeral: true })
                }


                break
            }

            case "memes": {


                // Verificação de permissões
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                    return await interaction.reply({
                        content: `> \`-\` <a:alerta:1163274838111162499> Não posso concluir este comando pois você não possui permissão.`,
                        ephemeral: true
                    });
                }

                const botMember = interaction.guild.members.cache.get(client.user.id)
                if (!botMember.permissions.has(PermissionFlagsBits.ManageMessages)) {
                    return interaction.reply({ content: `> \`-\` <a:alerta:1163274838111162499> Não posso concluir o comandos pois ainda não recebir permissão para gerenciar este servidor (Administrador)`, ephemeral: true })
                }

                const canal = interaction.options.getChannel('canal')

                const user = await meme.findOne({
                    guildId: interaction.guild.id
                })

                if (!user) {
                    const newCmd = {
                        guildId: interaction.guild.id,
                    }
                    if (canal) {
                        newCmd.canal1 = canal.id
                    }

                    await meme.create(newCmd)

                    let cargoNames = []

                    if (canal) {
                        cargoNames.push(canal)
                    }

                    let LogsAddUser = new EmbedBuilder()
                        .setDescription(`**Canal de memes configurado:** \n\n> \`+\` ${cargoNames}`)
                        .setTimestamp()
                        .setColor('13F000')
                        .setFooter({ text: `${interaction.member.user.username}`, iconURL: interaction.member.displayAvatarURL({ dynamic: true }) })

                    return interaction.reply({ embeds: [LogsAddUser], ephemeral: true })
                } else {

                    if (!canal) {
                        await meme.findOneAndUpdate({
                            guildId: interaction.guild.id
                        }, { $unset: { "canal1": "" } })
                    } else {
                        await meme.findOneAndUpdate({
                            guildId: interaction.guild.id
                        }, { $set: { "canal1": canal.id } })
                    }

                    let cargoNames = []

                    if (canal) {
                        cargoNames.push(canal)
                    }


                    let LogsAddUser = new EmbedBuilder()
                        .setDescription(`**Canal de memes atualizado:** \n\n> \`+\` ${cargoNames}`)
                        .setTimestamp()
                        .setColor('13F000')
                        .setFooter({ text: `${interaction.member.user.username}`, iconURL: interaction.member.displayAvatarURL({ dynamic: true }) })

                    return interaction.reply({ embeds: [LogsAddUser], ephemeral: true })
                }
                break
            }

            case "ticket": {


                // Verificação de permissões
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                    return await interaction.reply({
                        content: `> \`-\` <a:alerta:1163274838111162499> Não posso concluir este comando pois você não possui permissão.`,
                        ephemeral: true
                    });
                }


                const botMember = interaction.guild.members.cache.get(client.user.id)
                if (!botMember.permissions.has(PermissionFlagsBits.ManageMessages)) {
                    return interaction.reply({ content: `> \`-\` <a:alerta:1163274838111162499> Não posso concluir o comandos pois ainda não recebir permissão para gerenciar este servidor (Administrador)`, ephemeral: true })
                }

                let canal = interaction.options.getChannel('canal')
                let canal_log = interaction.options.getChannel('canal_log')
                let categoria = interaction.options.getChannel('categoria')
                let button = interaction.options.getString('nome_botao')
                let cargo = interaction.options.getRole('cargo')



                const user = await ticket.findOne({
                    guildId: interaction.guild.id
                })

                if (!user) {
                    const newCmd = {
                        guildId: interaction.guild.id,
                    }
                    if (canal) {
                        newCmd.canal1 = canal.id
                    }
                    if (canal_log) {
                        newCmd.canalLog = canal_log.id
                    }
                    if (categoria) {
                        newCmd.categoria = categoria.id
                    }
                    if (button) {
                        newCmd.nomeBotao = button
                    }
                    if (cargo) {
                        newCmd.cargo = cargo.id
                    }

                    await ticket.create(newCmd)


                } else {

                    if (!canal) {
                        await ticket.findOneAndUpdate({
                            guildId: interaction.guild.id
                        }, { $unset: { "canal1": "" } })
                    } else {
                        await ticket.findOneAndUpdate({
                            guildId: interaction.guild.id
                        }, { $set: { "canal1": canal.id } })
                    }

                    if (!canal_log) {
                        await ticket.findOneAndUpdate({
                            guildId: interaction.guild.id
                        }, { $unset: { "canalLog": "" } })
                    } else {
                        await ticket.findOneAndUpdate({
                            guildId: interaction.guild.id
                        }, { $set: { "canalLog": canal_log.id } })
                    }

                    if (!categoria) {
                        await ticket.findOneAndUpdate({
                            guildId: interaction.guild.id
                        }, { $unset: { "categoria": "" } })
                    } else {
                        await ticket.findOneAndUpdate({
                            guildId: interaction.guild.id
                        }, { $set: { "categoria": categoria.id } })
                    }

                    if (!button) {
                        await ticket.findOneAndUpdate({
                            guildId: interaction.guild.id
                        }, { $unset: { "nomeBotao": "" } })
                    } else {
                        await ticket.findOneAndUpdate({
                            guildId: interaction.guild.id
                        }, { $set: { "nomeBotao": button } })
                    }

                    if (!cargo) {
                        await ticket.findOneAndUpdate({
                            guildId: interaction.guild.id
                        }, { $unset: { "cargo": "" } })
                    } else {
                        await ticket.findOneAndUpdate({
                            guildId: interaction.guild.id
                        }, { $set: { "cargo": cargo.id } })
                    }

                }


                let modal = new ModalBuilder()
                    .setCustomId('modal_ticket')
                    .setTitle(`Mensagem Ticket}`)

                let titu = new TextInputBuilder()
                    .setCustomId('titulo')
                    .setLabel(`Titulo (Para abrir ticket)`)
                    .setStyle(1)
                    .setPlaceholder(`Digite o titulo (Primeira Linha)`)
                    .setRequired(false)

                let desc = new TextInputBuilder()
                    .setCustomId('descrição')
                    .setLabel(`Descrição da mensagem (Para abrir ticket)`)
                    .setStyle(2)
                    .setPlaceholder(`Digite a Descrição`)
                    .setRequired(false)

                let titu02 = new TextInputBuilder()
                    .setCustomId('titulo02')
                    .setLabel(`Titulo (Dentro do ticket)`)
                    .setStyle(1)
                    .setPlaceholder(`Digite o titulo (Primeira Linha)`)
                    .setRequired(false)

                let desc02 = new TextInputBuilder()
                    .setCustomId('descrição02')
                    .setLabel(`Descrição da mensagem (Dentro do ticket)`)
                    .setStyle(2)
                    .setPlaceholder(`Digite a Descrição.`)
                    .setRequired(false)

                const titulo = new ActionRowBuilder().addComponents(titu)
                const descrição = new ActionRowBuilder().addComponents(desc)
                const titulo02 = new ActionRowBuilder().addComponents(titu02)
                const descrição02 = new ActionRowBuilder().addComponents(desc02)

                modal.addComponents(titulo, descrição, titulo02, descrição02)

                await interaction.showModal(modal)

                break
            }

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
