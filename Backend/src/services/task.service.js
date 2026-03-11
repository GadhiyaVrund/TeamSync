import { ApiError } from "../utils/ApiError.js";
import { Todo } from "../models/todos.model.js";
import { AuditLog } from "../models/auditLog.model.js";
import { Team } from "../models/team.model.js";

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

export {
    completeTask    
};