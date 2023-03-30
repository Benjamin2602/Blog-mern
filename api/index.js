const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./models/User");
// post model
const Post = require('./models/Post');
const bcrypt = require("bcryptjs");
const app = express();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const uploadMiddleware = multer({
  dest: "uploads/", // directory where uploaded files will be stored
});

const fs = require("fs");

const salt = bcrypt.genSaltSync(10);
const secret = "dwdhsjdbsdjb";

app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));

mongoose.connect(
  "mongodb+srv://blog:4KJNpmjPrdquxNs2@cluster0.tbnmxgo.mongodb.net/?retryWrites=true&w=majority"
);

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const userDoc = await User.create({
      username,
      password: bcrypt.hashSync(password, salt),
    });
    res.json(userDoc);
  } catch (e) {
    res.status(400).json(e);
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const userDoc = await User.findOne({ username });
  const passOk = bcrypt.compareSync(password, userDoc.password);
  if (passOk) {
    //logged in
    jwt.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {
      if (err) throw err;
      // res.json(token);
      res.cookie("token", token).json({
        id: userDoc._id,
        username,
      });
    });
    //res.json
  } else {
    res.status(400).json("wrong credential");
  }
});

app.get("/profile", (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, secret, {}, (err, info) => {
    if (err) throw err;
    res.json(info);
  });
  // res.json(req.cookies);
});

app.post("/logout", (req, res) => {
  res.cookie("token", "").json("ok");
});

//create new post

app.post("/post", uploadMiddleware.single("file"), async (req, res) => {
  // Handle the uploaded file
  // res.json({file:req.file});
  const { originalname, path } = req.file;
  const parts = originalname.split(".");
  const ext = parts[parts.length - 1];
  const newPath = path + "." + ext;
  fs.renameSync(path, newPath);
  const {token} = req.cookies;
  jwt.verify(token, secret, {}, async (err,info) => {
    if (err) throw err;
     //uploading the file then we create the post
    const {title,summary,content} = req.body;
    const postDoc = await Post.create({
      title,
      summary,
      content,
      cover:newPath,
      author:info.id,
    });
    res.json(postDoc);
  });

});
  //uploading the file then we create the post
//   const { title, summary, content } = req.body;

// get request for post

app.get('/post', async (req, res) => {
  // const posts = await Post.find();
  res.json(
    await Post.find()
    .populate('author', ['username'])
    .sort({createdAt: -1})
    .limit(20)
    );
});

//single post

app.get('/post/:id', async (req, res) => {
  const {id} = req.params;
  const postDoc = await Post.findById(id).populate('author', ['username']);
  res.json(postDoc);
})

app.listen(4000);
//mongodb+srv://blog:4KJNpmjPrdquxNs2@cluster0.tbnmxgo.mongodb.net/?retryWrites=true&w=majority
//4KJNpmjPrdquxNs2
//mongodb+srv://blog:4KJNpmjPrdquxNs2@cluster0.tbnmxgo.mongodb.net/?retryWrites=true&w=majority
