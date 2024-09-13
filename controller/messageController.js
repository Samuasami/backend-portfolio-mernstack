import { catchAsyncError } from "../middleware/catchAsyncError.js";
import ErrorHandler from "../middleware/error.js";
import { Message } from "../model/messageSchema.js";

export const sendMessage = catchAsyncError(async (req, res, next) => {
  const { senderName, subject, message } = req.body;

  if (!senderName || !subject || !message) {
    return next(new ErrorHandler("Please fill in all fields", 400));
  }

  const data = await Message.create({ senderName, subject, message });

  res.status(200).json({
    success: true,
    message: "Message Sent",
    data,
  });
});

export const getAllMessage = catchAsyncError(async (req, res, next) => {
  const messages = await Message.find();
  res.status(200).json({
    success: true,
    messages,
  });
});

export const deleteMessage = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  const message = await Message.findByIdAndDelete(id);
  if (!message) {
    return next(new ErrorHandler("Message already deleted", 404));
  }
  await message.deleteOne();
  res.status(200).json({
    success: true,
    message: "Message deleted successfully",
    });
});
