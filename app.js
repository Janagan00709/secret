/** @format */

//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const alert = require("alert");
const encrypt = require("mongoose-encryption");


const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

mongoose.connect("mongodb://127.0.0.1:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] }); //["email","password"]})

const User = mongoose.model("User", userSchema);

app.get("/", function (req, res) {
  res.render("home");
});

app
  .route("/login")
  .get((req, res) => {
    res.render("login");
  })

  .post((req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    User.findOne({ email: username })
      .then((foundUser) => {
        if (foundUser.password === password) {
          res.render("secrets");
        } else {
          alert("wrong password");
        }
      })
      .catch((err) => {
        console.log(err);
      });
  });
app
  .route("/register")
  .get((req, res) => {
    res.render("register");
  })
  .post((req, res) => {
    const newUser = new User({
      email: req.body.username,
      password: req.body.password,
    });
    newUser
      .save()
      .then(() => {
        res.render("login");
      })
      .catch((err) => {
        console.log(err);
      });
  });

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
