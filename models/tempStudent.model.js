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

const tempStudentSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "First Name is required"],
    },
    lastName: {
      type: String,
      required: [true, "Last Name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
    },
    country: {
      type: String,
      required: [true, "Country is required"],
    },
    phone: {
      type: phoneSchema,
      required: true,
    },
    studentType: {
      type: String,
      required: [true, "Student Type is required"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    otp: {
      type: String,
      required: true,
    },
    otpExpiry: {
      type: Date,
      required: true,
    },
    isOtpVerified: {
      type: Boolean,
      default: false,
    },
    hearAbout: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Password encryption before saving the student
tempStudentSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// OTP encryption before saving (optional but can enhance security)
tempStudentSchema.pre("save", async function (next) {
  if (this.otp && this.isModified("otp")) {
    this.otp = await bcrypt.hash(this.otp, 10);
  }
  next();
});

// Password comparison method
tempStudentSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// OTP comparison method
tempStudentSchema.methods.isOtpCorrect = async function (otp) {
  return await bcrypt.compare(otp, this.otp);
};

export const TempStudent = mongoose.model("TempStudent", tempStudentSchema);
