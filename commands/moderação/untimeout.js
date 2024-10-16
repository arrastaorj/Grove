const {
    SlashCommandBuilder,
    PermissionsBitField,
    EmbedBuilder
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('untimeout')
        .setDescription('Remover o timeout de um usuário')
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("O usuário que será removido do timeout")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("motivo")
                .setDescription("Motivo do mute")
                .setRequired(true)
        ),


    async execute(interaction) {

        // Verifica se o autor tem a permissão de moderar membros
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return interaction.reply({ content: "> \`-\` <:NA_Intr004:1289442144255213618> Você não tem permissão para remover timeout de membros.", ephemeral: true });
        }

        const user = interaction.options.getUser("user");
        const reason = interaction.options.getString("motivo") || "Sem motivo especificado";

        const member = interaction.guild.members.cache.get(user.id);

        // Verifica se o usuário está no servidor
        if (!member) {
            return interaction.reply({ content: "> \`-\` <:NA_Intr004:1289442144255213618> Este usuário não está no servidor.", ephemeral: true });
        }

        // Verifica se o membro está em timeout
        if (!member.communicationDisabledUntil) {
            return interaction.reply({ content: "> \`-\` <:NA_Intr004:1289442144255213618> Este usuário não está atualmente em timeout.", ephemeral: true });
        }

        // Removendo o timeout
        try {
            await member.timeout(null, reason); // Passar `null` remove o timeout

            // Cria o embed de confirmação da remoção do timeout
            const untimeoutEmbed = new EmbedBuilder()
                .setColor("#00ff00")
                .setDescription(`* <:1078434426368839750:1290114335909085257> O timeout do usuário **${user.tag}** foi removido com sucesso.\n` +
                    `* <:settings:1289442654806999040> **Informações sobre o timeout:**\n` +
                    `  - **Motivo:** <:edit1:1293726236505542788> ${reason}\n` +
                    `  - **Moderador:** <:member_white:1289442908298023003> ${interaction.user.tag}\n\n` +
                    `-# <:info:1290116635814002749> Caso tenha dúvidas ou enfrente algum problema, sinta-se à vontade para entrar em nosso [servidor de suporte](http://dsc.gg/grovesuporte). Nossa equipe está à disposição para auxiliá-lo!`
                )
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setTimestamp()

            await interaction.reply({ embeds: [untimeoutEmbed] });

        } catch (error) {
            console.error(error);
            return interaction.reply({ content: "> \`-\` <:NA_Intr004:1289442144255213618> Ocorreu um erro ao tentar remover o timeout deste usuário.", ephemeral: true });
        }
    }
}
