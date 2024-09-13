import { catchAsyncError } from "../middleware/catchAsyncError.js";
import ErrorHandler from "../middleware/error.js";
import { v2 as cloudinary } from "cloudinary";
import { Skill } from "../model/skillsSchema.js";

export const addNewSkill = catchAsyncError(async (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorHandler("Skill SVG are required", 400));
  }

  const { svg } = req.files;
  const { title, proficiency } = req.body;

  if (!proficiency || !title) {
    return next(new ErrorHandler("please fill full form", 400));
  }

  // Upload avatar to Cloudinary
  const cloudinaryRespons = await cloudinary.uploader.upload(svg.tempFilePath, {
    folder: "PORTFOLIO_SKILLS_SVGS",
  });
  if (!cloudinaryRespons || cloudinaryRespons.error) {
    return next(
      new ErrorHandler(
        cloudinaryRespons.error?.message ||
          "Unknown Cloudinary error while uploading avatar",
        500
      )
    );
  }

  const newSkill = await Skill.create({
    title,
    proficiency,
    svg: {
      public_id: cloudinaryRespons.public_id,
      url: cloudinaryRespons.secure_url,
    },
  });
  res.status(201).json({
    success: true,
    message: "new Skill Added",
    skill: newSkill,
  });
});

export const deleteSkill = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const skill = await Skill.findById(id);
  if (!skill) {
    return next(new ErrorHandler("Skill not found", 404));
  }
  const skillSvgId = skill.svg.public_id;
  await cloudinary.uploader.destroy(skillSvgId);
  await skill.deleteOne();
  res.status(200).json({
    success: true,
    message: "Skill deleted",
  });
});

export const updateSkill = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  let skill = await Skill.findById(id);
  if (!skill) {
    return next(new ErrorHandler("Skill not found", 404));
  }
  const { proficiency } = req.body;

  skill = await Skill.findByIdAndUpdate(
    id,
    { proficiency },
    {
      new: true,
      runValidators: true,
      userFindAndModify: false,
    }
  );
  res.status(200).json({
    success: true,
    message: "Skill updated",
    skill,
  });
});

export const getAllSkill = catchAsyncError(async (req, res, next) => {
  const skill = await Skill.find();
    res.status(200).json({
        message: "skill Fetched successfully",
        success: true,
        skill,
        });
});
