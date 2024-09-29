const {
    EmbedBuilder
} = require("discord.js")

const moment = require("moment")
const client = require('../../index')

module.exports = async (interaction) => {
    // Lógica para submissão do modal
    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'modal_sugestao') {
            const channel = client.channels.cache.get('1054331649220943903'); // ID do canal para o envio da sugestão
            const sugestao = interaction.fields.getTextInputValue('sugestão');

            await interaction.reply({
                content: `${interaction.user}, sua sugestão foi recebida!`,
                ephemeral: true
            });

            await channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({
                            name: `${interaction.user.tag}`,
                            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
                        })
                        .setFooter({
                            text: interaction.guild.name,
                            iconURL: interaction.guild.iconURL({ dynamic: true })
                        })
                        .setThumbnail(interaction.user.displayAvatarURL({ format: "png", dynamic: true, size: 4096 }))
                        .setDescription(`**Horário da sugestão:** <t:${moment(interaction.createdTimestamp).unix()}>(<t:${parseInt(interaction.createdTimestamp / 1000)}:R>)

                        **Sobre o usuário:**
                        **ID:** \`${interaction.user.id}\`
                        **Usuário:** ${interaction.user}
                        **Nome no Discord:** \`${interaction.user.tag}\`

                        **Sugestão:**
                        \`\`\`${sugestao}\`\`\``)
                ]
            });
        }
    }
};
