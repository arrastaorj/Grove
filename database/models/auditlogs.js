const mongoose = require('mongoose');

const auditlogs = new mongoose.Schema({

    guildId: { type: String, required: true },
    isActive: { type: Boolean, default: false },
    canalLogs: { type: String },
})

module.exports = mongoose.model('auditlogs', auditlogs)