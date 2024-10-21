const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    PermissionsBitField,
    EmbedBuilder,
    StringSelectMenuBuilder,
    ActionRowBuilder
} = require('discord.js')

const cargos = require("../../database/models/cargos")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cargos')
        .setDescription('Configure o menu de cargos.')
        .addChannelOption(option =>
            option.setName('canal')
                .setDescription('Canal onde irei enviar o dropdownRoles')
                .setRequired(true)
                .addChannelTypes(0) // GuildText
        )
        .addChannelOption(option =>
            option.setName('logs')
                .setDescription('Canal onde será gerado os logs dos usuários.')
                .setRequired(true)
                .addChannelTypes(0) // GuildText
        )
        .addIntegerOption(option =>
            option.setName('max_roles')
                .setDescription('Quantidade máxima de cargos selecionados.')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('descricao')
                .setDescription('Adicione uma descrição')
                .setRequired(true)
        )
        .addRoleOption(option =>
            option.setName('cargo1')
                .setDescription('Mencione o cargo ou cole o ID')
                .setRequired(true)
        )
        .addRoleOption(option =>
            option.setName('cargo2')
                .setDescription('Mencione o cargo ou cole o ID')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('cor')
                .setDescription('Cor da embed em hexadecimal')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('imagem')
                .setDescription('Anexe uma imagem PNG/JPEG/GIF/WEBP')
                .setRequired(false)
        )
        .addRoleOption(option =>
            option.setName('cargo3')
                .setDescription('Mencione o cargo ou cole o ID')
                .setRequired(false)
        )
        .addRoleOption(option =>
            option.setName('cargo4')
                .setDescription('Mencione o cargo ou cole o ID')
                .setRequired(false)
        )
        .addRoleOption(option =>
            option.setName('cargo5')
                .setDescription('Mencione o cargo ou cole o ID')
                .setRequired(false)
        )
        .addRoleOption(option =>
            option.setName('cargo6')
                .setDescription('Mencione o cargo ou cole o ID')
                .setRequired(false)
        )
        .addRoleOption(option =>
            option.setName('cargo7')
                .setDescription('Mencione o cargo ou cole o ID')
                .setRequired(false)
        )
        .addRoleOption(option =>
            option.setName('cargo8')
                .setDescription('Mencione o cargo ou cole o ID')
                .setRequired(false)
        )
        .addRoleOption(option =>
            option.setName('cargo9')
                .setDescription('Mencione o cargo ou cole o ID')
                .setRequired(false)
        )
        .addRoleOption(option =>
            option.setName('cargo10')
                .setDescription('Mencione o cargo ou cole o ID')
                .setRequired(false)
        ),

    async execute(interaction) {

        // Verificação de permissões do usuário
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return await interaction.reply({
                content: `> \`-\` <:NA_Intr004:1289442144255213618> Você não possui permissão para gerenciar cargos (ManageRoles).`,
                ephemeral: true
            });
        }

        // Verificação de permissões do bot
        if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return await interaction.reply({
                content: `> \`-\` <:NA_Intr004:1289442144255213618> O bot não possui permissão para gerenciar cargos no servidor (ManageRoles).`,
                ephemeral: true
            });
        }
        const { options, guild, member, message } = interaction

        const chat = interaction.options.getChannel("canal")
        const logs = interaction.options.getChannel("logs")


        const setmax = options.getInteger("max_roles")


        const descrição = interaction.options.getString("descricao")

        const cor = interaction.options.getString("cor")

        function isValidHexColor(str) {
            const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
            return hexColorRegex.test(str);
        }

        if (cor && !isValidHexColor(cor)) {
            return interaction.reply({ content: 'Formato de cor inválido. Forneça um código de cor hexadecimal válido\nExemplo: #42f2f5', ephemeral: true });
        }


        const imagem = interaction.options.getString("imagem")

        if (imagem && !/\.(png|jpeg|gif)$/i.test(imagem)) {
            return interaction.reply({
                content: 'O link da imagem deve terminar com **.png**, **.jpeg** ou **.gif**\nExemplo: https://i.imgur.com/lCmmOZD.jpeg',
                ephemeral: true
            });
        }

        const cargo1 = options.getRole("cargo1")
        const cargo2 = options.getRole("cargo2")
        const cargo3 = options.getRole("cargo3")
        const cargo4 = options.getRole("cargo4")
        const cargo5 = options.getRole("cargo5")
        const cargo6 = options.getRole("cargo6")
        const cargo7 = options.getRole("cargo7")
        const cargo8 = options.getRole("cargo8")
        const cargo9 = options.getRole("cargo9")
        const cargo10 = options.getRole("cargo10")




        const chatTXT = [
            chat,
            logs
        ]
        for (const chatList of chatTXT) {
            if (!chatList) {
                continue;
            }
            if (chatList.type === 2) {
                return interaction.reply({ content: `> \`-\` <a:alerta:1163274838111162499> Desculpe, você só pode configurar um canal de texto.`, ephemeral: true });
            }
        }

        const cargosCurrent = [
            cargo1,
            cargo2,
            cargo3,
            cargo4,
            cargo5,
            cargo6,
            cargo7,
            cargo8,
            cargo9,
            cargo10
        ];

        for (const cargoList of cargosCurrent) {
            if (!cargoList) {
                continue;
            }

            const botMember = interaction.guild.members.cache.get(client.user.id)

            if (cargoList.position >= botMember.roles.highest.position) {
                return interaction.reply({ content: `> \`-\` <a:alerta:1163274838111162499> O cargo selecionado está acima ou na mesma posição hierárquica do cargo do Grove. O Grove não tem permissão para adicionar esse cargo adicione o cargo do Grove acima desse cargo.`, ephemeral: true });
            }
        }


        const embed = new EmbedBuilder()

        if (descrição) {
            embed.setDescription(`${descrição}`)
        }
        if (imagem) {
            embed.setImage(`${imagem}`)
        }

        if (cor) {
            embed.setColor(`${cor}`)
        }

        const stringSelectMenu = new StringSelectMenuBuilder()
            .setCustomId('select2')
            .setPlaceholder(`Selecione os cargos desejado`)

        const currentCargos = [cargo1, cargo2, cargo3, cargo4, cargo5, cargo6, cargo7, cargo8, cargo9, cargo10].filter(cargo => cargo)

        currentCargos.forEach((cargo, index) => {
            stringSelectMenu.addOptions({
                label: `${cargo.name}`,
                value: `cargo${index + 1}`
            })
        })


        if (setmax <= currentCargos.length) {
            stringSelectMenu.setMaxValues(setmax);
        } else {
            return interaction.reply({ content: `> \`-\` <a:alerta:1163274838111162499> Seu máximo selecionado não pode ser maior do que a quantidade de cargos configurados.`, ephemeral: true });
        }

        stringSelectMenu.setMinValues(0)


        const dropdown = new ActionRowBuilder().addComponents(stringSelectMenu)

        chat.send({ embeds: [embed], components: [dropdown] }).then(async sentMessage => {

            const user = await cargos.findOne({
                guildId: interaction.guild.id
            })

            if (!user) {

                const cargoNames = [
                    'cargo1',
                    'cargo2',
                    'cargo3',
                    'cargo4',
                    'cargo5',
                    'cargo6',
                    'cargo7',
                    'cargo8',
                    'cargo9',
                    'cargo10'
                ];
                const newCargo = {
                    guildId: interaction.guild.id,
                    msgID: sentMessage.id,
                    logsId: logs.id,
                    Img: imagem
                };

                for (let i = 0; i < cargoNames.length; i++) {
                    if (eval(cargoNames[i])) {
                        newCargo[`${cargoNames[i]}Id`] = eval(cargoNames[i]).id;
                    }
                }
                await cargos.create(newCargo);

            } else {
                const cargoNames = [
                    'cargo1',
                    'cargo2',
                    'cargo3',
                    'cargo4',
                    'cargo5',
                    'cargo6',
                    'cargo7',
                    'cargo8',
                    'cargo9',
                    'cargo10'
                ];
                const newCargo = {
                    guildId: interaction.guild.id,
                    msgID: sentMessage.id,
                    logsId: logs.id,
                    Img: imagem
                };

                for (let i = 0; i < cargoNames.length; i++) {
                    if (eval(cargoNames[i])) {
                        newCargo[`${cargoNames[i]}Id`] = eval(cargoNames[i]).id;
                    }
                }

                await cargos.create(newCargo);
            }

        })

        await interaction.reply({

            content: `> \`-\` <a:alerta:1163274838111162499> ${interaction.user},\n\n**SelectMenu**, Enviado com sucesso!\n\n**Canal:** ${chat}\n**Logs:** ${logs}`,
            ephemeral: true,

        })

    }
}
