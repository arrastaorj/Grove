const db = require('mongoose');

const cargos = new db.Schema({
    guildId: { type: String, required: true },
    cargos: { type: [String], default: [] }, // Mude aqui para um array
    isActive: { type: Boolean, default: false } // Se não tiver esse campo, adicione
});

module.exports = db.model('autorole', cargos);
