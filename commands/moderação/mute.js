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
        ),


    async execute(interaction) {

        // Verifica se o autor tem a permissão de mutar membros
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return interaction.reply({ content: "> \`-\` <:NA_Intr004:1289442144255213618> Você não tem permissão para mutar membros.", ephemeral: true });
        }

        const user = interaction.options.getUser("user");
        const reason = interaction.options.getString("motivo")

        const member = interaction.guild.members.cache.get(user.id);

        // Verifica se o usuário está no servidor
        if (!member) {
            return interaction.reply({ content: "> \`-\` <:NA_Intr004:1289442144255213618> Este usuário não está no servidor.", ephemeral: true });
        }

        // Verifica se o membro já está mutado
        const muteRole = interaction.guild.roles.cache.find(role => role.name.toLowerCase() === "mutado");
        if (!muteRole) {
            return interaction.reply({ content: "> \`-\` <:NA_Intr004:1289442144255213618> O cargo de 'mutado' não foi encontrado. Por favor, crie um cargo 'mutado' e configure as permissões.", ephemeral: true });
        }

        if (member.roles.cache.has(muteRole.id)) {
            return interaction.reply({ content: "> \`-\` <:NA_Intr004:1289442144255213618> Este usuário já está mutado.", ephemeral: true });
        }

        // Adicionando o cargo de mute ao usuário
        try {
            await member.roles.add(muteRole, reason);

            // Cria o embed de confirmação do mute
            const muteEmbed = new EmbedBuilder()
                .setColor("#ff0000")
                .setTitle("🔇 Usuário Mutado!")
                .setDescription(`O usuário **${user.tag}** foi mutado.`)
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
