require('dotenv').config();


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

// Mapeamento dos emblemas Nitro por tempo e seus requisitos em meses
const nitroBadges = [
    { name: '<:discordnitro:1285332037095522446>', minMonths: 0 },   // Menos de 1 mês
    { name: '<:bronze:1293024247471411220>', minMonths: 1 },         // Bronze - 1 mês
    { name: '<:silver:1293024307630575646>', minMonths: 3 },         // Silver - 3 meses
    { name: '<:gold:1293024383652204655>', minMonths: 6 },           // Gold - 6 meses
    { name: '<:platinum:1293024410181042246>', minMonths: 12 },      // Platinum - 12 meses
    { name: '<:diamond:1293024433035935834>', minMonths: 24 },       // Diamond - 24 meses
    { name: '<:emerald:1293024456398344233>', minMonths: 36 },       // Emerald - 36 meses
    { name: '<:ruby:1293024478959239170>', minMonths: 60 },          // Ruby - 60 meses
    { name: '<:fire:1293024508352925740>', minMonths: 72 }           // Fire - 72 meses
]

const fetchDiscordProfile = async (userId, isBot = false) => {
    const apiUrl = `https://discord.com/api/v10/users/${userId}/profile`;

    const response = await fetch(apiUrl, {
        headers: {
            Authorization: process.env.tokenAPI,
            "Content-Type": "application/json",
        },
    });

    const request = await response.json();


    // Excluindo os campos indesejados
    delete request.guild_badges;
    delete request.mutual_guilds;
    delete request.connected_accounts;
    return request;
}

// Função principal para processar a resposta da API e montar o resultado
async function processUserProfile(request) {
    // Construindo o objeto do perfil do usuário
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
        createdAt: getUserCreationDate(request.user.id).toISOString(), // Função para calcular a data de criação
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

    // Verifica se o usuário é Nitro e tem boosts ativos
    if (request.premium_type === 2 && request.premium_since) {
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
            nextBoostDate = new Date(boostStartDateClone.setMonth(boostStartStartDateClone.getMonth() + 15));
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

        // Criando o objeto de informações de boost
        boostInfo = {
            boost: userBoost,
            boostDate: premiumStartDate.toISOString(),
            nextBoost: nextBoost,
            nextBoostDate: nextBoostDate instanceof Date ? nextBoostDate.toISOString() : nextBoostDate,
        };
    }

    // Construindo o resultado final
    const result = {
        user: userProfile,
        profile: {
            badgesArray: badgesArray,
        },
        ...(boostInfo && { boostInfo: boostInfo }), // Inclui boostInfo se estiver presente
    };
    return result;
}

// Função para calcular diferença em meses
function diffMonths(startDate, finalDate, roundUpFractionalMonths) {
    let start = startDate;
    let end = finalDate;
    let inverse = false;
    if (start > finalDate) {
        start = finalDate;
        end = startDate;
        inverse = true;
    }

    const yearsDifference = end.getFullYear() - start.getFullYear();
    const monthsDifference = end.getMonth() - start.getMonth();
    const daysDifference = end.getDate() - start.getDate();

    const monthCorrection = roundUpFractionalMonths && daysDifference > 0 ? 1
        : !roundUpFractionalMonths && daysDifference < 0 ? -1
            : 0;

    return (inverse ? -1 : 1) * (yearsDifference * 12 + monthsDifference + monthCorrection);
}

// Função para converter o ID do usuário em uma data de criação
function getUserCreationDate(userId) {
    const timestamp = Number(userId) / 4194304 + 1420070400000; // Base do Discord: 1420070400000
    return new Date(timestamp);
}

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

