const db = require('mongoose')

const cmd = new db.Schema({
    guildId: { type: String, required: true },

    canal1: { type: String },
    canalLog: { type: String },
    categoria: { type: String },
    nomeBotao: { type: String },
    cargo: { type: String },
    titulo02: { type: String },
    descrição02: { type: String },
    createdVoicelID: { type: String },
    createdChannelID: { type: String },
    userId: { type: String },
    atendenteId: { type: String },
});


module.exports = db.model('ticket', cmd)
