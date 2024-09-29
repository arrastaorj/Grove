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

        // Definindo presença
        client.user.setPresence({
            activities: [{ name: '✏️ Personalize com /embed criar', type: ActivityType.Custom }],
            status: 'online',
        });

        console.log("[Bot-Status]".bgBlue, `> Estou online como: ${client.user.username}`.blue);
    },
};
