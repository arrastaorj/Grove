const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    PermissionsBitField,
    PermissionFlagsBits,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ComponentType,
    ChannelType,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');

const cargos = require("../../database/models/cargos")
const { v4: uuidv4 } = require('uuid')
const collectors = new Map()

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cargos')
        .setDescription('Configure o sistema de select-Cargos para os membros.'),

    async execute(interaction) {



        // Verificação de permissões do usuário
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return await interaction.reply({
                content: `> \`-\` <:NA_Intr004:1289442144255213618> Não posso concluir este comando pois você não possui permissão. (ManageRoles).`,
                ephemeral: true
            })
        }

        // Verificação de permissões do bot
        if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return await interaction.reply({
                content: `> \`-\` <:NA_Intr004:1289442144255213618> O bot não possui permissão para concluir este comando (ManageRoles).`,
                ephemeral: true
            })
        }



        const userId = interaction.user.id;

        // Verificar se já existe um coletor ativo para o usuário
        if (collectors.has(userId)) {
            const { timeout, startTime } = collectors.get(userId);
            const timeElapsed = Date.now() - startTime;
            const timeRemaining = timeout - timeElapsed;

            // Convertendo o tempo restante para segundos
            const secondsRemaining = Math.ceil(timeRemaining / 1000);

            // Função para formatar o tempo em horas, minutos e segundos
            function formatTime(seconds) {
                const hours = Math.floor(seconds / 3600);
                const minutes = Math.floor((seconds % 3600) / 60);
                const secondsLeft = seconds % 60;

                let result = '';
                if (hours > 0) result += `${hours} hora${hours > 1 ? 's' : ''}, `;
                if (minutes > 0) result += `${minutes} minuto${minutes > 1 ? 's' : ''}, `;
                result += `${secondsLeft} segundo${secondsLeft > 1 ? 's' : ''}`;

                return result;
            }

            // Formatando o tempo restante
            const formattedTime = formatTime(secondsRemaining)

            return interaction.reply({
                content: `\`-\` <:NA_Intr004:1289442144255213618> Você já iniciou uma solicitação no sistema de Tickets. Por favor, aguarde ${formattedTime} antes de tentar novamente. Se preferir, você pode excluir a solicitação atual e utilizar o comando novamente.`,
                ephemeral: true
            })
        }


        let selectedCargotId = null;

        // Função para definir o valor da variável
        function setSelectedCargotId(id) {
            selectedCargotId = id;
        }

        // Função para obter o valor da variável
        function getSelectedCargotId() {
            return selectedCargotId;
        }

        // Exporta as funções para outros arquivos
        module.exports = {
            setSelectedCargotId,
            getSelectedCargotId
        };


        const cargosConfigs = await cargos.find({
            guildId: interaction.guild.id
        })


        const selectMenuOptions = cargosConfigs.map(config => ({
            label: `Select-Cargos ID`,
            emoji: '<:Logs:1297733186985398375>',
            value: config.cargosId,
            description: ` ${config.cargosId}`
        }))


        selectMenuOptions.push({
            label: 'Criar novo sistema de Select-Cargos',
            emoji: '<:Ajouter:1297732836605825054>',
            value: 'cargos_add',
            description: 'Adicione um novo sistema de Select-Cargos'
        });


        selectMenuOptions.push({
            label: 'Deletar Sistema de Select-Cargos',
            emoji: '<:Supprimer:1299793527768612904>',
            value: 'cargos_delete',
            description: 'Exclua um sistema de Select-Cargos já configurado'
        })

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_cargos_config')
            .setPlaceholder('Selecione um Select-Cargos existente ou crie um novo')
            .addOptions(selectMenuOptions);



        const buttonVoltar = new ButtonBuilder()
            .setLabel("Voltar")
            .setEmoji("<:arrowwhite_left:1293008404662587402>")
            .setCustomId('voltarCargos')
            .setStyle(ButtonStyle.Secondary)

        const rowCargosBack = new ActionRowBuilder().addComponents(buttonVoltar)

        const row = new ActionRowBuilder().addComponents(selectMenu);


        const embedInicial = new EmbedBuilder()
            .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
            .setFooter({ text: `O sistema de Select-Cargos permite configurar apenas 10 cargos por selectMenus.`, iconURL: interaction.member.displayAvatarURL({ dynamic: true }) })
            .setColor("#ba68c8")
            .setTimestamp()
            .setDescription(
                `* <:shop_white:1289442593452724244> **Bem-vindo(a) ao sistema de configuração de Select-Cargos!**\n` +
                `  - Acesse o menu abaixo para selecionar um Select-Cargos já existente ou iniciar a criação de um novo.\n\n` +
                `-# <:info:1290116635814002749> Caso tenha dúvidas ou enfrente algum problema, sinta-se à vontade para entrar em nosso [servidor de suporte](http://dsc.gg/grovesuporte). Nossa equipe está à disposição para auxiliá-lo!`)
            .setColor("#ba68c8")



        const initialMessage = await interaction.reply({
            embeds: [embedInicial],
            components: [row],
        })


        let cargosData = await cargos.findOne({
            guildId: interaction.guild.id,
            cargosId: selectedCargotId
        })

        let assignedChannelLogs = cargosData?.logsId ? `<#${cargosData.logsId}>` : 'Não configurado';
        let assignedDescription = cargosData?.description ? `${cargosData.description}` : 'Não configurado';
        let imagem01 = cargosData?.Img ? `${cargosData.Img}` : 'Não configurado';
        let assignedRoles = cargosData && cargosData?.cargos?.length > 0
            ? cargosData.cargos.map(roleId => {
                const role = interaction.guild.roles.cache.get(roleId);
                return role ? `<@&${role.id}>` : '';
            }).filter(roleMention => roleMention)
                .join(', ')
            : 'Nenhum cargo atribuído';

        // Função para criar a embed
        const createEmbed = (assignedChannelLogs, assignedDescription, imagem01, assignedRoles) => {
            const embed = new EmbedBuilder()
                .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                .setDescription(
                    `* <:shop_white:1289442593452724244> **Bem-vindo(a) ao sistema de Select-Cargos do Grove!**\n` +
                    `  - Os membros agora podem escolher os cargos que desejam receber diretamente no menu.\n\n` +
                    `* <:settings:1289442654806999040> **Informações sobre o sistema:**\n` +
                    `  - **Canal de Logs:** <:channel:1290115652828270613> ${assignedChannelLogs}\n` +
                    `  - **Descrição:** <:edit1:1293726236505542788> ${assignedDescription}\n` +
                    `  - **Imagem/GIF:** <:media_add:1294097077579550794> ${imagem01}\n` +
                    `  - **Cargos Atribuídos:** <:announcement:1293726066174595215> ${assignedRoles}\n\n` +

                    `-# <:info:1290116635814002749> Caso tenha dúvidas ou enfrente algum problema, sinta-se à vontade para entrar em nosso [servidor de suporte](http://dsc.gg/grovesuporte). Nossa equipe está à disposição para auxiliá-lo!`)
                .setColor('#ba68c8')
                .setFooter({ text: `O sistema de Select-Cargos permite a configuração de no máximo 10 cargos.`, iconURL: interaction.member.displayAvatarURL({ dynamic: true }) })
                .setTimestamp()

            return embed;
        }

        let embed = createEmbed(assignedChannelLogs, assignedDescription, imagem01, assignedRoles)

        function createAutoroleMenu() {
            return new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('initial-menu')
                    .setPlaceholder('Selecione a opção que deseja configurar.')
                    .addOptions([
                        {
                            label: 'Adicionar Canal de Logs',
                            value: 'canal_log',
                            description: 'Configurar o canal onde as logs dos cargos serão enviadas.',
                            emoji: `<:channel:1290115652828270613>`,
                        },
                        {
                            label: 'Adicionar descrição',
                            value: 'description',
                            description: 'Configurar uma descrição para o menu de cargos.',
                            emoji: `<:Logs1:1300612045036716063>`,
                        },
                        {
                            label: 'Adicionar imagem',
                            value: 'imgCargos',
                            description: 'Configurar uma imagem para o menu de cargos.',
                            emoji: `<:media_add:1294097077579550794>`,
                        },

                        {
                            label: 'Adicionar cargo',
                            description: 'Adicionar um cargo ao sistema',
                            value: 'add_role',
                            emoji: '<:member_white:1289442908298023003>'
                        },
                        {
                            label: 'Remover Cargos',
                            description: 'Remova da lista cargos não desejados para o sistema.',
                            emoji: `<:member_red:1289442888610086924>`,
                            value: 'remove_role'
                        },
                        {
                            label: 'Enviar Select-Cargos',
                            description: 'Enviar o menu de cargos em um canal específico',
                            value: 'send_in_channel',
                            emoji: '<:upload:1293725213619523674>'
                        }
                    ])
            )
        }

        async function updateCargosEmbed(interaction) {
            // Buscar as informações mais recentes do banco de dados
            const updatedCargosConfig = await cargos.findOne({
                guildId: interaction.guild.id,
                cargosId: selectedCargotId
            })

            const assignedChannelLogs = updatedCargosConfig?.logsId ? `<#${updatedCargosConfig.logsId}>` : 'Não configurado';

            let assignedDescription = updatedCargosConfig?.description ? `${updatedCargosConfig.description}` : 'Não configurado';
            let imagem01 = updatedCargosConfig?.Img ? `${updatedCargosConfig.Img}` : 'Não configurado';


            const assignedRoles = updatedCargosConfig && updatedCargosConfig.cargos?.length > 0
                ? updatedCargosConfig.cargos.map(roleId => {
                    const role = interaction.guild.roles.cache.get(roleId);
                    return role ? `<@&${role.id}>` : '';
                }).filter(roleMention => roleMention)
                    .join(', ')
                : 'Nenhum cargo atribuído';

            // Recriar a embed com as novas informações
            const embed = createEmbed(assignedChannelLogs, assignedDescription, imagem01, assignedRoles)

            // Atualizar a resposta da interação com a nova embed
            await interaction.editReply({
                content: ``,
                embeds: [embed],
                components: [createAutoroleMenu(), rowCargosBack],
            });
        }



        const timeoutDuration = 600000; // 10 minutos
        const startTime = Date.now(); // Marca o momento em que o coletor foi iniciado


        const filter = (i) => i.customId === 'select_cargos_config' || i.customId === 'select_cargos_confirm_delete';
        const collector = initialMessage.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, time: timeoutDuration });

        // Armazenar o coletor no Map com o tempo de início e duração
        collectors.set(userId, { collector, timeout: timeoutDuration, startTime });

        collector.on('collect', async i => {

            const selectedOption = i.values[0];


            if (selectedOption === 'cargos_add') {

                const existingCargos = await cargos.find({ guildId: interaction.guild.id }).countDocuments();


                if (existingCargos >= 5) {
                    return i.update({
                        content: '<:NA_Intr004:1289442144255213618> O limite de 5 sistemas de Select-Cargos já foi atingido para este servidor.',
                        embeds: [],
                        components: [rowCargosBack]
                    });
                }


                const newCargoId = uuidv4();


                const newCargoConfig = new cargos({
                    guildId: interaction.guild.id,
                    cargosId: newCargoId,
                    title: null,
                    description: null,
                    logsId: null,
                    Img: null,
                    cargos: [],
                })


                await newCargoConfig.save();


                await i.update({
                    content: '<a:1278158897487806668:1298101208053059594> O sistema de Select-Cargos está sendo criado, por favor aguarde...',
                    embeds: [],
                    components: []
                });

                const embed = new EmbedBuilder()
                    .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                    .setFooter({ text: `O sistema de Select-Cargos permite a configuração de até 5 opções diferentes.`, iconURL: interaction.member.displayAvatarURL({ dynamic: true }) })
                    .setColor("#48ff00")
                    .setDescription(
                        `* **<:new:1289442513094049854> Novo sistema de Select-Cargos criado com sucesso.**\n` +
                        `  - **<:new1:1289442459776057375> ID:** \`\`${newCargoId}\`\`\n` +
                        `* O novo sistema está pronto para configuração no menu de Select-Cargos.\n\n` +
                        `-# <:info:1290116635814002749> Caso tenha dúvidas ou enfrente algum problema, sinta-se à vontade para entrar em nosso [servidor de suporte](http://dsc.gg/grovesuporte). Nossa equipe está à disposição para auxiliá-lo!`,
                    )

                setTimeout(() => {
                    i.editReply({
                        content: ``,
                        embeds: [embed],
                        components: [rowCargosBack]
                    });
                }, 5000);

                // Retornar para evitar que o fluxo continue para o else
                return;
            }

            // Supondo que o coletor original já está configurado
            if (selectedOption === 'cargos_delete') {


                const CargoConfigs = await cargos.find({ guildId: interaction.guild.id })
                if (CargoConfigs.length === 0) {
                    return i.reply({ content: `<:info:1290116635814002749> Nenhum Select-Cargos existente encontrado.`, ephemeral: true });
                }


                const selectMenuOptionstes = CargoConfigs.map(config => ({
                    label: `Select-Cargos ID`,
                    emoji: '<:Logs:1297733186985398375>',
                    value: config.cargosId,
                    description: `Apagar Select-Cargos ID ${config.cargosId}`
                }));


                const rowDelete = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('select_cargos_confirm_delete')
                        .setPlaceholder('Selecione o Select-Cargo que deseja deletar')
                        .addOptions(selectMenuOptionstes)
                );


                await i.update({
                    content: 'Selecione o Select-Cargos que deseja deletar:',
                    embeds: [],
                    components: [rowDelete],
                })
                return
            }

            if (i.customId === 'select_cargos_confirm_delete') {
                const selectedCargotId = i.values[0];


                await cargos.deleteOne({ cargosId: selectedCargotId });

                await i.update({
                    content: `<:1078434426368839750:1290114335909085257> O Select-Cargos foi deletado com sucesso.\n<:id:1284903920019308604> **ID:** \`\`${selectedCargotId}\`\``,
                    components: [rowCargosBack],

                })
                return
            }

            if (selectedOption !== 'cargos_add' && selectedOption !== 'cargos_delete' && selectedOption !== 'select_cargos_confirm_delete') {
                selectedCargotId = selectedOption;
                setSelectedCargotId(selectedOption);

                if (selectedCargotId) {
                    await i.deferUpdate();
                    await updateCargosEmbed(interaction);
                }
            }

        })


        const filter2 = i => i.user.id === interaction.user.id;
        const collector2 = initialMessage.createMessageComponentCollector({ filter2, time: timeoutDuration });

        collector2.on('collect', async i => {

            const channelsPerPage = 25;

            // Gera os canais de texto no servidor
            const textChannels = interaction.guild.channels.cache
                .filter(channel => channel.type === 0) // Tipo de canal de texto
                .map(channel => ({ label: channel.name, value: channel.id }));
            const totalPages = Math.ceil(textChannels.length / channelsPerPage);

            const generateChannelSelectMenu = (page, textChannels, customId, placeholder) => {
                const start = page * channelsPerPage;
                const end = start + channelsPerPage;
                const slicedChannels = textChannels.slice(start, end);

                return new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId(customId)
                            .setPlaceholder(placeholder)
                            .addOptions(slicedChannels)
                    );
            };

            const generatePaginationButtons = (page, totalPages) => {
                return new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('previous_page')
                            .setLabel('Voltar')
                            .setEmoji('<:arrowwhite_left:1293008404662587402>')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === 0),
                        new ButtonBuilder()
                            .setCustomId('next_log_page')
                            .setLabel('Avançar')
                            .setEmoji('<:arrowwhite:1293008459968544779>')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === totalPages - 1)
                    );
            };

            const filterrr = (btnInt) =>
                ['previous_page', 'next_log_page'].includes(btnInt.customId) && btnInt.user.id === interaction.user.id;

            if (i.customId === 'initial-menu') {

                const selectedValue = i.values[0]

                if (selectedValue === 'canal_log') {

                    await i.deferUpdate();

                    let logChannelPage = 0;
                    const totalLogPages = Math.ceil(textChannels.length / channelsPerPage);

                    const paginationLogMessage = await i.followUp({
                        content: `Página ${logChannelPage + 1}/${totalLogPages}. Selecione o canal de logs:`,
                        components: [
                            generateChannelSelectMenu(logChannelPage, textChannels, 'select_log_channel', 'Selecione o canal de logs'),
                            generatePaginationButtons(logChannelPage, totalLogPages)
                        ],
                        ephemeral: true
                    });

                    const logCollector = paginationLogMessage.createMessageComponentCollector({ filterrr, componentType: ComponentType.Button, time: timeoutDuration });

                    logCollector.on('collect', async (btnInt) => {
                        if (btnInt.customId === 'previous_page') logChannelPage -= 1;
                        if (btnInt.customId === 'next_log_page') logChannelPage += 1;

                        await btnInt.update({
                            content: `Página ${logChannelPage + 1}/${totalLogPages}. Selecione o canal de logs:`,
                            components: [
                                generateChannelSelectMenu(logChannelPage, textChannels, 'select_log_channel', 'Selecione o canal de logs'),
                                generatePaginationButtons(logChannelPage, totalLogPages)
                            ]
                        });
                    });

                    const selectLogMenuCollector = paginationLogMessage.createMessageComponentCollector({ filter: (int) => int.customId === 'select_log_channel', time: timeoutDuration });

                    selectLogMenuCollector.on('collect', async (i) => {
                        const selectedLogChannelId = i.values[0];

                        await cargos.updateOne(
                            { guildId: interaction.guild.id, cargosId: selectedCargotId }, // Condições de busca
                            { $set: { logsId: selectedLogChannelId } }, // Atualização
                            { lean: true } // Usando lean para otimização, upsert para criar se não existir
                        )
                        await updateCargosEmbed(interaction);

                        await i.update({
                            content: `<:1078434426368839750:1290114335909085257> Canal de logs configurado com sucesso: <#${selectedLogChannelId}>`,
                            components: []
                        });
                    });

                }

                if (selectedValue === 'description') {
                    // Cria um modal para solicitar a descrição 1
                    const modal = new ModalBuilder()
                        .setCustomId('descricao_cargos_modal')
                        .setTitle('Configurar Descrição 1');

                    // Adiciona um campo de texto para a descrição 1
                    const textInput = new TextInputBuilder()
                        .setCustomId('descricao_cargos_input')
                        .setLabel('Descrição')
                        .setMaxLength(4000)
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder('Descrição para o menu de cargos.')
                        .setRequired(true);

                    // Adiciona o campo ao modal
                    const actionRow = new ActionRowBuilder().addComponents(textInput);
                    modal.addComponents(actionRow);

                    // Envia o modal ao usuário
                    await i.showModal(modal);
                }

                if (selectedValue === 'imgCargos') {
                    // Cria o modal para coletar o link da imagem 01
                    const modal = new ModalBuilder()
                        .setCustomId('imagem_Modal')
                        .setTitle('Configurar Imagem');

                    // Campo para o usuário inserir o link da imagem 01
                    const imageLinkInput = new TextInputBuilder()
                        .setCustomId('imagem_Link')
                        .setLabel('Insira o link da Imagem')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('https://example.com/imagem.png')
                        .setRequired(true);

                    // Adiciona o campo de texto ao modal
                    const actionRow = new ActionRowBuilder().addComponents(imageLinkInput);
                    modal.addComponents(actionRow);

                    // Exibe o modal para o usuário
                    await i.showModal(modal)
                }

                if (selectedValue === 'add_role') {

                    let cargosData = await cargos.findOne({ guildId: interaction.guild.id, cargosId: selectedCargotId });

                    const currentRoles = cargosData ? cargosData.cargos : [];

                    // Verificação de limite de cargos configurados
                    if (currentRoles.length >= 10) {
                        return await i.reply({
                            content: '> \`-\` <:NA_Intr004:1289442144255213618> O máximo de cargos definidos foi atingido! Para adicionar outro cargo, remova algum da lista.',
                            ephemeral: true
                        });
                    }

                    // Verificação de permissões do bot
                    const botMember = interaction.guild.members.me; // Obtém o próprio bot como membro do servidor
                    if (!botMember.permissions.has('ManageRoles')) {
                        return await i.reply({
                            content: '> \`-\` <:NA_Intr004:1289442144255213618> O bot não tem permissão para gerenciar cargos! Conceda a permissão de "Gerenciar Cargos" para continuar.',
                            ephemeral: true
                        });
                    }

                    // Verifica se o bot está acima dos cargos que deseja manipular
                    const highestBotRole = botMember.roles.highest; // Cargo mais alto do bot
                    const rolesBelowBot = currentRoles.every(roleId => {
                        const role = interaction.guild.roles.cache.get(roleId);
                        return role && highestBotRole.position > role.position; // Verifica se o cargo do bot é superior
                    });

                    if (!rolesBelowBot) {
                        return await i.reply({
                            content: '> \`-\` <:NA_Intr004:1289442144255213618> O bot precisa estar acima dos cargos que deseja gerenciar. Ajuste a posição dos cargos no servidor para continuar.',
                            ephemeral: true
                        });
                    }

                    // Se todas as verificações passarem, continua com a criação do menu
                    const { components, totalPages } = await createAddRoleMenu(interaction.guild, 0); // Página inicial (0)

                    // Verifica se há opções para o select menu
                    if (!components[0].components[0].options || components[0].components[0].options.length === 0) {
                        return await i.reply({
                            content: '> \`-\` <:NA_Intr004:1289442144255213618> Nenhum cargo disponível para selecionar. Verifique as permissões ou a posição do cargo do bot.',
                            ephemeral: true
                        });
                    }

                    await i.reply({
                        content: `Selecione os cargos para adicionar: (Página 1 de ${totalPages})`,
                        components: components,
                        ephemeral: true
                    });
                }

                if (selectedValue === 'remove_role') {
                    const autoroleData = await cargos.findOne({ guildId: interaction.guild.id, cargosId: selectedCargotId })
                    const removeRoleMenu = createRemoveRoleMenu(autoroleData, interaction.guild);
                    await i.reply({ content: 'Selecione os cargos para remover:', components: [removeRoleMenu], ephemeral: true })
                }

                if (selectedValue === 'send_in_channel') {

                    const configData = await cargos.findOne({ guildId: interaction.guild.id, cargosId: selectedCargotId })

                    if (configData.cargos.length === 0) {
                        await i.reply({ content: '> \`-\` <:NA_Intr004:1289442144255213618> É necessário ter pelo menos um cargo configurado antes de enviar o Select-Cargos.', ephemeral: true });
                        await updateCargosEmbed(interaction);
                        return;
                    }

                    const requiredItems = [
                        { key: 'logsId', name: 'Canal de Logs' },
                    ];

                    let missingItems = [];
                    requiredItems.forEach(item => {
                        if (!configData[item.key]) {
                            missingItems.push(item.name);
                        }
                    });

                    if (missingItems.length > 0) {
                        await i.reply({
                            content: `> \`-\` <:NA_Intr004:1289442144255213618> Os seguintes itens não foram configurados: **${missingItems.join(', ')}**`,
                            ephemeral: true
                        })
                        await updateCargosEmbed(interaction);
                        return;
                    }

                    const textChannels = interaction.guild.channels.cache
                        .filter(channel => channel.isTextBased() && channel.type === ChannelType.GuildText)
                        .map(channel => ({ label: channel.name, value: channel.id }));

                    if (textChannels.length === 0) {
                        await interaction.reply({
                            content: '> Não foram encontrados canais de texto disponíveis para selecionar.',
                            ephemeral: true
                        })
                        await updateCargosEmbed(interaction);
                        return;
                    }

                    await i.deferUpdate();


                    let logChannelPage = 0;
                    const totalLogPages = Math.ceil(textChannels.length / channelsPerPage);

                    const paginationLogMessage = await i.followUp({
                        content: `Página ${logChannelPage + 1}/${totalLogPages}. Selecione o canal de logs:`,
                        components: [
                            generateChannelSelectMenu(logChannelPage, textChannels, 'select_log_channel', 'Selecione o canal de logs'),
                            generatePaginationButtons(logChannelPage, totalLogPages)
                        ],
                        ephemeral: true
                    });

                    const logCollector = paginationLogMessage.createMessageComponentCollector({ filterrr, componentType: ComponentType.Button, time: timeoutDuration });

                    logCollector.on('collect', async (btnInt) => {
                        if (btnInt.customId === 'previous_page') logChannelPage -= 1;
                        if (btnInt.customId === 'next_log_page') logChannelPage += 1;

                        await btnInt.update({
                            content: `Página ${logChannelPage + 1}/${totalLogPages}. Selecione o canal de logs:`,
                            components: [
                                generateChannelSelectMenu(logChannelPage, textChannels, 'select_log_channel', 'Selecione o canal de logs'),
                                generatePaginationButtons(logChannelPage, totalLogPages)
                            ]
                        });
                    });

                    const selectLogMenuCollector = paginationLogMessage.createMessageComponentCollector({ filter: (int) => int.customId === 'select_log_channel', time: timeoutDuration });

                    selectLogMenuCollector.on('collect', async (i) => {

                        const selectedChannelId = i.values[0];
                        const selectedChannel = interaction.guild.channels.cache.get(selectedChannelId);


                        if (!configData || !configData.cargos || configData.cargos.length === 0) {
                            await i.reply({ content: 'Nenhum cargo configurado para enviar a mensagem.', ephemeral: true });
                            await updateCargosEmbed(interaction);
                            return;
                        }

                        const { description, Img, cargos } = configData;

                        if (cargos.length === 0) {
                            await i.reply({ content: 'É necessário ter pelo menos um cargo configurado.', ephemeral: true });
                            await updateCargosEmbed(interaction);
                            return;
                        }

                        const cargoOptions = cargos.map(cargoId => {
                            const cargo = interaction.guild.roles.cache.get(cargoId);
                            return { label: cargo ? cargo.name : 'Cargo desconhecido', value: cargoId };
                        });

                        const maxValues = Math.min(cargoOptions.length, 10);

                        const cargoSelectMenu = new StringSelectMenuBuilder()
                            .setCustomId(`select-cargo-${selectedCargotId}`)
                            .setPlaceholder('Selecione o cargo que deseja.')
                            .setMaxValues(maxValues)
                            .setMinValues(0)
                            .addOptions(cargoOptions);

                        const cargoRow = new ActionRowBuilder().addComponents(cargoSelectMenu);

                        if (description || Img) {
                            const embed = new EmbedBuilder();
                            if (description) embed.setDescription(description)
                            if (Img) embed.setImage(Img)
                            await selectedChannel.send({
                                embeds: [embed],
                                components: [cargoRow]
                            })

                        } else {
                            await selectedChannel.send({ components: [cargoRow] });
                        }

                        await i.update({
                            content: `Mensagem com a seleção de cargos enviada para o canal **${selectedChannel.name}**!`,
                            components: [],
                            ephemeral: true
                        })
                        await updateCargosEmbed(interaction);
                        return;
                    })
                }
            }

            if (i.customId === 'select_role_to_add') {

                await i.deferUpdate();
                const selectedRoleIds = i.values;

                await cargos.updateOne(
                    { guildId: interaction.guild.id, cargosId: selectedCargotId },
                    { $addToSet: { cargos: { $each: selectedRoleIds } } },
                    { upsert: true }
                );


                await updateCargosEmbed(interaction)

                const updatedRoles2 = selectedRoleIds.map(roleId => `<@&${roleId}>`);
                await i.editReply({ content: `Cargo ${updatedRoles2.join(', ')} adicionado com sucesso!`, components: [], ephemeral: true });
            } else if (i.customId.startsWith('prev_page') || i.customId.startsWith('next_page')) {
                await i.deferUpdate();

                // Pega a página atual diretamente do customId
                const currentPage = parseInt(i.customId.split('_')[2], 10);

                // Atualiza a página com base no botão pressionado
                const newPage = i.customId.startsWith('next_page') ? currentPage + 1 : currentPage - 1;

                // Gera novamente o menu com a página atualizada
                const { components, totalPages } = await createAddRoleMenu(interaction.guild, newPage);

                await i.editReply({
                    content: `Selecione os cargos para adicionar: (Página ${newPage + 1} de ${totalPages})`,
                    components: components
                })
            }

            if (i.customId === 'select_role_to_remove') {

                await i.deferUpdate();
                const selectedRoleId = i.values[0];

                if (selectedRoleId === 'reset_all') {
                    // Remove todos os cargos
                    await cargos.updateOne(
                        { guildId: interaction.guild.id, cargosId: selectedCargotId },
                        { $set: { cargos: [] } } // Reseta a lista de cargos
                    )

                    await updateCargosEmbed(interaction)
                    await i.editReply({ content: '<:1078434426368839750:1290114335909085257> Todos cargos foram **removido** com sucesso!', components: [], ephemeral: true });

                } else {
                    await cargos.findOneAndUpdate(
                        { guildId: interaction.guild.id, cargosId: selectedCargotId },
                        { $pull: { cargos: selectedRoleId } }
                    );

                    await updateCargosEmbed(interaction)
                    await i.editReply({ content: `<:1078434426368839750:1290114335909085257> Cargo **removido** com sucesso!`, components: [] });
                }
            }

        })

        collector.on('end', async (collected, reason) => {

            const originalMessage = await interaction.fetchReply().catch(() => null)

            if (!originalMessage) {
                return collectors.delete(userId)
            }

            if (reason === 'time') {
                await interaction.editReply({
                    components: []
                })
            } else {
                await interaction.editReply({
                    components: []
                })
            }

            collectors.delete(userId)
        })

    }
}


