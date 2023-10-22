const User = require("../models/User");

const isAuthenticated = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ message: "Unauthorized, provide a token" });
  }

  const tokenSent = req.headers.authorization.replace("Bearer ", "");

  const user = User.findOne({ token: tokenSent });

  if (!user || user === null) {
    return res
      .status(401)
      .json({ message: "Unauthorized, this user doesn't exists" });
  } else {
    // ! Keeping the user found in req
    req.user = user;
    next();
  }
};

module.exports = isAuthenticated;
