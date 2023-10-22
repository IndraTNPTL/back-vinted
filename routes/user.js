const express = require("express");
const router = express.Router();

//! Password packages
const uid2 = require("uid2"); // Creating random strings
const SHA256 = require("crypto-js/sha256"); // Used to encrypt a string
const encBase64 = require("crypto-js/enc-base64"); // Used to transform the encryption into a string

//! Files and Img packages
const fileUpload = require("express-fileupload"); // fileupload import
const cloudinary = require("cloudinary").v2; // cloudinary import
const convertToBase64 = require("../utils/convertToBase64"); // middleware to convert buffer into base64

// ! Importing User model
const User = require("../models/User");

//! Routes starting
router.post("/user/signup", async (req, res) => {
  try {
    const { username, email, password, newsletter } = req.body;

    const avatar = await cloudinary.uploader.upload(
      convertToBase64(req.files.avatar),
      {
        folder: "/vinted/avatar",
      }
    );

    if (!username || username === null) {
      return res
        .status(404)
        .json({ message: "You need to provide an username 🤓" });
    }

    if (!email || email === null) {
      return res
        .status(404)
        .json({ message: "You need to provide an email 📧" });
    }

    if (!password || password === null) {
      return res
        .status(404)
        .json({ message: "You need to provide a password 🤫" });
    }

    if (!avatar || avatar === null) {
      return res
        .status(404)
        .json({ message: "You need to choose an avatar 🖼" });
    }

    const emailDuplicata = await User.findOne({ email: email });
    if (emailDuplicata) {
      return res
        .status(409)
        .json({ message: "Seems that this email already exists 👀!" });
    }

    // Tous les credentials sont renseignés alors
    //! On génère un salt
    const salt = uid2(16);

    //! On génère un hash
    const hash = SHA256(req.body.password + salt).toString(encBase64);

    //! On génère un token
    const token = uid2(64);

    //! On crée le nouvel utilisateur à partir du model
    const newUser = new User({
      email,
      account: {
        username,
      },
      newsletter,
      token,
      hash,
      salt,
      avatar,
    });

    //! On sauvegarde le nouveau User dans la BDD
    await newUser.save();

    //! On renvoit cette réponse à la requête
    res.status(201).json({
      message: "User Created",
      _id: newUser._id,
      account: newUser.account,
      token: newUser.token,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const email = req.body.email;

    // ! On cherche l'email renseigné en body dans la BDD
    if (!email || email === null) {
      return res
        .status(404)
        .json({ message: "This user doesn't exists, please signup 💌!" });
    }

    // ! Storing in the user variable the user infos we found on BDD thanks to the email
    const user = await User.findOne({ email: email });

    // ! On génère un hash
    const newhashedPassword = SHA256(req.body.password + user.salt).toString(
      encBase64
    );

    // ! On compare le password renseigné avec le hash du user trouvé grâce à son email
    if (newhashedPassword !== user.hash) {
      return res
        .status(401)
        .json({ message: "Unauthorized - Wrong credentials" });
    }

    // ! On renvoit cette réponse à la requête
    res.status(200).json({
      message: "Login successful",
      _id: user._id,
      token: user.token,
      account: { username: user.username },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
