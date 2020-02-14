const mongoose = require('mongoose');

const { Schema } = mongoose;

const MessagesSchema = new Schema({
  content: String,
  date: { type: Date, default: Date.now },
  username: String, //cache the username to prevent mass lookups
  edited: { type: Boolean, default: false},
  userId: String,
  planetId: String,
  channelId: String,
});

mongoose.model('Messages', MessagesSchema);