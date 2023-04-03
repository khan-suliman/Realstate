const { encodeMsg, decodeMsg } = require("../helper/createMsg");
const Post = require("../models/post");
const User = require("../models/users");
const {postImage}= require('./fileUpload')
const multer  = require('multer')

module.exports = {
  async allPosts(req, res) {
    try {
      let msgToken = req.query.msg;
      let option = {};
      if (msgToken) {
        let msg = decodeMsg(msgToken);
        option = msg;
      }
      let posts = await Post.find().populate("author");
      res.render("dashboard/examples/post/posts", {
        title: "Posts",
        posts,
        toast: Object.keys(option).length == 0 ? undefined : option,
      });
    } catch (err) {
      res.redirect("/dashboard?msg=" + encodeMsg(err));
    }
  },
  async addPost(req, res) {
    try {
      let users = await User.find();
      res.render("dashboard/examples/post/add-post", {
        title: "Add Post",
        users,
      });
    } catch (err) {
      res.redirect("/dashboard?msg=" + encodeMsg(err));
    }
  },
  async doPost(req, res) {
    try {
      let id = req.body;
      console.log(req.body)
      if (id) {
        console.log(req.body)
        // updating the post
        // await Post.findByIdAndUpdate(id, req.body);
      } else {
        // Adding new post
        postImage.single('featuredimage')(req, res, async (err)=>{
          if (err instanceof multer.MulterError) {
              if (err.code === 'LIMIT_FILE_COUNT') {
                console.log(400).json('You can upload upto 2 maximum files');
                  return;
                }
              console.log('Unknown error occurred while uploading')
            } else if (err) {
              console.log(err.message)
            }else{
              await Post({image: req.file.filename, ...req.body}).save();
            }
      })
      }
      return res.redirect(
        "/dashboard/posts?msg=" +
          encodeMsg(`Post ${id ? "Updated" : "Added"} Successfully.`)
      );
    } catch (err) {
      res.redirect("/dashboard?msg=" + encodeMsg(err.message, "danger"));
    }
  },
  async editPost(req, res) {
    let Id = req.params.id;
    if (!Id) {
      return res.redirect(
        "/posts?msg=" + encodeMsg("Post is required.", "danger")
      );
    }
    let post = await Post.findById(Id);
    let users = await User.find();

    res.render("dashboard/examples/post/add-post", {
      title: "Edit Post",
      post,
      users,
    });
  },
};
