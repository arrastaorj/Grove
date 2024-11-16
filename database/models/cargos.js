const db = require('mongoose')

const cargos = new db.Schema({

    guildId: { type: String, required: true, index: true },
    cargosId: { type: String, required: true, index: true },

    title: { type: String },
    description: { type: String },
    logsId: { type: String },
    Img: { type: String },
    cargos: { type: [String], default: [] }
});


module.exports = db.model('selectCargos', cargos)
