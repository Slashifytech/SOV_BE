import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const phoneSchema = new Schema(
  {
    code: {
      type: String,
      required: [true, "Phone code is required"],
    },
    number: {
      type: String,
      required: [true, "Phone number is required"],
    },
  },
  { _id: false }
);

const studentSchema = new Schema(
  {
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
      trim: true,
    },
    country: {
      type: String,
    },
    phone: {
      type: phoneSchema,
    },
    studentType: {
      type: String,
    },
    password: {
      type: String,
    },
    otp: {
      type: String, // Store OTP (can be hashed for extra security)
    },
    otpExpiry: {
      type: Date,  // OTP expiration timestamp
    },
    isOtpVerified: {
      type: Boolean,
      default: false,
    },
    hearAbout: {
      type: String,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Password encryption before saving the student
studentSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// OTP encryption before saving (optional but can enhance security)
studentSchema.pre("save", async function (next) {
  if (this.otp && this.isModified("otp")) {
    this.otp = await bcrypt.hash(this.otp, 10);
  }
  next();
});

// Password comparison method
studentSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// OTP comparison method
studentSchema.methods.isOtpCorrect = async function (otp) {
  return await bcrypt.compare(otp, this.otp);
};

export const Student = mongoose.model("Student", studentSchema);
