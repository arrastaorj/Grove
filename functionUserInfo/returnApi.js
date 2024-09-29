const badgesModule = require('./badges')

async function processUserBadges(user) {
    const userDataResponse = await fetch(`https://groveapi.squareweb.app/user/${user.id}`);
    const userData = await userDataResponse.json();

    const {
        user: { legacyUsername: nameOriginal },
        profile: { badgesArray: badgesArrayUser },
    } = userData;

    const desiredBadges = [
        'Nitro', 'BoostLevel1', 'BoostLevel2', 'BoostLevel3', 'BoostLevel4',
        'BoostLevel5', 'BoostLevel6', 'BoostLevel7', 'BoostLevel8', 'BoostLevel9',
        'HypeSquadOnlineHouse1', 'HypeSquadOnlineHouse2', 'HypeSquadOnlineHouse3',
        'ActiveDeveloper', 'PremiumEarlySupporter', 'VerifiedDeveloper',
        'CertifiedModerator', 'VerifiedBot', 'ApplicationCommandBadge',
        'ApplicationAutoModerationRuleCreateBadge', 'Hypesquad',
        'BugHunterLevel1', 'BugHunterLevel2', 'BugHunterLevel3'
    ];

    let list = [];

    desiredBadges.forEach(badge => {

        if (Array.isArray(badgesArrayUser) && badgesModule.hasBadge(badgesArrayUser, badge)) {
            list.push(badge);
        }
    });

    if (nameOriginal !== null && nameOriginal !== undefined) {
        list.push("TAG");
    }


    if (list.length > 0) {

        return list
            .map(badge => badgesModule.getFormattedBadge(badge))
            .join(',');
    } else {

        return null;
    }
}

module.exports = processUserBadges
