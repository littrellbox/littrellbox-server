const mongoose = require('mongoose');

const { Schema } = mongoose;

const FilesSchema = new Schema({
  messageId: String,
  fileURL: String,
  fileType: String,
  fileName: String
});

mongoose.model('Files', FilesSchema);