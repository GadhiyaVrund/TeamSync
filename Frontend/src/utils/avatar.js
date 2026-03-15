export const AVATAR_COLORS = [
  "bg-violet-500", "bg-sky-500", "bg-emerald-500",
  "bg-amber-500",  "bg-rose-500", "bg-indigo-500",
];

/** Returns 1-2 uppercase initials from a username.
 *  alex_johnson → AJ  |  alexjohnson → AL  |  alex → AL
 */
export function getInitials(username = "") {
  if (!username) return "";
  const parts = username.trim().split(/[_\-.\s]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return username.slice(0, 2).toUpperCase();
}

export function getAvatarColor(username = "") {
  return AVATAR_COLORS[(username.charCodeAt(0) || 0) % AVATAR_COLORS.length];
}
