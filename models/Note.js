var mongoose = require("mongoose");
const PORT = process.env.PORT || 3000;
var Schema = mongoose.Schema;

var NoteSchema = new Schema({
  title: String,
  body: String
});

var Note = mongoose.model("Note", NoteSchema);

module.exports = Note;
