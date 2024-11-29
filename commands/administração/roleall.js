const {
    SlashCommandBuilder,
    PermissionsBitField,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    EmbedBuilder,
    ComponentType,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');


const collectors = new Map()

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roleall')
        .setDescription('Configure e atribua um cargo específico aos membros.'),

    async execute(interaction) {

        const guild = interaction.guild;
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
                content: `\`-\` <:NA_Intr004:1289442144255213618> Você já iniciou uma solicitação com o sistema de AutoRoles. Aguarde ${formattedTime} antes de tentar novamente.`,
                ephemeral: true
            });
        }


        // Verificação de permissões do usuário
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return await interaction.reply({
                content: `> \`-\` <:NA_Intr004:1289442144255213618> Você não possui permissão para gerenciar cargos (ManageRoles).`,
                ephemeral: true
            });
        }

        // Verificação de permissões do bot
        if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return await interaction.reply({
                content: `> \`-\` <:NA_Intr004:1289442144255213618> O bot não possui permissão para gerenciar cargos no servidor (ManageRoles).`,
                ephemeral: true
            });
        }

        // Embed inicial com a opção de configurar cargo
        let assignedRoles = 'Nenhum cargo configurado'; // Informação inicial
        let selectedRoleId = null; // Cargo que será configurado

        const embed = new EmbedBuilder()
            .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
            .setDescription(
                `* <:shop_white:1289442593452724244> **Bem-vindo(a) ao sistema de atribuição automática de cargo!**\n` +
                `  - Utilize o menu abaixo para configurar o cargo a ser atribuídos.\n\n` +
                `* <:settings:1289442654806999040> **Informações sobre o sistema:**\n` +
                `  - **Cargo Configurado:** <:Members:1289442534216568893> ${assignedRoles}\n\n` +
                `-# <:info:1290116635814002749> Caso tenha dúvidas ou enfrente algum problema, sinta-se à vontade para entrar em nosso [servidor de suporte](http://dsc.gg/grovesuporte). Nossa equipe está à disposição para auxiliá-lo!`
            )
            .setColor('#ba68c8')
            .setFooter({ text: `O sistema de RoleAll permite a configuração de no máximo 1 cargo.`, iconURL: interaction.member.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();

        function createAutoroleMenu() {
            return new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('config_role')
                    .setPlaceholder('Selecione a opção que deseja configurar.')
                    .addOptions([
                        {
                            label: 'Adicionar Cargos',
                            description: 'Adicione à lista o cargo que os usuários irão receber.',
                            emoji: `<:member_white333:1289442716761067620>`,
                            value: 'select_role'
                        },
                        {
                            label: 'Atribuir Cargo a Todos',
                            description: 'Atribuir o cargo configurado a todos os membros do servidor.',
                            emoji: '<:new1:1289442459776057375>',
                            value: 'assign_role_to_all',
                            disabled: !selectedRoleId // Desabilitar até que um cargo seja selecionado
                        }
                    ])
            );
        }

        await interaction.reply({
            embeds: [embed],
            components: [createAutoroleMenu()],
        });

        const timeoutDuration = 240000; // 4 minutos
        const startTime = Date.now(); // Marca o momento em que o coletor foi iniciado

        const filter = i => i.customId === 'config_role' && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: timeoutDuration });
        collectors.set(userId, { collector, timeout: timeoutDuration, startTime });

        collector.on('collect', async i => {
            if (i.values[0] === 'select_role') {
                await i.deferUpdate();
                // Exibir o segundo menu de seleção de cargos
                let currentRolePage = 0;
                const rolesPerPage = 25; // Número de cargos por página
                const roles = interaction.guild.roles.cache
                    .filter(role => role.id !== interaction.guild.id) // Filtra o cargo @everyone
                    .map(role => ({
                        label: role.name,
                        description: `ID: ${role.id}`,
                        emoji: `<:member_white:1288778434184609804>`,
                        value: role.id
                    }))
                const totalRolePages = Math.ceil(roles.length / rolesPerPage);

                const generateRoleSelectMenu = (page) => {
                    const start = page * rolesPerPage;
                    const end = start + rolesPerPage;
                    const slicedRoles = roles.slice(start, end);

                    return new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId('select_all_role')
                                .setPlaceholder('Selecione o cargo para adicionar')
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
                    content: `Página ${currentRolePage + 1}/${totalRolePages}. Selecione o cargo para adicionar:`,
                    components: [generateRoleSelectMenu(currentRolePage), generateRolePaginationButtons(currentRolePage)],
                    ephemeral: true
                });

                const roleFilter = (btnInt) => ['previous_role_page', 'next_role_page', 'select_all_role'].includes(btnInt.customId) && btnInt.user.id === interaction.user.id;
                const roleCollector = rolePaginationMessage.createMessageComponentCollector({ filter: roleFilter, componentType: ComponentType.Button, time: timeoutDuration });

                roleCollector.on('collect', async (btnInt) => {
                    if (btnInt.customId === 'previous_role_page') currentRolePage -= 1;
                    if (btnInt.customId === 'next_role_page') currentRolePage += 1;

                    await btnInt.update({
                        content: `Página ${currentRolePage + 1}/${totalRolePages}. Selecione o cargo para adicionar:`,
                        components: [generateRoleSelectMenu(currentRolePage), generateRolePaginationButtons(currentRolePage)],
                        ephemeral: true
                    });
                });

                // Coletor para o menu de seleção de cargo
                const selectRoleCollector = rolePaginationMessage.createMessageComponentCollector({ filter: (int) => int.customId === 'select_all_role', time: timeoutDuration });

                selectRoleCollector.on('collect', async (i) => {
                    selectedRoleId = i.values[0];

                    embed.setDescription(
                        `* <:shop_white:1289442593452724244> **Bem-vindo(a) ao sistema de atribuição automática de cargo!**\n` +
                        `  - Utilize o menu abaixo para configurar os cargos a serem atribuídos.\n\n` +
                        `* <:settings:1289442654806999040> **Informações sobre o sistema:**\n` +
                        `  - **Cargo Configurado:** <:Members:1289442534216568893> <@&${selectedRoleId}>\n\n` +
                        `-# <:info:1290116635814002749> Caso tenha dúvidas ou enfrente algum problema, sinta-se à vontade para entrar em nosso [servidor de suporte](http://dsc.gg/grovesuporte). Nossa equipe está à disposição para auxiliá-lo!`
                    );

                    const newMenu = createAutoroleMenu();
                    await interaction.editReply({ embeds: [embed], components: [newMenu] });

                    await i.update({
                        content: `<:1078434426368839750:1290114335909085257> O cargo foi configurado com sucesso: <@&${selectedRoleId}>`,
                        components: [], // Remove os componentes após a seleção
                        ephemeral: true
                    });
                });
            } else if (i.values[0] === 'assign_role_to_all') {
                // Verificar se o cargo foi configurado
                if (!selectedRoleId) {
                    return i.reply({
                        content: '> \`-\` <:NA_Intr004:1289442144255213618> Nenhum cargo foi configurado ainda.',
                        ephemeral: true
                    });
                }

                await i.deferReply({ ephemeral: true });

                // Atribuir o cargo a todos os membros
                const role = guild.roles.cache.get(selectedRoleId);
                // Verificar se o cargo que o bot vai atribuir está abaixo na hierarquia
                const botMember = guild.members.me;

                if (role.position >= botMember.roles.highest.position) {
                    // Enviar uma mensagem separada informando que o cargo está acima do cargo do bot
                    await i.followUp({
                        content: `> \`-\` <:NA_Intr004:1289442144255213618> Eu não posso atribuir o cargo <@&${selectedRoleId}> pois ele está acima do meu cargo na hierarquia. Por favor, ajuste a hierarquia de cargos ou mova meu cargo para cima.`,
                        ephemeral: true
                    });

                    return; // Termina a execução aqui, pois o bot não pode atribuir o cargo
                }



                let successCount = 0;
                let failureCount = 0;

                await guild.members.fetch(); // Busca todos os membros do servidor

                const membersWithoutRole = guild.members.cache.filter(member => !member.roles.cache.has(selectedRoleId) && !member.user.bot);

                // Atribuir o cargo aos membros
                for (const member of membersWithoutRole.values()) {
                    try {
                        await member.roles.add(role);
                        successCount++;
                    } catch (error) {
                        failureCount++;
                        console.error(`Falha ao atribuir o cargo ao membro ${member.user.tag}:`, error);
                    }
                }

                await i.editReply({
                    content: `<:1078434426368839750:1290114335909085257> Cargo atribuído a ${successCount} membros com sucesso!`,
                    ephemeral: true
                })
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
