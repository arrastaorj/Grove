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
    lastDaily: {
        type: Number,
        reqired: true,
    },
    lastDaily2: {
        type: Number,
        reqired: true,
    },
    begTimeout: {
        type: Number,
    },
});

module.exports = model('Explorar', userSchema);