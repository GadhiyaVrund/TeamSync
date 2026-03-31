import axiosInstance from "./axios";

export const getNotifications = () =>
  axiosInstance.get("/api/v1/users/notifications");

export const acceptInvite = (inviteId) =>
  axiosInstance.post(`/api/v1/invites/${inviteId}/accept`);

export const rejectInvite = (inviteId) =>
  axiosInstance.post(`/api/v1/invites/${inviteId}/reject`);

export const acceptRequest = (requestId) =>
  axiosInstance.post(`/api/v1/requests/${requestId}/accept`);

export const rejectRequest = (requestId) =>
  axiosInstance.post(`/api/v1/requests/${requestId}/reject`);
