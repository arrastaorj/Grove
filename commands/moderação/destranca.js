const {
    SlashCommandBuilder,
    PermissionFlagsBits,
} = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('destrancar')
        .setDescription('Destrancar esse canal de texto.'),

    async execute(interaction) {



        // Verificação para garantir que apenas quem tem permissão possa usar o comando
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({
                content: `> \`-\` <:NA_Intr004:1289442144255213618> Não posso concluir este comando pois você não possui permissão.`,
                ephemeral: true
            });
        }

        // Verificação se o canal já está destrancado
        const channelPermissions = interaction.channel.permissionOverwrites.cache.get(interaction.guild.id);
        if (channelPermissions && channelPermissions.allow.has('SendMessages')) {

            return interaction.reply({ content: `> \`-\` <:NA_Intr004:1289442144255213618> O canal <#${interaction.channel.id}> já está destrancado. `, ephemeral: true });
        }


        // Responder primeiro para evitar o erro
        await interaction.reply({
            content: `> \`+\` Acabei de <:Ouvert:1292499630927515668> destrancar o canal de texto como você pediu.`,
            ephemeral: true
        });

        // Destrancar o canal
        await interaction.channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: true });


    }
}
