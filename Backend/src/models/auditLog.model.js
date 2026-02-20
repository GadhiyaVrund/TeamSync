import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    // Who performed the action
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Performer (user) is required']
    },

    // Which task was affected
    todo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Todo',
      required: [true, 'Todo reference is required']
    },

    // Which team the task belongs to
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: [true, 'Team reference is required']
    },

    // Type of action performed
    action: {
      type: String,
      enum: [
        'created',       // Task was created
        'updated',       // Task details were updated
        'completed',     // Task was marked as completed
        'reopened',      // Task was moved back from completed
        'assigned',      // Task was assigned to a user
        'unassigned',    // Task assignment was removed
        'status_changed',// Task status changed (pending → in-progress, etc.)
        'deleted'        // Task was deleted
      ],
      required: [true, 'Action type is required']
    },

    // Task status before the action
    previousStatus: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', null],
      default: null
    },

    // Task status after the action
    newStatus: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', null],
      default: null
    },

    // Snapshot of the task name at the time of action (for deleted tasks)
    todoSnapshot: {
      name: { type: String },
      description: { type: String }
    },

    // Optional human-readable note about the action
    note: {
      type: String,
      trim: true,
      maxlength: [300, 'Note cannot exceed 300 characters'],
      default: null
    },
  },
  {
    timestamps: true // Adds createdAt (when the log was recorded) and updatedAt
  }
);

// --- Indexes for efficient querying ---

// Look up all logs for a specific todo
auditLogSchema.index({ todo: 1, createdAt: -1 });

// Look up all actions performed by a specific user
auditLogSchema.index({ performedBy: 1, createdAt: -1 });

// Look up all logs within a team
auditLogSchema.index({ team: 1, createdAt: -1 });

// Filter by action type across the collection
auditLogSchema.index({ action: 1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
