const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    PermissionsBitField,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');

const commandChannelModel = require('../../database/models/comandos');
const collectors = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('comandos')
        .setDescription('Configure um canal para membros usarem comandos do Grove.'),


    async execute(interaction) {
        // Verificação de permissões
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return await interaction.reply({
                content: '> ⚠️ Você não tem permissão para usar este comando.',
                ephemeral: true
            });
        }

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({
                content: '> ⚠️ Não tenho permissão para gerenciar canais.',
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
                content: `\`-\` <a:alerta:1163274838111162499> Você já iniciou uma solicitação com o sistema de Comandos. Aguarde ${formattedTime} antes de tentar novamente.`,
                ephemeral: true
            });
        }


        let settings = await commandChannelModel.findOne({ guildId: interaction.guild.id });
        let assignedChannel = settings?.canal1 ? `<#${settings.canal1}>` : 'Nenhum canal configurado';

        const generateOptions = () => [
            {
                label: 'Selecionar Canal',
                emoji: '<:channel:1290115652828270613>',
                value: 'select_channel',
                description: 'Selecione o canal para os comandos do bot.',
            },
            {
                label: 'Redefinir Configurações',
                emoji: '<:NA_Intr004:1289442144255213618>',
                value: 'reset_settings',
                description: 'Redefina todas as configurações de canal de comando.',
            }
        ];

        const createEmbed = (assignedChannel) => {
            return new EmbedBuilder()
                .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                .setDescription(
                    `* <:shop_white:1289442593452724244> **Bem-vindo(a) ao sistema de configuração de canal de comandos!**\n` +
                    `  - Promova uma organização eficiente em seu servidor, permitindo que os membros utilizem os comandos do Grove exclusivamente no canal designado.\n\n` +
                    `* <:settings:1289442654806999040> **Informações sobre o sistema:**\n` +
                    `  - **Canal Configurado:** <:channels_and_roles:1289442612088147980> ${assignedChannel}`
                )
                .setColor('#ba68c8')
                .setFooter({ text: 'O sistema de comandos permite configurar apenas um canal.', iconURL: interaction.member.displayAvatarURL({ dynamic: true }) })
                .setTimestamp();
        };

        let embed = createEmbed(assignedChannel);

        const initialSelectMenu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('command_channel_menu')
                    .setPlaceholder('Selecione a opção que deseja configurar.')
                    .addOptions(generateOptions())
            );

        const message = await interaction.reply({
            embeds: [embed],
            components: [initialSelectMenu],
        });

        const timeoutDuration = 60000; // 60 segundos
        const startTime = Date.now();

        const filter = (i) => i.customId === 'command_channel_menu' && i.user.id === interaction.user.id;
        const collector = message.createMessageComponentCollector({ filter, time: timeoutDuration });

        collectors.set(userId, { collector, timeout: timeoutDuration, startTime });

        collector.on('collect', async (i) => {
            settings = await commandChannelModel.findOne({ guildId: interaction.guild.id });
            assignedChannel = settings?.canal1 ? `<#${settings.canal1}>` : 'Nenhum canal configurado';

            embed = createEmbed(assignedChannel);

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
                                .setCustomId('select_command_channel')
                                .setPlaceholder('Selecione o canal de comandos')
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
                                .setLabel('Avançar')
                                .setEmoji('<:arrowwhite:1293008459968544779>')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(page === totalPages - 1)
                        );
                };

                let ephemeralMessage = await i.followUp({
                    content: `Página ${currentPage + 1}/${totalPages}. Selecione o canal de comandos:`,
                    components: [generateSelectMenu(currentPage), generateActionRowWithButtons(currentPage)],
                    ephemeral: true,
                });

                const channelCollector = ephemeralMessage.createMessageComponentCollector({ time: 60000 });

                channelCollector.on('collect', async (i) => {
                    if (i.customId === 'previous_page') {
                        currentPage -= 1;
                    } else if (i.customId === 'next_page') {
                        currentPage += 1;
                    } else if (i.customId === 'select_command_channel') {
                        const selectedChannelId = i.values[0];

                        // Salvar a escolha no banco de dados
                        await commandChannelModel.findOneAndUpdate(
                            { guildId: interaction.guild.id },
                            { $set: { canal1: selectedChannelId } },
                            { upsert: true }
                        );

                        await i.update({
                            content: `<:1078434426368839750:1290114335909085257> Canal de comandos configurado com sucesso para <#${selectedChannelId}>.`,
                            components: [],
                        });

                        embed = createEmbed(`<#${selectedChannelId}>`);

                        await interaction.editReply({
                            embeds: [embed],
                            components: [initialSelectMenu],
                        });

                        return;
                    }

                    await i.update({
                        content: `Página ${currentPage + 1}/${totalPages}. Selecione o canal de comandos:`,
                        components: [generateSelectMenu(currentPage), generateActionRowWithButtons(currentPage)],
                    });
                });

                channelCollector.on('end', async (collected, reason) => {
                    if (reason === 'time') {
                        // O tempo para seleção expirou
                    }
                });
            }

            if (i.values[0] === 'reset_settings') {
                await i.deferUpdate();

                await commandChannelModel.findOneAndUpdate(
                    { guildId: interaction.guild.id },
                    { $set: { canal1: null } },
                    { upsert: true }
                );

                embed = createEmbed('Nenhum canal configurado');

                await interaction.editReply({
                    embeds: [embed],
                    components: [initialSelectMenu],
                });

                await i.followUp({ content: '<:1078434426368839750:1290114335909085257> As configurações de canal de comandos foram redefinidas com sucesso.', ephemeral: true });
            }
        });

        collector.on('end', async (collected, reason) => {
            const originalMessage = await interaction.fetchReply().catch(() => null);

            if (!originalMessage) {
                return collectors.delete(userId);
            }

            if (reason === 'time') {
                await interaction.editReply({
                    components: [],
                });
            }
        });
    },
};