async function createAddRoleMenu(guild, currentPage = 0) {
    const cargosData = await cargos.findOne({ guildId: guild.id });
    const currentRoles = cargosData ? cargosData.cargos : [];

    // Limite de cargos que podem ser adicionados (máximo 5)
    const maxRolesToAdd = Math.max(1, 10 - currentRoles.length);

    // Busca os cargos diretamente da API do Discord
    const fetchedRoles = await guild.roles.fetch();
    const availableRoles = fetchedRoles
        .filter(role =>
            role.editable &&
            !role.managed &&
            !currentRoles.includes(role.id) && // Remove cargos já cadastrados
            role.name !== '@everyone' && // Remove o cargo @everyone
            !role.managed // Remove cargos de bots (geralmente geridos pelo sistema)
        )
        .map(role => ({
            label: role.name,
            description: `ID: ${role.id}`,
            emoji: `<:member_white:1288778434184609804>`,
            value: role.id
        }));

    const rolesPerPage = 25;
    const totalPages = Math.ceil(availableRoles.length / rolesPerPage);

    // Pega a lista de cargos da página atual
    const paginatedRoles = availableRoles.slice(currentPage * rolesPerPage, (currentPage + 1) * rolesPerPage);


    // Cria o select menu
    const selectMenu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('select_role_to_add')
            .setPlaceholder('Escolha os cargos para adicionar')
            .setMaxValues(Math.min(maxRolesToAdd, paginatedRoles.length)) // Limita o número de seleções
            .addOptions(paginatedRoles) // Adiciona opções paginadas
    );

    // Cria os botões de navegação de páginas
    const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`prev_page_${currentPage}`) // Adiciona o número da página no customId
            .setLabel('Página Anterior')
            .setEmoji('<:arrowwhite_left:1293008404662587402>')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === 0), // Desabilita se estiver na primeira página
        new ButtonBuilder()
            .setCustomId(`next_page_${currentPage}`) // Adiciona o número da página no customId
            .setLabel('Próxima Página')
            .setEmoji('<:arrowwhite:1293008459968544779>')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === totalPages - 1) // Desabilita se estiver na última página
    );

    // Retorna o select menu e os botões de navegação
    return { components: [selectMenu, buttons], totalPages };
}

function createRemoveRoleMenu(cargosData, guild) {
    const storedRoleIds = cargosData.cargos
    const roleOptions = [];

    // Adiciona a opção de resetar todos os cargos no início
    roleOptions.push({
        label: 'Resetar todos (Irreversível)',
        description: `Essa opção irá remover todos os cargos definidos.`,
        emoji: `<:Supprimer:1299793527768612904>`,
        value: 'reset_all'
    });

    // Mapeia os cargos armazenados
    storedRoleIds.forEach(id => {
        const role = guild.roles.cache.get(id);
        roleOptions.push({
            label: role ? `${role.name}` : `Cargo removido (ID: ${id})`,
            description: `ID: ${role.id}`,
            emoji: `<:member_white:1288778434184609804>`,
            value: id
        });
    });

    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('select_role_to_remove')
            .setPlaceholder('Escolha os cargos para remover')
            .setMaxValues(1)
            .addOptions(roleOptions)
    );
}
