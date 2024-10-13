const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionsBitField
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Desbanir um usuário do servidor')
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("ID do usuário a ser desbanido")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("motivo")
                .setDescription("Motivo do desbanimento")
                .setRequired(true)
        ),


    async execute(interaction) {

          // Verifica se o autor tem a permissão de desbanir
          if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return interaction.reply({ content: "> \`-\` <:NA_Intr004:1289442144255213618> Você não tem permissão para desbanir membros.", ephemeral: true });
        }

        const userId = interaction.options.getString("user");
        const reason = interaction.options.getString("motivo")

        // Verifica se o ID é válido
        if (!userId || isNaN(userId)) {
            return interaction.reply({ content: "> \`-\` <:NA_Intr004:1289442144255213618> Forneça um ID de usuário válido.", ephemeral: true });
        }

        try {
            // Tenta buscar o banimento
            const banInfo = await interaction.guild.bans.fetch(userId);

            if (!banInfo) {
                return interaction.reply({ content: "> \`-\` <:NA_Intr004:1289442144255213618> Este usuário não está banido.", ephemeral: true });
            }

            // Desbanindo o usuário
            await interaction.guild.members.unban(userId, reason);

            // Cria o embed de confirmação do desbanimento
            const unbanEmbed = new EmbedBuilder()
                .setColor("#00ff00")
                .setTitle("🔓 Desbanimento Realizado!")
                .setDescription(`O usuário **${banInfo.user.tag}** foi desbanido com sucesso.`)
                .addFields(
                    { name: "Motivo", value: `💬 ${reason}` },
                    { name: "Moderador", value: `👮‍♂️ ${interaction.user.tag}` }
                )
                .setThumbnail(banInfo.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp();

            await interaction.reply({ embeds: [unbanEmbed] });

        
        } catch (error) {
          
            return interaction.reply({ content: "> \`-\` <:NA_Intr004:1289442144255213618> Ocorreu um erro ao tentar desbanir este usuário. Verifique se o ID está correto ou o usuário ja foi desbanido.", ephemeral: true });
        }

    }
}
