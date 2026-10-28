import mongoose from 'mongoose';

const StudySessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null,
    },
    subjectName: { type: String, default: 'General Study' },
    subjectEmoji: { type: String, default: '📚' },
    subjectColor: { type: String, default: '#7c3aed' },
    mode: {
      type: String,
      enum: ['stopwatch', 'pomodoro', 'countdown'],
      default: 'stopwatch',
    },
    durationSeconds: { type: Number, required: true, min: 0 }, // actual time studied
    targetSeconds:   { type: Number, default: 0 },             // planned target
    pomodoroCount:   { type: Number, default: 0 },             // how many pomodoros completed
    date: { type: Date, default: Date.now },
    xpEarned: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Virtual: duration in minutes
StudySessionSchema.virtual('durationMinutes').get(function () {
  return Math.round(this.durationSeconds / 60);
});

// Virtual: duration in hours (1 decimal)
StudySessionSchema.virtual('durationHours').get(function () {
  return Math.round((this.durationSeconds / 3600) * 10) / 10;
});

StudySessionSchema.set('toJSON', { virtuals: true });

export default mongoose.models.StudySession ||
  mongoose.model('StudySession', StudySessionSchema);