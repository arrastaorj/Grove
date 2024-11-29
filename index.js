const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js')
const connectiondb = require("./database/connect")
require('dotenv').config()

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User,
        Partials.GuildMember,
        Partials.Reaction
    ]
})

client.slashCommands = new Collection()


module.exports = client;

require('./handler')(client)
connectiondb.start()

//tokenGrove//tokenGroveTest

client.login(process.env.tokenGrove)

