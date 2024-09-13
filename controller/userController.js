import { catchAsyncError } from "../middleware/catchAsyncError.js";
import ErrorHandler from "../middleware/error.js";
import { User } from "../model/userSchema.js"; // Corrected import path
import { v2 as cloudinary } from "cloudinary";
import { generateToken } from "../utils/jwtToken.js";
import bcrypt from "bcrypt";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";

export const register = catchAsyncError(async (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorHandler("Avatar and Resume are required", 400));
  }

  const { avatar } = req.files;
  // Upload avatar to Cloudinary
  const cloudinaryResponsForAvatar = await cloudinary.uploader.upload(
    avatar.tempFilePath,
    { folder: "AVATARS" }
  );
  if (!cloudinaryResponsForAvatar || cloudinaryResponsForAvatar.error) {
    return next(
      new ErrorHandler(
        cloudinaryResponsForAvatar.error?.message ||
          "Unknown Cloudinary error while uploading avatar",
        500
      )
    );
  }
  const { resume } = req.files;

  // Upload resume to Cloudinary
  const cloudinaryResponsForResume = await cloudinary.uploader.upload(
    resume.tempFilePath,
    { folder: "MY_RESUME" }
  );
  if (!cloudinaryResponsForResume || cloudinaryResponsForResume.error) {
    return next(
      new ErrorHandler(
        cloudinaryResponsForResume.error?.message ||
          "Unknown Cloudinary error while uploading resume",
        500
      )
    );
  }

  const {
    fullName,
    email,
    phone,
    about,
    password,
    portfolioURL,
    githubUrl,
    linkedinUrl,
    twitterUrl,
    instagramUrl,
    facebookUrl,
  } = req.body;

  if (!fullName || !email || !phone || !about || !password || !portfolioURL) {
    return next(new ErrorHandler("All required fields must be filled", 400));
  }

  const user = await User.create({
    fullName,
    email,
    phone,
    about,
    password,
    portfolioURL,
    githubUrl,
    linkedinUrl,
    twitterUrl,
    instagramUrl,
    facebookUrl,
    avatar: {
      public_id: cloudinaryResponsForAvatar.public_id,
      url: cloudinaryResponsForAvatar.secure_url,
    },
    resume: {
      public_id: cloudinaryResponsForResume.public_id,
      url: cloudinaryResponsForResume.secure_url,
    },
  });

  generateToken(user, "user Registered successfuly", 201, res);
});

export const login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Email and Password are required", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid Email or Password", 401));
  }

  const isPasswordMatch = await user.comparePassword(password);

  if (!isPasswordMatch) {
    return next(new ErrorHandler("Invalid Email or Password", 401));
  }

  generateToken(user, "User logged in successfully", 200, res);
});

export const logout = catchAsyncError(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", "", {
      expires: new Date(Date.now()),
      httpOnly: true,
    })
    .json({
      success: true,
      message: "Logged Out",
    });
});

export const getUser = catchAsyncError(async (req, res, next) => {
  console.log(req.user);
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  res.status(200).json({
    success: true,
    user,
  });
});

export const updateUser = catchAsyncError(async (req, res, next) => {
  const newUserdata = {
    fullName: req.body.fullName,
    email: req.body.email,
    phone: req.body.phone,
    about: req.body.about,
    portfolioURL: req.body.portfolioURL,
    githubUrl: req.body.githubUrl,
    linkedinUrl: req.body.linkedinUrl,
    twitterUrl: req.body.twitterUrl,
    instagramUrl: req.body.instagramUrl,
    facebookUrl: req.body.facebookUrl,
  };

  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  if (req.files && req.files.avatar) {
    const avatar = req.files.avatar;
    const profileImageId = user.avatar.public_id;

    // Deleting old avatar from Cloudinary
    if (profileImageId) {
      await cloudinary.uploader.destroy(profileImageId);
    }

    // Upload new avatar
    const cloudinaryResponse = await cloudinary.uploader.upload(
      avatar.tempFilePath,
      {
        folder: "AVATARS",
      }
    );

    newUserdata.avatar = {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    };
  }

  if (req.files && req.files.resume) {
    const resume = req.files.resume;
    const resumeId = user.resume.public_id;

    // Deleting old resume from Cloudinary
    if (resumeId) {
      await cloudinary.uploader.destroy(resumeId);
    }

    // Upload new resume
    const cloudinaryResponse = await cloudinary.uploader.upload(
      resume.tempFilePath,
      {
        folder: "MY_RESUME",
      }
    );

    newUserdata.resume = {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    };
  }

  // Update user with new data
  const updatedUser = await User.findByIdAndUpdate(req.user._id, newUserdata, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user: updatedUser,
  });
});

export const updatePassword = catchAsyncError(async (req, res, next) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return next(new ErrorHandler("Please fill all the fields", 400));
  }

  const user = await User.findById(req.user._id).select("+password");

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  const isPasswordMatch = await user.comparePassword(currentPassword);

  if (!isPasswordMatch) {
    return next(new ErrorHandler("Current password is incorrect", 400));
  }

  if (newPassword !== confirmNewPassword) {
    return next(
      new ErrorHandler("New password and confirm password do not match", 400)
    );
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password updated successfully",
  });
});

export const getUserForPortfolio = catchAsyncError(async (req, res, next) => {
  const id = "66db86fb975becc37ccfc547";
  const user = await User.findById(id);
  res.status(200).json({
    success: true,
    user,
  });
});

export const forgotPassword = catchAsyncError(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  const resetToken = user.getResetpasswordToken();
  await user.save({ validateBeforeSave: false });
  const resetPasswordURL = `${process.env.DASHBOARD_URL}/password/reset/${resetToken}`;
  const message = `Your Reset Password Token is:- \n\n ${resetPasswordURL} \n\n If you haven't request for this please ignor it`;

  try {
    await sendEmail({
      email: user.email,
      subject: "personal portfolio Dashboard Recovery password ",
      message,
    });
    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} your account, please check your email inbox`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler(error.message, 500));
  }
});

export const resetPassword = catchAsyncError(async (req, res, next) => {
  const { token } = req.params;

  // Hash the token from params to compare with the hashed token stored in the database
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  // Find the user with the matching reset token and check if the token is not expired
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpires: {
      $gt: Date.now(),
    },
  });

  if (!user) {
    return next(
      new ErrorHandler("Reset Password Token is invalid or has expired", 400)
    );
  }

  // Check if the new password matches the confirm password
  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Passwords do not match", 400));
  }

  // Set the new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  // Save the user with the updated password
  await user.save();

  // Generate a new token for the user and send it in the response
  generateToken(user, "Password reset successful", 200, res);
});
