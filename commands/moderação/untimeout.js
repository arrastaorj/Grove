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
            return interaction.reply({ content: "> \`-\` <a:alerta:1163274838111162499> Você não tem permissão para remover timeout de membros.", ephemeral: true });
        }

        const user = interaction.options.getUser("user");
        const reason = interaction.options.getString("motivo") || "Sem motivo especificado";

        const member = interaction.guild.members.cache.get(user.id);

        // Verifica se o usuário está no servidor
        if (!member) {
            return interaction.reply({ content: "> \`-\` <a:alerta:1163274838111162499> Este usuário não está no servidor.", ephemeral: true });
        }

        // Verifica se o membro está em timeout
        if (!member.communicationDisabledUntil) {
            return interaction.reply({ content: "> \`-\` <a:alerta:1163274838111162499> Este usuário não está atualmente em timeout.", ephemeral: true });
        }

        // Removendo o timeout
        try {
            await member.timeout(null, reason); // Passar `null` remove o timeout

            // Cria o embed de confirmação da remoção do timeout
            const untimeoutEmbed = new EmbedBuilder()
                .setColor("#00ff00")
                .setTitle("✅ Timeout Removido!")
                .setDescription(`O timeout do usuário **${user.tag}** foi removido com sucesso.`)
                .addFields(
                    { name: "Motivo", value: `💬 ${reason}` },
                    { name: "Moderador", value: `👮‍♂️ ${interaction.user.tag}` }
                )
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setTimestamp();

            await interaction.reply({ embeds: [untimeoutEmbed] });

        } catch (error) {
            console.error(error);
            return interaction.reply({ content: "> \`-\` <a:alerta:1163274838111162499> Ocorreu um erro ao tentar remover o timeout deste usuário.", ephemeral: true });
        }
    }
}
