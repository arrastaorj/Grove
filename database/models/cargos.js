const db = require('mongoose')

const cargos = new db.Schema({
    guildId: { type: String, required: true },
    msgID: { type: String },
    logsId: { type: String },
    Img: { type: String },
    cargo1Id: { type: String },
    cargo2Id: { type: String },
    cargo3Id: { type: String },
    cargo4Id: { type: String },
    cargo5Id: { type: String },
    cargo6Id: { type: String },
    cargo7Id: { type: String },
    cargo8Id: { type: String },
    cargo9Id: { type: String },
    cargo10Id: { type: String }
});


module.exports = db.model('Guild', cargos)
