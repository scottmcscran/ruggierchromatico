const mongoose = require(`mongoose`);
const validate = require(`validator`);
const bcrypt = require(`bcryptjs`);

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, `User must have name`],
  },
  email: {
    type: String,
    required: [true, `Email must have name`],
    unique: [true, `A user with this email already exists`],
    minLength: [1, `Email must have at least 1 character`],
    lowercase: true,
    validate: [validate.isEmail, `Email not valid`],
  },
  role: {
    type: String,
    enum: [`user`, `admin`],
    default: `user`,
  },
  password: {
    type: String,
    required: [true, `User must have a password`],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, `Password confirmation required`],
    minLength: [8, `Password must have at least 8 characters`],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: `Passwords do not match`,
    },
  },
  passwordChangedAt: Date,
});

userSchema.pre(`save`, async function (next) {
  if (!this.isModified(`password`)) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
});

userSchema.methods.correctPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.changedPasswordAfter = function (JWTTimtestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = +this.passwordChangedAt.getTime() / 1000;
    return JWTTimtestamp < changedTimestamp;
  }

  return false;
};

const User = mongoose.model(`User`, userSchema);

module.exports = User;
