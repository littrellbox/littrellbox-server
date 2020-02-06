const mongoose = require('mongoose');

const { Schema } = mongoose;

const ChannelsSchema = new Schema({
  name: String,
  userId: String,
  planetId: String,
});

mongoose.model('Channels', ChannelsSchema);