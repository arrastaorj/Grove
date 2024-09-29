function getBadgeEmoji(badge) {
    switch (badge) {
        case 'Nitro':
            return '<:nitro:1284902411894521876>';
        case 'BoostLevel1':
            return '<:boost1:1284902479854571610>';
        case 'BoostLevel2':
            return '<:boost2:1284902501346312396>';
        case 'BoostLevel3':
            return '<:boost3:1284902527560847381>';
        case 'BoostLevel4':
            return '<:boost4:1284902546137157784>';
        case 'BoostLevel5':
            return '<:boost5:1284902568044134551>';
        case 'BoostLevel6':
            return '<:boost6:1284902586146619473>';
        case 'BoostLevel7':
            return '<:boost7:1284902603519430670>';
        case 'BoostLevel8':
            return '<:boost8:1284902623199105096>';
        case 'BoostLevel9':
            return '<:boost9:1284902642526584852>';
        case 'HypeSquadOnlineHouse1':
            return '<:HypeSquadBravery:1282353144805851238>';
        case 'HypeSquadOnlineHouse2':
            return '<:HypeSquadBrilliance:1282353194625925170>';
        case 'HypeSquadOnlineHouse3':
            return '<:HypeSquadBalance:1282353224929509505>';
        case 'ActiveDeveloper':
            return '<:ActiveDeveloper:1282353335319527536>';
        case 'PremiumEarlySupporter':
            return '<:EarlySupporter:1282353409990852731>';
        case 'VerifiedDeveloper':
            return '<:EarlyVerifiedBotDeveloper:1282353381851140136>';
        case 'CertifiedModerator':
            return '<:certifiedmoderator:1282353057816121515>';
        case 'TAG':
            return '<:original:1284902657894514751>';
        case 'VerifiedBot':
            return '<:verifiedbot:1282353437362618501>';
        case 'ApplicationCommandBadge':
            return '<:slashcommands:1284902451358601218>';
        case 'ApplicationAutoModerationRuleCreateBadge':
            return '<:automod:1284901767573934159>';
        case 'Hypesquad':
            return '<:HypeSquadEvents:1282353106063196242>';
        case 'BugHunterLevel1':
            return '<:BugHunter:1282353259738169365>';
        case 'BugHunterLevel2':
            return '<:BugHunterGold:1282353295607992411>';
        case 'BugHunterLevel3':
            return '<:bughunter3:1284905938880434311>';
        default:
            return '';
    }
}

function getFormattedBadge(badge) {
    return getBadgeEmoji(badge)
}

function hasBadge(badgesArrayUser, badge) {
    if (!badgesArrayUser || badgesArrayUser.length === 0) {
        return false; // Retorna falso se o array de insígnias do usuário estiver vazio ou não existir
    }
    return badgesArrayUser.includes(badge);
}



function formatBadge(badge) {
    const badgeEmojis = {
        'HypeSquadOnlineHouse1': '<:HypeSquadBravery:1282353144805851238>',
        'HypeSquadOnlineHouse2': '<:HypeSquadBrilliance:1282353194625925170>',
        'HypeSquadOnlineHouse3': '<:HypeSquadBalance:1282353224929509505>',
        'ActiveDeveloper': '<:ActiveDeveloper:1282353335319527536>',
        'PremiumEarlySupporter': '<:EarlySupporter:1282353409990852731>',
        'VerifiedDeveloper': '<:EarlyVerifiedBotDeveloper:1282353381851140136>',
        'CertifiedModerator': '<:certifiedmoderator:1282353057816121515>',
        'TAG': '<:original:1284902657894514751>',
        'VerifiedBot': '<:verifiedbot:1282353437362618501>',
        'ApplicationCommandBadge': '<:slashcommands:1284902451358601218>',
        'ApplicationAutoModerationRuleCreateBadge': '<:automod:1284901767573934159>',
        'Hypesquad': "<:HypeSquadEvents:1282353106063196242>",
        'BugHunterLevel1': "<:BugHunter:1282353259738169365>",
        'BugHunterLevel2': "<:BugHunterGold:1282353295607992411>",
        'BugHunterLevel3': "<:bughunter3:1284905938880434311>",
    };

    return badgeEmojis[badge] || '';
}


module.exports = {
    getBadgeEmoji,
    getFormattedBadge,
    hasBadge,
    formatBadge,
}