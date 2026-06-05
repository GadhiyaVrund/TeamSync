import { Router } from "express";
import {
    createTodo,
    getTodo,
    getAllTodos,
    updateTodo,
    completeTodo,
    moveTodo,
    getPriorityTodos,
    deleteTodo
} from "../controllers/todo.controller.js";
import { verifyJwt } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyJwt);

router.route("/")
    .post(createTodo)
    .get(getAllTodos);

router.route("/priority").get(getPriorityTodos);

router.route("/:id")
    .get(getTodo)
    .put(updateTodo)
    .delete(deleteTodo);

router.route("/:id/complete").patch(completeTodo);
router.route("/:id/move").patch(moveTodo);
export default router;
