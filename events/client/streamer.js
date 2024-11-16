const express = require('express');
const client = require("../../index");
const axios = require('axios');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const Stremer = require('../../database/models/stremer');
require('dotenv').config();

const twitchClientId = process.env.twitchClientId;
const twitchClientSecret = process.env.twitchClientSecret;

//https://grovenotific.discloud.app/webhooks/twitch

const webhookCallbackUrl = 'https://grovenotific.discloud.app/webhooks/twitch';

let twitchAccessToken = '';

async function getTwitchAccessToken() {
    try {
        const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
            params: {
                client_id: twitchClientId,
                client_secret: twitchClientSecret,
                grant_type: 'client_credentials'
            }
        });
        twitchAccessToken = response.data.access_token;
    } catch (error) {
        console.error('Erro ao obter o token de acesso da Twitch:', error.response?.data || error.message);
    }
}

async function getUserIdByUsername(username) {
    try {
        const response = await axios.get('https://api.twitch.tv/helix/users', {
            headers: {
                'Client-ID': twitchClientId,
                'Authorization': `Bearer ${twitchAccessToken}`
            },
            params: {
                login: username
            }
        });

        const user = response.data.data[0];
        return user ? user.id : null;
    } catch (error) {
        console.error('Erro ao obter o ID do usuário da Twitch:', error.response?.data || error.message);
        return null;
    }
}




async function checkIfSubscriptionExists(userId) {
    try {
        const response = await axios.get('https://api.twitch.tv/helix/eventsub/subscriptions', {
            headers: {
                'Client-ID': twitchClientId,
                'Authorization': `Bearer ${twitchAccessToken}`
            }
        });

        const existingSubscription = response.data.data.find(
            subscription =>
                subscription.condition.broadcaster_user_id === userId &&
                subscription.type === 'stream.online'
        );

        return !!existingSubscription;
    } catch (error) {
        console.error('Erro ao verificar as inscrições do EventSub:', error.response?.data || error.message);
        return false;
    }
}

async function subscribeToEventSub(username) {
    const userId = await getUserIdByUsername(username);
    if (!userId) {
        console.error(`Não foi possível encontrar o usuário ${username} na Twitch.`);
        return;
    }

    const subscriptionExists = await checkIfSubscriptionExists(userId);
    if (subscriptionExists) {
        console.log(`Inscrição já existe para ${username}. Ignorando criação duplicada.`);
        return;
    }

    const headers = {
        'Client-ID': twitchClientId,
        'Authorization': `Bearer ${twitchAccessToken}`,
        'Content-Type': 'application/json'
    };

    const eventTypes = ['stream.online', 'stream.offline'];

    try {
        for (const eventType of eventTypes) {
            await axios.post(
                'https://api.twitch.tv/helix/eventsub/subscriptions',
                {
                    type: eventType,
                    version: '1',
                    condition: { broadcaster_user_id: userId },
                    transport: {
                        method: 'webhook',
                        callback: webhookCallbackUrl,
                        secret: 'seu_segredo_aleatorio_aqui'
                    }
                },
                { headers }
            );
            console.log(`Inscrição no EventSub para ${eventType} do usuário ${username} foi criada com sucesso.`);
        }
    } catch (error) {
        console.error('Erro ao se inscrever no EventSub da Twitch:', error.response?.data || error.message);
    }
}




// Função para obter informações do jogo
function getGameInfo(gameId) {
    return axios.get(`https://api.twitch.tv/helix/games`, {
        headers: {
            'Client-ID': twitchClientId,
            'Authorization': `Bearer ${twitchAccessToken}`
        },
        params: {
            id: gameId
        }
    })
        .then(response => {

            return response.data.data[0]; // Retorna os dados do jogo
        })


        .catch(error => {
            console.error('Erro ao obter as informações do jogo:', error.response.data);
            return null;
        });
}



