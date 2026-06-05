export const TEAM_MEMBER_ROLES = ["admin", "manager", "member"];

export const TEAM_ADMIN_ROLES = ["admin"];

export const ROLE_LABELS = {
  admin: "Admin",
  manager: "Manager",
  member: "Member",
};

export function getTeamMemberRole(team, userId) {
  if (!team || !userId) {
    return "";
  }

  return team.members?.find((member) => member.user?._id?.toString?.() === userId.toString?.())?.role || "";
}

export function canManageTeam(team, userId) {
  return TEAM_ADMIN_ROLES.includes(getTeamMemberRole(team, userId));
}

export function getMemberDisplayName(member) {
  return (
    member?.user?.fullName ||
    member?.user?.username ||
    member?.user?.email ||
    "Unknown member"
  );
}

export function getMemberEmail(member) {
  return member?.user?.email || "";
}

export function getLogDisplayUser(log) {
  const performer = log?.performedBy || log?.user || log?.actor;

  if (typeof performer === "string") {
    return performer ? "User" : "System";
  }

  return (
    performer?.fullName ||
    performer?.username ||
    performer?.email ||
    (performer ? "User" : "System")
  );
}

export function getLogActionLabel(log) {
  return log?.action || log?.type || log?.event || "Unknown action";
}

export function getLogTaskTitle(log) {
  const todo = log?.todo;

  if (typeof todo === "string") {
    return todo;
  }

  return todo?.name || todo?.title || todo?.taskName || "Unknown task";
}

function formatStatusLabel(status) {
  const statusLabels = {
    "to-do": "To Do",
    pending: "To Do",
    "in-progress": "In Progress",
    "in-review": "In Review",
    completed: "Completed",
  };

  return statusLabels[status] || status || "Unknown status";
}

export function getLogActionMessage(log) {
  if (!log) {
    return "Unknown action";
  }

  const taskTitle = getLogTaskTitle(log);

  if (log.action === "status_changed") {
    const fromStatus = formatStatusLabel(log.previousStatus);
    const toStatus = formatStatusLabel(log.newStatus);

    if (fromStatus === toStatus) {
      return `Task stayed: ${taskTitle} in ${toStatus}`;
    }

    return `Task moved: ${taskTitle} from ${fromStatus} to ${toStatus}`;
  }

  const actionLabels = {
    created: "Task created",
    updated: "Task updated",
    completed: "Task completed",
    reopened: "Task reopened",
    assigned: "Task assigned",
    unassigned: "Task unassigned",
    deleted: "Task deleted",
  };

  const actionLabel = actionLabels[log.action] || getLogActionLabel(log);

  return `${actionLabel}: ${taskTitle}`;
}

export function formatLogTimestamp(value) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatRoleLabel(role) {
  return ROLE_LABELS[role] || role || "Unknown";
}