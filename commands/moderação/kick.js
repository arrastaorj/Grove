const {
    SlashCommandBuilder,
    PermissionsBitField,
    EmbedBuilder
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Expulsar um usuário do servidor')
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("O usuário a ser expulso")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("motivo")
                .setDescription("Motivo da expulsão")
                .setRequired(true)
        ),


    async execute(interaction) {

        // Verifica se o autor tem a permissão de expulsar
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return interaction.reply({ content: "> \`-\` <:NA_Intr004:1289442144255213618> Você não tem permissão para expulsar membros.", ephemeral: true });
        }

        const user = interaction.options.getUser("user");
        const reason = interaction.options.getString("motivo")

        const member = interaction.guild.members.cache.get(user.id);

        // Verifica se o usuário está no servidor
        if (!member) {
            return interaction.reply({ content: "> \`-\` <:NA_Intr004:1289442144255213618> Este usuário não está no servidor.", ephemeral: true });
        }

        // Verifica se o membro pode ser expulso (não pode expulsar administradores)
        if (!member.kickable) {
            return interaction.reply({ content: "> \`-\` <:NA_Intr004:1289442144255213618> Eu não posso expulsar este usuário.", ephemeral: true });
        }

        // Expulsando o membro
        try {
            await member.kick(reason);

            // Cria o embed de confirmação da expulsão
            const kickEmbed = new EmbedBuilder()
                .setColor("#ffa500")
                .setDescription(
                    `* <:1078434426368839750:1290114335909085257> O usuário **${user.tag}** foi expulso com sucesso.\n` +
                    `  - O Kick permite que os administradores removam temporariamente usuários que estão causando distúrbios no servidor, mantendo a ordem e o respeito entre os membros.\n\n` +
                    `* <:settings:1289442654806999040> **Informações sobre o kick:**\n` +
                    `  - **Motivo:** <:edit1:1293726236505542788> ${reason}\n` +
                    `  - **Moderador:** <:member_white:1289442908298023003> ${interaction.user.tag}\n\n` +
                    `-# <:info:1290116635814002749> Caso tenha dúvidas ou enfrente algum problema, sinta-se à vontade para entrar em nosso [servidor de suporte](http://dsc.gg/grovesuporte). Nossa equipe está à disposição para auxiliá-lo!`
                )
                .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                .setFooter({ text: 'Sistema de Kick', iconURL: interaction.member.displayAvatarURL({ dynamic: true }) })
                .setTimestamp();

            await interaction.reply({ embeds: [kickEmbed] });


        } catch (error) {
            console.error(error);
            await interaction.reply({ content: "> \`-\` <:NA_Intr004:1289442144255213618> Ocorreu um erro ao tentar expulsar este usuário.", ephemeral: true });
        }

    }
}
