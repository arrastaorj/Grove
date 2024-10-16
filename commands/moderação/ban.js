const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionsBitField
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Banir um usuário do servidor.')
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("O usuário a ser banido")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("motivo")
                .setDescription("Motivo do banimento")
                .setRequired(true)
        ),


    async execute(interaction) {

        // Verifica se o autor tem a permissão de banir
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return interaction.reply({ content: "> \`-\` <:NA_Intr004:1289442144255213618> Você não tem permissão para banir membros.", ephemeral: true });
        }

        const user = interaction.options.getUser("user");
        const reason = interaction.options.getString("motivo") || "Sem motivo especificado";

        const member = interaction.guild.members.cache.get(user.id);

        // Verifica se o usuário está no servidor
        if (!member) {
            return interaction.reply({ content: "> \`-\` <:NA_Intr004:1289442144255213618> Este usuário não está no servidor.", ephemeral: true });
        }

        // Verifica se o membro pode ser banido (não pode banir administradores)
        if (!member.bannable) {
            return interaction.reply({ content: "> \`-\` <:NA_Intr004:1289442144255213618> Eu não posso banir este usuário.", ephemeral: true });
        }

        // Banindo o membro
        try {
            await member.ban({ reason });

            // Cria o embed de confirmação do banimento
            const banEmbed = new EmbedBuilder()
                .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                .setFooter({ text: 'Sistema de Banimento', iconURL: interaction.member.displayAvatarURL({ dynamic: true }) })

                .setColor("#ff0000")
                .setDescription(
                    `* <:1078434426368839750:1290114335909085257> O usuário **${user.tag}** foi banido com sucesso.\n` +
                    `  - O Ban é uma medida de moderação rigorosa que remove permanentemente usuários problemáticos do seu servidor, garantindo um ambiente mais seguro e controlado.\n\n` +
                    `* <:settings:1289442654806999040> **Informações sobre o ban:**\n` +
                    `  - **Motivo:** <:edit1:1293726236505542788> ${reason}\n` +
                    `  - **Moderador:** <:member_white:1289442908298023003> ${interaction.user.tag}\n\n` +
                    `-# <:info:1290116635814002749> Caso tenha dúvidas ou enfrente algum problema, sinta-se à vontade para entrar em nosso [servidor de suporte](http://dsc.gg/grovesuporte). Nossa equipe está à disposição para auxiliá-lo!`
                )
                .setTimestamp()

            await interaction.reply({ embeds: [banEmbed], ephemral: true });

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: "> \`-\` <:NA_Intr004:1289442144255213618> Ocorreu um erro ao tentar banir este usuário.", ephemeral: true });
        }
    }
}
