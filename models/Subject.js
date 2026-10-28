import mongoose from 'mongoose';

const TopicSchema = new mongoose.Schema({
  name:              { type: String, required: true, trim: true },
  order:             { type: Number, default: 0 },
  status:            { type: String, enum: ['locked','unlocked','completed'], default: 'unlocked' },
  // Timer connection — must study this many minutes before quiz unlocks
  studyMinutesRequired: { type: Number, default: 20 },
  studyMinutesLogged:   { type: Number, default: 0  },
  // Notes
  weakPoints:        { type: String, default: '' },
  importantPoints:   { type: String, default: '' },
  // Quiz history
  quizAttempts: [{
    score:        { type: Number },
    totalQ:       { type: Number },
    passed:       { type: Boolean },
    weakAreas:    [{ type: String }],
    attemptedAt:  { type: Date, default: Date.now },
  }],
  bestScore:     { type: Number, default: 0  },
  completedAt:   { type: Date,   default: null },
}, { _id: true });

const SubjectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', required: true, index: true,
  },
  name:             { type: String, required: true, trim: true, maxlength: 80 },
  emoji:            { type: String, default: '📚' },
  color:            { type: String, default: '#7c3aed' },
  examDate:         { type: Date,   required: true },
  dailyTargetHours: { type: Number, default: 1, min: 0.5, max: 12 },
  priority:         { type: String, enum: ['low','medium','high'], default: 'medium' },
  totalHoursStudied:{ type: Number, default: 0 },
  isCompleted:      { type: Boolean, default: false },

  // Global subject notes (syllabus overview, key points)
  syllabusNotes:    { type: String, default: '' },
  weakPoints:       { type: String, default: '' },
  importantPoints:  { type: String, default: '' },

  // Full syllabus quiz (taken after all topics done)
  fullQuizDone:     { type: Boolean, default: false },
  fullQuizScore:    { type: Number,  default: 0    },
  fullQuizWeakAreas:{ type: [String], default: []  },

  // Topics array (replaces totalChapters/completedChapters)
  topics:           [TopicSchema],
}, { timestamps: true });

// ── Virtuals ──────────────────────────────────────────────────────────────────
SubjectSchema.virtual('totalChapters').get(function () {
  return this.topics.length;
});
SubjectSchema.virtual('completedChapters').get(function () {
  return this.topics.filter(t => t.status === 'completed').length;
});
SubjectSchema.virtual('progressPercent').get(function () {
  if (!this.topics.length) return 0;
  return Math.round((this.topics.filter(t => t.status === 'completed').length / this.topics.length) * 100);
});
SubjectSchema.virtual('daysRemaining').get(function () {
  const diff = this.examDate - new Date();
  return Math.max(0, Math.ceil(diff / 86400000));
});

SubjectSchema.set('toJSON',   { virtuals: true });
SubjectSchema.set('toObject', { virtuals: true });

export default mongoose.models.Subject || mongoose.model('Subject', SubjectSchema);