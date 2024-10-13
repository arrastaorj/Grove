const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const comandos = require('../../database/models/comandos');
const Level = require('../../database/models/level');
const canvafy = require("canvafy");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Exibe o level de um usuário no servidor.')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Mencione o usuário ou bot para ver o level.')
                .setRequired(false)
        ),

    async execute(interaction) {
        try {
            // Verifica se o canal correto foi configurado
            const canalID = await comandos.findOne({ guildId: interaction.guild.id });
            if (!canalID || !canalID.canal1) {
                return interaction.reply({
                    content: `> \`-\` <:NA_Intr004:1289442144255213618> Um administrador ainda não configurou o canal para a utilização dos comandos.`,
                    ephemeral: true
                });
            }

            const canalPermitido = canalID.canal1;
            if (interaction.channel.id !== canalPermitido) {
                return interaction.reply({
                    content: `> \`-\` <:NA_Intr004:1289442144255213618> Você está tentando usar um comando no canal de texto errado, tente usá-lo no canal correto. <#${canalPermitido}>.`,
                    ephemeral: true
                });
            }

            // Obter o usuário alvo ou o usuário da interação
            const user = interaction.options.getUser('usuario') || interaction.user;

            // Buscar o nível e XP do usuário no banco de dados
            let levelData = await Level.findOne({ userId: user.id, guildId: interaction.guild.id });
            if (!levelData) {
                return interaction.reply({
                    content: `> \`-\` <:NA_Intr004:1289442144255213618> Este usuário ainda não possui dados de nível.`,
                    ephemeral: true
                });
            }

            // Calcular o XP necessário para o próximo nível
            const nextLevelXp = levelData.requiredXp;
            const xpToNextLevel = nextLevelXp - levelData.xp;

            // Obter todos os níveis dos usuários da guilda
            const allLevels = await Level.find({ guildId: interaction.guild.id });

            // Determinar o rank do usuário
            const sortedLevels = allLevels.sort((a, b) => b.level - a.level); // Ordena do maior para o menor nível
            const rank = sortedLevels.findIndex(u => u.userId === user.id) + 1; // +1 para rankar corretamente (1, 2, 3...)

            // Criar a imagem de Rank com Canvafy
            const rankImage = await new canvafy.Rank()
                .setAvatar(user.displayAvatarURL({ format: 'png', size: 1024 }))
                .setBackground("image", "https://raw.githubusercontent.com/arrastaorj/flags/refs/heads/main/pikaso_edit.png")
                .setUsername(user.username)
                .setBorder("#62296f")
                .setBarColor('#62296f')
                .setStatus("online") // Você pode adaptar o status conforme necessário
                .setLevel(levelData.level)
                .setRank(rank) // Define o rank baseado na classificação
                .setCurrentXp(levelData.xp)
                .setRequiredXp(nextLevelXp)
                .build();

            const attachment = new AttachmentBuilder(rankImage, { name: `rank-${user.id}.png` });

            // Enviar a imagem de nível como resposta
            interaction.reply({
                content: `**${user}, aqui está o seu nível no servidor!**\nXP Atual: \`${levelData.xp}\` / XP Necessário para o próximo nível: \`${xpToNextLevel}\`\nSeu Rank: \`#${rank}\``,
                files: [attachment]
            });
        } catch (error) {
            console.error(`Erro ao exibir o nível do usuário: ${error}`);
            interaction.reply({
                content: `> \`-\` <:NA_Intr004:1289442144255213618> Ocorreu um erro ao exibir o nível do usuário.`,
                ephemeral: true
            });
        }
    }
};
