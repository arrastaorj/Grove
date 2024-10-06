const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js')


const badgeNames = {
    hypesquad_house_1: "HypeSquadOnlineHouse1",
    hypesquad_house_2: "HypeSquadOnlineHouse2",
    hypesquad_house_3: "HypeSquadOnlineHouse3",
    hypesquad: "HypesquadEvents",
    bug_hunter_level_1: "BugHunterLevel1",
    bug_hunter_level_2: "BugHunterLevel2",
    early_supporter: "EarlySupporter",
    verified_developer: "verifiedDeveloper",
    verified_bot_developer: "VerifiedBotDeveloper",
    active_developer: "ActiveDeveloper",
    partner: "Partner",
    staff: "Staff",
    premium: "Nitro",
    guild_booster_lvl1: "BoostLevel1",
    guild_booster_lvl2: "BoostLevel2",
    guild_booster_lvl3: "BoostLevel3",
    guild_booster_lvl4: "BoostLevel4",
    guild_booster_lvl5: "BoostLevel5",
    guild_booster_lvl6: "BoostLevel6",
    guild_booster_lvl7: "BoostLevel7",
    guild_booster_lvl8: "BoostLevel8",
    guild_booster_lvl9: "BoostLevel9",
    legacy_username: "LegacyUsername",
    quest_completed: "QuestCompleted",
    bot_commands: "BotCommands",
    automod: "AutoMod",
    bot: "BotVerificado",
    supporter: "Supporter",
    certified_moderator: "CertifiedModerator",
    discord_employee: "DiscordEmployee"
};

// Função para calcular diferença em meses
function diffMonths(startDate, finalDate, roundUpFractionalMonths) {
    var start = startDate;
    var end = finalDate;
    var inverse = false;
    if (start > finalDate) {
        start = finalDate;
        end = startDate;
        inverse = true;
    }

    var yearsDifference = end.getFullYear() - start.getFullYear();
    var monthsDifference = end.getMonth() - start.getMonth();
    var daysDifference = end.getDate() - start.getDate();

    var monthCorrection = 0;
    if (roundUpFractionalMonths === true && daysDifference > 0) {
        monthCorrection = 1;
    } else if (roundUpFractionalMonths !== true && daysDifference < 0) {
        monthCorrection = -1;
    }
    return (
        (inverse ? -1 : 1) *
        (yearsDifference * 12 + monthsDifference + monthCorrection)
    );
}

// Mapeamento dos emblemas Nitro por tempo e seus requisitos em meses
const nitroBadges = [
    { name: '<:discordnitro:1291524260992389220>', minMonths: 0 },   // Menos de 1 mês
    { name: '<:bronze:1291523909648384010>', minMonths: 1 },         // Bronze - 1 mês
    { name: '<:silver:1291523928178823219>', minMonths: 3 },         // Silver - 3 meses
    { name: '<:gold:1291523950291189760>', minMonths: 6 },           // Gold - 6 meses
    { name: '<:platinum:1291523990694662194>', minMonths: 12 },      // Platinum - 12 meses
    { name: '<:diamond:1291524018448629874>', minMonths: 24 },       // Diamond - 24 meses
    { name: '<:emerald:1291524040917389434>', minMonths: 36 },       // Emerald - 36 meses
    { name: '<:ruby:1291524062593421445>', minMonths: 60 },          // Ruby - 60 meses
    { name: '<:fire:1291524088770072578>', minMonths: 72 }           // Fire - 72 meses
];

// Função para obter o emblema atual com base no número de meses de Nitro
function getNitroBadge(differenceInMonths) {
    for (let i = nitroBadges.length - 1; i >= 0; i--) {
        if (differenceInMonths >= nitroBadges[i].minMonths) {
            return nitroBadges[i].name;
        }
    }
    return nitroBadges[0].name; // Retorna o emblema padrão (menos de 1 mês) por padrão
}

// Função para obter o próximo emblema de Nitro e quanto tempo falta para ele
function getNextNitroBadge(differenceInMonths) {
    for (let i = 0; i < nitroBadges.length; i++) {
        if (differenceInMonths < nitroBadges[i].minMonths) {
            const monthsUntilNext = nitroBadges[i].minMonths - differenceInMonths;
            return {
                nextBadge: nitroBadges[i].name,
                monthsRemaining: monthsUntilNext
            };
        }
    }
    return null; // Retorna null se já estiver no emblema máximo
}

