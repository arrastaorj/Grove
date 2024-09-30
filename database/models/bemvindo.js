const db = require('mongoose')

const cmd = new db.Schema({
    guildId: { type: String, required: true },
    canal1: { type: String },
    welcomeImage: { type: String, default: null },
    isActive: { type: Boolean, default: false },
})


module.exports = db.model('bemvindo', cmd)
