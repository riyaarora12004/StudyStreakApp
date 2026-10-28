import mongoose from 'mongoose';

const DeadlineSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  subjectId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null  },
  subjectName:  { type: String, default: 'General' },
  subjectEmoji: { type: String, default: '📚' },
  subjectColor: { type: String, default: '#7c3aed' },

  title:        { type: String, required: true, trim: true },
  type:         { type: String, enum: ['worksheet', 'project', 'assignment', 'exam', 'presentation', 'other'], default: 'assignment' },
  priority:     { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  dueDate:      { type: Date,   required: true },
  notes:        { type: String, default: '' },

  status:       { type: String, enum: ['pending', 'in_progress', 'completed', 'overdue'], default: 'pending' },
  completedAt:  { type: Date,   default: null },

  estimatedMins:{ type: Number, default: 0 },   // estimated time to complete
  reminder:     { type: Boolean, default: true }, // show reminder notification
}, { timestamps: true });

// Auto-mark overdue on fetch
DeadlineSchema.virtual('isOverdue').get(function () {
  return this.status !== 'completed' && new Date(this.dueDate) < new Date();
});

DeadlineSchema.virtual('daysLeft').get(function () {
  const diff = Math.ceil((new Date(this.dueDate) - new Date()) / 86400000);
  return diff;
});

DeadlineSchema.virtual('urgency').get(function () {
  if (this.status === 'completed') return 'done';
  const days = this.daysLeft;
  if (days < 0)  return 'overdue';
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days <= 3)  return 'soon';
  if (days <= 7)  return 'thisweek';
  return 'upcoming';
});

DeadlineSchema.set('toJSON',   { virtuals: true });
DeadlineSchema.set('toObject', { virtuals: true });

export default mongoose.models.Deadline || mongoose.model('Deadline', DeadlineSchema);