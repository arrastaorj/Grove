const {
    ModalBuilder,
    ActionRowBuilder,
    TextInputBuilder,
    TextInputStyle,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    PermissionFlagsBits,
    PermissionsBitField
} = require("discord.js")

const ticket = require("../../database/models/ticket")
const Atendente = require("../../database/models/ticketAtendimentos")
const discordTranscripts = require('discord-html-transcripts')


module.exports = async (interaction) => {


    if (interaction.isModalSubmit()) {
        // Função para carregar as informações do banco de dados
        const getUpdatedTicketConfig = async (guildId) => {
            return await ticket.findOne({ guildId }) || {};
        };

        // Função para montar e atualizar a embed
        const updateEmbed = async (interaction, updatedTicketConfig) => {
            let assignedChannel = updatedTicketConfig?.canal1 ? `<#${updatedTicketConfig.canal1}>` : 'Não configurado';
            let assignedChannelLogs = updatedTicketConfig?.canalLog ? `<#${updatedTicketConfig.canalLog}>` : 'Não configurado';
            let ticketCategory = updatedTicketConfig?.categoria ? `<#${updatedTicketConfig.categoria}>` : 'Não configurada';
            let updatedButtonName = updatedTicketConfig?.nomeBotao || 'Não configurado';
            let allowedRole = updatedTicketConfig?.cargo ? `<@&${updatedTicketConfig.cargo}>` : 'Não configurado';

            let titulo01 = updatedTicketConfig?.titulo01 || 'Não configurado';
            let descrição01 = updatedTicketConfig?.descrição01 || 'Não configurado';
            let titulo02 = updatedTicketConfig?.titulo02 || 'Não configurado';
            let descrição02 = updatedTicketConfig?.descrição02 || 'Não configurado';

            if (interaction.message.embeds.length > 0) {
                const embed = EmbedBuilder.from(interaction.message.embeds[0]);
                embed.setDescription(
                    `* <:shop_white:1289442593452724244> **Bem-vindo(a) ao sistema de configuração de tickets!**\n` +
                    `  - Utilize o menu abaixo para configurar as opções necessárias.\n\n` +
                    `* <:settings:1289442654806999040> **Informações sobre o sistema:**\n` +
                    `  - **Canal do Ticket:** <:channel:1290115652828270613> ${assignedChannel}\n` +
                    `  - **Canal de Logs:** <:channel:1290115652828270613> ${assignedChannelLogs}\n` +
                    `  - **Categoria:** <:search:1293726966360440966> ${ticketCategory}\n` +
                    `  - **Nome do Botão:** <:edit1:1293726236505542788> ${updatedButtonName}\n` +
                    `  - **Cargo Permitido:** <:announcement:1293726066174595215> ${allowedRole}\n` +
                    `  - **Titulo 1 (Para abrir o ticket):** <:edit1:1293726236505542788> ${titulo01}\n` +
                    `  - **Descrição 1 (Para abrir o ticket):** <:summary:1293727240114278422> ${descrição01}\n` +
                    `  - **Titulo 2 (Dentro do ticket):** <:edit1:1293726236505542788> ${titulo02}\n` +
                    `  - **Descrição 2 (Dentro do ticket):** <:summary:1293727240114278422> ${descrição02}\n\n` +
                    `-# <:info:1290116635814002749> Caso tenha dúvidas ou enfrente algum problema, sinta-se à vontade para entrar em nosso [servidor de suporte](http://dsc.gg/grovesuporte). Nossa equipe está à disposição para auxiliá-lo!`
                );
                try {
                    await interaction.message.edit({ embeds: [embed] });
                } catch (error) {
                    console.error("Erro ao atualizar a embed:", error);
                }
            }
        };

        // Função para salvar dados e atualizar embed
        const handleModalSubmit = async (interaction, updateData) => {
            // Atualizar o banco de dados
            await ticket.findOneAndUpdate(
                { guildId: interaction.guild.id },
                { $set: updateData },
                { upsert: true }
            );

            // Recarregar as informações do banco e atualizar a embed
            let updatedTicketConfig = await getUpdatedTicketConfig(interaction.guild.id);
            await updateEmbed(interaction, updatedTicketConfig);

            // Responder ao usuário
            await interaction.reply({
                content: `<:1078434426368839750:1290114335909085257> A configuração foi atualizada com sucesso.`,
                ephemeral: true
            });
        };

        // Verificar qual modal foi submetido
        if (interaction.customId === 'button_name_modal') {
            const buttonName = interaction.fields.getTextInputValue('button_name_input');
            await handleModalSubmit(interaction, { nomeBotao: buttonName });
        } else if (interaction.customId === 'titulo1_modal') {
            const titulo1 = interaction.fields.getTextInputValue('titulo1_input');
            await handleModalSubmit(interaction, { titulo01: titulo1 });
        } else if (interaction.customId === 'descricao1_modal') {
            const descricao1 = interaction.fields.getTextInputValue('descricao1_input');
            await handleModalSubmit(interaction, { descrição01: descricao1 });
        } else if (interaction.customId === 'titulo2_modal') {
            const titulo2 = interaction.fields.getTextInputValue('titulo2_input');
            await handleModalSubmit(interaction, { titulo02: titulo2 });
        } else if (interaction.customId === 'descricao2_modal') {
            const descricao2 = interaction.fields.getTextInputValue('descricao2_input');
            await handleModalSubmit(interaction, { descrição02: descricao2 });
        }
    }



    if (interaction.isButton) {
        try {

            const cmd3 = await ticket.findOne({
                guildId: interaction.guild.id
            })


            if (interaction.customId === 'ticket') {

                if (interaction.guild.channels.cache.find((c) => c.topic === interaction.user.id)) {
                    interaction.reply({ content: `**Você já possui um ticket aberto -> ${interaction.guild.channels.cache.find(c => c.topic === interaction.user.id)}.**`, ephemeral: true })

                } else {


                    let categoria = cmd3.categoria


                    const cmd = await ticket.findOne({
                        guildId: interaction.guild.id
                    })


                    if (!cmd) {
                        const newCmd = {
                            guildId: interaction.guild.id,
                        }
                        if (interaction.user.username) {
                            newCmd.userId = interaction.user.username
                        }
                        await ticket.create(newCmd)

                    } else {

                        if (!interaction.user.username) {
                            await ticket.findOneAndUpdate({
                                guildId: interaction.guild.id
                            }, { $unset: { "userId": "" } })
                        } else {
                            await ticket.findOneAndUpdate({
                                guildId: interaction.guild.id
                            }, { $set: { "userId": interaction.user.username } })
                        }

                    }


                    interaction.guild.channels.create({
                        name: `ticket-${interaction.user.username}`,
                        type: ChannelType.GuildText,
                        topic: `${interaction.user.id}`,
                        parent: categoria,
                        permissionOverwrites: [
                            {
                                id: cmd3.cargo,
                                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AddReactions]
                            },
                            {
                                id: interaction.guild.id,
                                deny: [PermissionFlagsBits.ViewChannel]
                            },
                            {
                                id: interaction.user.id,
                                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AddReactions]
                            }

                        ]

                    }).then(async (channel) => {



                        const createdChannelID = channel.id;

                        const cmd = await ticket.findOne({
                            guildId: interaction.guild.id
                        })


                        if (!cmd) {
                            const newCmd = {
                                guildId: interaction.guild.id,
                            }
                            if (createdChannelID) {
                                newCmd.createdChannelID = createdChannelID
                            }
                            await ticket.create(newCmd)

                        } else {

                            if (!createdChannelID) {
                                await ticket.findOneAndUpdate({
                                    guildId: interaction.guild.id
                                }, { $unset: { "createdChannelID": "" } })
                            } else {
                                await ticket.findOneAndUpdate({
                                    guildId: interaction.guild.id
                                }, { $set: { "createdChannelID": createdChannelID } })
                            }

                        }


                        let titulo = cmd3.titulo02

                        let descrição = cmd3.descrição02

                        let iniciado = new EmbedBuilder()
                            .setColor('#2f3136')
                            .setAuthor({ name: `Suporte - ${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ extension: 'png' }) })
                            .setDescription(`Olá ${interaction.user}, Seu ticket foi criado com sucesso.`)
                            .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ extension: 'png' }) })

                        let atalho = new ButtonBuilder()
                            .setLabel(`Atalho`)
                            .setURL(channel.url)
                            .setStyle(ButtonStyle.Link)

                        const butão = new ActionRowBuilder().addComponents(atalho)

                        interaction.reply({ embeds: [iniciado], components: [butão], ephemeral: true })

                        let criado = new EmbedBuilder()
                            .setColor('#2f3136')
                            .setAuthor({ name: titulo, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                            .setDescription(descrição)
                            .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ extension: 'png' }) })

                        let fechar = new ButtonBuilder()
                            .setCustomId('close')
                            .setEmoji('<:crvt:1168024673481662534>')
                            .setStyle(4)
                            .setLabel(`Finalizar Atendimento`)

                        let call = new ButtonBuilder()
                            .setCustomId('call')
                            .setEmoji('<:crvt:1168024678204461129>')
                            .setStyle(2)
                            .setLabel(`Criar Canal de Voz`)

                        let add = new ButtonBuilder()
                            .setCustomId("AdicionarMembro")
                            .setEmoji('<:crvt:1168024675599790100>')
                            .setLabel(`Adicionar Membro`)
                            .setStyle(2)
                        let remover = new ButtonBuilder()
                            .setCustomId("RemoverMembro")
                            .setEmoji('<:crvt:1168024676879040613>')
                            .setLabel(`Remover Membro`)
                            .setStyle(2)
                        let notificar = new ButtonBuilder()
                            .setCustomId("poke")
                            .setEmoji('<:crvt:1168024680683282495>')
                            .setLabel(`Notificação`)
                            .setStyle(2)
                        let sair = new ButtonBuilder()
                            .setCustomId("SairdoTicket")
                            .setEmoji('<:voltar:1167104944420175984>')
                            .setLabel(`Sair do Canal`)
                            .setStyle(1)

                        let assumir = new ButtonBuilder()  // Novo botão para assumir o ticket
                            .setCustomId("assumirTicket")
                            .setEmoji('🤝')
                            .setLabel("Assumir Atendimento")
                            .setStyle(3);


                        const deletar = new ActionRowBuilder().addComponents(add, remover, fechar)
                        const deletar2 = new ActionRowBuilder().addComponents(sair, notificar, assumir, call)
                        channel.send({ embeds: [criado], components: [deletar2, deletar] }).then(m => { m.pin() })

                    })
                }

            }

            if (interaction.customId === 'assumirTicket') {

                // Verifique se o usuário tem permissão para gerenciar canais
                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                    return interaction.reply({
                        content: `> \`-\` <a:alerta:1163274838111162499> Não posso concluir este comando pois você não possui permissão.`,
                        ephemeral: true
                    });
                }

                const channel = interaction.channel;
                const atendente = interaction.user;
                const guildId = interaction.guild.id;


                // Verifique se o ticket já foi assumido
                const cmd = await ticket.findOne({
                    guildId: interaction.guild.id,
                    createdChannelID: channel.id
                });

                if (cmd && cmd.atendenteId) {
                    return interaction.reply({
                        content: `Este ticket já foi assumido por <@${cmd.atendenteId}>.`,
                        ephemeral: true
                    });
                }

                await interaction.deferReply({ ephemeral: false });


                // Notifique o canal sobre quem assumiu o ticket
                let embed = new EmbedBuilder()
                    .setColor('#2f3136')
                    .setDescription(`Este ticket foi assumido por ${atendente}.`);

                // Responder à interação
                await interaction.editReply({
                    embeds: [embed],
                    components: [],
                });



                // Atualize o atendente no banco de dados para o ticket
                await ticket.findOneAndUpdate({
                    guildId: interaction.guild.id,
                    createdChannelID: channel.id
                }, { $set: { atendenteId: atendente.id } });


                // Atualize as permissões para o atendente
                await channel.permissionOverwrites.edit(atendente, {
                    ViewChannel: true,
                    SendMessages: true,
                    AttachFiles: true,
                    EmbedLinks: true,
                    AddReactions: true
                });

                // Verificar se o usuário já existe no banco de dados de atendentes para este servidor
                let atendenteData = await Atendente.findOne({ guildId: guildId, userId: atendente.id });


                if (!atendenteData) {
                    // Se o atendente não existir para este servidor, crie um novo documento
                    atendenteData = new Atendente({
                        userId: atendente.id,
                        guildId: guildId,
                        atendimentosRealizados: 1 // Inicia com 1 atendimento
                    });
                } else {
                    // Se o atendente já existe para este servidor, incrementa a contagem de atendimentos
                    atendenteData.atendimentosRealizados += 1;
                }

                // Salvar as mudanças no banco de dados
                await atendenteData.save();


            }

            if (interaction.customId === 'call') {


                if (!interaction.isButton()) return;

                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels))
                    return interaction.reply({
                        content: `> \`-\` <a:alerta:1163274838111162499> Não posso concluir este comando pois você não possui permissão.`,
                        ephemeral: true
                    })

                const cmd = await ticket.findOne({
                    guildId: interaction.guild.id
                })

                const userVoice = cmd.userId


                let possuido = interaction.guild.channels.cache.find(a => a.name === `voice-${userVoice}`)


                const cmd2 = await ticket.findOne({
                    guildId: interaction.guild.id
                })
                const userVoiceId = cmd2.createdVoicelID



                if (possuido)
                    return interaction.reply({
                        content: `> \`-\` <a:alerta:1163274838111162499> ${interaction.user}, você já possui um **CHAT DE VOZ** criado em <#${userVoiceId}>.`,
                        ephemeral: true,
                        fetchReply: true
                    })

                interaction.deferUpdate()


                interaction.guild.channels.create({
                    name: `voice-${userVoice}`,
                    type: ChannelType.GuildVoice,
                    parent: interaction.channel.parentId,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.roles.everyone,
                            deny: [PermissionsBitField.Flags.ViewChannel],
                        },
                        {
                            id: interaction.user.id,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                        },
                    ],
                }).then(async channel => {

                    const createdVoicelID = channel.id;

                    const cmd = await ticket.findOne({
                        guildId: interaction.guild.id
                    })


                    if (!cmd) {
                        const newCmd = {
                            guildId: interaction.guild.id,
                        }
                        if (createdVoicelID) {
                            newCmd.createdVoicelID = createdVoicelID
                        }
                        await ticket.create(newCmd)

                    } else {

                        if (!createdVoicelID) {
                            await ticket.findOneAndUpdate({
                                guildId: interaction.guild.id
                            }, { $unset: { "createdVoicelID": "" } })
                        } else {
                            await ticket.findOneAndUpdate({
                                guildId: interaction.guild.id
                            }, { $set: { "createdVoicelID": createdVoicelID } })
                        }

                    }

                    const callIniciadaEmbed = new EmbedBuilder()
                        .setTitle("Chamada Iniciada")
                        .setDescription(`Uma chamada foi iniciada por ${interaction.user}. Abaixo estão várias funções disponíveis com interação apenas no chat de voz.`)
                        .setColor("#27ae60")
                        .setFooter({
                            iconURL: interaction.user.displayAvatarURL({ extension: 'png' }),
                            text: `A chamada será encerrada após 2 minutos de inatividade.`
                        })
                        .setTimestamp();

                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId("EncerrarChamado")
                                .setEmoji('1001951864620859462')
                                .setLabel(`Encerrar Chamada de Voz`)
                                .setStyle(1),
                        )

                    interaction.channel.send({ embeds: [callIniciadaEmbed], components: [row], ephemeral: true }).then(edit => {

                        const inatividadeEmbed = new EmbedBuilder()
                            .setTitle(`Suporte por Chamada Encerrado`)
                            .setDescription(`O suporte por chamada foi encerrado devido à inatividade.`)
                            .setColor("#e74c3c")
                            .setTimestamp()
                        setTimeout(() => {
                            if (channel.members.size <= 0) {
                                channel.delete().catch(e => null);
                                edit.edit({ embeds: [inatividadeEmbed], ephemeral: true, components: [] }).catch(e => null);
                            }
                        }, 120000);
                    });

                })
            }

            if (interaction.customId === 'EncerrarChamado') {

                if (!interaction.isButton()) return;

                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels))
                    return interaction.reply({
                        content: `> \`-\` <a:alerta:1163274838111162499> Não posso concluir este comando pois você não possui permissão.`,
                        ephemeral: true
                    })

                const cmd = await ticket.findOne({
                    guildId: interaction.guild.id
                })

                const voiceId = cmd.createdVoicelID

                const fetchedVoice = interaction.guild.channels.cache.get(voiceId);

                fetchedVoice.delete().catch(e => null)

                const sairEmbed = new EmbedBuilder()
                    .setTitle(`Suporte por Chamada Encerrado`)
                    .setDescription(`O suporte por chamada foi encerrado por um membro da equipe.\n\n**Usuário:** ${interaction.user.username}`)
                    .setColor("#3498db")
                    .setTimestamp()

                interaction.message.edit({ embeds: [sairEmbed], components: [] })

            }

            if (interaction.customId === 'AdicionarMembro') {

                if (!interaction.isButton()) return;

                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) return interaction.reply({ content: `> \`-\` <a:alerta:1163274838111162499> Não posso concluir este comando pois você não possui permissão.`, ephemeral: true })

                const modal = new ModalBuilder()
                    .setCustomId('addmembro')
                    .setTitle(`Adicionar Membro`)

                const favoriteColorInput = new TextInputBuilder()
                    .setCustomId('idUser')
                    .setLabel(`Qual ID do membro a ser adicionado?`)
                    .setStyle(TextInputStyle.Short)

                const firstActionRow = new ActionRowBuilder().addComponents(favoriteColorInput)

                modal.addComponents(firstActionRow)

                await interaction.showModal(modal)
            }

            if (interaction.customId === 'RemoverMembro') {

                if (!interaction.isButton()) return;

                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) return interaction.reply({ content: `> \`-\` <a:alerta:1163274838111162499> Não posso concluir este comando pois você não possui permissão.`, ephemeral: true })

                const modal = new ModalBuilder()
                    .setCustomId('removermembrotexto')
                    .setTitle(`${interaction.guild.name}`);


                const favoriteColorInput = new TextInputBuilder()
                    .setCustomId('idMember')
                    .setLabel(`Qual ID do membro a ser removido?`)
                    .setStyle(TextInputStyle.Short);

                const firstActionRow = new ActionRowBuilder().addComponents(favoriteColorInput);

                modal.addComponents(firstActionRow);

                await interaction.showModal(modal);

            }

            if (interaction.customId === 'poke') {
                const cmd = await ticket.findOne({
                    guildId: interaction.guild.id
                });

                const channelId = cmd.createdChannelID;

                const fetchedChannel = interaction.guild.channels.cache.get(channelId)




                const roleId = cmd.cargo;

                const role = interaction.guild.roles.cache.get(roleId);

                if (role) {
                    const membersWithRole = role.members;

                    if (membersWithRole.size === 0) {
                        interaction.reply(`Nenhum membro com o cargo encontrado.`);
                        return;
                    }

                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setLabel(`Visualizar o Ticket"`)
                            .setEmoji("<:crvt:1168028479833505842>")
                            .setURL(fetchedChannel.url)
                            .setStyle(5)
                    );

                    const embed = new EmbedBuilder()
                        .setColor("#3498db") // Cor azul profissional
                        .setTitle(`<a:alerta:1163274838111162499> Você foi mencionado em um Ticket!`)
                        .setDescription(`Olá membros com o cargo **${role.name}**,\n\nAlguém mencionou vocês em um ticket aberto e aguarda uma resposta.\n\nPor favor, verifique o ticket e forneça sua colaboração.`)
                        .setFooter({
                            iconURL: interaction.user.displayAvatarURL({ extension: 'png' }),
                            text: `Agradecemos sua colaboração em ${interaction.guild.name}!`
                        });


                    membersWithRole.forEach(async member => {
                        try {
                            await member.send({ embeds: [embed], components: [row] })
                        } catch (error) {
                            console.error(`Erro ao enviar mensagem para ${member.user.tag}: ${error.message}`);
                        }
                    })

                    interaction.reply({
                        content: `> \`+\` <a:alerta:1163274838111162499> Notificação enviada para membros com o cargo <@&${role.id}>. \n\n> \`-\` <a:alerta:1163274838111162499> **Evite usar essa função de maneira inadequada, pois isso acarretará penalidades.**`,
                        ephemeral: true
                    })

                } else {

                    interaction.reply({ content: `> \`-\` Cargo não encontrado.`, ephemeral: true })

                }
            }

            if (interaction.customId === 'addmembro') {

                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels))
                    return interaction.reply({
                        content: `> \`-\` <a:alerta:1163274838111162499> Não posso concluir este comando pois você não possui permissão.`,
                        ephemeral: true
                    })


                const cmd = await ticket.findOne({
                    guildId: interaction.guild.id
                })


                const channelId = cmd.createdChannelID


                const fetchedChannel = interaction.guild.channels.cache.get(channelId)


                const user = interaction.fields.getTextInputValue('idUser')

                fetchedChannel.permissionOverwrites.edit(user, { ViewChannel: true })

                interaction.deferUpdate()

            }

            if (interaction.customId === 'removermembrotexto') {


                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) return interaction.reply({ content: `> \`-\` <a:alerta:1163274838111162499> Não posso concluir este comando pois você não possui permissão.`, ephemeral: true })

                const cmd = await ticket.findOne({
                    guildId: interaction.guild.id
                })

                const channelId = cmd.createdChannelID

                const fetchedChannel = interaction.guild.channels.cache.get(channelId)

                const newnamea = interaction.fields.getTextInputValue('idMember');

                fetchedChannel.permissionOverwrites.edit(newnamea, { ViewChannel: false })
                interaction.deferUpdate()
            }

            if (interaction.customId === 'SairdoTicket') {


                interaction.channel.permissionOverwrites.edit(interaction.user.id, { ViewChannel: false })

                interaction.reply({ content: `${interaction.user} Saiu do Atendimento!`, ephemeral: false })

            }

            if (interaction.customId === 'close') {


                if (!interaction.isButton()) return;

                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) return interaction.reply({ content: `> \`-\` <a:alerta:1163274838111162499> Não posso concluir este comando pois você não possui permissão.`, ephemeral: true })

                let ticket = interaction.channel.topic

                interaction.channel.edit({

                    permissionOverwrites: [
                        {
                            id: cmd3.cargo,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AddReactions],
                        },
                        {
                            id: ticket,
                            deny: [PermissionFlagsBits.ViewChannel],
                        },
                        {
                            id: interaction.guild.id,
                            deny: [PermissionFlagsBits.ViewChannel],
                        }

                    ],

                })

                let embed = new EmbedBuilder()
                    .setColor('#2f3136')
                    .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                    .setDescription(`O Membro ${interaction.user}\`(${interaction.user.id})\` Fechou o ticket, Escolha uma opção abaixo.`)

                let botoes = new ActionRowBuilder().addComponents([

                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Success)
                        .setLabel(`Reabrir`)
                        .setCustomId('reabrir'),
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Danger)
                        .setLabel(`Deletar`)
                        .setCustomId('deletar')])


                interaction.reply({ embeds: [embed], components: [botoes] })

            }

            if (interaction.customId === 'reabrir') {


                if (!interaction.isButton()) return;

                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) return interaction.reply({ content: `> \`-\` <a:alerta:1163274838111162499> Não posso concluir este comando pois você não possui permissão.`, ephemeral: true })

                interaction.message.delete()

                let ticket = interaction.channel.topic

                interaction.channel.edit({

                    permissionOverwrites: [
                        {
                            id: cmd3.cargo,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AddReactions],
                        },
                        {
                            id: ticket,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AddReactions],
                        },
                        {
                            id: interaction.guild.id,
                            deny: [PermissionFlagsBits.ViewChannel],
                        }

                    ],

                })

                let embed = new EmbedBuilder()
                    .setColor('#2f3136')
                    .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                    .setDescription(`Olá <@${ticket}>, O Membro ${interaction.user} Reabriu seu ticket.`)

                let button = new ButtonBuilder()
                    .setLabel(`Apagar Mensagem`)
                    .setStyle(2)
                    .setCustomId('msg')

                const row = new ActionRowBuilder().addComponents(button)

                interaction.channel.send({ content: `<@${ticket}>`, embeds: [embed], components: [row] })

            }

            if (interaction.customId === 'msg') {


                if (!interaction.isButton()) return;

                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) return interaction.reply({ content: `> \`-\` <a:alerta:1163274838111162499> Não posso concluir este comando pois você não possui permissão.`, ephemeral: true })

                interaction.message.delete()

            }

            if (interaction.customId === 'deletar') {
                if (!interaction.isButton()) return;

                try {
                    // Verifique se o usuário tem permissão para gerenciar canais
                    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                        return interaction.reply({
                            content: `> \`-\` <a:alerta:1163274838111162499> Não posso concluir este comando pois você não possui permissão.`,
                            ephemeral: true
                        });
                    }

                    const channel = interaction.channel;
                    const topic = channel.topic;
                    const guildId = interaction.guild.id;


                    // Obter o ticket relacionado ao canal atual
                    const cmd = await ticket.findOne({
                        guildId: guildId,
                        createdChannelID: channel.id
                    });

                    // Verifique se o ticket foi assumido por alguém
                    if (!cmd || !cmd.atendenteId) {
                        return interaction.reply({
                            content: 'Este ticket ainda não foi assumido por nenhum atendente.',
                            ephemeral: true
                        });
                    }

                    // Obtenha os dados do atendente
                    const atendenteData = await Atendente.findOne({ guildId: guildId, userId: cmd.atendenteId });

                    if (!atendenteData) {
                        return interaction.reply({
                            content: 'Não foi possível encontrar os dados do atendente.',
                            ephemeral: true
                        });
                    }

                    const attachment = await discordTranscripts.createTranscript(channel);
                    const transcriptTimestamp = Math.round(Date.now() / 1000);

                    // Deletar o canal após o transcript ser criado
                    await interaction.channel.delete();

                    // Crie a embed com as informações do atendente e número de tickets
                    let embed = new EmbedBuilder()
                        .setColor('#5865F2') // Azul do Discord
                        .setTitle('📋 Ticket Encerrado') // Título com emoji
                        .setDescription(`
                        **👤 Ticket de:** <@${topic}> \`(${topic})\`
                        **🛠️ Encerrado por:** ${interaction.user} \`(${interaction.user.id})\`
                        **📅 Data de encerramento:** <t:${transcriptTimestamp}:R> (<t:${transcriptTimestamp}:F>)
                        **👨‍💼 Assumido por:** <@${cmd.atendenteId}> 
                        **🏆 Atendimentos realizados:** ${atendenteData.atendimentosRealizados}
                    `)
                        .setThumbnail(interaction.guild.iconURL({ extension: 'png' })) // Imagem pequena do servidor
                        .setFooter({
                            text: `Ticket ID: ${channel.id}`,
                            iconURL: interaction.user.displayAvatarURL({ extension: 'png' })
                        })
                        .setTimestamp();

                    // Busca o ticket no banco de dados para resetar o atendente
                    await ticket.findOneAndUpdate({
                        guildId: guildId,
                        createdChannelID: channel.id
                    }, {
                        $unset: { atendenteId: "" } // Remove o atendente associado ao ticket
                    });


                    // Enviar a embed para o canal de logs
                    let chat_log = cmd3.canalLog;
                    let canal = interaction.guild.channels.cache.get(chat_log);
                    await canal.send({ embeds: [embed], files: [attachment] });

                } catch (error) {
                    console.error('Erro ao deletar o ticket:', error);
                    await interaction.reply({
                        content: 'Houve um erro ao processar a solicitação de deletar o ticket.',
                        ephemeral: true
                    });
                }
            }

        } catch (error) {

            return interaction.reply({
                content: `> \`-\` <a:alerta:1163274838111162499> Não posso concluir este comando pois você não possui permissão.`,
                ephemeral: true
            })
        }

    }
}
