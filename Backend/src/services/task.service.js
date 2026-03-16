import { ApiError } from "../utils/ApiError.js";
import { Todo } from "../models/todos.model.js";
import { AuditLog } from "../models/auditLog.model.js";
import { Team } from "../models/team.model.js";

const VALID_STATUSES = ['to-do', 'in-progress', 'in-review', 'completed'];
const ROLE_ADMIN = 'admin';
const ROLE_MANAGER = 'manager';

const getStatusIndex = (status) => VALID_STATUSES.indexOf(status);

const findTeamMember = (team, userId) =>
    team.members.find((member) => member.user.toString() === userId.toString());

const validateTaskMove = ({ role, fromStatus, toStatus }) => {
    if (fromStatus === toStatus) {
        return;
    }

    if (fromStatus === 'completed' && role == ROLE_ADMIN) {
        return;
    }

    if ((role === ROLE_MANAGER || role === ROLE_ADMIN) && fromStatus === 'in-review' && toStatus === 'in-progress') {
        return;
    }

    const currentIndex = getStatusIndex(fromStatus);
    const targetIndex = getStatusIndex(toStatus);

    if (targetIndex !== currentIndex + 1) {
        throw new ApiError(400, `Invalid move: ${fromStatus} can only move to next stage`);
    }
};

const completeTask = async(taskid, userId) => { 


    if(!(taskid && userId)) {  
        throw new ApiError(400, 'Task ID and User ID are required');
    }

    const task = await Todo.findById(taskid);
    if (!task) {
        throw new ApiError(404, 'Task not found');
    }

    if(task.status === 'completed') {
        throw new ApiError(400, 'Task is already completed');
    }

    const team = await Team.findById(task.team);
    if (!team) {
        throw new ApiError(404, 'Team not found');
    }

    const member = team.members.some(
        (member) => member.user.toString() === userId.toString()
    );

    if(!member) {
        throw new ApiError(403, 'You must be a member of the team to complete tasks');
    }

    if(task.assignedTo.toString() !== userId.toString()) {
        throw new ApiError(403, 'You are not authorized to complete this task');
    }

    const oldstatus = task.status;
    
    task.status = 'completed';
    await task.save();

    await AuditLog.create({
        action: 'completed',
        performedBy: userId, 
        todo: task._id,
        team: task.team,
        previousStatus: oldstatus,
        newStatus: 'completed',
    });
    
    return task;
}

const addTodoUpdatedAuditLog = async ({ taskId, performedBy, teamId, previousStatus = null, newStatus = null }) => {
    if (!(taskId && performedBy && teamId)) {
        throw new ApiError(400, 'Task ID, performer, and team are required');
    }

    return AuditLog.create({
        action: 'updated',
        performedBy,
        todo: taskId,
        team: teamId,
        previousStatus,
        newStatus,
    });
};

const addTaskMoveAuditLog = async ({ taskId, performedBy, fromStatus, toStatus, teamId }) => {
    if (!(taskId && performedBy && teamId)) {
        throw new ApiError(400, 'Task ID, performer, and team are required');
    }

    if (!toStatus || fromStatus === toStatus) {
        return null;
    }

    if (!VALID_STATUSES.includes(toStatus)) {
        throw new ApiError(400, 'Invalid target status');
    }

    return AuditLog.create({
        action: 'status_changed',
        performedBy,
        todo: taskId,
        team: teamId,
        previousStatus: fromStatus ?? null,
        newStatus: toStatus,
    });
};

const logTaskColumnMove = async (taskId, userId, nextStatus) => {
    if (!(taskId && userId && nextStatus)) {
        throw new ApiError(400, 'Task ID, user ID and next status are required');
    }

    const normalizedStatus = nextStatus === 'pending' ? 'to-do' : nextStatus;

    if (!VALID_STATUSES.includes(normalizedStatus)) {
        throw new ApiError(400, 'Invalid target status');
    }

    const task = await Todo.findById(taskId);
    if (!task) {
        throw new ApiError(404, 'Task not found');
    }

    const team = await Team.findById(task.team);
    if (!team) {
        throw new ApiError(404, 'Team not found');
    }

    const member = findTeamMember(team, userId);

    if (!member) {
        throw new ApiError(403, 'You are not a member of this team');
    }

    validateTaskMove({
        role: member.role,
        fromStatus: task.status,
        toStatus: normalizedStatus,
    });

    return addTaskMoveAuditLog({
        taskId: task._id,
        performedBy: userId,
        fromStatus: task.status,
        toStatus: normalizedStatus,
        teamId: task.team,
    });
};

const moveTask = async (taskId, userId, nextStatus) => {
    if (!(taskId && userId && nextStatus)) {
        throw new ApiError(400, 'Task ID, user ID and next status are required');
    }

    const normalizedStatus = nextStatus === 'pending' ? 'to-do' : nextStatus;

    if (!VALID_STATUSES.includes(normalizedStatus)) {
        throw new ApiError(400, 'Invalid target status');
    }

    const task = await Todo.findById(taskId);
    if (!task) {
        throw new ApiError(404, 'Task not found');
    }

    const team = await Team.findById(task.team);
    if (!team) {
        throw new ApiError(404, 'Team not found');
    }

    const member = findTeamMember(team, userId);

    if (!member) {
        throw new ApiError(403, 'You are not a member of this team');
    }

    validateTaskMove({
        role: member.role,
        fromStatus: task.status,
        toStatus: normalizedStatus,
    });

    const previousStatus = task.status;
    task.status = normalizedStatus;
    await task.save();

    await addTaskMoveAuditLog({
        taskId: task._id,
        performedBy: userId,
        fromStatus: previousStatus,
        toStatus: normalizedStatus,
        teamId: task.team,
    });

    return Todo.findById(task._id)
        .populate('team', 'name description')
        .populate('assignedTo', 'username email fullName');
};




export {
    completeTask,
    addTodoUpdatedAuditLog,
    addTaskMoveAuditLog,
    logTaskColumnMove,
    moveTask,
};