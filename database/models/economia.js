const { Schema, model } = require('mongoose');

const userSchema = new Schema({
  userId: {
    type: String,
    required: true,
  },
  guildId: {
    type: String,
    required: true,
  },
  saldo: {
    type: Number,
    default: 0,
    required: true,
  },
  bank: {
    type: Number,
    default: 0,
    required: true,
  },
  lastDaily: {
    type: Number,
    reqired: true,
  },
  begTimeout: {
    type: Number,
  },
});

module.exports = model('User', userSchema);