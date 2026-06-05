import { getTeamById, getTeamActivityLogs, removeMember, updateMemberRole } from "../apis/team.api";

export async function fetchTeamMembers(teamId) {
  const response = await getTeamById(teamId);
  return response?.data?.data || null;
}

export async function changeTeamMemberRole(teamId, memberId, role) {
  const response = await updateMemberRole(teamId, memberId, { role });
  return response?.data?.data || null;
}

export async function deleteTeamMember(teamId, memberId) {
  const response = await removeMember(teamId, memberId);
  return response?.data?.data || null;
}

export async function fetchTeamActivityLogs(teamId, page = 1, limit = 10) {
  const response = await getTeamActivityLogs(teamId, { page, limit });
  return response?.data?.data || null;
}