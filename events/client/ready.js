const {
    ActivityType
} = require("discord.js")

require('colors')

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        try {

            await client.application.commands.set(client.ArgsScommands); // Usando a propriedade do cliente
            console.log("[commands]".bgMagenta, "> Os comandos foram carregados globalmente.".magenta);
        } catch (e) {
            console.error("[commands]".bgMagenta, "> Não foi possível carregar os comandos globalmente.".magenta, e);
            process.exit(1);
        }

        const guildCount = await client.shard.fetchClientValues('guilds.cache.size')
        const totalGuilds = guildCount.reduce((acc, count) => acc + count, 0)
        const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)
        const formattedTotalUsers = totalUsers.toLocaleString('pt-BR')
        const shardId = client.shard.ids[0] // Obtém o ID da shard atual

        const statuses = [
            { name: `💜 Online | ${totalGuilds} Servidores`, type: ActivityType.Custom },
            { name: `💜 Online | ${formattedTotalUsers} Usuários`, type: ActivityType.Custom },
            { name: `💜 Online | Cluster: ${shardId}`, type: ActivityType.Custom },

        ]

        let index = 0


        setInterval(() => {
            client.user.setPresence({
                activities: [statuses[index]],
                status: 'online',
            })

            index = (index + 1) % statuses.length

        }, 60000)

        console.log("[Bot-Status]".bgBlue, `> Estou online como: ${client.user.username}`.blue);
    }
}
