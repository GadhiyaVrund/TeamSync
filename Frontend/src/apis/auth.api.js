import axiosInstance from "./axios";

export const loginUser = (data) =>
  axiosInstance.post("/api/v1/users/login", data);

export const registerUser = (data) =>
  axiosInstance.post("/api/v1/users/register", data);

export const getCurrentUser = () =>
  axiosInstance.get("/api/v1/users/me");

export const logoutUser = () =>
  axiosInstance.post("/api/v1/users/logout");

export const updateUserProfile = (userId, data) =>
  axiosInstance.patch(`/api/v1/users/${userId}`, data);

export const deleteUserAccount = (userId) =>
  axiosInstance.delete(`/api/v1/users/${userId}`);

export const createOrganization = (data) =>
  axiosInstance.post("/api/v1/organizations/", data);

export const joinOrganization = (data) =>
  axiosInstance.post("/api/v1/organizations/join", data);