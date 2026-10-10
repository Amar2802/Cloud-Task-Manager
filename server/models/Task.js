
const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000
    },
    completed: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
