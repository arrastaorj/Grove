const {
    SlashCommandBuilder,
    PermissionsBitField,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    TextInputStyle,
} = require('discord.js')

const bemvindo = require("../../database/models/bemvindo")
const collectors = new Map()


module.exports = {
    data: new SlashCommandBuilder()
        .setName('bem')
        .setDescription('Configure o sistema de bem-vindo para novos membros.')
        .addSubcommand(subcommad =>
            subcommad
                .setName("vindo")
                .setDescription("Configure o sistema de bem-vindo para novos membros.")
        ),

    async execute(interaction) {

        // Verificação de permissões do usuário
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return await interaction.reply({
                content: `> \`-\` <:NA_Intr004:1289442144255213618> Não posso concluir este comando pois você não possui permissão. (Administrator).`,
                ephemeral: true
            });
        }

        // Verificação de permissões do bot
        if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return await interaction.reply({
                content: `> \`-\` <:NA_Intr004:1289442144255213618> O bot não possui permissão para concluir este comando (ManageMessages).`,
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
            const formattedTime = formatTime(secondsRemaining);

            return interaction.reply({
                content: `\`-\` <a:alerta:1163274838111162499> Você já iniciou uma solicitação com o sistema de Bem Vindo(a). Aguarde ${formattedTime} antes de tentar novamente.`,
                ephemeral: true
            });
        }


        let settings = await bemvindo.findOne({ guildId: interaction.guild.id });
        let isActive = settings?.isActive || false;
        let assignedChannel = settings?.canal1 ? `<#${settings.canal1}>` : "Nenhum canal configurado";
        let welcomeImage = settings?.welcomeImage || null;

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
                label: 'Configurar Imagem',
                emoji: '<:media:1290453610911760396>',
                value: 'configure_image',
                description: 'Configure a imagem de boas-vindas',
            },
            {
                label: 'Redefinir Configurações',
                emoji: '<:NA_Intr004:1289442144255213618>',
                value: 'reset_settings',
                description: 'Redefina todas as configurações de boas-vindas',
            }
        ];

        const createEmbed = (isActive, assignedChannel, welcomeImage) => {
            const embed = new EmbedBuilder()
                .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                .setDescription(
                    `* <:shop_white:1289442593452724244> **Bem-vindo(a) ao sistema de configuração de canal de boas-vindas!**\n` +
                    `  - Quando um novo usuário entrar no servidor, uma saudação será enviada automaticamente ao canal configurado. Utilize o menu abaixo para configurar.\n\n` +
                    `* <:settings:1289442654806999040> **Informações sobre o sistema:**\n` +
                    `  - **Status:** ${isActive ? '<:8047onlinegray:1289442869060440109> Ativado' : '<:red_dot:1289442683705888929> Desativado'}\n` +
                    `  - **Canal Configurado:** <:channels_and_roles:1289442612088147980> ${assignedChannel}\n\n` +
                    `-# <:info:1290116635814002749> Caso tenha dúvidas ou enfrente algum problema, sinta-se à vontade para entrar em nosso [servidor de suporte](http://dsc.gg/grovesuporte). Nossa equipe está à disposição para auxiliá-lo!`)
                .setColor('#ba68c8')
                .setFooter({ text: `O sistema de boas-vindas permite configurar apenas um canal.`, iconURL: interaction.member.displayAvatarURL({ dynamic: true }) })
                .setTimestamp();

            if (welcomeImage) {
                embed.setImage(welcomeImage);
            }

            return embed;
        }

        let embed = createEmbed(isActive, assignedChannel, welcomeImage);

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

            // Atualiza a configuração ao coletar a interação
            settings = await bemvindo.findOne({ guildId: interaction.guild.id });
            isActive = settings?.isActive || false;
            assignedChannel = settings?.canal1 ? `<#${settings.canal1}>` : "Nenhum canal configurado";
            welcomeImage = settings?.welcomeImage || null;

            // Atualiza a embed com as informações mais recentes
            embed = createEmbed(isActive, assignedChannel, welcomeImage);

            if (i.values[0] === 'configure_image') {
                // Criar o modal para receber a URL da imagem
                const modal = new ModalBuilder()
                    .setCustomId('welcome_image_modal')
                    .setTitle('Configurar Imagem de Boas-vindas');

                const imageUrlInput = new TextInputBuilder()
                    .setCustomId('imageUrl')
                    .setLabel('Insira a URL da imagem de boas-vindas:')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('https://exemplo.com/imagem.png')
                    .setRequired(true);

                const actionRow = new ActionRowBuilder().addComponents(imageUrlInput);
                modal.addComponents(actionRow);

                await i.showModal(modal);

                // Coleta a resposta do modal
                const modalFilter = (modalInteraction) => modalInteraction.customId === 'welcome_image_modal' && modalInteraction.user.id === interaction.user.id;
                const modalCollector = await i.awaitModalSubmit({ filter: modalFilter, time: 60000 });

                const imageUrl = modalCollector.fields.getTextInputValue('imageUrl');

                // Validação da URL
                const isValidImageUrl = (url) => {
                    const validImageExtensions = /\.(jpeg|jpg|png)$/i; // Permite .jpeg, .jpg, .png
                    const isGif = /\.gif$/i; // Verifica se é um GIF
                    return validImageExtensions.test(url) && !isGif.test(url);
                };

                if (!imageUrl.startsWith('http') || !isValidImageUrl(imageUrl)) {
                    return modalCollector.reply({
                        content: 'Por favor, insira uma URL válida que termine com .jpeg, .jpg, ou .png. GIFs não são permitidos.',
                        ephemeral: true
                    });
                }

                // Atualiza o banco de dados com a nova imagem
                await bemvindo.findOneAndUpdate(
                    { guildId: modalCollector.guild.id },
                    { $set: { welcomeImage: imageUrl } },
                    { upsert: true }
                );

                welcomeImage = imageUrl;
                embed = createEmbed(isActive, assignedChannel, welcomeImage);

                await modalCollector.update({
                    embeds: [embed],
                    components: [initialSelectMenu],
                });

                await modalCollector.followUp({
                    content: 'Imagem de boas-vindas configurada com sucesso!',
                    ephemeral: true
                });
            }


            if (i.values[0] === 'select_channel') {
                await i.deferUpdate();
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
                                .setEmoji('<:arrowwhite_left:1293008404662587402>')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(page === 0),
                            new ButtonBuilder()
                                .setCustomId('next_page')
                                .setEmoji('<:arrowwhite:1293008459968544779>')
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

                        embed = createEmbed(isActive, `<#${selectedChannelId}>`, welcomeImage); // Atualiza a embed corretamente

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
                await i.deferUpdate();
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
                embed = createEmbed(isActive, assignedChannel, welcomeImage); // Atualiza a embed novamente

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
                await i.deferUpdate();
                // Atualiza o banco de dados para redefinir as configurações
                await bemvindo.findOneAndUpdate(
                    { guildId: interaction.guild.id },
                    { $set: { canal1: null, isActive: false, welcomeImage: null } },
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

    }
}
