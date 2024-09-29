const calculateLevelXp = (level) => {

    const baseXp = 100;
    const xpGrowthRate = 1.0;

    return Math.floor(baseXp * Math.pow(xpGrowthRate, level));
}

module.exports = calculateLevelXp;