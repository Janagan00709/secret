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
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(
  session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false,
  })
);

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
  googleId:{
    type:String,
    unique:true,
  },
  secret:String
});

userSchema.plugin(passportLocalMongoose);
//authgoogle2.0
userSchema.plugin(findOrCreate);

// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });// Encryption //["email","password"]})

const User = mongoose.model("User", userSchema);

//cookies
passport.use(User.createStrategy());

passport.serializeUser(function(user,done){
  done(null,user);
});
passport.deserializeUser(function(user,done){
  done(null,user);
});
/*passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
passport.serializeUser(function(user,done){
  done(null,user.id);
});
passport.deserializeUser(function(id,done){
  User.findById,function(err,user){
    done(err,user);
  }
}); */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
      scope: ["email", "profile"],
    },
    function (request, accessToken, refreshToken, profile, done) {
      const userEmail = profile.emails[0].value;
      User.findOrCreate(
        { googleId: profile.id, username: userEmail },
        function (err, user) {
          return done(err, user);
        }
      );
    }
  )
);

app.get("/", function (req, res) {
  res.render("home");
});
app.get("/auth/google", function (req, res) {
  passport.authenticate("google", { scope: ["email", "profile"] })(req, res);
});

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", {
    successRedirect: "/secrets",
    failureRedirect: "/login",
  })
);

app
  .route("/login")
  .get((req, res) => {
    res.render("login");
  })

  .post((req, res) => {
    const user = new User({
      username: req.body.username,
      password: req.body.password,
    });
    req.login(user, function (err) {
      if (err) {
        console.log(err);
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/secrets");
        });
      }
    });
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
    User.register(
      { username: req.body.username },
      req.body.password,
      function (err, user) {
        if (err) {
          console.log(err);
          res.redirect("/register");
        } else {
          passport.authenticate("local")(req, res, function () {
            res.redirect("secrets");
          });
        }
      }
    );
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

app.get("/secrets", function (req, res) {
  User.find({"secret":{$ne:null}})
  .then((foundUsers)=>{
    if(foundUsers){
      res.render("secrets",{usersWithSecrets:foundUsers});
    }
  }).catch((err)=>{
    console.log(err);
  })
  // if (req.isAuthenticated()) {
  //   res.render("secrets");
  // } else {
  //   res.redirect("/login");
  // }
});
app.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/");
    }
  });
});
app.get("/submit",function(req,res){
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});
app.post("/submit",function(req,res){
  console.log("User Info:", req.user);
  const submittedSecret=req.body.secret;
  User.findById(req.user._id)
  .then((foundUser)=>{
    if(foundUser){
      foundUser.secret=submittedSecret;
      foundUser.save()
      .then(()=>{
        res.redirect("/secrets")
      });
    }else{
      console.log("User not found");
    }
  })
  .catch((err)=>{
    console.log(err);
  })
      
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
