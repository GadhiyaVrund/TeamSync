import axiosInstance from "./axios";

export const searchUsers = (query) =>
  axiosInstance.get(`/api/v1/users/search?q=${encodeURIComponent(query)}`);

export const getRecentActivities = () =>
  axiosInstance.get(`/api/v1/users/activities`);
