const { PermissionFlagsBits } = require('discord.js');
const client = require('../../index');
const autorole = require("../../database/models/autorole");

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {

        // Buscar a configuração de cargos no banco de dados
        const addRoles = await autorole.findOne({ guildId: member.guild.id });

        // Se não houver configuração de autorole, sair
        if (!addRoles) return;

        // Verificar se o autorole está ativo (isActive)
        if (!addRoles.isActive) {
            console.log(`> \`-\` O sistema de AutoRole está desativado no servidor: ${member.guild.name}`);
            return;
        }

        // Verificar se o bot tem permissão para gerenciar cargos
        const botMember = member.guild.members.cache.get(client.user.id);
        const hasPermission = botMember.permissions.has(PermissionFlagsBits.ManageRoles);

        if (!hasPermission) {
            console.log(`> \`-\` O bot não tem permissão para gerenciar cargos no servidor: ${member.guild.name}`);
            return;
        }

        // Filtrar apenas os cargos válidos que foram configurados
        const rolesToAdd = addRoles.cargos
            .filter(roleId => member.guild.roles.cache.has(roleId)) // Verificar se os cargos existem no servidor

        // Se não houver cargos válidos configurados, sair
        if (rolesToAdd.length === 0) {
            console.log(`> \`-\` Nenhum cargo configurado no sistema de AutoRole para o servidor: ${member.guild.name}`);
            return;
        }

        // Adicionar os cargos ao membro
        try {
            await member.roles.add(rolesToAdd);
            console.log(`> \`+\` Cargos adicionados ao membro ${member.user.tag} no servidor ${member.guild.name}.`);
        } catch (error) {
            console.error(`Erro ao adicionar cargos para ${member.user.tag} no servidor ${member.guild.name}:`, error);
            try {
                await member.send(`> \`-\` <a:alerta:1163274838111162499> Não posso concluir o comando pois ainda não recebi permissão para gerenciar cargos no servidor **${member.guild.name}**.`);
            } catch (dmError) {
                console.error(`Erro ao enviar mensagem direta para ${member.user.tag}:`, dmError);
            }
        }
    }
};
