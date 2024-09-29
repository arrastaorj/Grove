const {
    roleMention,
    ModalBuilder,
    ActionRowBuilder,
    TextInputBuilder,
    TextInputStyle,
    EmbedBuilder,
    codeBlock,
    ButtonBuilder,
    ButtonStyle,
    RoleSelectMenuBuilder
} = require("discord.js")

module.exports = async (interaction) => {

    const isHex = (hex) => {
        if (hex.match(/#[a-zA-Z0-9]{6}/)) return true
        return false;
    }

    function isImage(url) {
        if (typeof url !== 'string') return false;
        return (url.match(/^http[^\?]*.(jpg|jpeg|gif|png|tiff|bmp)(\?(.*))?$/gmi) != null);
    }

    function isLink(url) {
        if (typeof url !== 'string') return false;
        let regex = /^(ftp|http|https):\/\/[^ "]+$/
        return (regex.test(url));
    }


    if (interaction.isButton()) {
        switch (interaction.customId) {

            case 'CREATOR_SET_TITLE':
                const embedTitle = EmbedBuilder.from(interaction.message.embeds[0])

                const modalTitle = new ModalBuilder()
                    .setCustomId('CREATOR_SET_TITLE')
                    .setTitle(`Criador de mensagem`)

                const title = new TextInputBuilder()
                    .setCustomId('TITLE_INPUT')
                    .setLabel(`Título`)
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(1)
                    .setMaxLength(256)
                    .setPlaceholder(`Insira o título que deseja definir`)
                    .setRequired(true)

                if (embedTitle.data.title) title.setValue(embedTitle.data.title)

                const rowTitle = new ActionRowBuilder().addComponents(title)
                modalTitle.addComponents(rowTitle)

                await interaction.showModal(modalTitle)


                break

            case 'CREATOR_SET_DESCRIPTION':

                const embedDescription = EmbedBuilder.from(interaction.message.embeds[0])

                const modalDescription = new ModalBuilder()
                    .setCustomId('CREATOR_SET_DESCRIPTION')
                    .setTitle(`Criador de mensagem`)

                const description = new TextInputBuilder()
                    .setCustomId('DESCRIPTION_INPUT')
                    .setLabel(`Descrição`)
                    .setStyle(TextInputStyle.Paragraph)
                    .setMaxLength(4000)
                    .setPlaceholder(`Insira a descrição que deseja definir`)
                    .setRequired(true)

                if (embedDescription.data.description) description.setValue(embedDescription.data.description)

                const rowDescription = new ActionRowBuilder().addComponents(description)
                modalDescription.addComponents(rowDescription)

                await interaction.showModal(modalDescription)
                break

            case 'CREATOR_SET_COLOR':
                const embedColor = EmbedBuilder.from(interaction.message.embeds[0])

                const modalColor = new ModalBuilder()
                    .setCustomId('CREATOR_SET_COLOR')
                    .setTitle(`Criador de mensagem`)

                const color = new TextInputBuilder()
                    .setCustomId('COLOR_INPUT')
                    .setLabel(`Código Hex`)
                    .setMinLength(7)
                    .setMaxLength(7)
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder(`Insira a cor que deseja definir`)
                    .setRequired(false)

                if (embedColor.data.color) color.setValue(`#${embedColor.data.color.toString(16).padStart(6, '0')}`)

                const rowColor = new ActionRowBuilder().addComponents(color)
                modalColor.addComponents(rowColor)

                await interaction.showModal(modalColor)
                break

            case 'CREATOR_SET_IMAGE':
                const embedImg = EmbedBuilder.from(interaction.message.embeds[0])

                const modalImg = new ModalBuilder()
                    .setCustomId('CREATOR_SET_IMAGE')
                    .setTitle(`Criador de mensagem`)

                const image = new TextInputBuilder()
                    .setCustomId('IMAGE_INPUT')
                    .setLabel(`Url da imagem`)
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder(`Insira a imagem que deseja definir`)
                    .setRequired(false)

                if (embedImg.data.image) image.setValue(embedImg.data.image.url)

                const rowImg = new ActionRowBuilder().addComponents(image)
                modalImg.addComponents(rowImg)

                await interaction.showModal(modalImg)
                break

            case 'CREATOR_SET_THUMBNAIL':
                const embedThubnail = EmbedBuilder.from(interaction.message.embeds[0])

                const modalThubnail = new ModalBuilder()
                    .setCustomId('CREATOR_SET_THUMBNAIL')
                    .setTitle(`Criador de mensagem`)

                const thumbnail = new TextInputBuilder()
                    .setCustomId('THUMBNAIL_INPUT')
                    .setLabel(`Url da miniatura`)
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder(`Insira a miniatura que deseja definir`)
                    .setRequired(false)

                if (embedThubnail.data.thumbnail) thumbnail.setValue(embedThubnail.data.thumbnail.url)

                const rowThubnail = new ActionRowBuilder().addComponents(thumbnail)
                modalThubnail.addComponents(rowThubnail)

                await interaction.showModal(modalThubnail)
                break

            case 'CREATOR_SET_AUTHOR':
                const embedAuthor = EmbedBuilder.from(interaction.message.embeds[0])

                const modalAuthor = new ModalBuilder()
                    .setCustomId('CREATOR_SET_AUTHOR')
                    .setTitle(`Criador de mensagem`)

                const author = new TextInputBuilder()
                    .setCustomId('AUTHOR_INPUT')
                    .setLabel(`Autor`)
                    .setMaxLength(256)
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder(`Insira o autor que deseja definir`)
                    .setRequired(false)

                const icon = new TextInputBuilder()
                    .setCustomId('ICON_INPUT')
                    .setLabel(`Icone`)
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder(`Insira o icone que deseja definir`)
                    .setRequired(false)

                const url = new TextInputBuilder()
                    .setCustomId('URL_INPUT')
                    .setLabel('Url')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder(`Insira a url que deseja definir`)
                    .setRequired(false)

                if (embedAuthor.data.author) author.setValue(embedAuthor.data.author.name)
                if (embedAuthor.data.author && embedAuthor.data.author.icon_url) icon.setValue(embedAuthor.data.author.icon_url)
                if (embedAuthor.data.author && embedAuthor.data.author.url) url.setValue(embedAuthor.data.author.url)

                const rowAuthor = new ActionRowBuilder().addComponents(author)
                const rowIcon = new ActionRowBuilder().addComponents(icon)
                const rowUrl = new ActionRowBuilder().addComponents(url)
                modalAuthor.addComponents(rowAuthor, rowIcon, rowUrl)

                await interaction.showModal(modalAuthor)
                break

            case 'CREATOR_SET_FOOTER':
                const embedFooter = EmbedBuilder.from(interaction.message.embeds[0])

                const modalFooter = new ModalBuilder()
                    .setCustomId('CREATOR_SET_FOOTER')
                    .setTitle(`Criador de mensagem`)

                const footer = new TextInputBuilder()
                    .setCustomId('FOOTER_INPUT')
                    .setLabel(`Rodapé`)
                    .setMaxLength(2048)
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder(`Insira o rodapé que deseja definir`)
                    .setRequired(false)

                const iconFooter = new TextInputBuilder()
                    .setCustomId('ICON_INPUT')
                    .setLabel(`Icone`)
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder(`Insira o icone que deseja definir`)
                    .setRequired(false)

                if (embedFooter.data.footer) footer.setValue(embedFooter.data.footer.text)
                if (embedFooter.data.footer && embedFooter.data.footer.icon_url) iconFooter.setValue(embedFooter.data.footer.icon_url)

                const rowFooter = new ActionRowBuilder().addComponents(footer)
                const rowIconFooter = new ActionRowBuilder().addComponents(iconFooter)
                modalFooter.addComponents(rowFooter, rowIconFooter)

                await interaction.showModal(modalFooter)
                break

            case 'CREATOR_MENTION_ROLE':

                const buttonCreatorBack2 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('CREATOR_BACK')
                        .setLabel(`Voltar`)
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji(`<:1095137898262695937:1166902501572870195>`))

                const menuCreatorRole = new ActionRowBuilder()
                    .addComponents(new RoleSelectMenuBuilder()
                        .setCustomId(`CREATOR_MENTION_ROLE`)
                        .setPlaceholder(`Clique para selecionar uma opção.`)
                    )

                const messageRole = interaction.message

                if (!messageRole.embeds) {
                    return await interaction.reply({
                        content: `A mensagem não contém nenhuma mensagem personalizada.`,
                        ephemeral: true
                    })
                }

                await interaction.update({
                    components: [menuCreatorRole, buttonCreatorBack2]
                })
                break

            case 'CREATOR_EXPORT_JSON':
                const messageExportJson = interaction.message

                if (!messageExportJson.embeds) {
                    return await interaction.reply({
                        content: `A mensagem não contém nenhuma mensagem personalizada.`,
                        ephemeral: true
                    })
                }

                const embedExportJson = EmbedBuilder.from(messageExportJson.embeds[0])

                await interaction.reply({
                    embeds: [{
                        description: codeBlock(JSON.stringify(embedExportJson.toJSON())),
                        color: 2829617
                    }],
                    ephemeral: true
                })

                break

            case 'CREATOR_IMPORT_JSON':

                const modalCreatorImportJson = new ModalBuilder()
                    .setCustomId('CREATOR_IMPORT_JSON')
                    .setTitle(`Criador de mensagem`)
                    .setComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('JSON_INPUT')
                                .setLabel('JSON')
                                .setStyle(TextInputStyle.Paragraph)
                                .setMinLength(1)
                                .setMaxLength(4000)
                                .setPlaceholder(`Insira o JSON que deseja definir`)
                                .setRequired(true)))

                await interaction.showModal(modalCreatorImportJson)
                break

            case 'CREATOR_SEND':

                const channel = interaction.channel; // Obtém o canal onde a interação ocorreu
                const message = interaction.message;

                const content = message.content;
                const embed = EmbedBuilder.from(message.embeds[0]);

                await channel.send({ content: content, embeds: [embed] });
                return await interaction.update({ content: `Mensagem enviada com sucesso no canal ${channel}.'`, embeds: [], components: [], ephemeral: true });
                break

            case 'limpa':

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


                await interaction.update({
                    content: "",
                    embeds: [embedEmpty],
                    components: buttonCreator
                })

                break

            case 'CREATOR_BACK': {

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

                const message = interaction.message

                if (!message.embeds) {
                    return await interaction.reply({
                        content: `A mensagem não contém nenhuma mensagem personalizada.`,
                        ephemeral: true
                    })
                }

                await interaction.update({
                    components: buttonCreator
                })
            }
                break
            default:
                break
        }
    }

    if (interaction.isRoleSelectMenu()) {

        if (interaction.customId === 'CREATOR_MENTION_ROLE') {
            const role = interaction.values && Array.isArray(interaction.values) ? interaction.values[0] : null;

            if (!role) {
                return await interaction.reply({ content: 'Nenhum cargo selecionado.', ephemeral: true });
            }

            const message = interaction.message;

            if (!message.embeds) {
                return await interaction.reply({ content: `A mensagem não contém nenhuma mensagem personalizada.`, ephemeral: true });
            }

            await interaction.update({ content: `${roleMention(role)}` });
        }
    }



    if (interaction.isModalSubmit()) {


        const message = interaction.message;

        if (!message.embeds) {
            return await interaction.reply({ content: `A mensagem não contém nenhuma mensagem personalizada.`, ephemeral: true });
        }

        const embed = EmbedBuilder.from(message.embeds[0]);

        // SetTitle
        if (interaction.customId === 'CREATOR_SET_TITLE') {
            const title = interaction.fields.getTextInputValue('TITLE_INPUT');
            embed.setTitle(title);
        }

        // SetDescription
        if (interaction.customId === 'CREATOR_SET_DESCRIPTION') {
            const description = interaction.fields.getTextInputValue('DESCRIPTION_INPUT');
            embed.setDescription(description.replaceAll('\\n', '\n'));
        }

        // SetColor
        if (interaction.customId === 'CREATOR_SET_COLOR') {
            const color = interaction.fields.getTextInputValue('COLOR_INPUT');
            if (color) {
                if (!isHex(color)) {
                    return await interaction.reply({ content: `A cor precisa ser um código hex válido.`, ephemeral: true });
                }
                embed.setColor(color);
            } else {
                embed.setColor(null);
            }
        }

        // SetImage
        if (interaction.customId === 'CREATOR_SET_IMAGE') {
            const image = interaction.fields.getTextInputValue('IMAGE_INPUT');
            if (image) {
                if (!isImage(image)) {
                    return await interaction.reply({ content: `O url precisa ser uma imagem válida.`, ephemeral: true });
                }
                embed.setImage(image);
            } else {
                embed.setImage(null);
            }
        }

        // SetThumbnail
        if (interaction.customId === 'CREATOR_SET_THUMBNAIL') {
            const thumbnail = interaction.fields.getTextInputValue('THUMBNAIL_INPUT');
            if (thumbnail) {
                if (!isImage(thumbnail)) {
                    return await interaction.reply({ content: `O url precisa ser uma imagem válida.`, ephemeral: true });
                }
                embed.setThumbnail(thumbnail);
            } else {
                embed.setThumbnail(null);
            }
        }

        // SetAuthor
        if (interaction.customId === 'CREATOR_SET_AUTHOR') {
            const authorName = interaction.fields.getTextInputValue('AUTHOR_INPUT');
            const authorIcon = interaction.fields.getTextInputValue('ICON_INPUT');
            const authorUrl = interaction.fields.getTextInputValue('URL_INPUT');
            if (authorName) {
                const author = { name: authorName };
                if (authorIcon) {
                    if (!isImage(authorIcon)) {
                        return await interaction.reply({ content: `O icone precisa ser uma imagem válida.`, ephemeral: true });
                    }
                    author.iconURL = authorIcon;
                }
                if (authorUrl) {
                    if (!isLink(authorUrl)) {
                        return await interaction.reply({ content: `O url precisa ser uma link válido.`, ephemeral: true });
                    }
                    author.url = authorUrl;
                }
                embed.setAuthor(author);
            } else {
                embed.setAuthor(null);
            }
        }

        // SetFooter
        if (interaction.customId === 'CREATOR_SET_FOOTER') {
            const footerText = interaction.fields.getTextInputValue('FOOTER_INPUT');
            const footerIcon = interaction.fields.getTextInputValue('ICON_INPUT');
            if (footerText) {
                const footer = { text: footerText };
                if (footerIcon) {
                    if (!isImage(footerIcon)) {
                        return await interaction.reply({ content: `O icone precisa ser uma imagem válida.`, ephemeral: true });
                    }
                    footer.iconURL = footerIcon;
                }
                embed.setFooter(footer);
            } else {
                embed.setFooter(null);
            }
        }

        // ImportJson
        if (interaction.customId === 'CREATOR_IMPORT_JSON') {
            try {
                const json = interaction.fields.getTextInputValue('JSON_INPUT');
                const parsedEmbed = EmbedBuilder.from(JSON.parse(json));
                await interaction.update({ embeds: [parsedEmbed] }).catch(() => false);
                return;
            } catch (e) {
                return await interaction.reply({ content: `O json precisa ser um json válido.`, ephemeral: true });
            }
        }

        // Atualiza o embed
        await interaction.update({ embeds: [embed] }).catch(() => false);
    }

}
