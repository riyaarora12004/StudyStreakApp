import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
  subjectId:   { type: String },
  subjectName: { type: String, required: true },
  emoji:       { type: String, default: '📚' },
  color:       { type: String, default: '#7c3aed' },
  topic:       { type: String, required: true },
  hours:       { type: Number, required: true },
  priority:    { type: String, enum: ['high','medium','low'], default: 'medium' },
  tip:         { type: String, default: '' },
  completed:   { type: Boolean, default: false },
}, { _id: false });

const DayPlanSchema = new mongoose.Schema({
  date:        { type: Date, required: true },
  label:       { type: String }, // "Today", "Tomorrow", "Mon 26 Feb"
  totalHours:  { type: Number, default: 0 },
  tasks:       [TaskSchema],
  motivation:  { type: String, default: '' },
}, { _id: false });

const StudyPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  generatedAt:    { type: Date, default: Date.now },
  availableHours: { type: Number, required: true },
  days:           [DayPlanSchema],
  aiMessage:      { type: String, default: '' }, // overall AI advice
}, { timestamps: true });

export default mongoose.models.StudyPlan || mongoose.model('StudyPlan', StudyPlanSchema);