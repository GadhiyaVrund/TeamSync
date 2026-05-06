import axiosInstance from "./axios";

export const createTodo = (data) =>
  axiosInstance.post("/api/v1/todos", data);

export const getAssignedTodos = () =>
  axiosInstance.get("/api/v1/todos");

export const getPriorityTodos = () =>
  axiosInstance.get("/api/v1/todos/priority");

export const updateTodo = (id, data) =>
  axiosInstance.put(`/api/v1/todos/${id}`, data);

export const moveTodo = (id, status) =>
  axiosInstance.patch(`/api/v1/todos/${id}/move`, { status });

export const completeTodo = (id) =>
  axiosInstance.patch(`/api/v1/todos/${id}/complete`);