const db = require('mongoose');

const automodConfig = new db.Schema({
       guildId: {
        type: String,
        required: true,
    },
    keywordBlockEnabled: {
        type: Boolean,
        default: false // Indica se a proteção contra palavras-chave está ativada ou desativada
    },
    messageSpamBlockEnabled: {
        type: Boolean,
        default: false // Indica se a proteção contra spam de mensagens está ativada ou desativada
    },
    mentionLimit: {
        type: Number,
        default: 0 // Armazena o limite de menções configurado pelo usuário
    },
    blockedKeywords: {
        type: [String],
        default: [] // Armazena uma lista de palavras-chave bloqueadas
    }
});

module.exports = db.model('automode', automodConfig);