async function handleEventSubNotification(req, res) {
    const messageType = req.headers['twitch-eventsub-message-type'];

    if (messageType === 'webhook_callback_verification') {
        return res.send(req.body.challenge);
    }

    if (messageType === 'notification') {
        const event = req.body.event;

        const { broadcaster_user_name: userName, broadcaster_user_id: userId, game_id: gameId } = event;

        const streamerConfig = await Stremer.findOne({ stremer: userName });
        const guild = client.guilds.cache.get(streamerConfig.guildId);
        const member = guild?.members.cache.get(streamerConfig.discordMemberId);
        const role = guild?.roles.cache.get(streamerConfig.cargoEmLive);

        let avatarUrl = '';
        try {
            const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
                headers: {
                    'Client-ID': twitchClientId,
                    'Authorization': `Bearer ${twitchAccessToken}`
                },
                params: { id: userId }
            });
            avatarUrl = userResponse.data.data[0]?.profile_image_url || '';
        } catch (error) {
            console.error('Erro ao obter avatar do streamer:', error.response?.data || error.message);
        }


        if (event.type === 'live') {


            const response = await axios.get(`https://api.twitch.tv/helix/streams`, {
                headers: {
                    'Client-ID': twitchClientId,
                    'Authorization': `Bearer ${twitchAccessToken}`
                },
                params: {
                    user_login: userName
                }
            })

            const streamData = response.data.data[0];

            const [gameInfo] = await Promise.all([

                getGameInfo(streamData.game_id)
            ])


            const gameImageUrl = gameInfo.box_art_url.replace(/-\{width\}x\{height\}/, "");

            const liveButton = new ButtonBuilder()
                .setLabel('Assistir na Twitch')
                .setStyle(ButtonStyle.Link)
                .setURL(`https://www.twitch.tv/${userName}`);
            const row = new ActionRowBuilder().addComponents(liveButton);

            const embed = new EmbedBuilder()
                .setColor('#9146FF')
                .setAuthor({ name: `Twitch` })
                .setTitle(`<:Twitch:1303157770014560357> ${userName} - Twitch`)
                .addFields(
                    { name: 'Título da Live', value: streamData.title || 'Título ainda não disponível', inline: true },
                )
                .setURL(`https://www.twitch.tv/${userName}`)
                .setThumbnail(avatarUrl)
                .setImage(gameImageUrl) // Imagem do jogo
                .setFooter({ text: 'Assista na Twitch', iconURL: `${avatarUrl}` })
                .setTimestamp()

            sendNotification(streamerConfig.canal1, {
                content: `<@${streamerConfig.discordMemberId}> Está ao vivo na Twitch!`,
                embeds: [embed],
                components: [row]
            });

            if (member && role) {
                await member.roles.add(role).catch(console.error);
                console.log(`Cargo 'EM LIVE' adicionado ao membro ${member.user.tag}`);
            } else {
                console.error('Membro ou cargo não encontrado para adição.');
            }

        } else {
            if (member && role) {
                await member.roles.remove(role).catch(console.error);
                console.log(`Cargo 'EM LIVE' removido do membro ${member.user.tag}`);
            } else {
                console.error('Membro ou cargo não encontrado para remoção.');
            }
        }

        return res.sendStatus(200);
    }
}

function sendNotification(channelId, message) {
    const channel = client.channels.cache.get(channelId);
    if (channel) {
        channel.send(message).catch(console.error);
    } else {
        console.error('Canal de notificação não encontrado.');
    }
}

const app = express();
app.use(express.json());

app.post('/webhooks/twitch', handleEventSubNotification);

client.once('ready', async () => {
    await getTwitchAccessToken();
    const streamers = await Stremer.find();
    streamers.forEach(stremer => subscribeToEventSub(stremer.stremer));

    const changeStream = Stremer.watch();
    changeStream.on('change', (change) => {
        if (change.operationType === 'insert') {
            const newStreamer = change.fullDocument.stremer;
            console.log(`Novo streamer adicionado: ${newStreamer}`);
            subscribeToEventSub(newStreamer);
        }
    });
})

app.listen(8080, () => {
    console.log('Servidor está rodando na porta 8080')
})
