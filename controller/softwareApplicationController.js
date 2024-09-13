import { catchAsyncError } from "../middleware/catchAsyncError.js";
import ErrorHandler from "../middleware/error.js";
import { SoftwareApplication } from "../model/softwareApplictionSchema.js";
import { v2 as cloudinary } from "cloudinary";

export const addNewApplication = catchAsyncError(async (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(
      new ErrorHandler("Software Appliction ICON/SVG are required", 400)
    );
  }

  const { svg } = req.files;
  const { name } = req.body;
  if (!name) {
    return next(new ErrorHandler("Software Appliction name is required", 400));
  }

  // Upload avatar to Cloudinary
  const cloudinaryRespons = await cloudinary.uploader.upload(svg.tempFilePath, {
    folder: "PORTFOLIO_SOFTWARE_APPLICATION",
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

  const softwareApplication = await SoftwareApplication.create({
    name: name,
    svg: {
      public_id: cloudinaryRespons.public_id,
      url: cloudinaryRespons.secure_url,
    },
  });
  res.status(201).json({
    success: true,
    message: "new software application added",
    softwareApplication,
  });
});
export const deleteApplication = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const softwareApplication = await SoftwareApplication.findById(id);
  if (!softwareApplication) {
    return next(new ErrorHandler("Software Application not found", 404));
  }
  const softwareApplicationSvgId = softwareApplication.svg.public_id;
  await cloudinary.uploader.destroy(softwareApplicationSvgId);
  await softwareApplication.deleteOne();
  res.status(200).json({
    success: true,
    message: "Software Application deleted",
  });
});
export const getAllApplication = catchAsyncError(async (req, res, next) => {
  const softwareApplication = await SoftwareApplication.find();
  res.status(200).json({
    message: "sotware appliction fetched successfully",
    success: true,
    softwareApplication,
  });
});
