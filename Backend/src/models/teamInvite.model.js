import mongoose from 'mongoose';

const teamInviteSchema = new mongoose.Schema(
  {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: [true, 'Team reference is required']
    },
    token: {
      type: String,
      required: [true, 'Invite token is required'],
      unique: true,
      trim: true
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

teamInviteSchema.index({ token: 1, expiresAt: 1 });

export const TeamInvite = mongoose.model('TeamInvite', teamInviteSchema);
