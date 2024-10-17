const { 
    PermissionFlagsBits, 
    EmbedBuilder 
} = require('discord.js');
const client = require('../../index');

module.exports = {
    name: 'guildCreate',
    async execute(guild) {

        if (!guild || !guild.name) return;

        const channel = client.channels.cache.get("1188525235025231872");

        let invite = 'Nenhum convite disponível';

        try {
            // Verifica se o bot tem a permissão de "Gerenciar Servidor" (MANAGE_GUILD)
            if (guild.members.me.permissions.has(PermissionFlagsBits.ManageGuild)) {
                const invites = await guild.invites.fetch();
                invite = invites.size > 0 ? invites.first().url : 'Nenhum convite disponível';
            }
        } catch (error) {
            console.error(`Erro ao buscar convites para o servidor ${guild.name}:`, error.message);
        }

        await channel.send({
            embeds: [
                new EmbedBuilder()
                    .setColor("#03f7ff")
                    .setTitle("Novo servidor adicionado 🎉")
                    .setDescription(`Agora estou em: **${client.guilds.cache.size} servidores** ✨`)
                    .setFields(
                        { name: `Servidor`, value: `${guild.name}` },
                        { name: `Usuários`, value: `${guild.memberCount}` },
                        { name: `ID`, value: `${guild.id}` },
                        { name: `Convite`, value: invite }
                    )
                    .setTimestamp(),
            ],
        });
    }
};
