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
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending'
    },
  },
  {
    timestamps: true // Creates createdAt and updatedAt fields automatically
  }
);

// Index for faster queries
todoSchema.index({ team: 1, status: 1 });
todoSchema.index({ assignedTo: 1 });



export const Todo = mongoose.model('Todo', todoSchema);
