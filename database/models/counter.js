const db = require('mongoose')

const CounterSchema = new db.Schema({
    guildId: { type: String, required: true },
    users: { type: Number },
    members: { type: Number },
    bots: { type: Number },
    userChannel: { type: String },
    memberChannel: { type: String },
    botChannel: { type: String },
})

module.exports = db.model('counter', CounterSchema)