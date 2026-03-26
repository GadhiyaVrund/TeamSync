import mongoose from 'mongoose';

const teamInviteSchema = new mongoose.Schema(
  {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: [true, 'Team reference is required']
    },
    email: {
      type: String,
      default: null,
      trim: true,
      lowercase: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    role: {
      type: String,
      enum: ['member', 'admin'],
      default: 'member'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required']
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator reference is required']
    }
  },
  {
    timestamps: true
  }
);

teamInviteSchema.index({ expiresAt: 1 });

export const TeamInvite = mongoose.model('TeamInvite', teamInviteSchema);
