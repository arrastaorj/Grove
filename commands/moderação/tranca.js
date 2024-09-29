const {
    SlashCommandBuilder,
    PermissionFlagsBits,

} = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trancar')
        .setDescription('Trancar esse canal de texto.'),

    async execute(interaction) {

        // Verificação para somente quem tiver permissão usar o comando
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({
                content: `> \`-\` <a:alerta:1163274838111162499> Não posso concluir este comando pois você não possui permissão.`,
                ephemeral: true
            });
        }

        // Verificação se o canal já está trancado
        const channelPermissions = interaction.channel.permissionOverwrites.cache.get(interaction.guild.id);
        if (channelPermissions && !channelPermissions.allow.has('SendMessages')) {

            return interaction.reply({ content: `> \`-\` <a:alerta:1163274838111162499> O canal **${interaction.channel.name}** já está trancado.`, ephemeral: true });
        }


        // Responder primeiro para evitar erro
        await interaction.reply({
            content: `> \`+\` Acabei de trancar o canal de texto como você pediu.`,
            ephemeral: true
        })

        // Trancar o canal
        await interaction.channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: false });

    }
}
