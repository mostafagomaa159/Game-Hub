const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Task = require("./task");
const newPost = require("./newPost");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate: [validator.isEmail, "Invalid email"],
    },
    password: {
      type: String,
      required: true,
      minlength: 7,
      trim: true,
      validate(value) {
        if (value.toLowerCase().includes("password")) {
          throw new Error('Password cannot contain "password"');
        }
      },
    },
    coins: {
      type: Number,
      default: 0,
      min: [0, "Coins must be a positive number"],
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    paypalEmail: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: (val) => !val || validator.isEmail(val),
        message: "Invalid PayPal email",
      },
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    avatar: Buffer,
  },
  { timestamps: true }
);

// Virtuals
userSchema.virtual("tasks", {
  ref: "Tasks",
  localField: "_id",
  foreignField: "owner",
});

userSchema.virtual("newpost", {
  ref: "newPost",
  localField: "_id",
  foreignField: "owner",
});

// Instance Methods
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.tokens;
  delete user.avatar;
  return user;
};

userSchema.methods.generateAuthToken = async function () {
  const token = jwt.sign({ _id: this._id.toString() }, process.env.JWT_SECRET);
  this.tokens.push({ token });
  await this.save();
  return token;
};

// Static Methods
userSchema.statics.findByCredentials = async function (email, password) {
  const user = await this.findOne({ email });
  if (!user) {
    throw new Error("Invalid credentials.");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid credentials.");
  }

  return user;
};

// Middleware
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

userSchema.pre("remove", async function (next) {
  await Task.deleteMany({ owner: this._id });
  await newPost.deleteMany({ owner: this._id });
  next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;
