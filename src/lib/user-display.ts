export type DisplayableUser = {
  name: string | null;
  email?: string | null;
};

export function displayName(user: DisplayableUser) {
  const name = user.name?.trim();
  if (name) return name;

  const emailName = user.email?.trim().split("@")[0];
  return emailName || "Kaquiz user";
}
