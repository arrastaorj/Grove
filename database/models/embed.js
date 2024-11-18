const db = require('mongoose')

const cmd = new db.Schema({
    guildId: { type: String, required: true },
    canal1: { type: String },
    canal2: { type: String },
    canal3: { type: String },

});


module.exports = db.model('embed', cmd)
