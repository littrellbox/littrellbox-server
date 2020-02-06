const mongoose = require('mongoose');

const { Schema } = mongoose;

const PlanetMembersSchema = new Schema({
  userId: String,
  planetId: String
});

mongoose.model('PlanetMembers', PlanetMembersSchema);