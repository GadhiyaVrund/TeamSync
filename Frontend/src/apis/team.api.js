import axiosInstance from "./axios";

export const getUserTeams = () =>
  axiosInstance.get("/api/v1/teams");

export const createTeam = (data) =>
  axiosInstance.post("/api/v1/teams", data);

export const getTeamById = (teamId) =>
  axiosInstance.get(`/api/v1/teams/${teamId}`);

export const updateTeam = (teamId, data) =>
  axiosInstance.patch(`/api/v1/teams/${teamId}`, data);

export const deleteTeam = (teamId) =>
  axiosInstance.delete(`/api/v1/teams/${teamId}`);

export const addMember = (teamId, data) =>
  axiosInstance.post(`/api/v1/teams/${teamId}/members`, data);

export const removeMember = (teamId, memberId) =>
  axiosInstance.delete(`/api/v1/teams/${teamId}/members/${memberId}`);

export const updateMemberRole = (teamId, memberId, data) =>
  axiosInstance.patch(`/api/v1/teams/${teamId}/members/${memberId}`, data);

export const leaveTeam = (teamId) =>
  axiosInstance.post(`/api/v1/teams/${teamId}/leave`);

export const requestUserToJoinTeam = (teamId, data) =>
  axiosInstance.post(`/api/v1/teams/${teamId}/request-user`, data);
