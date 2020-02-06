const mongoose = require('mongoose');

const { Schema } = mongoose;

const PlanetsSchema = new Schema({
  name: String,
  userId: String,
  invites: [String]
});

mongoose.model('Planets', PlanetsSchema);