const db = require('mongoose')

const cmd = new db.Schema({
    guildId: { type: String, required: true },
    canal1: { type: String },

});


module.exports = db.model('meme', cmd)
