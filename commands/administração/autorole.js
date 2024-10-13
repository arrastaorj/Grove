const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    PermissionsBitField,
    PermissionFlagsBits,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');

const autoroles = require("../../database/models/autorole")
const collectors = new Map()

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autorole')
        .setDescription('Configure o sistema de autorole para novos membros.'),

    async execute(interaction) {

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



        // Verificação se existe um registro para a guilda no banco de dados
        let autoroleData2 = await autoroles.findOne({ guildId: interaction.guild.id });

        // Se não houver registro, cria um novo
        if (!autoroleData2) {
            autoroleData2 = new autoroles({
                guildId: interaction.guild.id,
                cargos: [],
                isActive: false
            });
            await autoroleData2.save(); // Salva o novo registro
        }


        const autoroleData = await autoroles.findOne({ guildId: interaction.guild.id });
        const isActive = autoroleData ? autoroleData.isActive : false;
        const assignedRoles = autoroleData && autoroleData.cargos.length > 0
            ? autoroleData.cargos.map(roleId => {
                const role = interaction.guild.roles.cache.get(roleId);
                return role ? `<@&${role.id}>` : '';
            }).filter(roleMention => roleMention)
                .join(', ')
            : 'Nenhum cargo atribuído';

        const embed = new EmbedBuilder()
            .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
            .setDescription(
                `* <:shop_white:1289442593452724244> **Bem-vindo(a) ao sistema de atribuição automática de cargos do Grove!**\n` +
                `  - Quando um novo usuário entrar no servidor, ele receberá automaticamente os cargos configurados. Utilize o menu abaixo para configurar.\n\n` +
                `* <:settings:1289442654806999040> **Informações sobre o sistema:**\n` +
                `  - **Status:** ${isActive ? '<:8047onlinegray:1289442869060440109> Ativado' : '<:red_dot:1289442683705888929> Desativado'}\n` +
                `  - **Cargos Atribuídos:** <:Members:1289442534216568893> ${assignedRoles}\n\n` +
                `-# <:info:1290116635814002749> Caso tenha dúvidas ou enfrente algum problema, sinta-se à vontade para entrar em nosso [servidor de suporte](http://dsc.gg/grovesuporte). Nossa equipe está à disposição para auxiliá-lo!`)
            .setColor('#ba68c8')
            .setFooter({ text: `O sistema de AutoRole permite a configuração de no máximo 5 cargos.`, iconURL: interaction.member.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();

        function createAutoroleMenu(isActive) {
            return new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('autorole_menu')
                    .setPlaceholder('Selecione a opção que deseja configurar.')
                    .addOptions([
                        {
                            label: isActive ? 'Desativar' : 'Ativar',
                            description: isActive ? 'Desative o sistema de autorole.' : 'Ative o sistema de autorole.',
                            emoji: isActive ? `<:red_dot:1289442683705888929>` : `<:8047onlinegray:1289442869060440109>`,
                            value: 'toggle_active'
                        },
                        {
                            label: 'Adicionar Cargos',
                            description: 'Adicione à lista cargos que o usuário irá receber.',
                            emoji: `<:member_white333:1289442716761067620>`,
                            value: 'add_role'
                        },
                        {
                            label: 'Remover Cargos',
                            description: 'Remova da lista cargos não desejados para o sistema.',
                            emoji: `<:member_white22:1289442774378090506>`,
                            value: 'remove_role'
                        }
                    ])
            );
        }

        await interaction.reply({ embeds: [embed], components: [createAutoroleMenu(isActive)] })

        const timeoutDuration = 60000; // 60 segundos
        const startTime = Date.now(); // Marca o momento em que o coletor foi iniciado


        const filter = i => i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: timeoutDuration })



        // Armazenar o coletor no Map com o tempo de início e duração
        collectors.set(userId, { collector, timeout: timeoutDuration, startTime });

        collector.on('collect', async i => {
            if (i.customId === 'autorole_menu') {
                const selectedValue = i.values[0];

                if (selectedValue === 'toggle_active') {
                    const autoroleData = await autoroles.findOne({ guildId: interaction.guild.id });
                    const currentIsActive = autoroleData ? autoroleData.isActive : false;

                    const newIsActive = !currentIsActive;

                    await autoroles.updateOne(
                        { guildId: interaction.guild.id },
                        { $set: { isActive: newIsActive } },
                        { upsert: true }
                    );

                    const updatedAutoroleData = await autoroles.findOne({ guildId: interaction.guild.id });
                    const updatedRoles = updatedAutoroleData.cargos.map(roleId => {
                        const role = interaction.guild.roles.cache.get(roleId);
                        return role ? `<@&${role.id}>` : '';
                    }).filter(roleMention => roleMention).join(', ') || 'Nenhum cargo atribuído';

                    const updatedStatus = newIsActive ? '<:8047onlinegray:1289442869060440109> Ativado' : '<:red_dot:1289442683705888929> Desativado';

                    embed.setDescription(
                        `* <:shop_white:1289442593452724244> **Bem-vindo(a) ao sistema de atribuição automática de cargos do Grove!**\n` +
                        `  - Quando um novo usuário entrar no servidor, ele receberá automaticamente os cargos configurados. Utilize o menu abaixo para configurar.\n\n` +
                        `* <:settings:1289442654806999040> **Informações sobre o sistema:**\n` +
                        `  - **Status:** ${updatedStatus}\n` +
                        `  - **Cargos Atribuídos:** <:Members:1289442534216568893> ${updatedRoles}\n\n` +
                        `-# <:info:1290116635814002749> Caso tenha dúvidas ou enfrente algum problema, sinta-se à vontade para entrar em nosso [servidor de suporte](http://dsc.gg/grovesuporte). Nossa equipe está à disposição para auxiliá-lo!`)

                    const newMenu = createAutoroleMenu(newIsActive);
                    await interaction.editReply({ embeds: [embed], components: [newMenu] });

                    await i.reply({ content: `O sistema de autorole foi ${newIsActive ? '<:8047onlinegray:1289442869060440109> Ativado' : '<:red_dot:1289442683705888929> Desativado'}.`, components: [], ephemeral: true });
                }

                if (selectedValue === 'add_role') {
                    const autoroleData = await autoroles.findOne({ guildId: interaction.guild.id });
                    const currentRoles = autoroleData ? autoroleData.cargos : [];

                    if (currentRoles.length >= 5) {
                        await i.reply({
                            content: '> \`-\` <:NA_Intr004:1289442144255213618> O máximo de cargos definidos foi atingido! Para adicionar outro cargo, remova algum da lista.',
                            ephemeral: true
                        });
                    } else {
                        try {
                            const { components, totalPages } = await createAddRoleMenu(interaction.guild, 0); // Página inicial (0)

                            // Verifica se o menu tem opções disponíveis
                            if (components[0].components[0].options.length === 0) {

                                const embed = new EmbedBuilder()
                                    .setColor('#FF0000') // Cor do erro
                                    .setAuthor({
                                        name: interaction.guild.name,
                                        iconURL: interaction.guild.iconURL({ dynamic: true })
                                    })
                                    .setDescription(
                                        `* <:NA_Intr004:1289442144255213618> **Erro ao exibir os cargos do servidor!**\n` +
                                        `  - Infelizmente, não foi possível gerenciar o cargo solicitado. Aqui estão os motivos:\n\n` +
                                        `* <:info:1290116635814002749> **Motivos:**\n` +
                                        `  - **Não há cargos disponíveis** para exibir nesta página.\n` +
                                        `  - **O cargo do bot está abaixo** de outros cargos no servidor.\n` +
                                        `  - **Alguns cargos podem não ser editáveis.**\n\n` +
                                        `* <:settings:1289442654806999040> **Sugestões:**\n` +
                                        `  - Verifique se o cargo do bot está acima dos outros cargos.\n` +
                                        `  - Tente novamente mais tarde.\n\n` +
                                        `-# Caso tenha dúvidas ou enfrente algum problema, sinta-se à vontade para entrar em nosso [servidor de suporte](http://dsc.gg/grovesuporte). Nossa equipe está à disposição para auxiliá-lo!`
                                    )
                                    .setImage("https://raw.githubusercontent.com/arrastaorj/flags/refs/heads/main/imagem_2024-10-07_201030753.png")
                                    .setFooter({ text: 'A imagem a cima mostra como deve fica o cargo do bot.', iconURL: interaction.member.displayAvatarURL({ dynamic: true }) })
                                    .setTimestamp();

                                await i.reply({
                                    embeds: [embed],
                                    ephemeral: true
                                });


                            } else {
                                await i.reply({
                                    content: `Selecione os cargos para adicionar: (Página 1 de ${totalPages})`,
                                    components: components, // Inclui o select menu e os botões de paginação
                                    ephemeral: true
                                });
                            }
                        } catch (error) {
                            const embed = new EmbedBuilder()
                                .setColor('#FF0000') // Cor do erro
                                .setAuthor({
                                    name: interaction.guild.name,
                                    iconURL: interaction.guild.iconURL({ dynamic: true })
                                })
                                .setDescription(
                                    `* <:NA_Intr004:1289442144255213618> **Erro ao exibir os cargos do servidor!**\n` +
                                    `  - Infelizmente, não foi possível gerenciar o cargo solicitado. Aqui estão os motivos:\n\n` +
                                    `* <:info:1290116635814002749> **Motivos:**\n` +
                                    `  - **Não há cargos disponíveis** para exibir nesta página.\n` +
                                    `  - **O cargo do bot está abaixo** de outros cargos no servidor.\n` +
                                    `  - **Alguns cargos podem não ser editáveis.**\n\n` +
                                    `* <:settings:1289442654806999040> **Sugestões:**\n` +
                                    `  - Verifique se o cargo do bot está acima dos outros cargos.\n` +
                                    `  - Tente novamente mais tarde.\n\n` +
                                    `-# Caso tenha dúvidas ou enfrente algum problema, sinta-se à vontade para entrar em nosso [servidor de suporte](http://dsc.gg/grovesuporte). Nossa equipe está à disposição para auxiliá-lo!`
                                )
                                .setImage("https://raw.githubusercontent.com/arrastaorj/flags/refs/heads/main/imagem_2024-10-07_201030753.png")
                                .setFooter({ text: 'A imagem a cima mostra como deve fica o cargo do bot.', iconURL: interaction.member.displayAvatarURL({ dynamic: true }) })
                                .setTimestamp();

                            await i.reply({
                                embeds: [embed],
                                ephemeral: true
                            });


                        }
                    }
                }

                if (selectedValue === 'remove_role') {
                    const autoroleData = await autoroles.findOne({ guildId: interaction.guild.id });
                    const removeRoleMenu = createRemoveRoleMenu(autoroleData, interaction.guild);
                    await i.reply({ content: 'Selecione os cargos para remover:', components: [removeRoleMenu], ephemeral: true });
                }
            }

            if (i.customId === 'select_role_to_add') {
                await i.deferUpdate();
                const selectedRoleIds = i.values;

                await autoroles.updateOne(
                    { guildId: interaction.guild.id },
                    { $addToSet: { cargos: { $each: selectedRoleIds } } },
                    { upsert: true }
                );

                const autoroleData = await autoroles.findOne({ guildId: interaction.guild.id });

                const updatedRoles = autoroleData.cargos.map(roleId => {
                    const role = interaction.guild.roles.cache.get(roleId);
                    return role ? `<@&${role.id}>` : '';
                }).filter(roleMention => roleMention).join(', ');


                // Verificando se o autoroleData existe e se o campo isActive é true ou false
                const isActive = autoroleData?.isActive ?? false; // Usando operador de coalescência nula para garantir que isActive tenha um valor
                // Atualizando o status de acordo com o valor de isActive
                const updatedStatus = isActive
                    ? '<:8047onlinegray:1289442869060440109> Ativado'
                    : '<:red_dot:1289442683705888929> Desativado';

                embed.setDescription(
                    `* <:shop_white:1289442593452724244> **Bem-vindo(a) ao sistema de atribuição automática de cargos do Grove!**\n` +
                    `  - Quando um novo usuário entrar no servidor, ele receberá automaticamente os cargos configurados. Utilize o menu abaixo para configurar.\n\n` +
                    `* <:settings:1289442654806999040> **Informações sobre o sistema:**\n` +
                    `  - **Status:** ${updatedStatus}\n` +
                    `  - **Cargos Atribuídos:** <:Members:1289442534216568893> ${updatedRoles}\n\n` +
                    `-# <:info:1290116635814002749> Caso tenha dúvidas ou enfrente algum problema, sinta-se à vontade para entrar em nosso [servidor de suporte](http://dsc.gg/grovesuporte). Nossa equipe está à disposição para auxiliá-lo!`);


                await interaction.editReply({ embeds: [embed], components: [createAutoroleMenu(isActive)] });
                await i.editReply({ content: `<:1078434426368839750:1290114335909085257> Cargos **configurados** com sucesso!`, components: [] });

            } else if (i.customId.startsWith('prev_page') || i.customId.startsWith('next_page')) {
                await i.deferUpdate();

                // Pega a página atual diretamente do customId
                const currentPage = parseInt(i.customId.split('_')[2], 10);

                // Atualiza a página com base no botão pressionado
                const newPage = i.customId.startsWith('next_page') ? currentPage + 1 : currentPage - 1;

                // Gera novamente o menu com a página atualizada
                const { components } = await createAddRoleMenu(interaction.guild, newPage);

                await i.editReply({
                    content: `Escolha os cargos para adicionar: (Página ${newPage + 1})`,
                    components: components
                });
            }

            if (i.customId === 'select_role_to_remove') {
                await i.deferUpdate();
                const selectedRoleId = i.values[0];

                if (selectedRoleId === 'reset_all') {
                    // Remove todos os cargos
                    await autoroles.updateOne(
                        { guildId: interaction.guild.id },
                        { $set: { cargos: [] } } // Reseta a lista de cargos
                    );

                    const autoroleData = await autoroles.findOne({ guildId: interaction.guild.id });

                    // Verificando se o autoroleData existe e se o campo isActive é true ou false
                    const isActive = autoroleData?.isActive ?? false; // Usando operador de coalescência nula para garantir que isActive tenha um valor

                    // Atualizando o status de acordo com o valor de isActive
                    const updatedStatus = isActive
                        ? '<:8047onlinegray:1289442869060440109> Ativado'
                        : '<:red_dot:1289442683705888929> Desativado';

                    // Atualiza a embed inicial sem enviar uma nova mensagem

                    embed.setDescription(
                        `* <:shop_white:1289442593452724244> **Bem-vindo(a) ao sistema de atribuição automática de cargos do Grove!**\n` +
                        `  - Quando um novo usuário entrar no servidor, ele receberá automaticamente os cargos configurados. Utilize o menu abaixo para configurar.\n\n` +
                        `* <:settings:1289442654806999040> **Informações sobre o sistema:**\n` +
                        `  - **Status:** ${updatedStatus}\n` +
                        `  - **Cargos Atribuídos:** <:Members:1289442534216568893> Nenhum cargo atribuído\n\n` +
                        `-# <:info:1290116635814002749> Caso tenha dúvidas ou enfrente algum problema, sinta-se à vontade para entrar em nosso [servidor de suporte](http://dsc.gg/grovesuporte). Nossa equipe está à disposição para auxiliá-lo!`)


                    await interaction.editReply({ embeds: [embed], components: [createAutoroleMenu(isActive)] }); // Atualiza a embed inicial
                    await i.editReply({ content: '<:1078434426368839750:1290114335909085257> Todos cargos foram **removido** com sucesso!', components: [], ephemeral: true });

                } else {
                    await autoroles.findOneAndUpdate(
                        { guildId: interaction.guild.id },
                        { $pull: { cargos: selectedRoleId } }
                    );

                    // Reobtém os dados atualizados do DB após a remoção
                    const autoroleData = await autoroles.findOne({
                        guildId: interaction.guild.id
                    });

                    const updatedRoles = autoroleData.cargos.map(roleId => {
                        const role = interaction.guild.roles.cache.get(roleId);
                        return role ? `<@&${role.id}>` : '';
                    }).filter(roleMention => roleMention).join(', ') || 'Nenhum cargo atribuído'; // Caso não haja nenhum cargo



                    // Verificando se o autoroleData existe e se o campo isActive é true ou false
                    const isActive = autoroleData?.isActive ?? false; // Usando operador de coalescência nula para garantir que isActive tenha um valor

                    // Atualizando o status de acordo com o valor de isActive
                    const updatedStatus = isActive
                        ? '<:8047onlinegray:1289442869060440109> Ativado'
                        : '<:red_dot:1289442683705888929> Desativado';

                    embed.setDescription(
                        `* <:shop_white:1289442593452724244> **Bem-vindo(a) ao sistema de atribuição automática de cargos do Grove!**\n` +
                        `  - Quando um novo usuário entrar no servidor, ele receberá automaticamente os cargos configurados. Utilize o menu abaixo para configurar.\n\n` +
                        `* <:settings:1289442654806999040> **Informações sobre o sistema:**\n` +
                        `  - **Status:** ${updatedStatus}\n` +
                        `  - **Cargos Atribuídos:** <:Members:1289442534216568893> ${updatedRoles}\n\n` +
                        `-# <:info:1290116635814002749> Caso tenha dúvidas ou enfrente algum problema, sinta-se à vontade para entrar em nosso [servidor de suporte](http://dsc.gg/grovesuporte). Nossa equipe está à disposição para auxiliá-lo!`)

                    await interaction.editReply({ embeds: [embed], components: [createAutoroleMenu(isActive)] }); // Atualiza a embed inicial

                    await i.editReply({ content: `<:1078434426368839750:1290114335909085257> Cargo **removido** com sucesso!`, components: [] });
                }
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
// Função para criar o menu de adicionar cargos com paginação
async function createAddRoleMenu(guild, currentPage = 0) {
    const autoroleData = await autoroles.findOne({ guildId: guild.id });
    const currentRoles = autoroleData ? autoroleData.cargos : [];

    // Limite de cargos que podem ser adicionados (máximo 5)
    const maxRolesToAdd = Math.max(1, 5 - currentRoles.length);

    // Filtra os cargos disponíveis
    const availableRoles = guild.roles.cache
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


// Função para criar o menu de remover cargos
function createRemoveRoleMenu(autoroleData, guild) {
    const storedRoleIds = autoroleData.cargos;
    const roleOptions = [];

    // Adiciona a opção de resetar todos os cargos no início
    roleOptions.push({
        label: 'Resetar todos (Irreversível)',
        description: `Essa opção irá remover todos os cargos definidos.`,
        emoji: `<:NA_Intr004:1289442144255213618>`,
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
