import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Todo } from "../models/todos.model.js";
import { completeTask, moveTask } from "../services/task.service.js";
import { Team } from "../models/team.model.js";

const createTodo = asyncHandler(async (req, res) => {
    const { name, description, team, assignedTo, status, dueDate, priority } = req.body;
    const userId = req.user._id;


    const trimmedName = name ? name.trim() : '';
    const trimmedDescription = description ? description.trim() : '';
    // Validate required fields
    if (!trimmedName ) {
        throw new ApiError(400, 'Todo name is required');
    }

    

    if (!team) {
        throw new ApiError(400, 'Team is required');
    }

    // Validate name length
    if (trimmedName.length > 100) {
        throw new ApiError(400, 'Todo name cannot exceed 100 characters');
    }

    // Validate description length if provided
    if (trimmedDescription && trimmedDescription.length > 500) {
        throw new ApiError(400, 'Description cannot exceed 500 characters');
    }

    // Validate status if provided
    const validStatuses = ['to-do', 'in-progress', 'in-review', 'completed'];
    if (status && !validStatuses.includes(status)) {
        throw new ApiError(400, `Status must be one of: ${validStatuses.join(', ')}`);
    }

    // Validate priority if provided
    const validPriorities = ['low', 'medium', 'high'];
    if (priority && !validPriorities.includes(priority)) {
        throw new ApiError(400, `Priority must be one of: ${validPriorities.join(', ')}`);
    }

    // Check if team exists
    const teamExists = await Team.findById(team).select('members tasks');

    if (!teamExists) {
        throw new ApiError(404, 'Team not found');
    }
    
    // Check if user is a member of the team
    const userMember = teamExists.members.find(
        (member) => member.user.toString() === userId.toString()
    );
    
    if (!userMember) {
        throw new ApiError(403, 'You must be a member of the team to create tasks');
    }

    // Only admin or manager can set due date
    if (dueDate && !['admin', 'manager'].includes(userMember.role)) {
        throw new ApiError(403, 'Only admin or manager can set due dates');
    }

    // Validate due date is not in the past
    if (dueDate) {
        const dueDateObj = new Date(dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (dueDateObj < today) {
            throw new ApiError(400, 'Due date cannot be in the past');
        }
    }

    // If assignedTo is provided, verify they are a team member
    if (assignedTo) {
        const assigneeIsMember = teamExists.members.some(
            (member) => member.user.toString() === assignedTo.toString()
        );

        if (!assigneeIsMember) {
            throw new ApiError(400, 'Assigned user must be a member of the team');
        }
    }

    // Create the todo
    const todo = await Todo.create({
        name: trimmedName,
        description: trimmedDescription || undefined,
        team,
        assignedTo: assignedTo || null,
        status: status || 'to-do',
        dueDate: dueDate || null,
        priority: priority || 'medium'

    });

    
    // Add todo to team's tasks array
    teamExists.tasks.push(todo._id);
    await teamExists.save();

    // Fetch the created todo with populated fields
    const createdTodo = await Todo.findById(todo._id)
        .populate('assignedTo', 'username')
        .select('_id name description status priority assignedTo createdAt dueDate');

    return res
        .status(201)
        .json(new ApiResponse(201, createdTodo, 'Todo created successfully'));
});

const getTodo = asyncHandler(async (req, res) => {
    const todo = await Todo.findById(req.params.id)
        .populate('team', 'name description')
        .populate('assignedTo', 'username email fullName');

    if (!todo) {
        throw new ApiError(404, 'Todo not found');
    }

    return res
        .status(200)
        .json(new ApiResponse(200, todo, 'Todo retrieved successfully'));
});

const getAllTodos = asyncHandler(async (req, res) => {
    const userid = req.user._id;
    const todos = await Todo.find({ assignedTo: userid })
        .populate('team', 'name description')
        .populate('assignedTo', 'username email fullName')
        .sort({ dueDate: 1 }); // Sort by due date ascending
    

    return res
        .status(200)
        .json(new ApiResponse(200, todos, 'Todos retrieved successfully'));
});


const completeTodo = asyncHandler(async (req, res) => {
    const task = await completeTask(req.params.id, req.user._id);

    return res
        .status(200)
        .json(new ApiResponse(200, task, 'Todo marked as completed successfully'));

});

const updateTodo = asyncHandler(async (req, res) => {
    const { name, description, status, dueDate, priority } = req.body;
    const uid = req.user._id;
    const todo = await Todo.findById(req.params.id);

    if (!todo) {
        throw new ApiError(404, 'Todo not found');
    }

    const team = await Team.findById(todo.team);
    if (!team) {
        throw new ApiError(404, 'Team not found');
    }
    
    const userMember = team.members.find(
        (member) => member.user.toString() === uid.toString()
    );

    if (!userMember || !['admin', 'manager'].includes(userMember.role)) {
        throw new ApiError(403, 'Only admin or manager can update tasks');
    }

    // Validate priority if provided
    const validPriorities = ['low', 'medium', 'high'];
    if (priority && !validPriorities.includes(priority)) {
        throw new ApiError(400, `Priority must be one of: ${validPriorities.join(', ')}`);
    }

    // Validate status if provided
    const validStatuses = ['to-do', 'in-progress', 'in-review', 'completed'];
    if (status && !validStatuses.includes(status)) {
        throw new ApiError(400, `Status must be one of: ${validStatuses.join(', ')}`);
    }

    // Validate due date is not in the past
    if (dueDate) {
        const dueDateObj = new Date(dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (dueDateObj < today) {
            throw new ApiError(400, 'Due date cannot be in the past');
        }
    }

    const updatedTodo = await Todo.findByIdAndUpdate(
        req.params.id,
        { 
            ...(name && { name }),
            ...(description !== undefined && { description }),
            ...(status && { status }),
            ...(dueDate !== undefined && { dueDate }),
            ...(priority && { priority })
        },
        { new: true }
    )
    .populate('team', 'name description')
    .populate('assignedTo', 'username email fullName');

    return res
        .status(200)
        .json(new ApiResponse(200, updatedTodo, 'Todo updated successfully'));
});

// priority (high to low) and then by due date (ascending)
const getPriorityTodos = asyncHandler(async (req, res) => {

    const userid = req.user._id;

    if(!userid){
        throw new ApiError(400, 'User ID is required');
    }
    
    const todos = await Todo.find({ assignedTo: userid })
        .populate('team', 'name description')
        .populate('assignedTo', 'username email fullName')
        .sort({ priority: -1, dueDate: 1 }); 

    if(todos.length === 0){
        return res
        .status(200)
        .json(new ApiResponse(200, [], 'No todos found for the user'));
    }    

    return res
        .status(200)
        .json(new ApiResponse(200, todos, 'High priority todos retrieved successfully'));

});

const moveTodo = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const updatedTodo = await moveTask(req.params.id, req.user._id, status);

    return res
    .status(200)
    .json(new ApiResponse(200, updatedTodo, 'Todo moved successfully'));
});



export {
    createTodo,
    completeTodo,
    getTodo,
    getAllTodos,
    updateTodo,
    moveTodo,
    getPriorityTodos
};