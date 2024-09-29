// const {
//     AttachmentBuilder
// } = require('discord.js')

// const client = require('../../index')
// const comandos = require('../../database/models/comandos')
// const Level = require('../../database/models/level')
// const calculateLevelXp = require('../../plugins/calculateLevelXp')
// const cooldowns = new Set()
// const xpCooldowns = new Map() // Map para armazenar cooldowns de XP por usuário
// const canvafy = require("canvafy")

// // Cache de dados de idioma e comandos
// const commandCache = new Map()

// module.exports = {
//     name: 'messageCreate',
//     async execute(message) {

//         try {
//             // Ignorar mensagens de bots e mensagens diretas
//             if (message.author.bot || message.channel.type === 'dm') return;

//             // Verificar cooldown global de nível
//             if (cooldowns.has(message.author.id)) return;

//             // Verificar se o usuário está no cooldown de XP (frequência de nível)
//             const lastXpTimestamp = xpCooldowns.get(message.author.id);
//             const currentTime = Date.now();
//             const xpCooldownTime = 60000; // 1 minuto de cooldown para XP

//             if (lastXpTimestamp && currentTime - lastXpTimestamp < xpCooldownTime) {
//                 return; // Ignora se o tempo de cooldown ainda não expirou
//             }


//             // Cache do comando
//             let cmd = commandCache.get(message.guild.id);
//             if (!cmd) {
//                 cmd = await comandos.findOne({ guildId: message.guild.id });
//                 if (!cmd || !cmd.canal1) return; // Se não houver comando ou canal configurado
//                 commandCache.set(message.guild.id, cmd);
//                 setTimeout(() => commandCache.delete(message.guild.id), 60000); // Cache por 1 minuto
//             }

//             let cmd1 = cmd.canal1;

//             // Função para gerar XP aleatório
//             function getRandomXp(min, max) {
//                 min = Math.ceil(min);
//                 max = Math.floor(max);
//                 return Math.floor(Math.random() * (max - min + 1)) + min;
//             }

//             const xpToGive = getRandomXp(1, 20);
//             const query = { userId: message.author.id, guildId: message.guild.id };

//             try {
//                 let level = await Level.findOne(query);
//                 if (!level) {
//                     // Se o usuário não tiver um nível, cria um novo registro
//                     level = new Level({
//                         userId: message.author.id,
//                         guildId: message.guild.id,
//                         xp: xpToGive,
//                         level: 0
//                     });
//                 } else {
//                     level.xp += xpToGive;
//                 }

//                 const xpNeededForNextLevel = calculateLevelXp(level.level + 1);

//                 if (level.xp >= xpNeededForNextLevel) {
//                     level.xp = 0;
//                     level.level += 1;

//                     // Criando a imagem de Level Up com Canvafy
//                     const levelUpImage = await new canvafy.LevelUp()
//                         .setAvatar(message.author.displayAvatarURL({ format: 'png', size: 1024 }))
//                         .setBackground("image", "https://github.com/arrastaorj/flags/blob/main/rankAtendimento.jpg?raw=true")
//                         .setUsername(message.author.username)
//                         .setBorder("#000000")
//                         .setAvatarBorder("#ff0000")
//                         .setOverlayOpacity(0.7)
//                         .setLevels(level.level - 1, level.level)  // Exibe o nível anterior e o atual
//                         .build();

//                     const attachment = new AttachmentBuilder(levelUpImage, { name: "level_up.png" });

//                     client.channels.cache.get(cmd1).send({
//                         content: `**${message.author}, Parabêns, você subiu para o nível: \`${level.level}\`!**`,
//                         files: [attachment]
//                     });
//                 }

//                 // Salvar os dados de nível atualizados
//                 await level.save();

//                 // Adicionar o usuário ao cooldown global
//                 cooldowns.add(message.author.id);
//                 setTimeout(() => cooldowns.delete(message.author.id), 60000); // Remover do cooldown após 1 minuto

//                 // Atualizar o cooldown de XP do usuário
//                 xpCooldowns.set(message.author.id, Date.now());

//             } catch (error) {
//                 console.log(`Erro ao fornecer XP: ${error}`);
//             }

//         } catch (error) {
//             console.log(`Erro no processamento da mensagem: ${error}`);
//         }

//     }
// }
