const { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    ActionRowBuilder, 
    ButtonStyle, 
    ButtonBuilder, 
    EmbedBuilder 
} = require('discord.js');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('Painel para gerenciar o SlowMode do chat.'),
   

    async execute(interaction) {
        // Verifica se o usuário tem permissão para gerenciar canais
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({
                content: `> \`-\` <a:alerta:1163274838111162499> Você não tem permissão para usar este comando.`,
                ephemeral: true,
            });
        }

        const channel = interaction.channel;

        // Configura os botões dependendo do estado do slowmode no canal
        const slowmodeActive = channel.rateLimitPerUser > 0;

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ativar')
                    .setLabel('Ativar')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(slowmodeActive),
                new ButtonBuilder()
                    .setCustomId('desativar')
                    .setLabel('Desativar')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(!slowmodeActive)
            );

        // Embed para exibição no painel
        const embed = new EmbedBuilder()
            .setTitle('Painel de Configuração de SlowMode')
            .setDescription('Personalize o modo lento do chat ajustando o tempo de espera entre mensagens.')
            .addFields({ name: 'Configurações Disponíveis', value: 'Ajuste o tempo de espera entre mensagens.' })
            .setFooter({ 
                iconURL: interaction.user.displayAvatarURL({ extension: 'png' }), 
                text: `Solicitado por ${interaction.user.username}` 
            })
            .setThumbnail(interaction.guild.iconURL({ extension: 'png' }))
            .setTimestamp()
            .setColor('#41b2b0');

    
        // Responde à interação
        return interaction.reply({
            embeds: [embed],
            components: [buttons],
            
        });
    }
};
