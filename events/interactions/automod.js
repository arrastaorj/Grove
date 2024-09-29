const { EmbedBuilder } = require("discord.js");
const client = require('../../index');
const automodConfig = require("../../database/models/automod.js");

module.exports = async (interaction) => {
    const guild = interaction.guild;

    if (!interaction.isModalSubmit()) return;

    const automodSettings = await automodConfig.findOne({ guildId: guild.id }) || new automodConfig({ guildId: guild.id });
    const existingRules = await guild.autoModerationRules.fetch();

    const updateEmbed = async () => {
        if (interaction.message.embeds.length > 0) {
            const embed = EmbedBuilder.from(interaction.message.embeds[0]);
            embed.setDescription(
                `* <:new:1289442513094049854> **Bem-vindo(a) ao Sistema AutoMod - Proteção Inteligente para o Seu Servidor**\n` +
                `  - O AutoMod é uma solução avançada de moderação automática que garante a segurança e integridade do seu servidor.\n\n` +
                `* <:settings:1289442654806999040> **Informações sobre o sistema:**\n` +
                `  - **Palavras Ofensivas:** ${automodSettings.keywordBlockEnabled ? '<:8047onlinegray:1289442869060440109> Ativado' : '<:red_dot:1289442683705888929> Desativado'}\n` +
                `  - **Spam de Mensagem:** ${automodSettings.messageSpamBlockEnabled ? '<:8047onlinegray:1289442869060440109> Ativado' : '<:red_dot:1289442683705888929> Desativado'}\n` +
                `  - **Limite de Menções:** ${automodSettings.mentionLimit > 0 ? `<:meno:1289442211213086730> ${automodSettings.mentionLimit} menções` : '<:meno:1289442211213086730> 0'}\n` +
                `  - **Palavras-chave Bloqueadas:** ${automodSettings.blockedKeywords.length > 0 ? automodSettings.blockedKeywords.join(', ') : 'Nenhuma'}\n\n` +
                `-# <:channels_and_roles:1289442612088147980> Caso tenha dúvidas ou enfrente algum problema, sinta-se à vontade para entrar em nosso [servidor de suporte](http://dsc.gg/grovesuporte). Nossa equipe está à disposição para auxiliá-lo!`)
            await interaction.message.edit({ embeds: [embed] });
        }
    }

    const reply = async (content) => {
        return interaction.reply({ content, ephemeral: true });
    };

    if (interaction.customId === 'palavra-chave-modal') {
        const palavra = interaction.fields.getTextInputValue('palavra-chave-input');

        // Busca pela regra existente de palavras-chave
        const keywordRule = existingRules.find(rule => rule.triggerType === 1 && rule.triggerMetadata.keywordFilter);

        // Verifica se a palavra já foi adicionada no banco de dados
        if (automodSettings.blockedKeywords.includes(palavra)) {
            await updateEmbed();
            return reply(`> \`-\` <a:alerta:1163274838111162499> A palavra-chave **${palavra}** já está configurada.`);
        }

        // Verifica se o limite de palavras-chave foi atingido (usando o banco de dados e o limite de 6 palavras)
        if (automodSettings.blockedKeywords.length >= 6) {
            await updateEmbed();
            return reply(`> \`-\` <a:alerta:1163274838111162499> O limite de 6 palavras-chave foi atingido. Exclua uma palavra existente antes de adicionar uma nova.`);
        }

        if (keywordRule) {
            // Se a regra já existe, adiciona a nova palavra ao array de palavras existentes
            const currentKeywords = keywordRule.triggerMetadata.keywordFilter || [];

            // Atualiza a regra existente com a nova palavra, evitando duplicatas
            const updatedKeywords = [...new Set([...currentKeywords, palavra])];

            await guild.autoModerationRules.edit(keywordRule.id, {
                triggerMetadata: {
                    keywordFilter: updatedKeywords
                }
            });

            automodSettings.blockedKeywords.push(palavra); // Atualiza no banco de dados
            await automodSettings.save(); // Salva no banco de dados
            await updateEmbed(); // Atualiza o embed com as informações mais recentes
            return reply(`A palavra-chave **${palavra}** foi adicionada com sucesso.`);
        } else {
            // Se não existir regra de palavras-chave, cria uma nova
            await guild.autoModerationRules.create({
                name: `Grove AutoMod`,
                creatorId: client.user.id,
                enabled: true,
                eventType: 1,
                triggerType: 1,
                triggerMetadata: { keywordFilter: [palavra] }, // Inicializa com a palavra do usuário
                actions: [{
                    type: 1,
                    metadata: {
                        channel: interaction.channel,
                        durationSeconds: 10,
                        customMessage: `> \`-\` <a:alerta:1163274838111162499> O GroveAutoMod bloqueou esta mensagem por palavra-chave inapropriada.`
                    }
                }]
            });

            // Atualiza o banco de dados com a nova palavra
            automodSettings.blockedKeywords.push(palavra);
            await automodSettings.save();
            await updateEmbed();
            return reply(`A palavra-chave **${palavra}** foi adicionada com sucesso.`);
        }
    }


    if (interaction.customId === 'mencao-spam-modal') {
        const limite = parseInt(interaction.fields.getTextInputValue('mencao-spam-input'));
        const mentionRule = existingRules.find(rule => rule.triggerType === 5);

        if (mentionRule && mentionRule.triggerMetadata.mentionTotalLimit === limite) {
            await updateEmbed();
            return reply(`> \`-\` <a:alerta:1163274838111162499> Esta regra já está configurada com o limite de menções de **${limite}**.`);
        }

        if (mentionRule) {
            await mentionRule.edit({
                triggerMetadata: { mentionTotalLimit: limite }
            });
        } else {
            await guild.autoModerationRules.create({
                name: `Grove AutoMod`,
                creatorId: client.user.id,
                enabled: true,
                eventType: 1,
                triggerType: 5,
                triggerMetadata: { mentionTotalLimit: limite },
                actions: [{
                    type: 1,
                    metadata: {
                        channel: interaction.channel,
                        durationSeconds: 10,
                        customMessage: `> \`-\` <a:alerta:1163274838111162499> O GroveAutoMod bloqueou esta mensagem por excesso de menções.`
                    }
                }]
            });
        }

        automodSettings.mentionLimit = limite;
        await automodSettings.save();
        await updateEmbed();
        return reply(`O limite de menções foi atualizado para **${limite}**.`);
    }
};
