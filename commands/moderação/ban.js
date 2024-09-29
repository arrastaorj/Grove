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
            return interaction.reply({ content: "> \`-\` <a:alerta:1163274838111162499> Você não tem permissão para banir membros.", ephemeral: true });
        }

        const user = interaction.options.getUser("user");
        const reason = interaction.options.getString("motivo") || "Sem motivo especificado";

        const member = interaction.guild.members.cache.get(user.id);

        // Verifica se o usuário está no servidor
        if (!member) {
            return interaction.reply({ content: "> \`-\` <a:alerta:1163274838111162499> Este usuário não está no servidor.", ephemeral: true });
        }

        // Verifica se o membro pode ser banido (não pode banir administradores)
        if (!member.bannable) {
            return interaction.reply({ content: "> \`-\` <a:alerta:1163274838111162499> Eu não posso banir este usuário.", ephemeral: true });
        }

        // Banindo o membro
        try {
            await member.ban({ reason });

            // Cria o embed de confirmação do banimento
            const banEmbed = new EmbedBuilder()
                .setColor("#ff0000")
                .setTitle("🔨 Banimento Realizado!")
                .setDescription(`O usuário **${user.tag}** foi banido com sucesso.`)
                .addFields(
                    { name: "Motivo", value: `💬 ${reason}` },
                    { name: "Moderador", value: `👮‍♂️ ${interaction.user.tag}` }
                )
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setTimestamp();

            await interaction.reply({ embeds: [banEmbed], ephemral: true });

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: "> \`-\` <a:alerta:1163274838111162499> Ocorreu um erro ao tentar banir este usuário.", ephemeral: true });
        }
    }
}
