import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/* ─────────────────────────────────────────────
   🔔 Notification Schema
───────────────────────────────────────────── */
const NotificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'streak_risk',
      'milestone',
      'quiz_unlock',
      'exam_soon',
      'achievement',
      'star_earned'
    ],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  icon: { type: String, default: '🔔' },
  read: { type: Boolean, default: false },
  link: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

/* ─────────────────────────────────────────────
   👤 User Schema
───────────────────────────────────────────── */
const UserSchema = new mongoose.Schema(
  {
    // Basic Info
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },

    avatar: { type: String, default: '' },

    // 🎯 Goals
    goal: {
      type: String,
      enum: ['entrance', 'grades', 'habit', 'top'],
      default: 'habit',
    },
    goals: { type: [String], default: [] },
    examTarget: { type: String, default: '' },

    /* ─────────────────────────────────────────
       🔥 Streak System
    ───────────────────────────────────────── */
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastStudyDate: { type: Date, default: null },

    /* ─────────────────────────────────────────
       ⚡ XP & Level System
    ───────────────────────────────────────── */
    totalXP: { type: Number, default: 0 },
    level: { type: Number, default: 1 },

    /* ─────────────────────────────────────────
       ⭐ Stars System
    ───────────────────────────────────────── */
    totalStars: { type: Number, default: 0 },
    availableStars: { type: Number, default: 0 },
    redeemedStars: { type: Number, default: 0 },

    starHistory: [
      {
        stars: Number,
        reason: String,
        earnedAt: { type: Date, default: Date.now },
        expiresAt: Date,
      },
    ],

    /* ─────────────────────────────────────────
       🏆 Milestones
    ───────────────────────────────────────── */
    celebratedMilestones: {
      type: [Number],
      default: [],
    },

    /* ─────────────────────────────────────────
       🔔 Notifications
    ───────────────────────────────────────── */
    notifications: [NotificationSchema],
  },
  { timestamps: true }
);

/* ─────────────────────────────────────────────
   🔐 Password Hashing Middleware
───────────────────────────────────────────── */
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

/* ─────────────────────────────────────────────
   🔑 Compare Password Method
───────────────────────────────────────────── */
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/* ─────────────────────────────────────────────
   🏅 Virtual: Level Name
───────────────────────────────────────────── */
UserSchema.virtual('levelName').get(function () {
  const levels = [
    { min: 0, name: 'Beginner' },
    { min: 500, name: 'Scholar' },
    { min: 1500, name: 'Expert' },
    { min: 3000, name: 'Master' },
    { min: 6000, name: 'Legend' },
  ];

  const level = [...levels].reverse().find(l => this.totalXP >= l.min);
  return level?.name || 'Beginner';
});

UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

/* ─────────────────────────────────────────────
   🚀 Export Model (Prevent Hot Reload Error)
───────────────────────────────────────────── */
export default mongoose.models.User || mongoose.model('User', UserSchema);