function getBadgeTitles(badgesArrayUser, boostDateTemp) {
    const badgeEmojis = {
        // NITRO E BOOSTER
        "Nitro": getNitroBadge(diffMonths(new Date(boostDateTemp), new Date(), false)), // Nitro será tratado separadamente
        "BoostLevel1": '<:discordboost1:1285331558680498236>',
        "BoostLevel2": '<:discordboost2:1285331584848756797>',
        "BoostLevel3": '<:discordboost3:1285331608689184849>',
        "BoostLevel4": '<:discordboost4:1285331629484806154>',
        "BoostLevel5": '<:discordboost5:1285331650007535798>',
        "BoostLevel6": '<:discordboost6:1285331672379949168>',
        "BoostLevel7": '<:discordboost7:1285331698418057288>',
        "BoostLevel8": '<:discordboost8:1285331726192742492>',
        "BoostLevel9": '<:discordboost9:1285331744446484572>',
        //////////////////////////////////////////////////////////

        // VERIFICADOS
        "Partner": '<:discordpartner:1285332063574036584>', // DONO DE SERVIDOR PARCEIRO
        "QuestCompleted": '<:quest:1285332455540129843>', // Completou uma Missão
        "LegacyUsername": '<:username:1285332512134004829>', // Originalmente NOME COM #
        "verifiedDeveloper": '<:discordbotdev:1285331912763900006>', // Desenvolvedor Verificado de Bots Pioneiro
        "ActiveDeveloper": '<:activedeveloper:1285331864848175175>', // Desenvolvedor(a) ativo(a)
        "HypeSquadOnlineHouse1": '<:hypesquadbravery:1285332158306717749>', // bravery do HypeSquad
        "HypeSquadOnlineHouse2": '<:hypesquadbrilliance:1285332237071679582>', // brilliance do HypeSquad
        "HypeSquadOnlineHouse3": '<:hypesquadbalance:1285332202111893595>', // Balance do HypeSquad
        "HypesquadEvents": '<:hypesquadevents:1285332266419224586>', // Eventos do HypeSquad
        "EarlySupporter": '<:discordearlysupporter:1285331982045282325>', // Apoiador Inicial
        "CertifiedModerator": '<:discordmod:1285332004585603117>', // EX ALUNO DO PROGRAMA DE MODERADORES
        "BugHunterLevel2": '<:discordbughunter2:1285331960905859203>', // DISCORD BUG HUNTER LEVEL 2
        "BugHunterLevel1": '<:discordbughunter1:1285331941037572116>', // DISCORD BUG HUNTER LEVEL 1
        //////////////////////////////////////////////////////////


        "Staff": '<:discordstaff:1285332089176195164>',
        "DiscordEmployee": '<:discordmod:1285332004585603117>',
        "VerifiedBotDeveloper": '<:discordbotdev:1285331912763900006>',

        //BOTS
        "AutoMod": '<:automod:1285331890072715339>',
        "BotCommands": '<:supportscommands:1285332488310489098>',
        "BotVerificado": '<:VerifiedApp:1285332872173191188>',
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

function getBoostEmoji(boostLevel) {
    const emojiMap = {
        BoostLevel1: 'discordboost1:1285331558680498236',
        BoostLevel2: 'discordboost2:1285331584848756797',
        BoostLevel3: 'discordboost3:1285331608689184849',
        BoostLevel4: 'discordboost4:1285331629484806154',
        BoostLevel5: 'discordboost5:1285331650007535798',
        BoostLevel6: 'discordboost6:1285331672379949168',
        BoostLevel7: 'discordboost7:1285331698418057288',
        BoostLevel8: 'discordboost8:1285331726192742492',
        BoostLevel9: 'discordboost9:1285331744446484572',
    };

    return emojiMap[boostLevel] ? `<:${emojiMap[boostLevel]}>` : '❌';
}

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

module.exports = {
    fetchDiscordProfile,
    processUserProfile,
    diffMonths,
    getBadgeTitles,
    getNextNitroBadge,
    getNitroBadge,
    getBoostEmoji,
    convertBoostLevel,
    convertNextBoostLevel,
    calculateTimeDifference
}
