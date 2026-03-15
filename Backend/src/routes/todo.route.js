import { Router } from "express";
import {
    createTodo,
    getTodo,
    getAllTodos,
    updateTodo,
    completeTodo,
    moveTodo,
} from "../controllers/todo.controller.js";
import { verifyJwt } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyJwt);

router.route("/")
    .post(createTodo)
    .get(getAllTodos);

router.route("/:id")
    .get(getTodo)
    .put(updateTodo);

router.route("/:id/complete").patch(completeTodo);
router.route("/:id/move").patch(moveTodo);

export default router;
