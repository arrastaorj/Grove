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
    ButtonBuilder,
    ButtonStyle,

} = require('discord.js')

const client = require("../../index")
const comandos = require("../../database/models/comandos")
const meme = require("../../database/models/meme")
const bemvindo = require("../../database/models/bemvindo")
const fbv = require("../../database/models/fbv")
const ticket = require("../../database/models/ticket")
const music = require("../../database/models/music")
const collectors = new Map(); // Armazenar coletores ativos

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Veja meus comandos de configuração.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('bem-vindo')
                .setDescription('Definir canal de Bem-Vindo(a).')
        )
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


            case "bem-vindo": {

                // Verificação de permissões
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                    return await interaction.reply({
                        content: `> \`-\` <a:alerta:1163274838111162499> Não posso concluir este comando pois você não possui permissão.`,
                        ephemeral: true
                    });
                }

                if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) {
                    return interaction.reply({
                        content: `> \`-\` <a:alerta:1163274838111162499> Não posso concluir o comando pois não recebi permissão para gerenciar este servidor (Administrador)`,
                        ephemeral: true
                    });
                }


                const userId = interaction.user.id;

                // Verificar se já existe um coletor ativo para o usuário
                if (collectors.has(userId)) {
                    const { timeout, startTime } = collectors.get(userId);
                    const timeElapsed = Date.now() - startTime;
                    const timeRemaining = timeout - timeElapsed;

                    // Convertendo o tempo restante para segundos
                    const secondsRemaining = Math.ceil(timeRemaining / 1000);

                    return interaction.reply({
                        content: `\`-\` <a:alerta:1163274838111162499> Você já iniciou uma solicitação com o sistema de AutoRole. Aguarde ${secondsRemaining} segundos antes de tentar novamente.`,
                        ephemeral: true
                    })
                }


                // Verifica a configuração atual
                let settings = await bemvindo.findOne({ guildId: interaction.guild.id });
                let isActive = settings?.isActive || false;
                let assignedChannel = settings?.canal1 ? `<#${settings.canal1}>` : "Nenhum canal configurado";

                const generateOptions = (isActive) => [
                    {
                        label: isActive ? 'Desativar' : 'Ativar',
                        emoji: isActive ? '<:red_dot:1289442683705888929>' : '<:8047onlinegray:1289442869060440109>',
                        value: 'activate_system',
                        description: isActive ? 'Desative o sistema de boas-vindas' : 'Ative o sistema de boas-vindas',
                    },
                    {
                        label: 'Selecionar Canal',
                        emoji: '<:channel:1290115652828270613>',
                        value: 'select_channel',
                        description: 'Selecione o canal para enviar mensagens de boas-vindas',
                    },
                    {
                        label: 'Redefinir Configurações',
                        emoji: '<:NA_Intr004:1289442144255213618>',
                        value: 'reset_settings',
                        description: 'Redefina todas as configurações de boas-vindas',
                    }
                ];

                const createEmbed = (isActive, assignedChannel) => {
                    return new EmbedBuilder()
                        .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                        .setDescription(
                            `* <:shop_white:1289442593452724244> **Bem-vindo(a) ao sistema de configuração de canal de boas-vindas!**\n` +
                            `  - Quando um novo usuário entrar no servidor, uma saudação será enviada automaticamente ao canal configurado. Utilize o menu abaixo para configurar.\n\n` +
                            `* <:settings:1289442654806999040> **Informações sobre o sistema:**\n` +
                            `  - **Status:** ${isActive ? '<:8047onlinegray:1289442869060440109> Ativado' : '<:red_dot:1289442683705888929> Desativado'}\n` +
                            `  - **Canal Configurado:** <:channels_and_roles:1289442612088147980> ${assignedChannel}\n\n` +
                            `-# <:info:1290116635814002749> Caso tenha dúvidas ou enfrente algum problema, sinta-se à vontade para entrar em nosso [servidor de suporte](http://dsc.gg/grovesuporte). Nossa equipe está à disposição para auxiliá-lo!`
                        )
                        .setColor('#ba68c8')
                        .setFooter({ text: `O sistema de boas-vindas permite configurar apenas um canal.`, iconURL: interaction.member.displayAvatarURL({ dynamic: true }) })
                        .setTimestamp();
                };

                let embed = createEmbed(isActive, assignedChannel); // Atualização aqui

                const initialSelectMenu = new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('welcome_menu')
                            .setPlaceholder('Selecione a opção que deseja configurar.')
                            .addOptions(generateOptions(isActive))
                    );

                // Envia o menu inicial
                const message = await interaction.reply({
                    embeds: [embed],
                    components: [initialSelectMenu],
                });

                const timeoutDuration = 60000; // 60 segundos
                const startTime = Date.now(); // Marca o momento em que o coletor foi iniciado

                // Cria um coletor para o menu inicial
                const filter = (i) => i.customId === 'welcome_menu' && i.user.id === interaction.user.id;
                const collector = message.createMessageComponentCollector({ filter, time: timeoutDuration });

                collectors.set(userId, { collector, timeout: timeoutDuration, startTime });

                collector.on('collect', async (i) => {
                    await i.deferUpdate();

                    // Atualiza a configuração ao coletar a interação
                    settings = await bemvindo.findOne({ guildId: interaction.guild.id });
                    isActive = settings?.isActive || false;
                    assignedChannel = settings?.canal1 ? `<#${settings.canal1}>` : "Nenhum canal configurado";

                    if (i.values[0] === 'select_channel') {
                        const channelsPerPage = 25;
                        let currentPage = 0;
                        const textChannels = interaction.guild.channels.cache
                            .filter(channel => channel.type === 0)
                            .map(channel => ({ label: channel.name, value: channel.id }));
                        const totalPages = Math.ceil(textChannels.length / channelsPerPage);

                        const generateSelectMenu = (page) => {
                            const start = page * channelsPerPage;
                            const end = start + channelsPerPage;
                            const slicedChannels = textChannels.slice(start, end);

                            return new ActionRowBuilder()
                                .addComponents(
                                    new StringSelectMenuBuilder()
                                        .setCustomId('select_welcome_channel')
                                        .setPlaceholder('Selecione o canal de boas-vindas')
                                        .addOptions(slicedChannels)
                                );
                        };

                        const generateActionRowWithButtons = (page) => {
                            return new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('previous_page')
                                        .setLabel('Voltar')
                                        .setEmoji('<:reply_3389006:1290102452732821597>')
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(page === 0),
                                    new ButtonBuilder()
                                        .setCustomId('next_page')
                                        .setEmoji('<:forward_3389009:1290102446764462182>')
                                        .setLabel('Avançar')
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(page === totalPages - 1)
                                );
                        };

                        let ephemeralMessage = await i.followUp({
                            content: `Página ${currentPage + 1}/${totalPages}. Selecione o canal de boas-vindas:`,
                            components: [generateSelectMenu(currentPage), generateActionRowWithButtons(currentPage)],
                            ephemeral: true,
                        });

                        const channelCollector = ephemeralMessage.createMessageComponentCollector({ time: 60000 });

                        channelCollector.on('collect', async (i) => {
                            if (i.customId === 'previous_page') {
                                currentPage -= 1;
                            } else if (i.customId === 'next_page') {
                                currentPage += 1;
                            } else if (i.customId === 'select_welcome_channel') {
                                const selectedChannelId = i.values[0];

                                // Salvar a escolha no banco de dados
                                await bemvindo.findOneAndUpdate(
                                    { guildId: interaction.guild.id },
                                    { $set: { canal1: selectedChannelId } },
                                    { upsert: true }
                                );

                                // Atualizar a mensagem de confirmação
                                await i.update({
                                    content: `<:1078434426368839750:1290114335909085257> Canal de boas-vindas configurado com sucesso para <#${selectedChannelId}>.`,
                                    components: [],
                                });

                                // Atualizar a embed original
                                embed = createEmbed(isActive, `<#${selectedChannelId}>`); // Atualiza a embed corretamente

                                // Editar a mensagem original do menu
                                await interaction.editReply({
                                    embeds: [embed],
                                    components: [initialSelectMenu],
                                });

                                return;
                            }

                            await i.update({
                                content: `Página ${currentPage + 1}/${totalPages}. Selecione o canal de boas-vindas:`,
                                components: [generateSelectMenu(currentPage), generateActionRowWithButtons(currentPage)],
                            });
                        });

                        channelCollector.on('end', (collected, reason) => {

                            if (reason === 'time') {
                                // i.followUp({ content: 'O tempo para selecionar um canal expirou.', ephemeral: true });
                            }
                        })

                    }
                    if (i.values[0] === 'activate_system') {
                        // Alterna o status atual de isActive
                        isActive = !isActive;

                        // Atualiza o banco de dados com o novo status (isActive)
                        const updateResult = await bemvindo.findOneAndUpdate(
                            { guildId: interaction.guild.id },
                            { $set: { isActive: isActive } },
                            { upsert: true, new: true }
                        );

                        if (!updateResult) throw new Error("Erro ao atualizar o banco de dados.");

                        // Atualiza a embed com o novo estado
                        embed = createEmbed(isActive, assignedChannel); // Atualiza a embed novamente

                        // Atualiza as opções do menu
                        const updatedSelectMenu = new ActionRowBuilder()
                            .addComponents(
                                new StringSelectMenuBuilder()
                                    .setCustomId('welcome_menu')
                                    .setPlaceholder('Selecione a opção que deseja configurar.')
                                    .addOptions(generateOptions(isActive))
                            );

                        // Atualiza a mensagem com o novo embed e menu
                        await interaction.editReply({
                            embeds: [embed],
                            components: [updatedSelectMenu],
                        });

                        await i.followUp({ content: `<:1078434426368839750:1290114335909085257> O sistema de bem-vindo foi ${isActive ? '<:8047onlinegray:1289442869060440109> Ativado' : '<:red_dot:1289442683705888929> Desativado'}.`, ephemeral: true });


                    }
                    if (i.values[0] === 'reset_settings') {

                        // Atualiza o banco de dados para redefinir as configurações
                        await bemvindo.findOneAndUpdate(
                            { guildId: interaction.guild.id },
                            { $set: { canal1: null, isActive: false } },
                            { upsert: true }
                        );

                        // Atualiza a embed e o menu
                        embed = createEmbed(false, "Nenhum canal configurado");
                        const updatedSelectMenu = new ActionRowBuilder()
                            .addComponents(
                                new StringSelectMenuBuilder()
                                    .setCustomId('welcome_menu')
                                    .setPlaceholder('Selecione a opção que deseja configurar.')
                                    .addOptions(generateOptions(false))
                            );

                        await interaction.editReply({
                            embeds: [embed],
                            components: [updatedSelectMenu],
                        });

                        await i.followUp({ content: '<:1078434426368839750:1290114335909085257> As configurações de boas-vindas foram redefinidas com sucesso.', ephemeral: true });

                    }
                })

                collector.on('end', async (collected, reason) => {
                    const originalMessage = await interaction.fetchReply().catch(() => null);

                    if (!originalMessage) {
                        return collectors.delete(userId)
                    }

                    if (reason === 'time') {
                        await interaction.editReply({
                            components: []
                        });
                    } else {
                        await interaction.editReply({
                            components: []
                        });
                    }

                    collectors.delete(userId)
                })
                break;
            }


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
