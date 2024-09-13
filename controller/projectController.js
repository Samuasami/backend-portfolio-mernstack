import { catchAsyncError } from "../middleware/catchAsyncError.js";
import ErrorHandler from "../middleware/error.js";
import { v2 as cloudinary } from "cloudinary";
import { Project } from "../model/projectSchema.js";

export const addNewProject = catchAsyncError(async (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorHandler("Project Banner Image is Required"));
  }
  const { projectBanner } = req.files;
  const {
    title,
    description,
    gitRepoLink,
    projectLink,
    technologies,
    stack,
    deployed,
  } = req.body;

  if (
    !title ||
    !description ||
    !gitRepoLink ||
    !projectLink ||
    !technologies ||
    !stack ||
    !deployed
  ) {
    return next(new ErrorHandler("Please fill all the fields", 400));
  }

  const cloudiaryResponse = await cloudinary.uploader.upload(
    projectBanner.tempFilePath,
    { folder: "PROJECT IMAGES" }
  );

  if (!cloudiaryResponse || cloudiaryResponse.error) {
    console.error(
      cloudiaryResponse.error?.message ||
        "Unknown Cloudinary error while uploading avatar"
    );
    return next(
      new ErrorHandler("Faild to upload project Banner to cloudinary", 500)
    );
  }

  const project = await Project.create({
    title,
    description,
    gitRepoLink,
    projectLink,
    technologies,
    stack,
    deployed,
    projectBanner: {
      public_id: cloudiaryResponse.public_id,
      url: cloudiaryResponse.secure_url,
    },
  });
  return res.status(201).json({
    success: true,
    project,
    message: "New Project Added successfully",
  });
});

export const deleteProject = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const project = await Project.findById(id);
  if (!project) {
    return next(new ErrorHandler("Project not found", 404));
  }
  await project.deleteOne();
  return res.status(200).json({
    success: true,
    message: "Project deleted successfuly",
  });
});

export const updateProject = catchAsyncError(async (req, res, next) => {
  const newProject = {
    title: req.body.title,
    description: req.body.description,
    gitRepoLink: req.body.gitRepoLink,
    projectLink: req.body.projectLink,
    technologies: req.body.technologies,
    stack: req.body.stack,
    deployed: req.body.deployed,
  };

  if (req.files && req.files.projectBanner) {
    const projectBanner = req.files.projectBanner;
    const project = await Project.findById(req.params.id);
    const projectBannerID = project.projectBanner.public_id;
    await cloudinary.uploader.destroy(projectBannerID);
    const cloudiaryResponse = await cloudinary.uploader.upload(
      projectBanner.tempFilePath,
      {
        folder: "PROJECT IMAGE",
      }
    );
    newProject.projectBanner = {
      public_id: cloudiaryResponse.public_id,
      url: cloudiaryResponse.secure_url,
    };
  }

  const project = await Project.findByIdAndUpdate(req.params.id, newProject, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({
    success: true,
    message: "Project updated successfully",
    project,
  });
});

export const getAllProjects = catchAsyncError(async (req, res, next) => {
  const project= await Project.find();
  res.status(200).json({
    success: true,
    message: "Projects fetched successfully",
    project
    });
});

export const getSingleProject = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const project = await Project.findById(id);
  if (!project) {
    return next(new ErrorHandler("Project not found", 404));
  }
  res.status(200).json({
    success: true,
    message: "Project fetched successfully",
    project
    });
});
