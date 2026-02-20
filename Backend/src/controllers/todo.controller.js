import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Todo } from "../models/todos.model.js";
import Team from "../models/team.model.js";

const createTodo = asyncHandler(async (req, res) => {
    const { name, description, team, assignedTo, status } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!name || !name.trim()) {
        throw new ApiError(400, 'Todo name is required');
    }

    if (!team) {
        throw new ApiError(400, 'Team is required');
    }

    // Validate name length
    if (name.length > 100) {
        throw new ApiError(400, 'Todo name cannot exceed 100 characters');
    }

    // Validate description length if provided
    if (description && description.length > 500) {
        throw new ApiError(400, 'Description cannot exceed 500 characters');
    }

    // Validate status if provided
    const validStatuses = ['pending', 'in-progress', 'completed'];
    if (status && !validStatuses.includes(status)) {
        throw new ApiError(400, `Status must be one of: ${validStatuses.join(', ')}`);
    }

    // Check if team exists
    const teamExists = await Team.findById(team);
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
        name: name.trim(),
        description: description ? description.trim() : undefined,
        team,
        assignedTo: assignedTo || null,
        status: status || 'pending'
    });

    // Add todo to team's tasks array
    teamExists.tasks.push(todo._id);
    await teamExists.save();

    // Fetch the created todo with populated fields
    const createdTodo = await Todo.findById(todo._id)
        .populate('team', 'name description')
        .populate('assignedTo', 'username email fullName');

    return res
        .status(201)
        .json(new ApiResponse(201, createdTodo, 'Todo created successfully'));
});



export {
    createTodo
};