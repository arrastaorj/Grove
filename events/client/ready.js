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

        const statuses = [
            { name: '✏️ Personalize com /embed criar', type: ActivityType.Custom },
            { name: '🚫 proteger com /antilink', type: ActivityType.Custom },
            { name: '🎭 gerencie com /cargos', type: ActivityType.Custom },
            { name: '🛡️ moderação com /automod', type: ActivityType.Custom }
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