const fetchDiscordProfile = async (userId, isBot = false) => {
    const apiUrl = `https://discord.com/api/v10/users/${userId}/profile`;

    const response = await fetch(apiUrl, {
        headers: {
            Authorization: `MTE2MDQ0MzM1MDk4MjMzMjQxNg.GiislM.ldR1giJvv2uzxD_60_UqrKjzS4C_kXfvuWqBLM`,
            "Content-Type": "application/json",
        },
    });

    const data = await response.json();

    // Excluindo os campos indesejados
    delete data.guild_badges;
    delete data.mutual_guilds;
    delete data.connected_accounts;


    return data;
};

// Função para converter o ID do usuário em uma data de criação
function getUserCreationDate(userId) {
    const timestamp = Number(userId) / 4194304 + 1420070400000; // 1420070400000 é a data base do Discord
    return new Date(timestamp);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('perfil')
        .setDescription('Obtém o perfil de um usuário ou bot.')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Mencione o usuário ou bot para ver o perfil.')
                .setRequired(true)
        ),

    async execute(interaction) {


        const userId = interaction.options.getUser('usuario')

        const member = interaction.guild.members.cache.get(userId.id)
        const request = await fetchDiscordProfile(userId.id)


        const userProfile = {
            id: request.user.id,
            username: request.user.username,
            globalName: request.user.global_name || null,
            premiumType: request.premium_type === 0 ? "None"
                : request.premium_type === 1 ? "Nitro Classic"
                    : request.premium_type === 2 ? "Nitro"
                        : request.premium_type === 3 ? "Nitro Basic"
                            : null,
            premiumSince: request.premium_since || null,
            createdAt: getUserCreationDate(request.user.id).toISOString(),
            legacyUsername: request.legacy_username,
            aboutMe: request.user.bio || null,
            avatarUrl: request.user.avatar ? `https://cdn.discordapp.com/avatars/${request.user.id}/${request.user.avatar}.gif?size=4096` : null,
            bannerUrl: request.user.banner ? `https://cdn.discordapp.com/banners/${request.user.id}/${request.user.banner}.gif?size=4096` : null
        };

        // Preenchendo badges
        const badgesArray = [];
        if (request.badges) {
            request.badges.forEach(badge => {
                const badgeName = badgeNames[badge.id];
                if (badgeName) badgesArray.push(badgeName);
            });

            if (request.application && request.application.verified) {
                badgesArray.push("BotVerificado");
            }
        }

        // Definindo boostInfo como null por padrão
        let boostInfo = null;


        if (request.premium_type === 2 && request.premium_since) {
            const premiumType = "Nitro";

            // Converte a data ISO para um objeto Date
            const premiumStartDate = new Date(request.premium_since);
            const currentDate = new Date();


            const differenceInMonths = diffMonths(premiumStartDate, currentDate);

            let userBoost = "";
            let nextBoost = "";
            let nextBoostDate = null;

            const boostStartDateClone = new Date(premiumStartDate); // Clonar a data de início

            // Definir os níveis de boost com base na diferença de meses
            if (differenceInMonths >= 0 && differenceInMonths < 2) {
                userBoost = "BoostLevel1";
                nextBoost = "BoostLevel2";
                nextBoostDate = new Date(boostStartDateClone.setMonth(boostStartDateClone.getMonth() + 2));
            } else if (differenceInMonths >= 2 && differenceInMonths < 3) {
                userBoost = "BoostLevel2";
                nextBoost = "BoostLevel3";
                nextBoostDate = new Date(boostStartDateClone.setMonth(boostStartDateClone.getMonth() + 3));
            } else if (differenceInMonths >= 3 && differenceInMonths < 6) {
                userBoost = "BoostLevel3";
                nextBoost = "BoostLevel4";
                nextBoostDate = new Date(boostStartDateClone.setMonth(boostStartDateClone.getMonth() + 6));
            } else if (differenceInMonths >= 6 && differenceInMonths < 9) {
                userBoost = "BoostLevel4";
                nextBoost = "BoostLevel5";
                nextBoostDate = new Date(boostStartDateClone.setMonth(boostStartDateClone.getMonth() + 9));
            } else if (differenceInMonths >= 9 && differenceInMonths < 12) {
                userBoost = "BoostLevel5";
                nextBoost = "BoostLevel6";
                nextBoostDate = new Date(boostStartDateClone.setMonth(boostStartDateClone.getMonth() + 12));
            } else if (differenceInMonths >= 12 && differenceInMonths < 15) {
                userBoost = "BoostLevel6";
                nextBoost = "BoostLevel7";
                nextBoostDate = new Date(boostStartDateClone.setMonth(boostStartDateClone.getMonth() + 15));
            } else if (differenceInMonths >= 15 && differenceInMonths < 18) {
                userBoost = "BoostLevel7";
                nextBoost = "BoostLevel8";
                nextBoostDate = new Date(boostStartDateClone.setMonth(boostStartDateClone.getMonth() + 18));
            } else if (differenceInMonths >= 18 && differenceInMonths < 24) {
                userBoost = "BoostLevel8";
                nextBoost = "BoostLevel9";
                nextBoostDate = new Date(boostStartDateClone.setMonth(boostStartDateClone.getMonth() + 24));
            } else if (differenceInMonths >= 24) {
                userBoost = "BoostLevel9";
                nextBoost = "MaxLevelReached";
                nextBoostDate = "MaxLevelReached";
            }

            // Objeto de informações de boost
            boostInfo = {
                boost: userBoost,
                boostDate: premiumStartDate.toISOString(),
                nextBoost: nextBoost,
                nextBoostDate: nextBoostDate instanceof Date ? nextBoostDate.toISOString() : nextBoostDate,
            };
        }



        const result = {
            user: userProfile,
            profile: {
                badgesArray: badgesArray,
            },
            ...(boostInfo && { boostInfo: boostInfo }),
        }

        const {
            user: {
                id: userID,
                username: userTag,
                globalName: userDataNameGlobal = "Nome padrão",
                premiumSince: nitroData = null,
                legacyUsername: nameOrifinal = "Nome original",
                createdAt: createdAt,
                avatarUrl: AvatarUser
            } = {}, // Verifica se 'user' existe, se não, usa um objeto vazio
            profile: {
                badgesArray: badgesArrayUser = [],
            } = {}, // Verifica se 'profile' existe, se não, usa um objeto vazio
            boostInfo: {
                boost = null,
                boostDate = null,
                nextBoost = null,
                nextBoostDate = null
            } = {} // Verifica se 'boost' existe, se não, usa um objeto vazio
        } = result || {}; // Verifica se 'userData' existe, se não, usa um objeto vazio


        function convertBoostLevel(boost) {
            if (!boost) {
                return "No Boost Level"; // Retorna uma string padrão ou uma mensagem indicando que não há boost
            }
            return `Boost Level ${boost.replace(/\D/g, '')}`;
        }

        function convertNextBoostLevel(nextBoost) {
            if (!nextBoost) {
                return "No Next Boost Level"; // Retorna uma string padrão ou uma mensagem indicando que não há próximo boost
            }
            return `Boost Level ${nextBoost.replace(/\D/g, '')}`;
        }



        const stringData = nitroData
        const data = new Date(stringData)
        const boostDateTemp = data.getTime()

        const stringData2 = boostDate
        const data2 = new Date(stringData2)
        const nextBoostDateTemp = data2.getTime()

        function getBoostEmoji(boostLevel) {
            const emojiMap = {
                BoostLevel1: 'discordboost1:1291516445661986836',
                BoostLevel2: 'discordboost2:1291516467480625183',
                BoostLevel3: 'discordboost3:1291516484417486890',
                BoostLevel4: 'discordboost4:1291516508471824446',
                BoostLevel5: 'discordboost5:1291516534598013033',
                BoostLevel6: 'discordboost6:1291516570756972635',
                BoostLevel7: 'discordboost7:1291516695722328095',
                BoostLevel8: 'discordboost8:1291516717687767060',
                BoostLevel9: 'discordboost9:1291516746792173650',
            };

            return emojiMap[boostLevel] ? `<:${emojiMap[boostLevel]}>` : '❌';
        }




        // Inicia a construção da embed
        const embed = new EmbedBuilder()
            .setColor("#ba68c8")
            // .setAuthor({ name: `${userDataNameGlobal}`, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
            //  .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                {
                    name: '<:Member_list:1291541003236282398> Tag',
                    value: `\`\`\`${userTag}\`\`\``,
                    inline: true
                },
                {
                    name: '<:Discord_Copy_ID_white:1291541018436436049> ID',
                    value: `\`\`\`${userID}\`\`\``,
                    inline: true
                },
                {
                    name: `<:calendar_591598:1291538695412912249> Data de criação da conta`,
                    value: `<t:${Math.floor(new Date(createdAt).getTime() / 1000)}> (<t:${Math.floor(new Date(createdAt).getTime() / 1000)}:R>)`,
                    inline: false
                },
                // {
                //     name: `<:calendar_591607:1291538669349507192> Entrou no servidor em`,
                //     value: `<t:${~~(member.joinedTimestamp / 1000)}:f> (<t:${~~(member.joinedTimestamp / 1000)}:R>)`,
                //     inline: false
                // }

            )


        function getBadgeTitles(badgesArrayUser, boostDateTemp) {
            const badgeEmojis = {
                "Nitro": getNitroBadge(diffMonths(new Date(boostDateTemp), new Date(), false)), // Nitro será tratado separadamente
                "HypeSquadOnlineHouse1": '<:HypeSquadBravery:1282345459087708170>',
                "HypeSquadOnlineHouse2": '<:HypeSquadBrilliance:1282345686255407175>',
                "HypeSquadOnlineHouse3": '<:HypeSquadBalance:1282345852450508882>',
                "HypesquadEvents": '<:HypeSquadEvents:1282345297766383656>',
                "BugHunterLevel1": '<:BugHunter:1282346038530805770>',
                "BugHunterLevel2": '<:BugHunterGold:1282346110685544588>',
                "EarlySupporter": '<:EarlySupporter:1282346446615482500>', // Apoiador Inicial
                "verifiedDeveloper": '<:EarlyVerifiedBotDeveloper:1282346357436321814>', // Desenvolvedor verificado de bots pioneiros
                "VerifiedBotDeveloper": '<:EarlyVerifiedBotDeveloper:1282346357436321814>',
                "ActiveDeveloper": '<:DiscordActiveDeveloper:1291548196488740926>',
                "Partner": '<:discordpartner:1282344829837119560>',
                "Staff": '<:discordstaff:1282344645291933837>',
                "BoostLevel1": '<:discordboost1:1291516445661986836>',
                "BoostLevel2": '<:discordboost2:1291516467480625183>',
                "BoostLevel3": '<:discordboost3:1291516484417486890>',
                "BoostLevel4": '<:discordboost4:1291516508471824446>',
                "BoostLevel5": '<:discordboost5:1291516534598013033>',
                "BoostLevel6": '<:discordboost6:1291516570756972635>',
                "BoostLevel7": '<:discordboost7:1291516695722328095>',
                "BoostLevel8": '<:discordboost8:1291516717687767060>',
                "BoostLevel9": '<:discordboost9:1291516746792173650>',
                "LegacyUsername": '<:username:1291540105911210105>',
                "QuestCompleted": '<:quest:1291546173068284014>',
                "BotCommands": '<:supportscommands:1291546335983570999>',
                "AutoMod": '<:automod:1291546475314151444>',
                "BotVerificado": '<:VerifiedBot:1291546799357563044>',
                "CertifiedModerator": '<:discordmod:1291546543559671828>',
                "DiscordEmployee": '<:discordstaff:1282344645291933837>',
            };

            // Verifica se o array de emblemas é válido
            if (!Array.isArray(badgesArrayUser) || badgesArrayUser.length === 0) {
                return ''; // Retorna uma string vazia se não houver emblemas
            }

            // Montar os emblemas, exceto o Nitro
            let badgeTitles = badgesArrayUser
                .filter(badge => badge !== "Nitro") // Remove Nitro para evitar duplicidade
                .map(badge => badgeEmojis[badge] || '') // Se o emblema existir, exibe, caso contrário, string vazia.
                .join(' ');

            // Adiciona Nitro apenas se o usuário tiver o emblema "Nitro" no array badgesArrayUser
            if (badgesArrayUser.includes("Nitro")) {
                const nitroBadge = getNitroBadge(diffMonths(new Date(boostDateTemp), new Date(), false));
                if (nitroBadge) {
                    badgeTitles += ` ${nitroBadge}`;
                }
            }

            // Remove espaços extras
            badgeTitles = badgeTitles.trim();

            return badgeTitles;
        }

        // Exemplo de uso
        const badgeTitles = getBadgeTitles(badgesArrayUser, boostDateTemp);

        // Só define o título da embed se houver emblemas
        if (badgeTitles) {
            embed.setDescription(`${badgeTitles}`);
        }

        // Exemplo de uso
        if (boostDateTemp) {
            embed.addFields({
                name: `<:discordnitro:1291524260992389220> Assinante Nitro desde`,
                value: `<t:${~~(boostDateTemp / 1000)}:f> (<t:${~~(boostDateTemp / 1000)}:R>)`,
                inline: false
            });
        }




        // Adiciona o campo relacionado ao próximo Boost apenas se a data existir
        if (nextBoostDateTemp) {
            embed.addFields({
                name: `<:nitro_boost1:1291528943240876082> Impulsionando servidor desde`,
                value: `<t:${~~(nextBoostDateTemp / 1000)}:f> (<t:${~~(nextBoostDateTemp / 1000)}:R>)`,
                inline: false
            });
        }

        // Adiciona o campo do Boost Level atual se o boost existir
        if (boost) {
            let emoji = getBoostEmoji(boost);
            embed.addFields({
                name: `Nível atual`,
                value: `${emoji} ${convertBoostLevel(boost)}`,
                inline: true
            });
        }

        // Adiciona o campo do próximo Boost Level se o nextBoost existir
        if (nextBoost) {
            let emoji2 = getBoostEmoji(nextBoost);
            embed.addFields({
                name: `Próximo Nível`,
                value: `${emoji2} ${convertNextBoostLevel(nextBoost)}`,
                inline: true
            });
        }
        // Função para calcular a diferença em meses, dias e horas
        function calculateTimeDifference(startDate, endDate) {
            const totalMilliseconds = endDate - startDate;

            if (totalMilliseconds < 0) {
                return { months: 0, days: 0, hours: 0 };
            }

            const totalSeconds = Math.floor(totalMilliseconds / 1000);
            const totalMinutes = Math.floor(totalSeconds / 60);
            const totalHours = Math.floor(totalMinutes / 60);
            const totalDays = Math.floor(totalHours / 24);
            const totalMonths = Math.floor(totalDays / 30); // Aproximação de meses como 30 dias

            const months = totalMonths;
            const days = totalDays % 30;
            const hours = totalHours % 24;

            return { months, days, hours };
        }


        // Exemplo de uso
        if (boostDateTemp) {
            const currentDate = new Date(); // Data atual
            const boostStartDate = new Date(boostDateTemp); // Data de início do boost
            const differenceInMonths = diffMonths(boostStartDate, currentDate, false); // Calcula a diferença

            const nitroBadge = getNitroBadge(differenceInMonths); // Obtém o emblema atual
            const nextNitroBadgeInfo = getNextNitroBadge(differenceInMonths); // Obtém o próximo emblema e meses restantes

            const monthsToNextBadge = nextNitroBadgeInfo ? nextNitroBadgeInfo.monthsRemaining : 0;
            const nextBadgeDate = new Date(boostStartDate);
            nextBadgeDate.setMonth(nextBadgeDate.getMonth() + (differenceInMonths + monthsToNextBadge));

            // Calcula a diferença de tempo até o próximo emblema
            const timeUntilNextBadge = calculateTimeDifference(currentDate, nextBadgeDate);

            // Calcula a diferença de tempo desde o início do boost até agora
            const timeSinceBoostStarted = calculateTimeDifference(boostStartDate, currentDate);

            let nitroFieldValue = `Emblema atual: ${nitroBadge} ` +
                `**${timeSinceBoostStarted.months} mês, ${timeSinceBoostStarted.days} dias, ${timeSinceBoostStarted.hours} horas**`;

            if (nextNitroBadgeInfo) {
                nitroFieldValue += `\nPróximo emblema: ${nextNitroBadgeInfo.nextBadge} ` +
                    `**${timeUntilNextBadge.months} mês, ${timeUntilNextBadge.days} dias, ${timeUntilNextBadge.hours} horas**`;
            } else {
                nitroFieldValue += `\nVocê já atingiu o emblema máximo!`;
            }

            embed.addFields({
                name: `<:sparkles_nitro_boost:1291533643927519242> Evolução insígnia de nitro`,
                value: nitroFieldValue,
                inline: false
            });
        }


        interaction.reply({ embeds: [embed] })

    }
}