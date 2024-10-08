const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js')

const {
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
} = require('../../api/userinfo')


module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Obtém o perfil de um usuário ou bot.')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Mencione o usuário ou bot para ver o perfil.')
                .setRequired(true)
        ),

    async execute(interaction) {

        const userId = interaction.options.getUser('usuario').id
        const member = interaction.guild.members.cache.get(userId)
        const request = await fetchDiscordProfile(userId)
        const profileData = await processUserProfile(request)


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
        } = profileData || {}; // Verifica se 'userData' existe, se não, usa um objeto vazio


        const stringData = nitroData
        const data = new Date(stringData)
        const boostDateTemp = data.getTime()

        const stringData2 = boostDate
        const data2 = new Date(stringData2)
        const nextBoostDateTemp = data2.getTime()


        // Inicia a construção da embed
        const embed = new EmbedBuilder()
            .setColor("#ba68c8")
            .setAuthor({ name: `${userDataNameGlobal || userTag}`, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                {
                    name: '<:Member_list:1293025114673250454> Menção',
                    value: `\`\`\`${userTag}\`\`\``,
                    inline: true
                },
                {
                    name: '<:Discord_Copy_ID_white:1293025139365249065> ID',
                    value: `\`\`\`${userID}\`\`\``,
                    inline: true
                },
                {
                    name: `<:calendar_591598:1293025043273744425> Data de criação da conta`,
                    value: `<t:${Math.floor(new Date(createdAt).getTime() / 1000)}> (<t:${Math.floor(new Date(createdAt).getTime() / 1000)}:R>)`,
                    inline: false
                },
                {
                    name: `<:calendar_591607:1293025062785515591> Entrou no servidor em`,
                    value: `<t:${~~(member.joinedTimestamp / 1000)}:f> (<t:${~~(member.joinedTimestamp / 1000)}:R>)`,
                    inline: false
                }

            )

        // Exemplo de uso
        const badgeTitles = getBadgeTitles(badgesArrayUser, boostDateTemp);

        // Só define o título da embed se houver emblemas
        if (badgeTitles) {
            embed.setDescription(`${badgeTitles}`);
        }

        // Exemplo de uso
        if (boostDateTemp) {
            embed.addFields({
                name: `<:discordnitro:1285332037095522446> Assinante Nitro desde`,
                value: `<t:${~~(boostDateTemp / 1000)}:f> (<t:${~~(boostDateTemp / 1000)}:R>)`,
                inline: false
            });
        }

        // Adiciona o campo relacionado ao próximo Boost apenas se a data existir
        if (nextBoostDateTemp) {
            embed.addFields({
                name: `<:nitro_boost1:1293025585144266752> Impulsionando servidor desde`,
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
                name: `<:sparkles_nitro_boost:1293025096184893471> Evolução insígnia de nitro`,
                value: nitroFieldValue,
                inline: false
            })
        }

        interaction.reply({ embeds: [embed] })

    }
}