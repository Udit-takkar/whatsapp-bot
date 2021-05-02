const mongoose = require("mongoose"); //import mongoose

var Schema = mongoose.Schema; // declare a new schema

var taskSchema = new Schema({
  task: {
    type: String,
  },
  deadline: {
    type: String,
  },
});

const Task = mongoose.model("Task", taskSchema); // now we have to create our model

module.exports = Task; // export our created model
