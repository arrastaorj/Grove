const {
    SlashCommandBuilder,
    ApplicationCommandType,
    ApplicationCommandOptionType,
    AttachmentBuilder
} = require('discord.js')

const {
    createCanvas,
    loadImage,
    registerFont,
} = require('canvas')

const client = require("../../index")
const comandos = require("../../database/models/comandos")
const level = require("../../database/models/level")
const canvafy = require("canvafy"); // Certifique-se de ter instalado o canvafy
const Atendente = require("../../database/models/ticketAtendimentos");



module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Exibir um ranking global ou do servidor atual.')
        .addSubcommand(subcommand =>
            subcommand
                .setName("atendimentos")
                .setDescription("Exibir o ranking de atendentes do servidor.")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("global")
                .setDescription("Exibir a classificação global do grove.")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("server")
                .setDescription("Exibir a classificação de atendimento no ticket atual deste servidor.")
        ),



    async execute(interaction) {

        const subcommands = interaction.options.getSubcommand()

        switch (subcommands) {


            case "atendimentos": {


                const cmd = await comandos.findOne({
                    guildId: interaction.guild.id
                })

                if (!cmd) return interaction.reply({
                    content: `> \`-\` <a:alerta:1163274838111162499> Um Adminitrador ainda não configurou o canal para uso de comandos!`,
                    ephemeral: true
                })


                let cmd1 = cmd.canal1

                if (cmd1 === null || cmd1 === true || !client.channels.cache.get(cmd1) || cmd1 === interaction.channel.id) {

                    try {

                        await interaction.deferReply({ fetchReply: true })


                        const guildId = interaction.guild.id;

                        // Obtenha os 10 melhores atendentes para o servidor
                        const atendentes = await Atendente.find({ guildId })
                            .sort({ atendimentosRealizados: -1 })
                            .limit(10);

                        if (atendentes.length === 0) {
                            return interaction.reply({ content: "Não há atendimentos registrados.", ephemeral: true });
                        }

                        // Monta os dados para o Canvafy
                        const usersData = await Promise.all(
                            atendentes.map(async (atendente, index) => {
                                const user = await client.users.fetch(atendente.userId);
                                return {
                                    top: index + 1,
                                    avatar: user.displayAvatarURL({ format: "png" }),
                                    tag: user.tag,
                                    score: atendente.atendimentosRealizados
                                };
                            })
                        );

                        // Gera a imagem do ranking usando Canvafy
                        const topImage = await new canvafy.Top()
                            .setOpacity(0.6)
                            .setScoreMessage("Atendimentos:")
                            .setabbreviateNumber(false)
                            .setBackground("image", "https://github.com/arrastaorj/flags/blob/main/rankAtendimento.jpg?raw=true")
                            .setColors({
                                box: '#212121',
                                username: '#ffffff',
                                score: '#ffffff',
                                firstRank: '#f7c716',
                                secondRank: '#9e9e9e',
                                thirdRank: '#94610f'
                            })
                            .setUsersData(usersData)
                            .build();

                        const attachment = new AttachmentBuilder(topImage, { name: "rank.png" });

                        // Envia a imagem de ranking
                        await interaction.editReply({ files: [attachment] });

                    } catch (error) {
                        console.error(error);
                        interaction.reply({ content: "Ocorreu um erro ao gerar o ranking.", ephemeral: true });
                    }
                }
                else if (interaction.channel.id !== cmd1) {
                    interaction.reply({
                        content: `> \`-\` <a:alerta:1163274838111162499> Você está tentando usar um comando no canal de texto errado, tente usá-lo no canal correto. <#${cmd1}>.`,
                        ephemeral: true
                    })
                }

                break
            }


            case "global": {



                const cmd = await comandos.findOne({
                    guildId: interaction.guild.id
                })

                if (!cmd)
                    return interaction.reply({
                        content: `> \`-\` <a:alerta:1163274838111162499> Um Adminitrador ainda não configurou o canal para uso de comandos!`,
                        ephemeral: true
                    })

                let cmd1 = cmd.canal1

                if (cmd1 === null || cmd1 === false || !client.channels.cache.get(cmd1) || cmd1 === interaction.channel.id) {


                    await interaction.deferReply({ fetchReply: true })

                    const canvas = createCanvas(751, 500),
                        ctx = canvas.getContext('2d'),
                        bg = await loadImage("https://raw.githubusercontent.com/arrastaorj/flags/main/rankGlobal.png")
                    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height)


                    const allUserData = await level.find({}).exec()

                    const uniqueUsers = {}

                    allUserData.forEach((userData) => {
                        const userId = userData.userId

                        if (!uniqueUsers[userId] ||
                            uniqueUsers[userId].level < userData.level ||
                            (uniqueUsers[userId].level === userData.level && uniqueUsers[userId].xp < userData.xp)
                        ) {
                            uniqueUsers[userId] = userData
                        }
                    })

                    const dataGlobal = Object.values(uniqueUsers).sort((a, b) => {
                        if (b.level !== a.level) {
                            return b.level - a.level;
                        } else {
                            return b.xp - a.xp;
                        }
                    }).slice(0, 10)


                    if (!dataGlobal || dataGlobal.length === 0) {
                        return interaction.reply({
                            content: `Este servidor ainda não possui Rank.`,
                            ephemeral: true
                        })
                    }


                    const ranks = Math.min(10, dataGlobal.length)

                    const userNames = []
                    const userContents = []

                    for (let i = 0; i < ranks; i++) {
                        const userData = dataGlobal[i]
                        const user = client.users.cache.get(userData?.userId)

                        if (user) {
                            userNames.push(user.tag)
                            userContents.push(user.id)
                        }
                    }

                    userContents.sort((a, b) => {
                        const userDataA = dataGlobal.find((user) => user.userId === a)
                        const userDataB = dataGlobal.find((user) => user.userId === b)
                        const levelA = userDataA ? userDataA.level : 0
                        const levelB = userDataB ? userDataB.level : 0

                        if (levelB !== levelA) {
                            return levelB - levelA
                        } else {
                            const xpA = userDataA ? userDataA.xp : 0
                            const xpB = userDataB ? userDataB.xp : 0
                            return xpB - xpA
                        }
                    })

                    const positions = [
                        { x: 375, y: 225 },
                        { x: 195, y: 285 },
                        { x: 555, y: 285 },
                        { x: 145, y: 344 },
                        { x: 145, y: 401 },
                        { x: 145, y: 458 },
                        { x: 495, y: 344 },
                        { x: 495, y: 401 },
                        { x: 495, y: 458 }
                    ]

                    for (let i = 0; i < positions.length; i++) {
                        const { x, y } = positions[i]
                        ctx.font = '17px "ChunkFive"'
                        ctx.fillStyle = "white"
                        ctx.textAlign = i < 3 ? "center" : "left"
                        ctx.fillText(userNames[i], x, y)
                    }

                    async function drawUserAvatar(ctx, user, x, y, radius) {
                        return new Promise(async (resolve) => {
                            ctx.save();
                            await loadImage(user?.displayAvatarURL({ extension: 'png', dynamic: false })).then(async (i) => {
                                ctx.beginPath();
                                ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2);
                                ctx.clip();
                                ctx.drawImage(i, x, y, radius * 2, radius * 2);
                                ctx.restore();
                                resolve();
                            });
                        });
                    }

                    const userCoordinates = [
                        { x: 317, y: 86, radius: 59 },
                        { x: 145, y: 165, radius: 50 },
                        { x: 505, y: 165, radius: 50 },
                        { x: 91, y: 313, radius: 23 },
                        { x: 91, y: 373, radius: 23 },
                        { x: 91, y: 430, radius: 23 },
                        { x: 443, y: 313, radius: 23 },
                        { x: 443, y: 373, radius: 23 },
                        { x: 443, y: 430, radius: 23 },
                    ];
                    const maxIndex = Math.min(userContents.length, userCoordinates.length);

                    await Promise.all(userContents.slice(0, maxIndex).map(async (userId, index) => {
                        const user = client.users.cache.get(userId);
                        const coordinates = userCoordinates[index];

                        if (user && coordinates) {
                            await drawUserAvatar(ctx, user, coordinates.x, coordinates.y, coordinates.radius);
                        } else {
                            console.error(`User or coordinates not found for index ${index}`);
                        }
                    }));


                    await loadImage("https://raw.githubusercontent.com/arrastaorj/flags/main/rankComplement.png").then(async (i) => {
                        ctx.drawImage(i, 60, 25, 804, 450)
                    })


                    const rankCard = new AttachmentBuilder(canvas.toBuffer(), "rank.png")
                    return await interaction.editReply({
                        files: [rankCard]
                    })
                }

                else if (interaction.channel.id !== cmd1) {
                    await interaction.reply({
                        content: `> \`-\` <a:alerta:1163274838111162499> Você está tentando usar um comando no canal de texto errado, tente usá-lo no canal correto. <#${cmd1}>.`,
                        ephemeral: true
                    })
                }
                break
            }

            case "server": {

                const cmd = await comandos.findOne({
                    guildId: interaction.guild.id
                })

                if (!cmd)
                    return interaction.reply({
                        content: `> \`-\` <a:alerta:1163274838111162499> Um Adminitrador ainda não configurou o canal para uso de comandos!`,
                        ephemeral: true
                    })

                let cmd1 = cmd.canal1

                if (cmd1 === null || cmd1 === false || !client.channels.cache.get(cmd1) || cmd1 === interaction.channel.id) {


                    await interaction.deferReply({ fetchReply: true })


                    let allUserData = await level.find({
                        guildId: interaction.guild.id,
                    }).exec();

                    const uniqueUsers = {};

                    allUserData.forEach((userData) => {
                        const userId = userData.userId; // Substitua "userId" pelo campo que contém a identificação única do usuário

                        if (!uniqueUsers[userId] ||
                            uniqueUsers[userId].level < userData.level ||
                            (uniqueUsers[userId].level === userData.level && uniqueUsers[userId].xp < userData.xp)
                        ) {
                            uniqueUsers[userId] = userData;
                        }
                    });

                    const dataGlobal = Object.values(uniqueUsers).sort((a, b) => {
                        if (b.level !== a.level) {
                            return b.level - a.level;
                        } else {
                            return b.xp - a.xp;
                        }
                    }).slice(0, 10)



                    if (!dataGlobal || dataGlobal.length === 0) {
                        return interaction.reply({
                            content: `Este servidor ainda não possui Rank.`,
                            ephemeral: true
                        });
                    }




                    const ranks = Math.min(10, dataGlobal.length)


                    const userNames = []
                    const userContents = []

                    for (let i = 0; i < ranks; i++) {

                        const userData = dataGlobal[i]
                        const user = client.users.cache.get(userData?.userId)

                        if (user) {

                            const userName = `${user.tag} | Level: [${userData.level}]`
                            userNames.push(userName)

                            const userContent = `${user.id}`
                            userContents.push(userContent)

                        }
                    }


                    userNames.sort((a, b) => {
                        const levelA = parseInt(a.match(/\[([0-9]+)\]/)[1])
                        const levelB = parseInt(b.match(/\[([0-9]+)\]/)[1])
                        return levelB - levelA
                    })

                    userContents.sort((a, b) => {
                        const userDataA = dataGlobal.find((user) => user.userId === a)
                        const userDataB = dataGlobal.find((user) => user.userId === b)


                        const levelA = userDataA ? userDataA.level : 0
                        const levelB = userDataB ? userDataB.level : 0


                        if (levelB !== levelA) {
                            return levelB - levelA
                        } else {

                            const xpA = userDataA ? userDataA.xp : 0
                            const xpB = userDataB ? userDataB.xp : 0

                            return xpB - xpA
                        }
                    })

                    const canvas = createCanvas(680, 745),
                        ctx = canvas.getContext('2d'),
                        bg = await loadImage("https://raw.githubusercontent.com/arrastaorj/flags/main/rankteste.png");
                    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height)

                    const drawUser = async (userName, userContent, yPos) => {
                        ctx.font = "30px 'Pelita'";
                        ctx.fillStyle = "white";
                        ctx.textAlign = "left";
                        ctx.fillText(userName, 250, yPos)



                        const user = client.users.cache.get(userContent)
                        const avatarURL = user?.displayAvatarURL({
                            extension: 'png',
                            dynamic: false,
                            caches: false
                        })

                        if (avatarURL) {
                            try {
                                const avatarImage = await loadImage(avatarURL);
                                return { userName, avatarImage, yPos }
                            } catch (error) {
                                console.error(`Erro ao carregar avatar para ${userName}:`, error)
                                return null
                            }
                        } else {
                            console.error(`URL de avatar não encontrada para ${userName}`)
                            return null
                        }
                    }


                    const avatarPromises = userNames.map(async (userName, i) => {
                        const userContent = userContents[i]
                        const yPos = 105 + i * 55
                        const userData = await drawUser(userName, userContent, yPos)
                        return userData
                    })

                    const avatarImages = await Promise.all(avatarPromises)

                    avatarImages.sort((a, b) => a.yPos - b.yPos)

                    for (const { avatarImage, yPos } of avatarImages) {
                        ctx.drawImage(avatarImage, 198, yPos - 20, 38, 38)
                    }

                    const at = new AttachmentBuilder(canvas.toBuffer(), "rank.png")
                    return await interaction.editReply({
                        files: [at]
                    })

                }
                else if (interaction.channel.id !== cmd1) {
                    await interaction.reply({
                        content: `> \`-\` <a:alerta:1163274838111162499> Você está tentando usar um comando no canal de texto errado, tente usá-lo no canal correto. <#${cmd1}>.`,
                        ephemeral: true
                    })
                }
                break
            }
        }



    }
}
