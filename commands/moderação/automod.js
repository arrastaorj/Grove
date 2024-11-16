const {
    SlashCommandBuilder,
    PermissionsBitField,
    PermissionFlagsBits,
    StringSelectMenuBuilder,
    ActionRowBuilder,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js')

const automodConfig = require("../../database/models/automod.js")
const client = require("../../index.js")
const collectors = new Map(); // Armazenar coletores ativos

module.exports = {
    data: new SlashCommandBuilder()
        .setName('automod')
        .setDescription('Configurar sistema automod'),

    async execute(interaction) {

        const { guild } = interaction;

        const userId = interaction.user.id;


        // Verificar se já existe um coletor ativo para o usuário
        if (collectors.has(userId)) {
            const { timeout, startTime } = collectors.get(userId);
            const timeElapsed = Date.now() - startTime;
            const timeRemaining = timeout - timeElapsed;

            // Convertendo o tempo restante para segundos
            const secondsRemaining = Math.ceil(timeRemaining / 1000);

            // Função para formatar o tempo em horas, minutos e segundos
            function formatTime(seconds) {
                const hours = Math.floor(seconds / 3600);
                const minutes = Math.floor((seconds % 3600) / 60);
                const secondsLeft = seconds % 60;

                let result = '';
                if (hours > 0) result += `${hours} hora${hours > 1 ? 's' : ''}, `;
                if (minutes > 0) result += `${minutes} minuto${minutes > 1 ? 's' : ''}, `;
                result += `${secondsLeft} segundo${secondsLeft > 1 ? 's' : ''}`;

                return result;
            }

            // Formatando o tempo restante
            const formattedTime = formatTime(secondsRemaining);

            return interaction.reply({
                content: `\`-\` <:NA_Intr004:1289442144255213618> Você já iniciou uma solicitação com o sistema de AutoMod. Aguarde ${formattedTime} antes de tentar novamente.`,
                ephemeral: true
            });
        }


        // Verificação de permissões
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return await interaction.reply({
                content: `> \`-\` <:NA_Intr004:1289442144255213618> Não posso concluir este comando pois você não possui permissão.`,
                ephemeral: true
            });
        }

        const botMember = interaction.guild.members.cache.get(client.user.id);
        if (!botMember.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({ content: `> \`-\` <:NA_Intr004:1289442144255213618> Não posso concluir o comandos pois ainda não recebir permissão para gerenciar este servidor (Administrador)`, ephemeral: true });
        }


        // Função auxiliar para obter ou criar configurações de AutoMod
        const getOrCreateAutoModSettings = async (guildId) => {
            let automodSettings = await automodConfig.findOne({ guildId });
            if (!automodSettings) {
                automodSettings = new automodConfig({
                    guildId,
                    keywordBlockEnabled: false,
                    messageSpamBlockEnabled: false,
                    mentionLimit: 0,
                    blockedKeywords: []
                });
                await automodSettings.save();
            }
            return automodSettings;
        };

        // Função para atualizar embed com base nas configurações de AutoMod
        const updateEmbed = (automodSettings, embed) => {
            const keywordStatus = automodSettings.keywordBlockEnabled ? '<:8047onlinegray:1289442869060440109> Ativado' : '<:red_dot:1289442683705888929> Desativado';
            const spamStatus = automodSettings.messageSpamBlockEnabled ? '<:8047onlinegray:1289442869060440109> Ativado' : '<:red_dot:1289442683705888929> Desativado';

            embed.setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })

            embed.setDescription(
                `* <:shop_white:1289442593452724244> **Bem-vindo(a) ao Sistema AutoMod - Proteção Inteligente para o Seu Servidor**\n` +
                `  - O AutoMod é uma solução avançada de moderação automática que garante a segurança e integridade do seu servidor.\n\n` +
                `* <:settings:1289442654806999040> **Informações sobre o sistema:**\n` +
                `  - **Palavras Ofensivas:** ${keywordStatus}\n` +
                `  - **Spam de Mensagens:** ${spamStatus}\n` +
                `  - **Limite de Menções:** ${automodSettings.mentionLimit > 0 ? `<:meno:1289442211213086730> ${automodSettings.mentionLimit} menções` : '<:meno:1289442211213086730> 0'}\n` +
                `  - **Palavras-chave Bloqueadas:** ${automodSettings.blockedKeywords.length > 0 ? `<:bloquea:1285256594011193457> ${automodSettings.blockedKeywords.join(', ')}` : `<:bloquea:1285256594011193457> Nenhuma`}\n\n` +
                `-# <:info:1290116635814002749> Caso tenha dúvidas ou enfrente algum problema, sinta-se à vontade para entrar em nosso [servidor de suporte](http://dsc.gg/grovesuporte). Nossa equipe está à disposição para auxiliá-lo!`
            );
        };

        // Busca as regras de AutoMod diretamente do Discord e atualiza o banco de dados
        const existingRules = await guild.autoModerationRules.fetch();
        let automodSettings = await getOrCreateAutoModSettings(guild.id);

        // Atualiza as configurações do banco de dados com base nas regras do Discord
        const offensiveRule = existingRules.find(rule => rule.triggerMetadata.presets && rule.triggerMetadata.presets.includes(1));
        const spamRule = existingRules.find(rule => rule.triggerType === 3);
        const mentionRule = existingRules.find(rule => rule.triggerType === 5);
        const keywordRule = existingRules.find(rule => rule.triggerType === 1 && rule.triggerMetadata.keywordFilter);

        automodSettings.keywordBlockEnabled = !!offensiveRule;
        automodSettings.messageSpamBlockEnabled = !!spamRule;
        automodSettings.mentionLimit = mentionRule?.triggerMetadata.mentionTotalLimit || 0;
        automodSettings.blockedKeywords = keywordRule?.triggerMetadata.keywordFilter || [];

        await automodSettings.save(); // Salva as atualizações no banco de dados

        // Criação do Embed
        const embed = new EmbedBuilder()
            .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
            .setColor('#ba68c8')
            .setFooter({ text: `O AutoMod oferece proteção eficaz para o seu servidor.`, iconURL: interaction.member.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();

        // Atualiza o Embed com as novas configurações
        updateEmbed(automodSettings, embed);

        // Função para recriar o menu
        const createMenu = () => {
            const menu = new StringSelectMenuBuilder()
                .setCustomId('automod-select')
                .setPlaceholder('Selecione uma opção de AutoMod')
                .addOptions([
                    { label: 'Bloquear Ofensivas', description: 'Bloqueie palavrões e calúnias', value: 'ofensivas', emoji: '<:ofencivas:1289426926489964626>' },
                    { label: 'Bloquear Spam de Mensagens', description: 'Bloqueie spam', value: 'spam-mensagens', emoji: '<:spwam:1289426913844006955>' },
                    { label: 'Limite de Menções', description: 'Defina limite de menções para bloquear mensagens', value: 'menção-spam', emoji: '<:meno:1289442211213086730>' },
                    { label: 'Bloquear Palavra-Chave', description: 'Bloqueie uma palavra específica', value: 'palavra-chave', emoji: '<:palavrachave:1289426939513409609>' },
                    { label: 'Redefinir Configurações', description: 'Redefina todas as configurações de AutoMod', value: 'reset-config', emoji: '<:NA_Intr004:1289437673261629480>' }
                ]);
            return new ActionRowBuilder().addComponents(menu);
        };

        // Função para enviar o menu
        const sendMenu = async () => {
            await interaction.editReply({
                embeds: [embed],
                components: [createMenu()]
            });
        };

        // Envia o menu interativo
        await interaction.reply({
            embeds: [embed],
            components: [createMenu()]
        });

        const timeoutDuration = 240000; // 4 minutos
        const startTime = Date.now(); // Marca o momento em que o coletor foi iniciado

        // Coletor para respostas do menu suspenso
        const filter = i => i.customId === 'automod-select' && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: timeoutDuration });

        // Armazenar o coletor no Map com o tempo de início e duração
        collectors.set(userId, { collector, timeout: timeoutDuration, startTime });

        collector.on('collect', async i => {
            const selectedOption = i.values[0];

            if (selectedOption === 'ofensivas') {

                automodSettings = await getOrCreateAutoModSettings(guild.id);

                if (automodSettings.keywordBlockEnabled) {
                    await i.reply({ content: '> \`-\` <:NA_Intr004:1289442144255213618> A regra de AutoMod para **bloquear palavras ofensivas** já está ativada.', ephemeral: true });
                } else {
                    const existingRules = await guild.autoModerationRules.fetch();
                    const offensiveWordsRule = existingRules.find(rule => rule.triggerType === 4);

                    if (offensiveWordsRule) {
                        await i.reply({ content: '> \`-\` <:NA_Intr004:1289442144255213618> Já existe uma regra de bloqueio de palavras ofensivas configurada.', ephemeral: true });
                    } else {
                        automodSettings.keywordBlockEnabled = true;
                        await automodSettings.save();

                        await guild.autoModerationRules.create({
                            name: `Grove AutoMod`,
                            creatorId: client.user.id,
                            enabled: true,
                            eventType: 1,
                            triggerType: 4,
                            triggerMetadata: { presets: [1, 2, 3] },
                            actions: [{
                                type: 1,
                                metadata: {
                                    channel: interaction.channel,
                                    durationSeconds: 10,
                                    customMessage: `> \`-\` O GroveAutoMod identificou esta mensagem como inadequada e a bloqueou.`
                                }
                            }]
                        });

                        await i.reply({ content: '<:1078434426368839750:1290114335909085257> A regra **bloquear palavras ofensivas** foi configurada com sucesso!', ephemeral: true });
                    }
                }
                updateEmbed(automodSettings, embed);
                sendMenu();
            }


            if (selectedOption === 'spam-mensagens') {

                automodSettings = await getOrCreateAutoModSettings(guild.id);

                if (automodSettings.messageSpamBlockEnabled) {
                    await i.reply({ content: '> \`-\` <:NA_Intr004:1289442144255213618> Informamos que a regra de AutoMod para bloqueio de spam de mensagens já está ativada.', ephemeral: true });
                } else {
                    const existingRules = await guild.autoModerationRules.fetch();
                    const spamRule = existingRules.find(rule => rule.triggerType === 3);

                    if (spamRule) {
                        await i.reply({ content: '> \`-\` <:NA_Intr004:1289442144255213618> Já existe uma regra de bloqueio de spam de mensagens configurada em seu servidor.', ephemeral: true });
                    } else {
                        automodSettings.messageSpamBlockEnabled = true;
                        await automodSettings.save();

                        await guild.autoModerationRules.create({
                            name: `Grove AutoMod`,
                            creatorId: client.user.id,
                            enabled: true,
                            eventType: 1,
                            triggerType: 3,
                            triggerMetadata: {},
                            actions: [
                                {
                                    type: 1,
                                    metadata: {
                                        channel: interaction.channel,
                                        durationSeconds: 10,
                                        customMessage: `> \`-\` <:NA_Intr004:1289442144255213618> O GroveAutoMod identificou esta mensagem como inadequada e a bloqueou.`
                                    }
                                }
                            ]
                        });

                        await i.reply({ content: `<:1078434426368839750:1290114335909085257> A regra **bloqueio de spam de mensagens** foi configurada com sucesso!`, ephemeral: true });
                    }
                }
                updateEmbed(automodSettings, embed);
                sendMenu();
            }


            if (selectedOption === 'menção-spam') {
                // Código para capturar o limite de menções via Modal
                const mencaoModal = new ModalBuilder()
                    .setCustomId('mencao-spam-modal')
                    .setTitle('Definir Limite de Menções')
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('mencao-spam-input')
                                .setLabel('Digite o limite de menções permitidas:')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                        )
                    );

                await i.showModal(mencaoModal);
                sendMenu();
            }

            if (selectedOption === 'palavra-chave') {
                const palavraModal = new ModalBuilder()
                    .setCustomId('palavra-chave-modal')
                    .setTitle('Bloquear Palavra-Chave')
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('palavra-chave-input')
                                .setLabel('Digite a palavra que deseja bloquear:')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                        )
                    );

                await i.showModal(palavraModal);
                sendMenu();

            }

            if (selectedOption === 'reset-config') {

                // Redefinir configurações no banco de dados
                await automodConfig.deleteOne({ guildId: guild.id }); // Excluir configuração do banco de dados

                // Excluir regras de AutoMod no Discord
                const existingRulesToDelete = await guild.autoModerationRules.fetch();
                const deletionPromises = []; // Armazenar promessas de exclusão
                let mentionRuleExists = false; // Variável para verificar se a regra de limite de menções existe

                for (const rule of existingRulesToDelete.values()) {
                    // Evitar excluir regras de limite de menções (triggerType 5)
                    if (rule.triggerType !== 5) {
                        deletionPromises.push(rule.delete()); // Adiciona a promessa de exclusão
                    } else {
                        mentionRuleExists = true; // Marcar que a regra de limite de menções existe

                    }
                }

                // Aguardar todas as promessas de exclusão serem resolvidas
                await Promise.all(deletionPromises);

                // Resposta ao usuário
                let replyMessage = `Todas as **configurações de AutoMod** foram redefinidas com sucesso!`;

                if (mentionRuleExists) {
                    replyMessage += `\n\nA regra de **limite de menções** não pode ser excluída, pois ela é obrigatória em servidores da comunidade.`;
                }

                let mentionLimit = 0; // Inicializa com 0, mas será atualizado se a regra existir

                // Verifica se a regra de limite de menções existe e obtém o valor
                const mentionRule = existingRules.find(rule => rule.triggerType === 5);
                if (mentionRule && mentionRule.triggerMetadata.mentionTotalLimit) {
                    mentionLimit = mentionRule.triggerMetadata.mentionTotalLimit; // Pega o limite atual
                }


                // Recriar as configurações padrão no banco de dados
                const newAutomodSettings = new automodConfig({
                    guildId: guild.id,
                    keywordBlockEnabled: false,
                    messageSpamBlockEnabled: false,
                    mentionLimit: mentionLimit, // Usa o valor atual ou 0 se não houver
                    blockedKeywords: []
                });
                await newAutomodSettings.save();

                // Atualiza o embed
                updateEmbed(newAutomodSettings, embed);
                sendMenu();
                await i.reply({ content: replyMessage, ephemeral: true });
            }
        })

        collector.on('end', async (collected, reason) => {
            const originalMessage = await interaction.fetchReply().catch(() => null);

            if (!originalMessage) {
                return collectors.delete(userId)
            }

            if (reason === 'time') {
                await interaction.editReply({
                    components: []
                });
            } else {
                await interaction.editReply({
                    components: []
                });
            }

            collectors.delete(userId)
        })

    }
}