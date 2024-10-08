const { PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../database/models/antilink.js');

const linkRegex = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/;

const guildCache = new Map(); // Cache para guardar as configurações das guildas

// Função para enviar a mensagem de alerta e excluir depois de um tempo
async function sendAlertAndDelete(channel, content, timeout = 15000) {
    try {
        const alertMessage = await channel.send(content);
        setTimeout(() => alertMessage.delete().catch(error => {
        }), timeout);
    } catch (error) {
    }
}

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        try {
            // Ignorar mensagens de bots e mensagens fora de guildas
            if (message.author.bot || !message.guild) return;

            const guildId = message.guild.id;
            let guildConfig = guildCache.get(guildId);

            // Se não estiver no cache, busca no banco de dados e armazena no cache
            if (!guildConfig) {
                guildConfig = await GuildConfig.findOne({ guildId });
                if (guildConfig) {
                    guildCache.set(guildId, guildConfig);
                    // Cache por 5 minutos, depois remove
                    setTimeout(() => guildCache.delete(guildId), 300000);
                }
            }

            if (guildConfig && guildConfig.antilinkEnabled) {
                const allowedRoles = guildConfig.allowedRoles;

                // Verificar se há links na mensagem
                if (linkRegex.test(message.content)) {

                    // Verifica se o membro é administrador, retornando antes de verificar os cargos permitidos
                    if (message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

                    // Verificar se o membro tem algum dos cargos permitidos
                    const hasAllowedRole = allowedRoles.some(roleId => message.member.roles.cache.has(roleId));
                    if (hasAllowedRole) return;

                    // Tentar deletar a mensagem com link
                    try {
                        await message.delete();
                        // Enviar alerta ao canal e apagar após 15 segundos
                        await sendAlertAndDelete(
                            message.channel,
                            `> \`-\` <a:alerta:1163274838111162499> ${message.author}, links não são permitidos em **${message.guild.name}**`
                        );
                    } catch (error) {

                        await sendAlertAndDelete(
                            message.channel,
                            `> \`-\` <a:alerta:1163274838111162499> ${message.author}, houve um erro ao tentar deletar sua mensagem contendo links em **${message.guild.name}**`
                        );
                    }
                }
            }
        } catch (error) {

        }
    }
}
