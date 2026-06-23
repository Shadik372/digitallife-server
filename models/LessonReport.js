import mongoose from "mongoose";

const lessonReportSchema = new mongoose.Schema({
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson", required: true },
  reporterUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reportedUserEmail: { type: String, required: true },
  reason: { type: String, required: true },
}, { timestamps: true });

export default mongoose.models.LessonReport || mongoose.model("LessonReport", lessonReportSchema);