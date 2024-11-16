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

const client = require("../../index")
const GuildConfig = require('../../database/models/auditlogs');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('audit')
        .setDescription('Configure o sistema de logs do servidor.')
        .addSubcommand(subcommad =>
            subcommad
                .setName("logs")
                .setDescription("Configure o sistema de logs do servidor.")
        ),


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


        let settings = await GuildConfig.findOne({ guildId: interaction.guild.id })

        let isActive = settings?.isActive || false;
        let assignedChannel = settings?.canalLogs ? `<#${settings.canalLogs}>` : "Nenhum canal configurado";


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
                description: 'Selecione o canal para enviar os logs do servidor',
            },
            {
                label: 'Redefinir Configurações',
                emoji: '<:NA_Intr004:1289442144255213618>',
                value: 'reset_settings',
                description: 'Redefina todas as configurações de boas-vindas',
            }
        ]

        const createEmbed = (isActive, assignedChannel) => {
            const embed = new EmbedBuilder()
                .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                .setDescription(
                    `<:shop_white:1289442593452724244> **Bem-vindo(a) ao Sistema de Configuração de Logs do Servidor!**\n` +
                    `  - Todas as alterações realizadas no servidor serão registradas e enviadas ao canal de logs configurado.\n\n` +
                    `* <:settings:1289442654806999040> **Informações sobre o sistema:**\n` +
                    `  - **Status:** ${isActive ? '<:8047onlinegray:1289442869060440109> Ativado' : '<:red_dot:1289442683705888929> Desativado'}\n` +
                    `  - **Canal Configurado:** <:channels_and_roles:1289442612088147980> ${assignedChannel}\n\n` +
                    `-# <:info:1290116635814002749> Caso tenha dúvidas ou enfrente algum problema, sinta-se à vontade para entrar em nosso [servidor de suporte](http://dsc.gg/grovesuporte). Nossa equipe está à disposição para auxiliá-lo!`)
                .setColor('#ba68c8')
                .setFooter({ text: `O sistema de logs oferece uma maneira eficiente de gerenciar e monitorar as atividades do seu servidor.`, iconURL: interaction.member.displayAvatarURL({ dynamic: true }) })
                .setTimestamp()

            return embed;
        }

        let embed = createEmbed(isActive, assignedChannel)


        const initialSelectMenu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('logs_menu')
                    .setPlaceholder('Selecione a opção que deseja configurar.')
                    .addOptions(generateOptions(isActive))
            );


        const message = await interaction.reply({
            embeds: [embed],
            components: [initialSelectMenu],
        })


        const timeoutDuration = 60000; // 60 segundos
        const startTime = Date.now(); // Marca o momento em que o coletor foi iniciado

        // Cria um coletor para o menu inicial
        const filter = (i) => i.customId === 'logs_menu' && i.user.id === interaction.user.id;
        const collector = message.createMessageComponentCollector({ filter, time: timeoutDuration });


        collector.on('collect', async (i) => {


            settings = await GuildConfig.findOne({ guildId: interaction.guild.id })

            isActive = settings?.isActive || false;
            assignedChannel = settings?.canalLogs ? `<#${settings.canalLogs}>` : "Nenhum canal configurado";


            embed = createEmbed(isActive, assignedChannel)


            if (i.values[0] === 'activate_system') {
                await i.deferUpdate();
                // Alterna o status atual de isActive
                isActive = !isActive;

                // Atualiza o banco de dados com o novo status (isActive)
                const updateResult = await GuildConfig.findOneAndUpdate(
                    { guildId: interaction.guild.id },
                    { $set: { isActive: isActive } },
                    { upsert: true, new: true }
                );

                if (!updateResult) throw new Error("Erro ao atualizar o banco de dados.");

                // Atualiza a embed com o novo estado
                embed = createEmbed(isActive, assignedChannel)

                // Atualiza as opções do menu
                const updatedSelectMenu = new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('logs_menu')
                            .setPlaceholder('Selecione a opção que deseja configurar.')
                            .addOptions(generateOptions(isActive))
                    );

                // Atualiza a mensagem com o novo embed e menu
                await interaction.editReply({
                    embeds: [embed],
                    components: [updatedSelectMenu],
                });

                await i.followUp({ content: `<:1078434426368839750:1290114335909085257> O sistema de logs foi ${isActive ? '<:8047onlinegray:1289442869060440109> Ativado' : '<:red_dot:1289442683705888929> Desativado'}.`, ephemeral: true });


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
                                .setCustomId('select_logs_channel')
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
                    } else if (i.customId === 'select_logs_channel') {
                        const selectedChannelId = i.values[0];

                        // Salvar a escolha no banco de dados
                        await GuildConfig.findOneAndUpdate(
                            { guildId: interaction.guild.id },
                            { $set: { canalLogs: selectedChannelId } },
                            { upsert: true }
                        );

                        // Atualizar a mensagem de confirmação
                        await i.update({
                            content: `<:1078434426368839750:1290114335909085257> Canal de logs foi configurado com sucesso para <#${selectedChannelId}>.`,
                            components: [],
                        });

                        embed = createEmbed(isActive, `<#${selectedChannelId}>`)

                        // Editar a mensagem original do menu
                        await interaction.editReply({
                            embeds: [embed],
                            components: [initialSelectMenu],
                        });

                        return;
                    }

                    await i.update({
                        content: `Página ${currentPage + 1}/${totalPages}. Selecione o canal de logs:`,
                        components: [generateSelectMenu(currentPage), generateActionRowWithButtons(currentPage)],
                    })
                })

            }

            if (i.values[0] === 'reset_settings') {
                await i.deferUpdate();
                // Atualiza o banco de dados para redefinir as configurações
                await GuildConfig.findOneAndUpdate(
                    { guildId: interaction.guild.id },
                    { $set: { canalLogs: null, isActive: false, } },
                    { upsert: true }
                );

                // Atualiza a embed e o menu
                embed = createEmbed(false, "Nenhum canal configurado");
                const updatedSelectMenu = new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('logs_menu')
                            .setPlaceholder('Selecione a opção que deseja configurar.')
                            .addOptions(generateOptions(false))
                    );

                await interaction.editReply({
                    embeds: [embed],
                    components: [updatedSelectMenu],
                });

                await i.followUp({ content: '<:1078434426368839750:1290114335909085257> As configurações de logs foram redefinidas com sucesso.', ephemeral: true });

            }
        })


    }
}
