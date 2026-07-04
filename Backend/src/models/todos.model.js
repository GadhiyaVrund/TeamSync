import mongoose from 'mongoose';

const todoSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Todo name is required'],
      trim: true,
      maxlength: [100, 'Todo name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization reference is required']
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: [true, 'Team is required']
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    dueDate: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['to-do', 'in-progress', 'in-review', 'completed'],
      default: 'to-do'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
      required: [true, 'Priority is required']
    },
  },
  {
    timestamps: true // Creates createdAt and updatedAt fields automatically
  }
);

// Index for faster queries
todoSchema.index({ team: 1, status: 1 });
todoSchema.index({ assignedTo: 1 });
todoSchema.index({ dueDate: 1 });


export const Todo = mongoose.model('Todo', todoSchema);
