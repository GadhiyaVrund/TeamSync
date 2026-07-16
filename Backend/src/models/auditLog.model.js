import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    // Who performed the action
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Performer (user) is required']
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization reference is required']
    },
    // Which task was affected
    todo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Todo',
      default: null
    },

    // Which team the task belongs to
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null
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
        'deleted',       // Task was deleted
        'organization_created',
        'join_code_regenerated',
        'organization_joined',
        'organization_left',
        'role_changed'
      ],
      required: [true, 'Action type is required']
    },

    // Task status before the action
    previousStatus: {
      type: String,
      enum: ['to-do', 'pending', 'in-progress', 'in-review', 'completed', null],
      default: null
    },

    // Task status after the action
    newStatus: {
      type: String,
      enum: ['to-do', 'pending', 'in-progress', 'in-review', 'completed', null],
      default: null
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
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

// Look up all organization-level events within an organization
auditLogSchema.index({ organization: 1, createdAt: -1 });

// Filter by action type across the collection
auditLogSchema.index({ action: 1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
