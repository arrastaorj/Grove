const mongoose = require('mongoose');

const antilinkSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        unique: true,
    },
    antilinkEnabled: {
        type: Boolean,
        required: true,
        default: false,
    },
    allowedRoles: [
        {
            type: String,
        },
    ],
});

module.exports = mongoose.model('Antilink', antilinkSchema);