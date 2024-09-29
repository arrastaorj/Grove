const {
    SlashCommandBuilder,
    EmbedBuilder,
    AttachmentBuilder
} = require('discord.js')


const comandos = require("../../database/models/comandos")
const axios = require('axios')
const Canvas = require('canvas')
const { registerFont } = require("canvas")
registerFont("././fonts/Evogria.otf", { family: "Evogria" })
registerFont("././fonts/the.otf", { family: "the" })
const client = require("../../index")
const translate = require("@iamtraction/google-translate");
require('dotenv').config()


module.exports = {
    data: new SlashCommandBuilder()
        .setName('league')
        .setDescription('Exibe o perfil de um jogador em League of Legends.')
        .addSubcommand(subcommand =>
            subcommand
                .setName("profile")
                .setDescription("Exibe o perfil de um jogador em League of Legends.")
                .addStringOption(option =>
                    option
                        .setName("nick")
                        .setDescription("Escreva o nome do invocador.")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName("tag")
                        .setDescription("Escreva sua tag sem #.")
                        .setRequired(true)
                )
        ),


    async execute(interaction) {

        const cmd = await comandos.findOne({
            guildId: interaction.guild.id
        })

        let cmd1 = cmd.canal1

        if (cmd1 === null || cmd1 === false || !client.channels.cache.get(cmd1) || cmd1 === interaction.channel.id) {



            const procurando = new EmbedBuilder()
                .setTitle('🔍 Procurando Jogador...')
                .setDescription('Estamos buscando o jogador solicitado. Isso pode levar alguns segundos.')
                .setImage('https://i.imgur.com/1oCp761.gif')
                .setColor('#00A86B') // Cor verde, representando busca/espera
                .setFooter({ text: 'Obrigado pela paciência!' });

            const aguarde = new EmbedBuilder()
                .setTitle('⏳ Mais um pouquinho...')
                .setDescription('Estamos quase lá! Apenas um pouco mais de paciência.')
                .setImage('https://i.imgur.com/1oCp761.gif')
                .setColor('#FFA500') // Cor laranja, representando espera
                .setFooter({ text: 'Obrigado por aguardar!' });

            const encontrado = new EmbedBuilder()
                .setTitle('🎉 JOGADOR ENCONTRADO!!')
                .setDescription('Estamos construindo as informações necessárias. Em breve, você terá todos os detalhes!')
                .setImage('https://i.imgur.com/1oCp761.gif')
                .setColor('#32CD32') // Cor verde-limão, representando sucesso
                .setFooter({ text: 'Fique atento!' });


            await interaction.reply({ embeds: [procurando] }).catch(err => { })

            try {

                async function getPlayerData(interaction) {

                    const nick = interaction.options.getString('nick');
                    const tag = interaction.options.getString('tag');

                    // Construção das URLs
                    const urlAccount = `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${nick}/${tag}?api_key=${process.env.RiotApi}`;
                    const urlAuthorization = `https://br1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/{puuid}?api_key=${process.env.RiotApi}`;
                    const urlRank = `https://br1.api.riotgames.com/lol/league/v4/entries/by-summoner/{summonerId}?api_key=${process.env.RiotApi}`;
                    const urlMastery = `https://br1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/{puuid}?api_key=${process.env.RiotApi}`;
                    const desafio = `https://br1.api.riotgames.com/lol/challenges/v1/player-data/{puuid}?api_key=${process.env.RiotApi}`



                    // Obtenção do PUUID
                    const { data: accountData } = await axios.get(urlAccount);
                    const accountPuuid = accountData.puuid;

                    // Obtenção do ID do Invocador
                    const urlAuthorizationWithPuuid = urlAuthorization.replace('{puuid}', accountPuuid);
                    const { data: summonerData } = await axios.get(urlAuthorizationWithPuuid);
                    const summonerId = summonerData.id;

                    // Substituindo IDs nas URLs para rank e mastery
                    const urlRankWithSummonerId = urlRank.replace('{summonerId}', summonerId);
                    const urlMasteryWithPuuid = urlMastery.replace('{puuid}', accountPuuid);
                    const urlDesafios = desafio.replace('{puuid}', accountPuuid);

                    // Requisições de rank e mastery em paralelo
                    const [rankData, masteryData, desafioNames] = await Promise.all([
                        axios.get(urlRankWithSummonerId).then(res => res.data),
                        axios.get(urlMasteryWithPuuid).then(res => res.data),
                        axios.get(urlDesafios).then(res => res.data)
                    ]);

                    return { rankData, masteryData, summonerData, accountPuuid, accountData, desafioNames };


                }


                const { masteryData, summonerData, accountPuuid, accountData, desafioNames } = await getPlayerData(interaction)

                console.log(accountData)

                const json_data_raw = require("../../plugins/champions.json");

                // Mapeamento de elos para URLs de imagens
                const rankImages = {
                    IRON: "https://raw.githubusercontent.com/arrastaorj/flags/refs/heads/main/img/elos/iron.png",
                    BRONZE: "https://raw.githubusercontent.com/arrastaorj/flags/refs/heads/main/img/elos/bronze.png",
                    SILVER: "https://raw.githubusercontent.com/arrastaorj/flags/refs/heads/main/img/elos/silver.png",
                    GOLD: "https://raw.githubusercontent.com/arrastaorj/flags/refs/heads/main/img/elos/gold.png",
                    PLATINUM: "https://raw.githubusercontent.com/arrastaorj/flags/refs/heads/main/img/elos/platinum.png",
                    EMERALD: "https://raw.githubusercontent.com/arrastaorj/flags/refs/heads/main/img/elos/emerald.png",
                    DIAMOND: "https://raw.githubusercontent.com/arrastaorj/flags/refs/heads/main/img/elos/diamond.png",
                    MASTER: "https://raw.githubusercontent.com/arrastaorj/flags/refs/heads/main/img/elos/master.png",
                    GRANDMASTER: "https://raw.githubusercontent.com/arrastaorj/flags/refs/heads/main/img/elos/grandmaster.png",
                    CHALLENGER: "https://raw.githubusercontent.com/arrastaorj/flags/refs/heads/main/img/elos/challenger.png",
                    UNRANKED: "https://raw.githubusercontent.com/arrastaorj/flags/refs/heads/main/img/elos/unranked.png"
                };

                // Função para obter a URL da imagem do elo
                function getRankImage(tier) {
                    if (!tier) return rankImages.UNRANKED;
                    return rankImages[tier.split('_')[0]] || rankImages.UNRANKED;
                }

                // Função para obter o nome do campeão
                function getChampionName(championId) {
                    const champion = json_data_raw.find(champ => champ.key == championId);
                    return champion ? champion.name : "Campeão não encontrado";
                }

                // Função para obter a URL da maestria
                function getMasteryUrl(championLevel) {
                    const level = Math.min(championLevel, 10);
                    return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-collections/global/default/images/item-element/crest-and-banner-mastery-${level}.png`;
                }

                function getFlagUrl(tier) {
                    if (!tier || tier === 'Unranked') {
                        return 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/regalia/bannerskins/default.png';
                    }
                    return `https://raw.githubusercontent.com/arrastaorj/flags/main/${tier.toLowerCase()}.png`;
                }




                async function processPlayerData(interaction) {


                    // Obtém os dados do jogador
                    const { rankData, masteryData, summonerData, accountPuuid, accountData, desafioNames } = await getPlayerData(interaction);

                    // Filtragem dos dados
                    const soloduo = rankData.find(fila => fila.queueType === "RANKED_SOLO_5x5") || {};
                    const flex = rankData.find(fila => fila.queueType === "RANKED_FLEX_SR") || {};

                    // Desestruturação e atribuição de valores padrão
                    const {
                        tier: elosolo = 'Unranked',
                        rank: elosolo1 = '',
                        wins: psolov = '0',
                        losses: psolod = '0',
                        leaguePoints: spdl = '0'
                    } = soloduo;

                    const {
                        tier: eloflex = 'Unranked',
                        rank: eloflex1 = '',
                        wins: pflexv = '0',
                        losses: pflexd = '0',
                        leaguePoints: fpdl = '0'
                    } = flex;

                    // Imagem dos elos
                    const rankSoloDuo = getRankImage(elosolo);
                    const rankFlex = getRankImage(eloflex);

                    // Obter URL da bandeira com base no elo
                    const flagSolo = getFlagUrl(elosolo);
                    const flagFlex = getFlagUrl(eloflex);

                    // Nomes dos campeões e URLs de maestria
                    const championNames = masteryData.map(data => getChampionName(data.championId));

                    const championName0 = masteryData[0] ? getChampionName(masteryData[0].championId) : "Campeão não encontrado";
                    const championName1 = masteryData[1] ? getChampionName(masteryData[1].championId) : "Campeão não encontrado";
                    const championName2 = masteryData[2] ? getChampionName(masteryData[2].championId) : "Campeão não encontrado";

                    const masteryUrls0 = masteryData[0] ? getMasteryUrl(masteryData[0].championLevel) : "Nível não disponível";
                    const masteryUrls1 = masteryData[1] ? getMasteryUrl(masteryData[1].championLevel) : "Nível não disponível";
                    const masteryUrls2 = masteryData[2] ? getMasteryUrl(masteryData[2].championLevel) : "Nível não disponível";

                    // Ícone do perfil
                    const icon = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${summonerData.profileIconId}.jpg`;

                    // URLs dos campeões
                    const [zero, um, dois] = championNames.map(name =>
                        `https://ddragon.leagueoflegends.com/cdn/14.17.1/img/champion/${name}.png`
                    );

                    // Lógica de título
                    const selectedTitle = desafioNames.preferences;
                    const titleraw = require("../../plugins/titles.json");

                    let userTitle = "";
                    for (const key in titleraw.titles) {
                        const title = titleraw.titles[key];
                        if (title.itemId === Number(selectedTitle.title)) {
                            userTitle = title.name;
                            break;
                        }
                    }

                    // Lógica de desafio
                    const userChallenges = desafioNames.preferences;
                    const desafioraw = desafioNames.challenges;

                    const getDesafioLevel = (challengeId) => {
                        const challenge = desafioraw.find(ch => ch.challengeId === challengeId);
                        return challenge ? challenge.level.toLowerCase() : '';
                    };

                    const getDesafioUrl = (challengeId, desafioLevel) => {
                        if (!challengeId || challengeId === -1) {
                            return 'https://lolstatic-a.akamaihd.net/frontpage/apps/prod/rg-xr-duo-reveal/en_US/8d5e6e779309988804ba564ea5742649b83dc66b/assets/img/portrait-frame.png';
                        }
                        return `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/challenges/config/${challengeId}/tokens/${desafioLevel}.png`;
                    };

                    const desafioUrls = userChallenges.challengeIds.map(challengeId => {
                        const desafioLevel = getDesafioLevel(challengeId);
                        return getDesafioUrl(challengeId, desafioLevel);
                    });

                    const [desafio1, desafio2, desafio3] = desafioUrls;

                    // Adiciona o nome do invocador
                    const summonerName = accountData.gameName;

                    // Resultados finais (como exemplo, você pode personalizar conforme necessário)
                    return {
                        soloduoStats: { elosolo, elosolo1, psolov, psolod, spdl },
                        flexStats: { eloflex, eloflex1, pflexv, pflexd, fpdl },
                        rankImage: { rankSoloDuo, rankFlex },
                        flagUrls: { flagSolo, flagFlex },
                        championName0,
                        championName1,
                        championName2,
                        masteryUrls0,
                        masteryUrls1,
                        masteryUrls2,
                        championImages: { zero, um, dois },
                        profileIcon: icon,
                        userTitle,
                        userDesafios: { desafio1, desafio2, desafio3 },
                        summonerName
                    }

                }

                // Exemplo de uso da função
                const {
                    soloduoStats,
                    flexStats,
                    rankImage,
                    masteryUrls0,
                    masteryUrls1,
                    masteryUrls2,
                    championImages,
                    profileIcon,
                    flagUrls,
                    championName0,
                    championName1,
                    championName2,
                    userTitle,
                    userDesafios,
                    summonerName
                } = await processPlayerData(interaction);


                let chave = {};
                chave.create = Canvas.createCanvas(1024, 440);
                chave.context = chave.create.getContext('2d');
                chave.context.fillStyle = '#F8F8FF';

                const foto = `https://raw.githubusercontent.com/arrastaorj/flags/refs/heads/main/img/fundo/fundo.png`;
                const loadImage = Canvas.loadImage;

                async function drawText(text, x, y, align = "center", font = '15px "the"', color = "#fffafa") {
                    chave.context.textAlign = align;
                    chave.context.font = font;
                    chave.context.fillStyle = color;
                    chave.context.fillText(text, x, y);
                }

                async function drawChampion(championImage, masteryUrl, championName, championPoints, x, y) {

                    // Circulo dourado
                    chave.context.beginPath();
                    chave.context.arc(x, y, 38, 0, Math.PI * 2, true);
                    chave.context.strokeStyle = "#dfa849";
                    chave.context.stroke();

                    // Imagem do campeao
                    chave.context.save();
                    chave.context.beginPath();
                    chave.context.arc(x, y, 35, 0, Math.PI * 2);
                    chave.context.clip();
                    chave.context.drawImage(championImage, x - 40, y - 40, 78, 78);
                    chave.context.restore();

                    // Bandeira da Maestria
                    chave.context.drawImage(masteryUrl, x - 35, y + 27, 70, 70);



                    // Nome e pontos
                    await drawText(championName, x, y + 110, "center", '15px "the"', "#fffafa");
                    await drawText(`${championPoints.toLocaleString()} pts`, x, y + 125, "center", '15px "the"', "#7a786f");
                }

                async function drawRankInfo(rankImage, flagImg, rank, rankDetails, wins, points, x, y) {
                    if (flagImg) {
                        chave.context.drawImage(flagImg, 4, 0, 300, 450);
                    }
                    await drawText(rank, x, y, "center", '15px "the"', "#7a786f");
                    await drawText(rankDetails, x, y + 25, "center");
                    await drawText(`${wins} Vitórias | ${points} Pdl`, x, y + 50, "center", '15px "the"', "#7a786f");
                    chave.context.drawImage(rankImage, x - 70, y - 145, 138, 138);
                }

                loadImage(foto).then(async (img) => {
                    chave.context.drawImage(img, 0, 0, 1024, 500);

                    const translated = await translate(`${soloduoStats.elosolo}`, { from: "en", to: "pt" });
                    const translated2 = await translate(`${flexStats.eloflex}`, { from: "en", to: "pt" });

                    const [
                        flagSoloImg,
                        rankSoloDuoImg,
                        rankFlexImg,
                        championImg0,
                        championImg1,
                        championImg2,
                        masteryUrl0,
                        masteryUrl1,
                        masteryUrl2,
                        profileIconImg,
                        desafio1Img,
                        desafio2Img,
                        desafio3Img
                    ] = await Promise.all([
                        loadImage(flagUrls.flagSolo),
                        loadImage(rankImage.rankSoloDuo),
                        loadImage(rankImage.rankFlex),
                        loadImage(championImages.zero),
                        loadImage(championImages.um),
                        loadImage(championImages.dois),
                        loadImage(masteryUrls0),
                        loadImage(masteryUrls1),
                        loadImage(masteryUrls2),
                        loadImage(profileIcon),
                        loadImage(userDesafios.desafio1),
                        loadImage(userDesafios.desafio2),
                        loadImage(userDesafios.desafio3)
                    ]);

                    // Desenha as informações de rank
                    await drawRankInfo(rankSoloDuoImg, flagSoloImg, "Solo/Duo", `${translated.text} ${soloduoStats.elosolo1}`, soloduoStats.psolov, soloduoStats.spdl, 370, 350);
                    await drawRankInfo(rankFlexImg, null, "Flex 5V5", `${translated2.text} ${flexStats.eloflex1}`, flexStats.pflexv, flexStats.fpdl, 550, 350);

                    // Desenha as informações dos campeões
                    await drawChampion(championImg0, masteryUrl0, championName0, masteryData[0].championPoints, 810, 255);
                    await drawChampion(championImg1, masteryUrl1, championName1, masteryData[1].championPoints, 710, 275);
                    await drawChampion(championImg2, masteryUrl2, championName2, masteryData[2].championPoints, 910, 275);

                    // Ícone do Invocador
                    chave.context.save();
                    chave.context.beginPath();
                    chave.context.arc(155, 145, 68, 0, Math.PI * 2);
                    chave.context.clip();
                    chave.context.drawImage(profileIconImg, 85, 70, 143, 143);
                    chave.context.restore();

                    // Desenho dos desafios
                    chave.context.drawImage(desafio1Img, 80, 310, 50, 50);
                    chave.context.drawImage(desafio2Img, 130, 310, 50, 50);
                    chave.context.drawImage(desafio3Img, 180, 310, 50, 50);

                    // Level e Título do Invocador
                    await drawText(`${summonerData.summonerLevel}`, 156, 216, "center", '14px "Evogria"');
                    await drawText(`${userTitle}`, 155, 295, "center", '12px "the"', "#7a786f");

                    // Adicionando o gameName
                    await drawText(`${summonerName}`, 155, 275, "center", '18px "the"', "#ffffff");


                    const mensagem = new AttachmentBuilder(chave.create.toBuffer(), `${interaction.user.tag}.png`);

                    setTimeout(() => { interaction.editReply({ embeds: [aguarde] }) }, 1000)
                    setTimeout(() => { interaction.editReply({ embeds: [encontrado] }) }, 3000)
                    return setTimeout(() => { interaction.editReply({ files: [mensagem], embeds: [] }).catch(err => { }) }, 5000)

                })

            } catch (error) {

                const nick = interaction.options.getString('nick');
                const tag = interaction.options.getString('tag');

                return await interaction.editReply({
                    content: `> \-\ <a:alerta:1163274838111162499> Olá ${interaction.user},O usuário \ **${nick}#${tag}**\ nao foi encontrado! Por Favor verifique o nick e tente novamente.`,
                    ephemeral: true,
                    embeds: [],

                })
            }




        } else if (interaction.channel.id !== cmd1) {
            interaction.reply({
                content: `> \`-\` <a:alerta:1163274838111162499> Você está tentando usar um comando no canal de texto errado, tente usá-lo no canal correto. <#${cmd1}>.`,
                ephemeral: true
            })
        }
    }
}
