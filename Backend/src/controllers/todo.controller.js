import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Todo } from "../models/todos.model.js";
import { completeTask } from "../services/task.service.js";
import { Team } from "../models/team.model.js";

const createTodo = asyncHandler(async (req, res) => {
    const { name, description, team, assignedTo, status } = req.body;
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

    // Check if team exists
    const teamExists = await Team.findById(team).select('members tasks');

    if (!teamExists) {
        throw new ApiError(404, 'Team not found');
    }
    
    // Check if user is a member of the team
    const isMember = teamExists.members.some(
        (member) => member.user.toString() === userId.toString()
    );
    
    if (!isMember) {
        throw new ApiError(403, 'You must be a member of the team to create tasks');
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
        status: status || 'in-progress'
    });

    
    // Add todo to team's tasks array
    teamExists.tasks.push(todo._id);
    await teamExists.save();

    // Fetch the created todo with populated fields
    const createdTodo = await Todo.findById(todo._id)
        .populate('assignedTo', 'username')
        .select('_id name description status assignedTo createdAt');

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
        .populate('assignedTo', 'username email fullName');
    

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
    const { name, description, status } = req.body;
    const uid = req.user._id;
    const todo = await Todo.findById(req.params.id);

    if (!todo) {
        throw new ApiError(404, 'Todo not found');
    }

    const team = await Team.findById(todo.team);
    if (!team) {
        throw new ApiError(404, 'Team not found');
    }
    const isMember = team.members.some(
        (member) => member.user.toString() === uid.toString()
    );

    if (!isMember) {
        throw new ApiError(403, 'You are not a member of this team');
    }

    const updatedTodo = await Todo.findByIdAndUpdate(
        req.params.id,
        { name, description, status },
        { new: true }
    )
    .populate('team', 'name description')
    .populate('assignedTo', 'username email fullName');

    return res
        .status(200)
        .json(new ApiResponse(200, updatedTodo, 'Todo updated successfully'));
});



export {
    createTodo,
    completeTodo,
    getTodo,
    getAllTodos,
    updateTodo
};