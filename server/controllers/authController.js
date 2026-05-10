const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const SALT_ROUNDS = 10;

function jwtSecretOrThrow() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set in environment variables");
  }
  return secret;
}

function signToken(userId) {
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign({ id: userId.toString() }, jwtSecretOrThrow(), {
    expiresIn,
  });
}

function sendAuthSuccess(res, user, token, message) {
  return res.status(200).json({
    message,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
}

async function signup(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please provide name, email, and password.",
      });
    }

    const trimmedEmail = String(email).trim().toLowerCase();

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long.",
      });
    }

    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      name: String(name).trim(),
      email: trimmedEmail,
      password: hashedPassword,
    });

    const token = signToken(user._id);

    return sendAuthSuccess(res, user, token, "Account created successfully.");
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Please provide email and password.",
      });
    }

    const trimmedEmail = String(email).trim().toLowerCase();

    const user = await User.findOne({ email: trimmedEmail }).select(
      "+password"
    );

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    user.password = undefined;

    const token = signToken(user._id);

    return sendAuthSuccess(res, user, token, "Login successful.");
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  signup,
  login,
};
