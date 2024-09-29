const {
    SlashCommandBuilder,
    PermissionsBitField,
    EmbedBuilder
} = require('discord.js');

const ms = require("ms")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Aplicar um timeout (silenciamento temporário) a um usuário')
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("O usuário a ser silenciado")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("tempo")
                .setDescription("Duração do timeout (exemplo: 10m, 1h, 1d)")
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
            return interaction.reply({ content: "> \`-\` <a:alerta:1163274838111162499> Você não tem permissão para aplicar timeout em membros.", ephemeral: true });
        }

        const user = interaction.options.getUser("user");
        const duration = interaction.options.getString("tempo");
        const reason = interaction.options.getString("motivo")
        const member = interaction.guild.members.cache.get(user.id);

        // Verifica se o usuário está no servidor
        if (!member) {
            return interaction.reply({ content: "> \`-\` <a:alerta:1163274838111162499> Este usuário não está no servidor.", ephemeral: true });
        }

        // Verifica se o membro pode ser silenciado (não pode aplicar timeout a administradores)
        if (!member.moderatable) {
            return interaction.reply({ content: "> \`-\` <a:alerta:1163274838111162499> Eu não posso aplicar timeout neste usuário.", ephemeral: true });
        }

        // Converte o tempo para milissegundos
        const timeInMs = ms(duration);
        if (!timeInMs || timeInMs < 10000 || timeInMs > 2419200000) { // Entre 10 segundos e 28 dias
            return interaction.reply({ content: "> \`-\` <a:alerta:1163274838111162499> O tempo de timeout deve ser entre 10 segundos e 28 dias.", ephemeral: true });
        }

        // Aplicando o timeout
        try {
            await member.timeout(timeInMs, reason);

            // Cria o embed de confirmação do timeout
            const timeoutEmbed = new EmbedBuilder()
                .setColor("#ff9900")
                .setTitle("⏳ Timeout Aplicado!")
                .setDescription(`O usuário **${user.tag}** foi silenciado por **${duration}**.`)
                .addFields(
                    { name: "Motivo", value: `💬 ${reason}` },
                    { name: "Moderador", value: `👮‍♂️ ${interaction.user.tag}` }
                )
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setTimestamp();

            await interaction.reply({ embeds: [timeoutEmbed] });


        } catch (error) {
            console.error(error);
            return interaction.reply({ content: "> \`-\` <a:alerta:1163274838111162499> Ocorreu um erro ao tentar aplicar timeout a este usuário. Você pode usar **/audit logs** para configurar um novo canal de logs.", ephemeral: true });
        }

    }
}
