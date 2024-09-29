const fs = require("fs").promises;
const path = require("path");

module.exports = async (client) => {

    
    client.ArgsScommands = [];

      // Função para carregar comandos de forma recursiva
      async function loadCommands(dir) {
        try {
            const files = await fs.readdir(dir, { withFileTypes: true });

            for (const file of files) {
                const fullPath = path.join(dir, file.name); // Usar path.join para garantir a compatibilidade

                if (file.isDirectory()) {
                    // Recursivamente ler subpastas
                    await loadCommands(fullPath);
                } else if (file.isFile() && file.name.endsWith('.js')) {
                    // Carregar o comando
                    const command = require(fullPath); // Usar caminho completo para o require
                    client.slashCommands.set(command.data.name, command);
                    client.ArgsScommands.push(command.data.toJSON());
                }
            }
        } catch (error) {
            console.error("[Comandos] Erro ao carregar comandos:", error);
        }
    }

    // Carregando eventos
    async function loadEvents() {
        try {
            const eventFolders = await fs.readdir('./events');
            for (const folder of eventFolders) {
                const eventFiles = await fs.readdir(`./events/${folder}`);
                const jsFiles = eventFiles.filter(file => file.endsWith('.js'));
                for (const file of jsFiles) {
                    const event = require(`../events/${folder}/${file}`);
                    if (event.once) {
                        client.once(event.name, (...args) => event.execute(...args, client));
                    } else {
                        client.on(event.name, (...args) => event.execute(...args, client));
                    }
                }
            }
            console.log("[Eventos]".bgYellow, "> Eventos carregados com sucesso.".yellow);

        } catch (error) {
            console.error("[Eventos]".bgYellow, "> Erro ao carregar eventos.".yellow, error);
        }
    }

    // Chamando as funções de carregamento
    await loadCommands(path.join(__dirname, '../commands')); // Passar o caminho correto para a pasta de comandos
    await loadEvents();
   

    
}
