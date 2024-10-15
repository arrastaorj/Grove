const {
    SlashCommandBuilder,
    PermissionsBitField,
    EmbedBuilder
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mutar um usuário no servidor')
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("O usuário a ser mutado")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("motivo")
                .setDescription("Motivo do mute")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName("duração")
                .setDescription("Duração do mute em minutos")
                .setRequired(true)
        ),

    async execute(interaction) {

        // Verifica se o autor tem a permissão de moderar membros
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return interaction.reply({ content: "> \`-\` <:NA_Intr004:1289442144255213618> Você não tem permissão para mutar membros.", ephemeral: true });
        }

        const user = interaction.options.getUser("user");
        const reason = interaction.options.getString("motivo");
        const duration = interaction.options.getInteger("duração");

        const member = interaction.guild.members.cache.get(user.id);
        const botMember = interaction.guild.members.cache.get(interaction.client.user.id); // Pega o próprio bot

        // Verifica se o usuário está no servidor
        if (!member) {
            return interaction.reply({ content: "> \`-\` <:NA_Intr004:1289442144255213618> Este usuário não está no servidor.", ephemeral: true });
        }

        // Verifica se o cargo do bot é maior que o cargo do membro
        if (botMember.roles.highest.position <= member.roles.highest.position) {
            return interaction.reply({ content: "> \`-\` <:NA_Intr004:1289442144255213618> Eu não posso mutar este usuário porque o cargo dele é igual ou superior ao meu.", ephemeral: true });
        }

        // Verifica se o membro já está em timeout
        if (member.communicationDisabledUntilTimestamp) {
            return interaction.reply({ content: "> \`-\` <:NA_Intr004:1289442144255213618> Este usuário já está mutado.", ephemeral: true });
        }

        try {
            // Adiciona o timeout ao usuário
            const muteDurationMs = duration * 60 * 1000; // Converte a duração para milissegundos
            await member.timeout(muteDurationMs, reason);

            // Cria o embed de confirmação do mute
            const muteEmbed = new EmbedBuilder()
                .setColor("#ff0000")
                .setTitle("🔇 Usuário Mutado!")
                .setDescription(`O usuário **${user.tag}** foi mutado por ${duration} minutos.`)
                .addFields(
                    { name: "Motivo", value: `💬 ${reason}` },
                    { name: "Moderador", value: `👮‍♂️ ${interaction.user.tag}` }
                )
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setTimestamp();

            await interaction.reply({ embeds: [muteEmbed] });

        } catch (error) {
            console.error(error);
            return interaction.reply({ content: "> \`-\` <:NA_Intr004:1289442144255213618> Ocorreu um erro ao tentar mutar este usuário.", ephemeral: true });
        }

    }
}
