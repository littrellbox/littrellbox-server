const mongoose = require('mongoose');

const { Schema } = mongoose;

const FilesSchema = new Schema({
  fileOwner: String,
  fileURL: String,
  fileType: String,
  fileName: String
});

mongoose.model('Files', FilesSchema);
