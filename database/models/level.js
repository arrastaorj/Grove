const { Schema, model } = require('mongoose');

const levelSchema = new Schema({
  userId: { type: String, required: true, },
  guildId: { type: String, required: true, },
  xp: { type: Number, default: 0, },
  level: { type: Number, default: 0, },
  requiredXp: { type: Number, default: 100 } // XP necessário para o próximo nível

})

module.exports = model('Level', levelSchema);