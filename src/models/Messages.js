const mongoose = require('mongoose');

const { Schema } = mongoose;

const MessagesSchema = new Schema({
  content: String,
  date: { type: Date, default: Date.now },
  edited: { type: Boolean, default: false},
  userId: String,
  planetId: String,
  channelId: String,
});

mongoose.model('Messages', MessagesSchema);