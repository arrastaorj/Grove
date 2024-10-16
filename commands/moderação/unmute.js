const {
    SlashCommandBuilder,
    PermissionsBitField,
    EmbedBuilder
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Remover o mute de um usuário')
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("O usuário a ser desmutado")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("motivo")
                .setDescription("Motivo para remover o mute")
                .setRequired(true)
        ),

    async execute(interaction) {

        // Verifica se o autor tem a permissão de moderar membros
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return interaction.reply({ content: "> \`-\` <:NA_Intr004:1289442144255213618> Você não tem permissão para desmutar membros.", ephemeral: true });
        }

        const user = interaction.options.getUser("user");
        const reason = interaction.options.getString("motivo");

        const member = interaction.guild.members.cache.get(user.id);
        const botMember = interaction.guild.members.cache.get(interaction.client.user.id); // Pega o próprio bot

        // Verifica se o usuário está no servidor
        if (!member) {
            return interaction.reply({ content: "> \`-\` <:NA_Intr004:1289442144255213618> Este usuário não está no servidor.", ephemeral: true });
        }

        // Verifica se o cargo do bot é maior que o cargo do membro
        if (botMember.roles.highest.position <= member.roles.highest.position) {
            return interaction.reply({ content: "> \`-\` <:NA_Intr004:1289442144255213618> Eu não posso desmutar este usuário porque o cargo dele é igual ou superior ao meu.", ephemeral: true });
        }

        // Verifica se o membro está realmente mutado (em timeout)
        if (!member.communicationDisabledUntilTimestamp) {
            return interaction.reply({ content: "> \`-\` <:NA_Intr004:1289442144255213618> Este usuário não está mutado.", ephemeral: true });
        }

        try {
            // Remove o timeout (desmute)
            await member.timeout(null, reason); // Passar `null` remove o timeout

            // Cria o embed de confirmação da remoção do mute
            const unmuteEmbed = new EmbedBuilder()
                .setColor("#00ff00")
                .setDescription(`* <:1078434426368839750:1290114335909085257> O usuário **${user.tag}** foi desmutado com sucesso.\n` +
                    `* <:settings:1289442654806999040> **Informações sobre o mute:**\n` +
                    `  - **Motivo:** <:edit1:1293726236505542788> ${reason}\n` +
                    `  - **Moderador:** <:member_white:1289442908298023003> ${interaction.user.tag}\n\n` +
                    `-# <:info:1290116635814002749> Caso tenha dúvidas ou enfrente algum problema, sinta-se à vontade para entrar em nosso [servidor de suporte](http://dsc.gg/grovesuporte). Nossa equipe está à disposição para auxiliá-lo!`
                )
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setTimestamp();

            await interaction.reply({ embeds: [unmuteEmbed] });

        } catch (error) {
            console.error(error);
            return interaction.reply({ content: "> \`-\` <:NA_Intr004:1289442144255213618> Ocorreu um erro ao tentar desmutar este usuário.", ephemeral: true });
        }

    }
};
