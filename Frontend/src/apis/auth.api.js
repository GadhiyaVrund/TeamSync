import axiosInstance from "./axios";

export const loginUser = (data) =>
  axiosInstance.post("/api/v1/users/login", data);

export const registerUser = (data) =>
  axiosInstance.post("/api/v1/users/register", data);

export const getCurrentUser = () =>
  axiosInstance.get("/api/v1/users/me");
