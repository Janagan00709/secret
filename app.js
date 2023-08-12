/** @format */

//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const alert = require("alert");
const encrypt = require("mongoose-encryption");
// const md5=require("md5");// -->Encrypt
// const bcrypt = require("bcrypt");// -->bcrypt
// const saltRounds = 10;
// const myPlaintextPassword = "s0//P4$$w0rD";
const session=require('express-session');
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(session({
  secret:"Our little secret.",
  resave:false,
  saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
//cookies
// mongoose.set("useCreateIndex",true);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

userSchema.plugin(passportLocalMongoose);

// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });// Encryption //["email","password"]})

const User = mongoose.model("User", userSchema);

//cookies
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function (req, res) {
  res.render("home");
});

app
  .route("/login")
  .get((req, res) => {
    res.render("login");
  })

  .post((req, res) => {
    // const username = req.body.username;
    // const password = req.body.password; //md5(req.body.password);
    // User.findOne({ email: username })
    //   .then((foundUser) => {
    //     if (foundUser) {
    //       //if (foundUser.password === password) {
    //         if (bcrypt.compare(password, foundUser.password)) {
    //           res.render("secrets");
    //         } else {
    //           alert("wrong password");
    //         }
    //     } else {
    //       alert("wrong password");
    //     }
    //    })
    //   .catch((err) => {
    //     console.log(err);
    //   });
  });
app
  .route("/register")
  .get((req, res) => {
    res.render("register");
  })
  .post((req, res) => {
    // bcrypt.genSalt(saltRounds, function (err, salt) {
    //   bcrypt.hash(myPlaintextPassword, salt, function (err, hash) {
    //     //bcrypt
    //     const newUser = new User({
    //       email: req.body.username,
    //       password: hash, //req.body.password, //md5(req.body.password)//
    //     });
    //     newUser
    //       .save()
    //       .then(() => {
    //         res.render("secrets");
    //       })
    //       .catch((err) => {
    //         console.log(err);
    //       }); //bcrypt
    //   }); //bcrypt
    // });
  });

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
