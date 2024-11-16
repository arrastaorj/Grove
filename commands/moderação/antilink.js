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

const antilinkModel = require('../../database/models/antilink');
const collectors = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('antilink')
        .setDescription('Configure o sistema de AntiLink para o servidor.'),


    async execute(interaction) {

        // Verificação de permissões
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return await interaction.reply({
                content: `> \`-\` <:NA_Intr004:1289442144255213618> Não posso concluir este comando pois você não possui permissão.`,
                ephemeral: true
            });
        }

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({
                content: `> \`-\` <:NA_Intr004:1289442144255213618> Não posso concluir o comando pois não recebi permissão para gerenciar este servidor (Administrador)`,
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
                content: `\`-\` <:NA_Intr004:1289442144255213618> Você já iniciou uma solicitação com o sistema de AntiLink. Aguarde ${formattedTime} antes de tentar novamente.`,
                ephemeral: true
            });
        }


        // Verificar se já existe um registro no banco de dados
        let antilinkConfig = await antilinkModel.findOne({ guildId: interaction.guild.id });

        if (!antilinkConfig) {
            // Se não existir, criar um novo registro com configurações padrão
            antilinkConfig = new antilinkModel({
                guildId: interaction.guild.id,
                allowedRoles: [], // Nenhum cargo permitido inicialmente
                antilinkEnabled: false, // Desativado inicialmente
            });
            await antilinkConfig.save();
        }

        let settings = await antilinkModel.findOne({ guildId: interaction.guild.id });
        let antilinkStatus = settings?.antilinkEnabled ? '<:8047onlinegray:1289442869060440109> Ativado' : '<:red_dot:1289442683705888929> Desativado';
        let permittedRoles = settings?.allowedRoles?.map(id => `<@&${id}>`).join(', ') || 'Nenhum cargo permitido';

        const generateOptions = () => {
            const options = [
                {
                    label: settings.antilinkEnabled ? 'Desativar' : 'Ativar',
                    emoji: settings.antilinkEnabled ? '<:red_dot:1289442683705888929>' : '<:8047onlinegray:1289442869060440109>',
                    value: 'toggle_antilink',
                    description: settings.antilinkEnabled ? 'Desative o sistema de AntiLink.' : 'Ative o sistema de AntiLink.',
                },
                {
                    label: 'Adicionar Cargos Permitidos',
                    emoji: '<:member_white333:1289442716761067620>',
                    value: 'add_roles',
                    description: 'Permita que certos cargos enviem links.',
                },
                {
                    label: 'Remover Cargos Permitidos',
                    emoji: '<:member_white22:1289442774378090506>',
                    value: 'remove_roles',
                    description: 'Remova cargos que podem enviar links.',
                },
                {
                    label: 'Redefinir Configurações',
                    emoji: '<:NA_Intr004:1289442144255213618>',
                    value: 'reset_settings',
                    description: 'Redefina todas as configurações do AntiLink.',
                }
            ];

            return options;
        };


        const createEmbed = (antilinkStatus, permittedRoles) => {
            return new EmbedBuilder()
                .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                .setDescription(
                    `* <:shop_white:1289442593452724244> **Bem-vindo(a) ao Sistema Antilink - Proteção Inteligente para o Seu Servidor**\n` +
                    `  - O Antilink é uma solução avançada de moderação automática que garante a segurança e integridade do seu servidor.\n\n` +
                    `* <:settings:1289442654806999040> **Informações sobre o sistema:**\n` +
                    `  - **Status do Antilink:** ${antilinkStatus}\n` +
                    `  - **Cargos Permitidos:** <:Members:1289442534216568893> ${permittedRoles}\n\n` +
                    `-# <:info:1290116635814002749> Caso tenha dúvidas ou enfrente algum problema, sinta-se à vontade para entrar em nosso [servidor de suporte](http://dsc.gg/grovesuporte). Nossa equipe está à disposição para auxiliá-lo!`
                )
                .setColor('#ba68c8')
                .setFooter({ text: 'Sistema de AntiLink', iconURL: interaction.member.displayAvatarURL({ dynamic: true }) })
                .setTimestamp();
        };

        let embed = createEmbed(antilinkStatus, permittedRoles);

        const initialSelectMenu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('antilink_menu')
                    .setPlaceholder('Selecione a opção que deseja configurar.')
                    .addOptions(generateOptions())
            );

        const message = await interaction.reply({
            embeds: [embed],
            components: [initialSelectMenu],
        });

        const timeoutDuration = 240000; // 4 minutos
        const startTime = Date.now();

        const filter = (i) => i.customId === 'antilink_menu' && i.user.id === interaction.user.id;
        const collector = message.createMessageComponentCollector({ filter, time: timeoutDuration });

        collectors.set(userId, { collector, timeout: timeoutDuration, startTime });

        collector.on('collect', async (i) => {
            settings = await antilinkModel.findOne({ guildId: interaction.guild.id });

            antilinkStatus = settings?.antilinkEnabled ? '<:8047onlinegray:1289442869060440109> Ativado' : '<:red_dot:1289442683705888929> Desativado';
            permittedRoles = settings?.allowedRoles?.map(id => `<@&${id}>`).join(', ') || 'Nenhum cargo permitido';

            embed = createEmbed(antilinkStatus, permittedRoles);

            if (i.values[0] === 'toggle_antilink') {
                await i.deferUpdate();

                // Alterna o estado do AntiLink
                settings.antilinkEnabled = !settings.antilinkEnabled;
                await settings.save();

                // Cria o embed baseado no novo estado
                const embed = createEmbed(settings.antilinkEnabled ? '<:8047onlinegray:1289442869060440109> Ativado' : '<:red_dot:1289442683705888929> Desativado', permittedRoles);

                // Atualiza as opções do select menu
                const updatedOptions = generateOptions(); // Chama a função que gera as opções com o novo estado
                const updatedSelectMenu = new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('antilink_menu') // Substitua pelo seu customId
                            .setPlaceholder('Selecione a opção que deseja configurar.')
                            .addOptions(updatedOptions)
                    );

                await interaction.editReply({
                    embeds: [embed],
                    components: [updatedSelectMenu], // Usa o novo select menu atualizado
                });

                await i.followUp({ content: `<:1078434426368839750:1290114335909085257> O sistema de AntiLink foi ${settings.antilinkEnabled ? '<:8047onlinegray:1289442869060440109> Ativado' : '<:red_dot:1289442683705888929> Desativado'}.`, ephemeral: true });
            }


            if (i.values[0] === 'add_roles') {
                await i.deferUpdate();

                const rolesPerPage = 25;
                let currentPage = 0;

                // Verificar se o limite de 5 cargos já foi atingido
                if (settings.allowedRoles.length >= 5) {
                    return i.followUp({ content: '⚠️ O limite de 5 cargos permitidos já foi atingido. Exclua algum cargo para adicionar mais.', ephemeral: true });
                }

                const remainingSlots = 5 - settings.allowedRoles.length;

                // Filtrar cargos para não incluir cargos de bots, @everyone e já adicionados
                const roles = interaction.guild.roles.cache
                    .filter(role => !role.managed && role.id !== interaction.guild.id && !settings.allowedRoles.includes(role.id))
                    .map(role => ({ label: role.name, description: `ID: ${role.id}`, emoji: `<:member_white:1288778434184609804>`, value: role.id }));

                const totalPages = Math.ceil(roles.length / rolesPerPage);

                const generateSelectMenu = (page) => {
                    const start = page * rolesPerPage;
                    const end = start + rolesPerPage;
                    const slicedRoles = roles.slice(start, end);

                    return new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId('select_roles')
                                .setPlaceholder('Selecione os cargos permitidos para links.')
                                .setMaxValues(remainingSlots) // Limitar a seleção para o número de cargos restantes
                                .addOptions(slicedRoles)
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
                    content: `Página ${currentPage + 1}/${totalPages}. Selecione até ${remainingSlots} cargos permitidos:`,
                    components: [generateSelectMenu(currentPage), generateActionRowWithButtons(currentPage)],
                    ephemeral: true,
                });

                const rolesCollector = ephemeralMessage.createMessageComponentCollector({ time: 60000 });

                rolesCollector.on('collect', async (i) => {
                    if (i.customId === 'previous_page') {
                        currentPage -= 1;
                    } else if (i.customId === 'next_page') {
                        currentPage += 1;
                    } else if (i.customId === 'select_roles') {
                        const selectedRoles = i.values;

                        // Salvar os cargos permitidos no banco de dados
                        settings.allowedRoles.push(...selectedRoles);
                        await settings.save();

                        embed = createEmbed(antilinkStatus, settings.allowedRoles.map(id => `<@&${id}>`).join(', '));

                        await interaction.editReply({
                            embeds: [embed],
                            components: [initialSelectMenu],
                        });

                        return i.update({ content: '<:1078434426368839750:1290114335909085257> Cargos permitidos configurados com sucesso!', components: [] });
                    }

                    await i.update({
                        content: `Página ${currentPage + 1}/${totalPages}. Selecione até ${remainingSlots} cargos permitidos:`,
                        components: [generateSelectMenu(currentPage), generateActionRowWithButtons(currentPage)],
                    })

                })

                rolesCollector.on('end', async () => {
                    // Remover o coletor quando o tempo se esgotar ou a configuração for concluída
                    collectors.delete(userId);
                });
            }


            if (i.values[0] === 'remove_roles') {
                await i.deferUpdate();

                // Checar se há cargos permitidos para remover
                if (settings.allowedRoles.length === 0) {
                    return i.followUp({ content: '⚠️ Não há cargos permitidos para remover.', ephemeral: true });
                }

                const roles = settings.allowedRoles.map(id => interaction.guild.roles.cache.get(id)).filter(role => role);
                const rolesOptions = roles.map(role => ({
                    label: role.name,
                    value: role.id,
                }));

                const removeSelectMenu = new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('remove_select_roles')
                            .setPlaceholder('Selecione o cargo que deseja remover.')
                            .addOptions(rolesOptions)
                    );

                const removeMessage = await i.followUp({
                    content: 'Selecione um cargo para remover:',
                    components: [removeSelectMenu],
                    ephemeral: true,
                });

                const removeCollector = removeMessage.createMessageComponentCollector({ time: 60000 });

                removeCollector.on('collect', async (removeInteraction) => {
                    if (removeInteraction.user.id !== interaction.user.id) {
                        return removeInteraction.reply({ content: 'Aguarde enquanto o dono do comando remove cargos.', ephemeral: true });
                    }

                    const roleToRemove = removeInteraction.values[0];
                    settings.allowedRoles = settings.allowedRoles.filter(role => role !== roleToRemove);
                    await settings.save();
                    await removeInteraction.update({ content: `<:1078434426368839750:1290114335909085257> Cargo <@&${roleToRemove}> removido com sucesso.`, components: [], ephemeral: true });

                    embed = createEmbed(antilinkStatus, settings.allowedRoles.map(id => `<@&${id}>`).join(', '));

                    await interaction.editReply({
                        embeds: [embed],
                        components: [initialSelectMenu],
                    });

                });

                removeCollector.on('end', () => {
                    removeMessage.edit({ components: [] });
                })
            }


            if (i.values[0] === 'reset_settings') {
                await i.deferUpdate();
                settings.allowedRoles = []; // Limpar cargos permitidos
                settings.antilinkEnabled = false; // Desativar Antilink
                await settings.save();

                embed = createEmbed('Desativado', 'Nenhum cargo permitido');

                await interaction.editReply({
                    embeds: [embed],
                    components: [initialSelectMenu],
                });

                await i.followUp({ content: '<:1078434426368839750:1290114335909085257> As configurações do sistema de AntiLink foram redefinidas.', ephemeral: true });
            }
        });

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
    },
};
