const { AttachmentBuilder } = require('discord.js');
const client = require('../../index');
const comandos = require('../../database/models/comandos');
const Level = require('../../database/models/level');
const cooldowns = new Set();
const xpCooldowns = new Map();
const userLeveling = new Set();
const canvafy = require("canvafy");
const commandCache = new Map();

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        try {
            if (message.author.bot || message.channel.type === 'dm') return;
            if (cooldowns.has(message.author.id)) return;
            if (userLeveling.has(message.author.id)) return;

            const lastXpTimestamp = xpCooldowns.get(message.author.id);
            const currentTime = Date.now();
            const xpCooldownTime = 60000;

            if (lastXpTimestamp && currentTime - lastXpTimestamp < xpCooldownTime) {
                return;
            }

            let cmd = commandCache.get(message.guild.id);
            if (!cmd) {
                cmd = await comandos.findOne({ guildId: message.guild.id });
                if (!cmd || !cmd.canal1) return;
                commandCache.set(message.guild.id, cmd);
                setTimeout(() => commandCache.delete(message.guild.id), 60000);
            }

            const cmd1 = cmd.canal1;

            function getRandomXp(min, max) {
                return Math.floor(Math.random() * (max - min + 1)) + min;
            }

            function calculateLevelXp(level) {
                const baseXp = 100;
                let requiredXp = Math.floor(baseXp * Math.pow(level, 1.5)); // Crescimento polinomial

                // Define um limite máximo para o XP necessário
                const maxXp = Number.MAX_SAFE_INTEGER; // Limite máximo seguro de XP
                return Math.min(requiredXp, maxXp);
            }


            const xpToGive = getRandomXp(1, 20);
            const query = { userId: message.author.id, guildId: message.guild.id };

            userLeveling.add(message.author.id);

            try {
                // Atualiza ou cria um novo usuário com o upsert
                const level = await Level.findOneAndUpdate(
                    query,
                    {
                        $inc: { xp: xpToGive },  // Incrementa XP
                        $setOnInsert: {
                            level: 0,
                            requiredXp: calculateLevelXp(1)
                        }
                    },
                    { new: true, upsert: true } // new retorna o documento atualizado; upsert cria se não existir
                );

                // Lógica de nível após a atualização ou criação
                if (level.xp >= level.requiredXp) {
                    level.xp -= level.requiredXp;
                    level.level += 1;
                    level.requiredXp = calculateLevelXp(level.level + 1);

                    // Gera a imagem de level up
                    const levelUpImage = await new canvafy.LevelUp()
                        .setAvatar(message.author.displayAvatarURL({ format: 'png', size: 1024 }))
                        .setBackground("image", "https://github.com/arrastaorj/flags/blob/main/rankAtendimento.jpg?raw=true")
                        .setUsername(message.author.username)
                        .setBorder("#000000")
                        .setAvatarBorder("#ff0000")
                        .setOverlayOpacity(0.7)
                        .setLevels(level.level - 1, level.level)
                        .build();

                    const attachment = new AttachmentBuilder(levelUpImage, { name: "level_up.png" });

                    client.channels.cache.get(cmd1).send({
                        content: `**${message.author}, Parabéns, você subiu para o nível: \`${level.level}\`!**`,
                        files: [attachment]
                    });
                }

                await level.save(); // Salva as alterações no nível e XP

                cooldowns.add(message.author.id);
                setTimeout(() => cooldowns.delete(message.author.id), 60000);
                xpCooldowns.set(message.author.id, Date.now());

            } catch (error) {
                console.log(`Erro ao fornecer XP: ${error}`);
            } finally {
                userLeveling.delete(message.author.id);
            }

        } catch (error) {
            console.log(`Erro no processamento da mensagem: ${error}`);
        }
    }
};
