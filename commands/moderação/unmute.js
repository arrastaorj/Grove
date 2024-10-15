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
                .setTitle("🔊 Usuário Desmutado!")
                .setDescription(`O usuário **${user.tag}** foi desmutado com sucesso.`)
                .addFields(
                    { name: "Motivo", value: `💬 ${reason}` },
                    { name: "Moderador", value: `👮‍♂️ ${interaction.user.tag}` }
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
