const {
    SlashCommandBuilder,
    PermissionsBitField,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
} = require('discord.js')


module.exports = {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Abra um painel interativo para criar sua embed personalizada.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('criar')
                .setDescription('Abra um painel interativo para criar sua embed personalizada.')
        ),

    async execute(interaction) {

        // Verificação de permissões
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return await interaction.reply({
                content: `> \`-\` <:NA_Intr004:1289442144255213618> Não posso concluir este comando pois você não possui permissão. (ManageMessages)`,
                ephemeral: true
            });
        }

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({
                content: `> \`-\` <:NA_Intr004:1289442144255213618> Não posso concluir o comando pois não recebi permissão para gerenciar este servidor (Administrador)`,
                ephemeral: true
            });
        }



        const embedEmpty = new EmbedBuilder()
            .setTitle(`Titulo Defaut`)
            .setDescription(`Descrição Defaut.`)

        const buttonCreator = [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('CREATOR_SET_TITLE')
                    .setLabel(`Definir título`)
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji(`<:titulo:1286990391161258054>`),
                new ButtonBuilder()
                    .setCustomId('CREATOR_SET_DESCRIPTION')
                    .setLabel(`Definir descrição`)
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji(`<:descrio:1286990442654732339>`),
                new ButtonBuilder()
                    .setCustomId('CREATOR_SET_COLOR')
                    .setLabel(`Definir cor`)
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji(`<:cor:1286990455980167228>`),
                new ButtonBuilder()
                    .setCustomId('CREATOR_SET_IMAGE')
                    .setLabel(`Definir imagem`)
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji(`<:imagem:1286990430856282203>`),
            ),
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('CREATOR_SET_THUMBNAIL')
                    .setLabel(`Definir miniatura`)
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji(`<:miniatura:1286990407477231627>`),
                new ButtonBuilder()
                    .setCustomId('CREATOR_SET_AUTHOR')
                    .setLabel(`Definir autor`)
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji(`<:autor:1284643891764658229>`),
                new ButtonBuilder()
                    .setCustomId('CREATOR_SET_FOOTER')
                    .setLabel(`Definir rodapé`)
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji(`<:rodape:1284643905152749598>`),
                new ButtonBuilder()
                    .setCustomId('CREATOR_MENTION_ROLE')
                    .setLabel(`Mencionar cargo`)
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji(`<:cargo:1284643916594937877>`)
            ),
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('CREATOR_IMPORT_JSON')
                    .setLabel(`Importa JSON`)
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji(`<:importa:1284643944877265019>`),
                new ButtonBuilder()
                    .setCustomId('CREATOR_EXPORT_JSON')
                    .setLabel(`Exportar JSON`)
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji(`<:exporta:1284643930666831872>`),
                new ButtonBuilder()
                    .setCustomId('CREATOR_SEND')
                    .setLabel(`Enviar menssagem`)
                    .setStyle(ButtonStyle.Success)
                    .setEmoji(`<:envia:1284643956071596153>`),
                new ButtonBuilder()
                    .setCustomId('limpa')
                    .setLabel(`Limpar embed`)
                    .setEmoji("<:limpa:1284643966838374470>")
                    .setStyle(ButtonStyle.Danger)

            )
        ]

        interaction.reply({
            embeds: [embedEmpty],
            components: buttonCreator,
            ephemeral: true
        })

    }
}