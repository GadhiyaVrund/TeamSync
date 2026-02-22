import mongoose from 'mongoose';

// Member schema for better readability and reusability
const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required']
    },
    role: {
      type: String,
      enum: ['admin', 'member', 'viewer'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      minlength: [3, 'Team name must be at least 3 characters long'],
      maxlength: [50, 'Team name cannot exceed 50 characters']
    },
    members: [memberSchema],
    tasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Todo'
      }
    ],
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
teamSchema.index({ name: 1 });
teamSchema.index({ 'members.user': 1 });

// Virtual to get member count
teamSchema.virtual('memberCount').get(function () {
  return this.members.length;
});

// Virtual to get task count
teamSchema.virtual('taskCount').get(function () {
  return this.tasks.length;
});

// Method to add member to team
teamSchema.methods.addMember = function (userId, role = 'member') {
  const memberExists = this.members.some(
    (member) => member.user.toString() === userId.toString()
  );
  
  if (memberExists) {
    throw new Error('User is already a member of this team');
  }
  
  this.members.push({
    user: userId,
    role: role,
    joinedAt: new Date()
  });
  
  return this.save();
};

// Method to remove member from team
teamSchema.methods.removeMember = function (userId) {
  this.members = this.members.filter(
    (member) => member.user.toString() !== userId.toString()
  );
  
  return this.save();
};

// Method to add task to team
teamSchema.methods.addTask = function (taskId) {
  if (!this.tasks.includes(taskId)) {
    this.tasks.push(taskId);
  }
  
  return this.save();
};

// Method to remove task from team
teamSchema.methods.removeTask = function (taskId) {
  this.tasks = this.tasks.filter(
    (task) => task.toString() !== taskId.toString()
  );
  
  return this.save();
};

// Static method to find teams by member
teamSchema.statics.findByMember = function (userId) {
  return this.find({ 'members.user': userId });
};

// Pre-save middleware to ensure at least one admin
teamSchema.pre('save', function (next) {
  if (this.members.length > 0) {
    const hasAdmin = this.members.some((member) => member.role === 'admin');
    if (!hasAdmin) {
      return next(new Error('Team must have at least one admin'));
    }
  }
});

// Ensure virtuals are included when converting to JSON
teamSchema.set('toJSON', { virtuals: true });
teamSchema.set('toObject', { virtuals: true });

const Team = mongoose.model('Team', teamSchema);

export { Team };
