const mongoose = require('mongoose');

const { Schema } = mongoose;

const AttachmentSchema = new Schema({
    userId: String,
    data: Object,
    type: String,
    name: String,
    messageId: String,
});

mongoose.model('Attachments', AttachmentSchema);
