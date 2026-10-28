import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  role:      { type: String, enum: ['user', 'ai'], required: true },
  content:   { type: String, required: true },
  topic:     { type: String, default: '' },           // which topic this relates to
  helpful:   { type: Boolean, default: null },        // thumbs up/down
  createdAt: { type: Date, default: Date.now },
});

const DoubtSessionSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  subjectId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null  },
  subjectName: { type: String, default: 'General' },
  subjectEmoji:{ type: String, default: '📚' },
  subjectColor:{ type: String, default: '#7c3aed' },
  messages:    [MessageSchema],
  totalQuestions: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.DoubtSession
  || mongoose.model('DoubtSession', DoubtSessionSchema);