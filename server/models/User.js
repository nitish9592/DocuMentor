import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// ✅ Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" },
});

// ✅ Password Compare Method
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

// ✅ Static Methods (Optional Convenience)
userSchema.statics.findByUsername = function (username) {
  return this.findOne({ username });
};

userSchema.statics.createUser = async function ({ username, password, role = "user" }) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new this({ username, password: hashedPassword, role });
  return user.save();
};

// ✅ Model
const User = mongoose.model("User", userSchema);
export default User;
