import mongoose from 'mongoose';

const organizationMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required']
    },
    role: {
      type: String,
      enum: ['admin', 'member', 'manager'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const organizationSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        trim: true
    },
    joinCode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    members: [organizationMemberSchema],
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

export const Organization = mongoose.model('Organization', organizationSchema);