const express = require("express");
const app = express();
require("./db/mongoose");
var cors = require("cors");
var bodyParser = require('body-parser')

const taskRouter = require("./routers/task");

app.use(express.json());

app.use(taskRouter);
app.use(cors());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "http:localhost:8000"); // update to match the domain you will make the request from
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.listen(process.env.PORT, () => {
  console.log("listening on port " + process.env.PORT);
});
