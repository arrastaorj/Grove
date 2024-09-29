const { Schema, model } = require('mongoose')

const cmd = new Schema({
    userId: { type: String, required: true, },
    guildId: { type: String, required: true, },
    sobreMim: { type: String },
})

module.exports = model('Sobre', cmd)