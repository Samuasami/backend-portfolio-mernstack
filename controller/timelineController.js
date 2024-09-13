import { catchAsyncError } from "../middleware/catchAsyncError.js";
import ErrorHandler from "../middleware/error.js";
import { Timeline } from "../model/timelineSchema.js";

export const postTimeLine = catchAsyncError(async (req, res, next) => {
  const { title, description, from, to } = req.body;
  const newTimeline = await Timeline.create({
    title,
    description,
    timeline: { from, to },
  });
  res.status(201).json({
    message: "Timeline created successfully",
    success: true,
    newTimeline,
  });
});
export const deleteTimeLine = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const timeline = await Timeline.findByIdAndDelete(id);
  if (!timeline) {
    return next(new ErrorHandler("Timeline not Found", 404));
  }
  await timeline.deleteOne();
  res.status(200).json({
    message: "Timeline deleted successfully",
    success: true,
  });
});
export const getAllTimeLines = catchAsyncError(async (req, res, next) => {
  const timelines = await Timeline.find();
  res.status(200).json({
    message: "Timelines fetched successfully",
    success: true,
    timelines,
  });
});
