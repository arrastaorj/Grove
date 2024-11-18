const { Schema, model } = require('mongoose');

const userSchema = new Schema({
    userId: {
        type: String,
        required: true,
    },
    saldo: {
        type: Number,
        default: 0,
        required: false,
    },
    bank: {
        type: Number,
        default: 0,
        required: false,
    },
    valorDaily: {
        type: Number,
        default: 0,
        required: false,
    },

    lastDaily: {
        type: Number,
        reqired: false,
    },
    begTimeout: {
        type: Number,
    },
});

module.exports = model('Banco', userSchema);