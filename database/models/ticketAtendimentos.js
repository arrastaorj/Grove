const db = require('mongoose')


const atendenteSchema = new db.Schema({
    guildId: { type: String, required: true },
    userId: { type: String, required: true }, // ID do usuário atendente
    atendimentosRealizados: { type: Number, default: 0 } // Contagem de atendimentos
});


module.exports = db.model('atendente', atendenteSchema)

