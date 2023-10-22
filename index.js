const express = require("express");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;

// ! Creating my server
const app = express();
app.use(express.json());

// TODO À sécuriser !
// ! Linking my project to the following mongoose database
mongoose.connect(process.env.MONGODB_URI);

// ! Cloudinay credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  //   secure: true,
});

// ! Linking Routes files
const userRoutes = require("./routes/user.js");
const offerRoutes = require("./routes/offer.js");

// ! Used to include and use routes defined in separate files within your Express.js application
app.use(userRoutes);
app.use(offerRoutes);

// ! Handleling all the other routes that are not defined in my project
app.all("*", (req, res) => {
  res.status(404).json({ message: "This route does not exist" });
});

// ! Starting the server and make it listen on port 3000
app.listen(process.env.PORT, () => {
  console.log("Server started");
});
