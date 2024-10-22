const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    PermissionsBitField,
    ModalBuilder,
    TextInputBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    EmbedBuilder,
    ComponentType,
    ButtonBuilder,
    ButtonStyle,
    TextInputStyle
} = require('discord.js')
const client = require("../../index")
const ticket = require("../../database/models/ticket");
const { v4: uuidv4 } = require('uuid')
const collectors = new Map()

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Gerencie as configurações do menu de tickets.'),

    async execute(interaction) {


        // Verificação de permissões do usuário
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return await interaction.reply({
                content: `> \`-\` <:NA_Intr004:1289442144255213618> Não posso concluir este comando pois você não possui permissão. (Administrator).`,
                ephemeral: true
            })
        }

        // Verificação de permissões do bot
        if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return await interaction.reply({
                content: `> \`-\` <:NA_Intr004:1289442144255213618> O bot não possui permissão para concluir este comando (ManageMessages).`,
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


        let selectedTicketId = null;  // Variável para armazenar o ticketId

        // Função para definir o valor da variável
        function setSelectedTicketId(id) {
            selectedTicketId = id;
        }

        // Função para obter o valor da variável
        function getSelectedTicketId() {
            return selectedTicketId;
        }

        // Exporta as funções para outros arquivos
        module.exports = {
            setSelectedTicketId,
            getSelectedTicketId
        };

        // Buscar as configurações de tickets existentes no banco de dados
        const ticketConfigs = await ticket.find({ guildId: interaction.guild.id });

        // Criar opções no select menu para os diferentes tickets disponíveis
        const selectMenuOptions = ticketConfigs.map(config => ({
            label: `Ticket ID`,
            emoji: '<:Logs:1297733186985398375>',
            value: config.ticketId,
            description: ` ${config.ticketId}`
        }));

        // Adicionar a opção de criar um novo sistema de tickets
        selectMenuOptions.push({
            label: 'Criar novo sistema de ticket',
            emoji: '<:Ajouter:1297732836605825054>',
            value: 'ticket_add',
            description: 'Adicione um novo sistema de ticket'
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_ticket_config')
            .setPlaceholder('Selecione um ticket existente ou crie um novo')
            .addOptions(selectMenuOptions);

        const row = new ActionRowBuilder().addComponents(selectMenu);


        const embedInicial = new EmbedBuilder()
            .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
            .setFooter({ text: `O sistema de tickets permite configurar apenas um canal, uma categoria e um cargo permitido.`, iconURL: interaction.member.displayAvatarURL({ dynamic: true }) })
            .setColor("#ba68c8")
            .setTimestamp()
            .setDescription(
                `* <:shop_white:1289442593452724244> **Bem-vindo(a) ao sistema de configuração de tickets!**\n` +
                `  - Acesse o menu abaixo para selecionar um ticket já existente ou iniciar a criação de um novo.\n\n` +
                `-# <:info:1290116635814002749> Caso tenha dúvidas ou enfrente algum problema, sinta-se à vontade para entrar em nosso [servidor de suporte](http://dsc.gg/grovesuporte). Nossa equipe está à disposição para auxiliá-lo!`)
            .setColor("#ba68c8")



        const initialMessage = await interaction.reply({
            embeds: [embedInicial],
            components: [row],
        })


        // Busca ou cria as configurações do ticket
        let ticketConfig = await ticket.findOne({ guildId: interaction.guild.id, ticketId: selectedTicketId })


        // Garantir que as variáveis estão sendo corretamente definidas, evitando `undefined` 
        let assignedChannel = ticketConfig?.canal1 ? `<#${ticketConfig.canal1}>` : 'Não configurado';
        let assignedChannelLogs = ticketConfig?.canalLog ? `<#${ticketConfig.canalLog}>` : 'Não configurado';
        let ticketCategory = ticketConfig?.categoria ? `<#${ticketConfig.categoria}>` : 'Não configurada';
        let buttonName = ticketConfig?.nomeBotao || 'Não configurado';
        let allowedRole = ticketConfig?.cargo ? `<@&${ticketConfig.cargo}>` : 'Não configurado';
        let titulo01 = ticketConfig?.titulo01 ? `Para visualizar utilize o botão de preview abaixo` : 'Não configurado';
        let descrição01 = ticketConfig?.descrição01 ? `Para visualizar utilize o botão de preview abaixo` : 'Não configurado';
        let titulo02 = ticketConfig?.titulo02 ? `Para visualizar utilize o botão de preview abaixo` : 'Não configurado';
        let descrição02 = ticketConfig?.descrição02 ? `Para visualizar utilize o botão de preview abaixo` : 'Não configurado';

        let imagem01 = ticketConfig?.imagem01 ? `${ticketConfig.imagem01}` : 'Não configurado';
        let imagem02 = ticketConfig?.imagem02 ? `${ticketConfig.imagem02}` : 'Não configurado';


        // Função para criar a embed
        const createEmbed = (assignedChannelLogs, assignedChannel, ticketCategory, buttonName, allowedRole, titulo01, descrição01, titulo02, descrição02, imagem01, imagem02) => {
            const embed = new EmbedBuilder()
                .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                .setDescription(
                    `* <:shop_white:1289442593452724244> **Bem-vindo(a) ao sistema de configuração de tickets!**\n` +
                    `  - Utilize o menu abaixo para configurar as opções necessárias.\n\n` +
                    `* <:settings:1289442654806999040> **Informações sobre o sistema:**\n` +
                    `  - **Canal do Ticket:** <:channel:1290115652828270613> ${assignedChannel}\n` +
                    `  - **Canal de Logs:** <:channel:1290115652828270613> ${assignedChannelLogs}\n` +
                    `  - **Categoria:** <:search:1293726966360440966> ${ticketCategory}\n` +
                    `  - **Nome do Botão:** <:edit1:1293726236505542788> ${buttonName}\n` +
                    `  - **Cargo Permitido:** <:announcement:1293726066174595215> ${allowedRole}\n` +
                    `  - **Titulo 1 (Para abrir o ticket):** <:edit1:1293726236505542788> ${titulo01}\n` +
                    `  - **Descrição 1 (Para abrir o ticket):** <:summary:1293727240114278422> ${descrição01}\n` +
                    `  - **Imagem/GIF (Para abrir o ticket):** <:media:1290453610911760396> ${imagem01}\n` +
                    `  - **Titulo 2 (Dentro do ticket):** <:edit1:1293726236505542788> ${titulo02}\n` +
                    `  - **Descrição 2 (Dentro do ticket):** <:summary:1293727240114278422> ${descrição02}\n` +
                    `  - **Imagem/GIF (Dentro do ticket):** <:media:1290453610911760396> ${imagem02}\n\n` +
                    `-# <:info:1290116635814002749> Caso tenha dúvidas ou enfrente algum problema, sinta-se à vontade para entrar em nosso [servidor de suporte](http://dsc.gg/grovesuporte). Nossa equipe está à disposição para auxiliá-lo!`)
                .setColor("#ba68c8")

                .setFooter({ text: `O sistema de tickets permite configurar apenas um canal, uma categoria e um cargo permitido.`, iconURL: interaction.member.displayAvatarURL({ dynamic: true }) })
                .setTimestamp();

            return embed;
        };

        let embed = createEmbed(assignedChannelLogs, assignedChannel, ticketCategory, buttonName, allowedRole, titulo01, descrição01, titulo02, descrição02, imagem01, imagem02)


        const selectMenu2 = new StringSelectMenuBuilder()
            .setCustomId('config_ticket')
            .setPlaceholder('Selecione uma opção de configuração')
            .addOptions([
                { label: 'Enviar ticket', value: 'enviaticket', description: 'Envie a embed do ticket.', emoji: '<:upload:1293725213619523674>' },
                { label: 'Canal do Ticket', value: 'canal_ticket', description: 'Configurar o canal onde as mensagens de ticket serão enviadas.', emoji: `<:channel:1290115652828270613>` },
                { label: 'Canal de Logs', value: 'canal_log', description: 'Configurar o canal onde as logs de tickets serão enviadas.', emoji: `<:channel:1290115652828270613>` },
                { label: 'Categoria', value: 'categoria', description: 'Configurar a categoria onde os tickets serão criados.', emoji: '<:search:1293726966360440966>' },
                { label: 'Nome do Botão', value: 'nome_botao', description: 'Configurar o nome do botão que abrirá os tickets.', emoji: '<:edit1:1293726236505542788>' },
                { label: 'Cargo Permitido', value: 'cargo', description: 'Configurar o cargo que poderá ver os tickets.', emoji: '<:announcement:1293726066174595215>' },
                { label: 'Titulo 1 (Abrir o ticket)', value: 'titulo1', description: 'Configurar o titulo para abrir o ticket.', emoji: '<:edit1:1293726236505542788>' },
                { label: 'Descrição 1 (Abrir o ticket)', value: 'descrição1', description: 'Configurar a descrição para abrir o ticket.', emoji: '<:summary:1293727240114278422>' },

                { label: 'Imagem/GIF (Abrir o ticket)', value: 'imagem01', description: 'Configurar uma imagem ou gif para abrir o ticket.', emoji: '<:media_add:1294097077579550794>' },

                { label: 'Titulo 2 (Dentro do ticket)', value: 'titulo2', description: 'Configurar o titulo dentro do ticket.', emoji: '<:edit1:1293726236505542788>' },
                { label: 'Descrição 2 (Dentro do ticket)', value: 'descrição2', description: 'Configurar a descrição dentro do ticket.', emoji: '<:summary:1293727240114278422>' },

                { label: 'Imagem/GIF (Dentro do ticket)', value: 'imagem02', description: 'Configurar uma imagem ou gif dentro do ticket.', emoji: '<:media_add:1294097077579550794>' },

                { label: 'Redefinir Configurações', value: 'reset_settings', description: 'Redefina todas as configurações do ticket.', emoji: '<:NA_Intr004:1289442144255213618>' },

            ]);

        const button = new ButtonBuilder()
            .setLabel("Preview Ticket")
            .setEmoji("<:search:1293726966360440966>")
            .setCustomId('preview_ticket')
            .setStyle(ButtonStyle.Secondary)

        const buttonVoltar = new ButtonBuilder()
            .setLabel("Voltar")
            .setEmoji("<:arrowwhite_left:1293008404662587402>")
            .setCustomId('voltar')
            .setStyle(ButtonStyle.Secondary)


        const row1 = new ActionRowBuilder().addComponents(buttonVoltar, button)
        const row2 = new ActionRowBuilder().addComponents(selectMenu2)
        const rowTicketAdd = new ActionRowBuilder().addComponents(buttonVoltar)



        async function updateTicketEmbed(interaction) {
            // Buscar as informações mais recentes do banco de dados
            const updatedTicketConfig = await ticket.findOne({ guildId: interaction.guild.id, ticketId: selectedTicketId });

            // Atualizar as variáveis com os novos valores do banco de dados
            const assignedChannel = updatedTicketConfig.canal1 ? `<#${updatedTicketConfig.canal1}>` : 'Não configurado';
            const assignedChannelLogs = updatedTicketConfig.canalLog ? `<#${updatedTicketConfig.canalLog}>` : 'Não configurado';
            const ticketCategory = updatedTicketConfig.categoria ? `<#${updatedTicketConfig.categoria}>` : 'Não configurada';
            const buttonName = updatedTicketConfig.nomeBotao || 'Não configurado';
            const allowedRole = updatedTicketConfig.cargo ? `<@&${updatedTicketConfig.cargo}>` : 'Não configurado';

            const titulo01 = updatedTicketConfig?.titulo01 ? `Para visualizar utilize o botão de preview abaixo` : 'Não configurado';
            const descrição01 = updatedTicketConfig?.descrição01 ? `Para visualizar utilize o botão de preview abaixo` : 'Não configurado';
            const titulo02 = updatedTicketConfig?.titulo02 ? `Para visualizar utilize o botão de preview abaixo` : 'Não configurado';
            const descrição02 = updatedTicketConfig?.descrição02 ? `Para visualizar utilize o botão de preview abaixo` : 'Não configurado';

            const imagem01 = updatedTicketConfig.imagem01 || 'Não configurado';
            const imagem02 = updatedTicketConfig.imagem02 || 'Não configurado';

            // Recriar a embed com as novas informações
            const embed = createEmbed(assignedChannelLogs, assignedChannel, ticketCategory, buttonName, allowedRole, titulo01, descrição01, titulo02, descrição02, imagem01, imagem02);

            // Atualizar a resposta da interação com a nova embed
            await interaction.editReply({
                content: ``,
                embeds: [embed],
                components: [row2, row1],
            });
        }


        const timeoutDuration = 600000; // 60 segundos
        const startTime = Date.now(); // Marca o momento em que o coletor foi iniciado

        const filter = (i) => (i.customId === 'select_ticket_config')
        const collector = initialMessage.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, time: timeoutDuration });

        // Armazenar o coletor no Map com o tempo de início e duração
        collectors.set(userId, { collector, timeout: timeoutDuration, startTime });

        collector.on('collect', async i => {

            // Verificar se o usuário que interagiu é o mesmo que iniciou a interação
            if (i.user.id !== interaction.user.id) {
                // Se não for o mesmo usuário, enviar uma mensagem apenas para aquele usuário
                return i.reply({
                    content: '<:NA_Intr004:1289442144255213618> Você não pode interagir com este comando, pois não foi o iniciador ou não possui a permissão necessária.',
                    ephemeral: true // Define a resposta como privada
                });
            }

            const selectedOption = i.values[0];  // O `ticketId` ou a opção `ticket_add`

            // Se o usuário selecionar a opção de adicionar um novo ticket
            if (selectedOption === 'ticket_add') {
                // Verificar quantos tickets já existem para o servidor
                const existingTickets = await ticket.find({ guildId: interaction.guild.id }).countDocuments();

                // Se o número de tickets for 5 ou mais, informar o limite atingido
                if (existingTickets >= 5) {
                    return i.update({
                        content: '<:NA_Intr004:1289442144255213618> O limite de 5 sistemas de tickets já foi atingido para este servidor.',
                        embeds: [],
                        components: [rowTicketAdd]
                    });
                }

                // Gerar um novo `ticketId` (UUID ou timestamp)
                const newTicketId = uuidv4();

                // Criar uma nova configuração de ticket com valores padrão
                const newTicketConfig = new ticket({
                    guildId: interaction.guild.id,
                    ticketId: newTicketId,
                    canal1: null,
                    canalLog: null,
                    categoria: null,
                    nomeBotao: null,
                    cargo: null,
                    titulo01: null,
                    descrição01: null,
                    titulo02: null,
                    descrição02: null,
                    imagem01: null,
                    imagem02: null,
                });

                // Salvar o novo ticket
                await newTicketConfig.save();

                // Informar ao usuário que o ticket está sendo criado
                await i.update({
                    content: '<a:1278158897487806668:1298101208053059594> O sistema de ticket está sendo criado, por favor aguarde...',
                    embeds: [],
                    components: []
                });

                const embed = new EmbedBuilder()
                    .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                    .setFooter({ text: `O sistema de tickets permite a configuração de até 5 opções diferentes.`, iconURL: interaction.member.displayAvatarURL({ dynamic: true }) })
                    .setColor("#48ff00")
                    .setDescription(
                        `* **<:new:1289442513094049854> Novo sistema de ticket criado com sucesso.**\n` +
                        `  - **<:new1:1289442459776057375> ID:** \`\`${newTicketId}\`\`\n` +
                        `* Agora você pode configurá-lo no menu de tickets.\n\n` +
                        `-# <:info:1290116635814002749> Caso tenha dúvidas ou enfrente algum problema, sinta-se à vontade para entrar em nosso [servidor de suporte](http://dsc.gg/grovesuporte). Nossa equipe está à disposição para auxiliá-lo!`,
                    )

                setTimeout(() => {
                    i.editReply({
                        content: ``,
                        embeds: [embed],
                        components: [rowTicketAdd]
                    });
                }, 5000);

                // Retornar para evitar que o fluxo continue para o else
                return;
            }

            // Caso contrário, tratar as outras interações
            if (selectedOption !== 'ticket_add') {
                selectedTicketId = selectedOption;
                setSelectedTicketId(selectedOption);

                if (selectedTicketId) {
                    await i.deferUpdate();
                    await updateTicketEmbed(interaction);
                }
            }

        })



        const filter2 = i => i.customId === 'config_ticket'
        const collector2 = initialMessage.createMessageComponentCollector({ filter2, componentType: ComponentType.StringSelect, time: timeoutDuration });

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
                            .setEmoji('⬅️')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === 0),
                        new ButtonBuilder()
                            .setCustomId('next_page')
                            .setLabel('Avançar')
                            .setEmoji('➡️')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === totalPages - 1)
                    );
            };

            const filter = (btnInt) =>
                ['previous_page', 'next_page', 'select_ticket_channel', 'select_log_channel'].includes(btnInt.customId) && btnInt.user.id === interaction.user.id;


            const selectedOption2 = i.values[0];


            if (selectedOption2 === 'canal_ticket') {
                await i.deferUpdate();

                let currentPage = 0;
                const paginationMessage = await i.followUp({
                    content: `Página ${currentPage + 1}/${totalPages}. Selecione o canal de tickets:`,
                    components: [
                        generateChannelSelectMenu(currentPage, textChannels, 'select_ticket_channel', 'Selecione o canal de tickets'),
                        generatePaginationButtons(currentPage, totalPages)
                    ],
                    ephemeral: true
                });

                const collector = paginationMessage.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: timeoutDuration });

                collector.on('collect', async (btnInt) => {
                    if (btnInt.customId === 'previous_page') currentPage -= 1;
                    if (btnInt.customId === 'next_page') currentPage += 1;

                    await btnInt.update({
                        content: `Página ${currentPage + 1}/${totalPages}. Selecione o canal de tickets:`,
                        components: [
                            generateChannelSelectMenu(currentPage, textChannels, 'select_ticket_channel', 'Selecione o canal de tickets'),
                            generatePaginationButtons(currentPage, totalPages)
                        ]
                    });
                });

                const selectMenuCollector = paginationMessage.createMessageComponentCollector({ filter: (int) => int.customId === 'select_ticket_channel', time: timeoutDuration });

                selectMenuCollector.on('collect', async (i) => {
                    const selectedChannelId = i.values[0];


                    await ticket.updateOne(
                        { guildId: interaction.guild.id, ticketId: selectedTicketId }, // Condições de busca
                        { $set: { canal1: selectedChannelId } }, // Atualização
                        { lean: true } // Usando lean para otimização, upsert para criar se não existir
                    )

                    await updateTicketEmbed(interaction);


                    await i.update({
                        content: `<:1078434426368839750:1290114335909085257> Canal de tickets configurado com sucesso: <#${selectedChannelId}>`,
                        components: []
                    });
                });

            }

            if (selectedOption2 === 'canal_log') {
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

                const logCollector = paginationLogMessage.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: timeoutDuration });

                logCollector.on('collect', async (btnInt) => {
                    if (btnInt.customId === 'previous_page') logChannelPage -= 1;
                    if (btnInt.customId === 'next_page') logChannelPage += 1;

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

                    await ticket.updateOne(
                        { guildId: interaction.guild.id, ticketId: selectedTicketId }, // Condições de busca
                        { $set: { canalLog: selectedLogChannelId } }, // Atualização
                        { lean: true } // Usando lean para otimização, upsert para criar se não existir
                    )

                    await updateTicketEmbed(interaction, row);

                    await i.update({
                        content: `<:1078434426368839750:1290114335909085257> Canal de logs configurado com sucesso: <#${selectedLogChannelId}>`,
                        components: []
                    });
                });

            }

            if (selectedOption2 === 'categoria') {
                await i.deferUpdate();

                let categoryPage = 0;
                const categories = interaction.guild.channels.cache
                    .filter(channel => channel.type === 4) // Tipo de canal de categoria
                    .map(channel => ({ label: channel.name, value: channel.id }));

                const totalCategoryPages = Math.ceil(categories.length / channelsPerPage);

                const paginationCategoryMessage = await i.followUp({
                    content: `Página ${categoryPage + 1}/${totalCategoryPages}. Selecione a categoria:`,
                    components: [
                        generateChannelSelectMenu(categoryPage, categories, 'select_category', 'Selecione a categoria'),
                        generatePaginationButtons(categoryPage, totalCategoryPages)
                    ],
                    ephemeral: true
                });

                const categoryCollector = paginationCategoryMessage.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: timeoutDuration });

                categoryCollector.on('collect', async (btnInt) => {
                    if (btnInt.customId === 'previous_page') categoryPage -= 1;
                    if (btnInt.customId === 'next_page') categoryPage += 1;

                    await btnInt.update({
                        content: `Página ${categoryPage + 1}/${totalCategoryPages}. Selecione a categoria:`,
                        components: [
                            generateChannelSelectMenu(categoryPage, categories, 'select_category', 'Selecione a categoria'),
                            generatePaginationButtons(categoryPage, totalCategoryPages)
                        ]
                    });
                });



                const selectCategoryCollector = paginationCategoryMessage.createMessageComponentCollector({ filter: (int) => int.customId === 'select_category', time: timeoutDuration });

                selectCategoryCollector.on('collect', async (i) => {
                    const selectedCategoryId = i.values[0];



                    await ticket.updateOne(
                        { guildId: interaction.guild.id, ticketId: selectedTicketId }, // Condições de busca
                        { $set: { categoria: selectedCategoryId } }, // Atualização
                        { lean: true } // Usando lean para otimização, upsert para criar se não existir
                    )


                    await updateTicketEmbed(interaction, row);


                    // Atualiza a mensagem do menu para confirmar a configuração
                    await i.update({
                        content: `<:1078434426368839750:1290114335909085257> Categoria configurada com sucesso: <#${selectedCategoryId}>`,
                        components: [] // Remove os componentes após a seleção
                    });
                });

            }


            if (selectedOption2 === 'nome_botao') {
                // Cria um modal para solicitar o nome do botão
                const modal = new ModalBuilder()
                    .setCustomId('button_name_modal')
                    .setTitle('Configurar Nome do Botão');

                // Adiciona um campo de texto ao modal
                const textInput = new TextInputBuilder()
                    .setCustomId('button_name_input')
                    .setLabel('Nome do Botão')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Digite o nome do botão aqui')
                    .setRequired(true); // Define como obrigatório

                // Cria uma ação para adicionar o campo ao modal
                const actionRow = new ActionRowBuilder().addComponents(textInput);
                modal.addComponents(actionRow);

                // Envia o modal ao usuário
                await i.showModal(modal)
            }

            if (selectedOption2 === 'cargo') {
                await i.deferUpdate();

                let currentRolePage = 0;
                const rolesPerPage = 25; // Número de cargos por página
                const roles = interaction.guild.roles.cache
                    .filter(role => role.id !== interaction.guild.id) // Filtra o cargo @everyone
                    .map(role => ({ label: role.name, value: role.id }));
                const totalRolePages = Math.ceil(roles.length / rolesPerPage);

                const generateRoleSelectMenu = (page) => {
                    const start = page * rolesPerPage;
                    const end = start + rolesPerPage;
                    const slicedRoles = roles.slice(start, end);

                    return new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId('select_ticket_role')
                                .setPlaceholder('Selecione o cargo permitido')
                                .addOptions(slicedRoles)
                        );
                };

                const generateRolePaginationButtons = (page) => {
                    return new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('previous_role_page')
                                .setLabel('Voltar')
                                .setEmoji('<:arrowwhite_left:1293008404662587402>')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(page === 0),
                            new ButtonBuilder()
                                .setCustomId('next_role_page')
                                .setLabel('Avançar')
                                .setEmoji('<:arrowwhite:1293008459968544779>')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(page === totalRolePages - 1)
                        );
                };

                const rolePaginationMessage = await i.followUp({
                    content: `Página ${currentRolePage + 1}/${totalRolePages}. Selecione o cargo permitido:`,
                    components: [generateRoleSelectMenu(currentRolePage), generateRolePaginationButtons(currentRolePage)],
                    ephemeral: true
                });

                const roleFilter = (btnInt) => ['previous_role_page', 'next_role_page', 'select_ticket_role'].includes(btnInt.customId) && btnInt.user.id === interaction.user.id;
                const roleCollector = rolePaginationMessage.createMessageComponentCollector({ filter: roleFilter, componentType: ComponentType.Button, time: timeoutDuration });

                roleCollector.on('collect', async (btnInt) => {
                    if (btnInt.customId === 'previous_role_page') currentRolePage -= 1;
                    if (btnInt.customId === 'next_role_page') currentRolePage += 1;

                    await btnInt.update({
                        content: `Página ${currentRolePage + 1}/${totalRolePages}. Selecione o cargo permitido:`,
                        components: [generateRoleSelectMenu(currentRolePage), generateRolePaginationButtons(currentRolePage)]
                    });
                });



                // Coletor para o menu de seleção de cargo
                const selectRoleCollector = rolePaginationMessage.createMessageComponentCollector({ filter: (int) => int.customId === 'select_ticket_role', time: timeoutDuration });

                selectRoleCollector.on('collect', async (i) => {
                    const selectedRoleId = i.values[0];


                    await ticket.updateOne(
                        { guildId: interaction.guild.id, ticketId: selectedTicketId }, // Condições de busca
                        { $set: { cargo: selectedRoleId } }, // Atualização
                        { lean: true } // Usando lean para otimização, upsert para criar se não existir
                    )


                    await updateTicketEmbed(interaction, row);

                    // Atualiza a mensagem do menu para confirmar a configuração
                    await i.update({
                        content: `<:1078434426368839750:1290114335909085257> Cargo permitido configurado com sucesso: <@&${selectedRoleId}>`, // Menciona o cargo
                        components: [] // Remove os componentes após a seleção
                    })
                })

            }

            if (selectedOption2 === 'titulo1') {
                // Cria um modal para solicitar o título 1
                const modal = new ModalBuilder()
                    .setCustomId('titulo1_modal')
                    .setTitle('Configurar Título 1');

                // Adiciona um campo de texto para o título 1
                const textInput = new TextInputBuilder()
                    .setCustomId('titulo1_input')
                    .setLabel('Título 1')
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(256)
                    .setPlaceholder('Título para abrir o ticket')
                    .setRequired(true); // Define como obrigatório

                // Cria uma ação para adicionar o campo ao modal
                const actionRow = new ActionRowBuilder().addComponents(textInput);
                modal.addComponents(actionRow);

                // Envia o modal ao usuário
                await i.showModal(modal);

            }

            if (selectedOption2 === 'descrição1') {
                // Cria um modal para solicitar a descrição 1
                const modal = new ModalBuilder()
                    .setCustomId('descricao1_modal')
                    .setTitle('Configurar Descrição 1');

                // Adiciona um campo de texto para a descrição 1
                const textInput = new TextInputBuilder()
                    .setCustomId('descricao1_input')
                    .setLabel('Descrição 1')
                    .setMaxLength(4000)
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Descrição para abrir o ticket')
                    .setRequired(true);

                // Adiciona o campo ao modal
                const actionRow = new ActionRowBuilder().addComponents(textInput);
                modal.addComponents(actionRow);

                // Envia o modal ao usuário
                await i.showModal(modal);
            }

            if (selectedOption2 === 'imagem01') {
                // Cria o modal para coletar o link da imagem 01
                const modal = new ModalBuilder()
                    .setCustomId('imagem01Modal')
                    .setTitle('Configurar Imagem 01');

                // Campo para o usuário inserir o link da imagem 01
                const imageLinkInput = new TextInputBuilder()
                    .setCustomId('imagem01Link')
                    .setLabel('Insira o link da Imagem 01')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('https://example.com/imagem.png')
                    .setRequired(true);

                // Adiciona o campo de texto ao modal
                const actionRow = new ActionRowBuilder().addComponents(imageLinkInput);
                modal.addComponents(actionRow);

                // Exibe o modal para o usuário
                await i.showModal(modal);
            }


            if (selectedOption2 === 'titulo2') {
                // Cria um modal para solicitar o título 1
                const modal = new ModalBuilder()
                    .setCustomId('titulo2_modal')
                    .setTitle('Configurar Título 2');

                // Adiciona um campo de texto para o título 1
                const textInput = new TextInputBuilder()
                    .setCustomId('titulo2_input')
                    .setLabel('Título 2')
                    .setMaxLength(256)
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Título dentro do ticket')
                    .setRequired(true); // Define como obrigatório

                // Cria uma ação para adicionar o campo ao modal
                const actionRow = new ActionRowBuilder().addComponents(textInput);
                modal.addComponents(actionRow);

                // Envia o modal ao usuário
                await i.showModal(modal);
            }

            if (selectedOption2 === 'descrição2') {

                // Cria um modal para solicitar a descrição 1
                const modal = new ModalBuilder()
                    .setCustomId('descricao2_modal')
                    .setTitle('Configurar Descrição 1');

                // Adiciona um campo de texto para a descrição 1
                const textInput = new TextInputBuilder()
                    .setCustomId('descricao2_input')
                    .setLabel('Descrição 2')
                    .setMaxLength(4000)
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Descrição dentro do ticket')
                    .setRequired(true);

                // Adiciona o campo ao modal
                const actionRow = new ActionRowBuilder().addComponents(textInput);
                modal.addComponents(actionRow);

                // Envia o modal ao usuário
                await i.showModal(modal);
            }

            if (selectedOption2 === 'imagem02') {
                // Cria o modal para coletar o link da imagem 02
                const modal = new ModalBuilder()
                    .setCustomId('imagem02Modal')
                    .setTitle('Configurar Imagem 02');

                // Campo para o usuário inserir o link da imagem 02
                const imageLinkInput = new TextInputBuilder()
                    .setCustomId('imagem02Link')
                    .setLabel('Insira o link da Imagem 02')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('https://example.com/imagem.png')
                    .setRequired(true);

                // Adiciona o campo de texto ao modal
                const actionRow = new ActionRowBuilder().addComponents(imageLinkInput);
                modal.addComponents(actionRow);

                // Exibe o modal para o usuário
                await i.showModal(modal);
            }

            if (selectedOption2 === 'enviaticket') {

                // Recupera as configurações do ticket
                const ticketConfig = await ticket.findOne({ guildId: interaction.guild.id, ticketId: selectedTicketId });

                // Cria uma lista de itens obrigatórios e seus nomes amigáveis
                const requiredItems = [
                    { key: 'canal1', name: 'Canal do Ticket' },
                    { key: 'canalLog', name: 'Canal de Logs' },
                    { key: 'categoria', name: 'Categoria' },
                    { key: 'nomeBotao', name: 'Nome do Botão' },
                    { key: 'cargo', name: 'Cargo' },
                    { key: 'titulo01', name: 'Título da Primeira Embed' },
                    { key: 'descrição01', name: 'Descrição da Primeira Embed' },
                    { key: 'titulo02', name: 'Título da Segunda Embed' },
                    { key: 'descrição02', name: 'Descrição da Segunda Embed' }
                ];

                // Verifica se algum item obrigatório está ausente
                let missingItems = [];
                requiredItems.forEach(item => {
                    if (!ticketConfig[item.key]) {
                        missingItems.push(item.name); // Usa o nome amigável em vez da chave
                    }
                });

                // Se houver itens faltando, informa o usuário
                if (missingItems.length > 0) {
                    return await i.reply({
                        content: `> \`-\` <:NA_Intr004:1289442144255213618> Os seguintes itens não foram configurados: **${missingItems.join(', ')}**`,
                        ephemeral: true
                    });
                }

                // Continua com a criação do ticket se tudo estiver configurado
                const ticketChannel = interaction.guild.channels.cache.get(ticketConfig.canal1);

                // Configura as informações para a embed
                const embed = new EmbedBuilder()
                    .setAuthor({ name: `${ticketConfig.titulo01}`, iconURL: interaction.guild.iconURL({ extension: 'png' }) })
                    .setDescription(ticketConfig.descrição01)
                    .setColor('#ba68c8')
                    .setThumbnail(interaction.guild.iconURL({ extension: 'png', dynamic: true }))
                    .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ extension: 'png' }) })
                    .setTimestamp();

                // Verifica se imagem01 foi configurada antes de adicionar a imagem
                if (ticketConfig.imagem01 && ticketConfig.imagem01.trim() !== "") {
                    embed.setImage(ticketConfig.imagem01);
                }

                // Cria o botão com o nome configurado no ticket
                const button = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`open_ticket_${selectedTicketId}`)
                            .setEmoji('<:Ticket:1289442436556259359>')
                            .setLabel(ticketConfig.nomeBotao)
                            .setStyle(ButtonStyle.Secondary)
                    );

                // Envia a embed para o canal configurado com o botão
                await ticketChannel.send({ embeds: [embed], components: [button] });

                // Responde a interação confirmando o envio da embed
                await i.reply({
                    content: `<:1078434426368839750:1290114335909085257> A embed do ticket foi enviada para o canal <#${ticketChannel.id}>.`,
                    ephemeral: true
                });
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