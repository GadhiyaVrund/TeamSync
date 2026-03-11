import axiosInstance from "./axios";

export const createTodo = (data) =>
  axiosInstance.post("/api/v1/todos", data);

export const updateTodo = (id, data) =>
  axiosInstance.put(`/api/v1/todos/${id}`, data);
