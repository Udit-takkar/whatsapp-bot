const express = require("express");
const router = new express.Router();
const Task = require("../models/task");

router.get("/task", async (req, res) => {
  const tasks = await Task.find({});
  res.status(200).send(tasks);
});

router.post("/task", async (req, res) => {
  const date = req.data.deadline;
  const task = new Task({
    task: req.data.task,
    deadline: `${date}-2021`,
  });
 
  res.status(201).send(task);
  // try {
  //   await task.save();
  //   res.status(201).send(task);
  // } catch (err) {
  //   res.status(400).send(err);
  // }
});

module.exports = router;
