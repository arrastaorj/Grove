const { Schema, model } = require('mongoose');

const stremerSchema = new Schema({
    guildId: { type: String, required: true },
    stremer: { type: String, required: true },
    discordMemberId: { type: String, required: true },
    canal1: { type: String, required: true },
    cargoEmLive: { type: String, required: false },
})

module.exports = model('Stremer', stremerSchema);
