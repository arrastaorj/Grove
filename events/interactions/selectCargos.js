const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,

} = require("discord.js")

const client = require('../../index')
const cargos = require("../../database/models/cargos")

module.exports = async (interaction) => {


    const { member, message } = interaction;

    if (interaction.customId.startsWith("select-cargo-")) {

        // Extrai o cargosId do customId (por exemplo, "select-cargo-12345" -> "12345")
        const cargosId = interaction.customId.split("select-cargo-")[1];

        const cargo = await cargos.findOne({
            guildId: interaction.guild.id,
            cargosId: cargosId
        });

        if (!cargo) {
            return interaction.reply({
                content: `> \`-\` <a:alerta:1163274838111162499> Configurações de cargos não encontradas.`,
                ephemeral: true
            });
        }

        const channel = client.channels.cache.get(cargo.logsId);

        if (!channel) {
            return interaction.reply({
                content: `> \`-\` <a:alerta:1163274838111162499> Canal de logs não encontrado.`,
                ephemeral: true
            });
        }

        const cargoIds = cargo.cargos || []; // Array de IDs de cargos no banco de dados
        const cargoMapping = cargoIds
            .map(cargoId => interaction.guild.roles.cache.get(cargoId))
            .filter(role => role);

        if (cargoMapping.length === 0) {
            return interaction.reply({
                content: `> \`-\` <a:alerta:1163274838111162499> Nenhum cargo configurado foi encontrado.`,
                ephemeral: true
            });
        }

        // Verificação de permissões do bot
        if (!interaction.guild.members.me.permissions.has('ManageRoles')) {
            return interaction.reply({
                content: `> \`-\` <a:alerta:1163274838111162499> Eu preciso da permissão de "Gerenciar Cargos" para concluir esta ação.`,
                ephemeral: true
            });
        }

        const botHighestRole = interaction.guild.members.me.roles.highest;

        // Filtra os cargos válidos selecionados pelo usuário
        const { values } = interaction;
        const selectedRoles = values
            .map(value => interaction.guild.roles.cache.get(value))
            .filter(role => role);

        // Verificação para assegurar que os cargos do bot são mais altos que os cargos selecionados
        if (selectedRoles.some(role => role.position >= botHighestRole.position)) {
            return interaction.reply({
                content: `> \`-\` <a:alerta:1163274838111162499> Não tenho permissão para modificar alguns dos cargos selecionados, pois estão acima do meu cargo mais alto.`,
                ephemeral: true
            });
        }

        const currentRoles = member.roles.cache;
        const rolesToAdd = selectedRoles.filter(role => !currentRoles.has(role.id));
        const rolesToRemove = cargoMapping.filter(role => !selectedRoles.includes(role) && currentRoles.has(role.id));

        // Embeds para log de adição e remoção de cargos
        const logsAdd = new EmbedBuilder()
            .setDescription(`${interaction.member} **Atualizou seus cargos** \n\n> \`+\` ${rolesToAdd.map(role => role.name).join("\n> \`+\` ")}`)
            .setTimestamp()
            .setColor('13F000')
            .setFooter({ text: `${interaction.member.user.username}`, iconURL: interaction.member.displayAvatarURL({ dynamic: true }) });

        const logsRemove = new EmbedBuilder()
            .setDescription(`${interaction.member} **Removeu seus cargos** \n\n> \`-\` ${rolesToRemove.map(role => role.name).join("\n> \`-\` ")}`)
            .setTimestamp()
            .setColor('E61919')
            .setFooter({ text: `${interaction.member.user.username}`, iconURL: interaction.member.displayAvatarURL({ dynamic: true }) });

        const logsAddUser = new EmbedBuilder()
            .setDescription(`**Cargos adicionados:** \n\n> \`+\` ${rolesToAdd.map(role => role.name).join("\n> \`+\` ")}`)
            .setTimestamp()
            .setColor('13F000')
            .setFooter({ text: `${interaction.member.user.username}`, iconURL: interaction.member.displayAvatarURL({ dynamic: true }) });

        const logsRemoveUser = new EmbedBuilder()
            .setDescription(`**Cargos removidos:** \n\n> \`-\` ${rolesToRemove.map(role => role.name).join("\n> \`-\` ")}`)
            .setTimestamp()
            .setColor('E61919')
            .setFooter({ text: `${interaction.member.user.username}`, iconURL: interaction.member.displayAvatarURL({ dynamic: true }) });

        // Adiciona e remove os cargos, se necessário
        try {
            if (rolesToAdd.length > 0) {
                await member.roles.add(rolesToAdd);
                await channel.send({ embeds: [logsAdd] });
                return interaction.reply({ embeds: [logsAddUser], ephemeral: true });
            }

            if (rolesToRemove.length > 0) {
                await member.roles.remove(rolesToRemove);
                await channel.send({ embeds: [logsRemove] });
                return interaction.reply({ embeds: [logsRemoveUser], ephemeral: true });
            }

            return interaction.reply({ content: `Você já possui todos os cargos selecionados`, ephemeral: true });

        } catch (error) {
            return interaction.reply({
                content: `> \`-\` <a:alerta:1163274838111162499> Não posso concluir o comando devido a um erro inesperado.`,
                ephemeral: true
            });
        }
    }

    if (interaction.isButton) {
        if (interaction.customId === 'voltarCargos') {

            await interaction.deferUpdate();

            // Buscar as configurações de tickets existentes no banco de dados
            const cargosConfigs = await cargos.find({ guildId: interaction.guild.id });

            // Criar opções no select menu para os diferentes tickets disponíveis
            const selectMenuOptions = cargosConfigs.map(config => ({
                label: `Select-Cargos ID`,
                emoji: '<:Logs:1297733186985398375>',
                value: config.cargosId,
                description: ` ${config.cargosId}`
            }));

            // Adicionar a opção de criar um novo sistema de tickets
            selectMenuOptions.push({
                label: 'Criar novo sistema de Select-Cargos',
                emoji: '<:Ajouter:1297732836605825054>',
                value: 'cargos_add',
                description: 'Adicione um novo sistema de Select-Cargos'
            });

            // Adicionar a opção de criar um novo sistema de tickets
            selectMenuOptions.push({
                label: 'Deletar Sistema de Select-Cargos',
                emoji: '<:Supprimer:1299793527768612904>',
                value: 'cargos_delete',
                description: 'Exclua um sistema de Select-Cargos já configurado'
            });


            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('select_cargos_config')
                .setPlaceholder('Selecione um Select-Cargos existente ou crie um novo')
                .addOptions(selectMenuOptions);

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
            await interaction.editReply({
                content: ``,
                embeds: [embedInicial],
                components: [row], // Certifique-se de que a variável 'row' esteja definida

            })
        }
    }



    if (interaction.isModalSubmit()) {

        const { getSelectedCargotId } = require('../../commands/administração/teste')
        const selectedCargoId = getSelectedCargotId();


        // Função para carregar as informações do banco de dados com guildId e selectedCargoId
        const getUpdatedCargosConfig = async (guildId) => {
            return await cargos.findOne({ guildId, cargosId: selectedCargoId })
        }

        // Função para montar e atualizar a embed
        const updateEmbed = async (interaction, cargosData) => {
            let assignedChannelLogs = cargosData?.logsId ? `<#${cargosData.logsId}>` : 'Não configurado';
            let assignedDescription = cargosData?.description ? `${cargosData.description}` : 'Não configurado';
            let imagem01 = cargosData?.Img ? `${cargosData.Img}` : 'Não configurado';
            let assignedRoles = cargosData && cargosData.cargos?.length > 0
                ? cargosData.cargos.map(roleId => {
                    const role = interaction.guild.roles.cache.get(roleId);
                    return role ? `<@&${role.id}>` : '';
                }).filter(roleMention => roleMention)
                    .join(', ')
                : 'Nenhum cargo atribuído';


            if (interaction.message.embeds.length > 0) {
                const embed = EmbedBuilder.from(interaction.message.embeds[0]);
                embed.setDescription(
                    `* <:shop_white:1289442593452724244> **Bem-vindo(a) ao sistema de selectMenu para cargos do Grove!**\n` +
                    `  - Os membros agora podem escolher os cargos que desejam receber diretamente no menu.\n\n` +
                    `* <:settings:1289442654806999040> **Informações sobre o sistema:**\n` +
                    `  - **Canal de Logs:** <:channel:1290115652828270613> ${assignedChannelLogs}\n` +
                    `  - **Descrição:** <:summary:1293727240114278422> ${assignedDescription}\n` +
                    `  - **Imagem/GIF:** <:media:1290453610911760396> ${imagem01}\n` +
                    `  - **Cargos Atribuídos:** <:Members:1289442534216568893> ${assignedRoles}\n\n` +
                    `-# <:info:1290116635814002749> Caso tenha dúvidas ou enfrente algum problema, sinta-se à vontade para entrar em nosso [servidor de suporte](http://dsc.gg/grovesuporte). Nossa equipe está à disposição para auxiliá-lo!`)
                try {
                    await interaction.message.edit({ embeds: [embed] });
                } catch (error) {
                    console.error("Erro ao atualizar a embed:", error);
                }
            }
        }

        async function isValidImageUrl(url) {
            try {
                // Faz uma requisição HEAD para o URL
                const response = await fetch(url, { method: 'HEAD' });

                // Verifica o content-type do cabeçalho da resposta
                const contentType = response.headers.get('content-type');
                return contentType && (contentType.startsWith('image/jpeg') || contentType.startsWith('image/png') || contentType.startsWith('image/gif'));
            } catch (error) {
                // Se houver erro, a URL não é válida ou acessível
                return false;
            }
        }

        // Função para salvar dados e atualizar embed
        const handleModalSubmit = async (interaction, updateData) => {
            // Atualizar o banco de dados
            await cargos.findOneAndUpdate(
                { guildId: interaction.guild.id, cargosId: selectedCargoId },
                { $set: updateData },
                { lean: true }
            )

            // Recarregar as informações do banco e atualizar a embed
            let updatedTicketConfig = await getUpdatedCargosConfig(interaction.guild.id);
            await updateEmbed(interaction, updatedTicketConfig);

            // Responder ao usuário
            await interaction.reply({
                content: `<:1078434426368839750:1290114335909085257> A configuração foi atualizada com sucesso.`,
                ephemeral: true
            })
        }


        if (interaction.customId === 'descricao_cargos_modal') {
            const descricao = interaction.fields.getTextInputValue('descricao_cargos_input')
            await handleModalSubmit(interaction, { description: descricao })
        } else if (interaction.customId === 'imagem_Modal') {
            const imageUrl = interaction.fields.getTextInputValue('imagem_Link');

            // Verifica se a URL é válida para imagens JPEG, PNG ou GIF
            if (!(await isValidImageUrl(imageUrl))) {
                return await interaction.reply({
                    content: '> \`-\` <a:alerta:1163274838111162499> O link fornecido não é uma URL válida para uma imagem (somente arquivos JPEG, PNG ou GIF são permitidos).',
                    ephemeral: true
                });
            }

            await handleModalSubmit(interaction, { Img: imageUrl })
        }
    }


}
