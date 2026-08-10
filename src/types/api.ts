export type User = {
  id: number;
  name: string | null;
  email: string;
  avatar: string | null;
};

export type UserRelationship = "none" | "friends" | "outgoing_pending" | "incoming_pending";

export type SearchUser = User & {
  relationship: UserRelationship;
};

export type FriendLocation = {
  latitude: string | number;
  longitude: string | number;
  timestamp: string;
};

export type Friend = Pick<User, "id" | "name" | "avatar"> & {
  email?: string;
  location: FriendLocation | null;
};

export type IncomingInvite = {
  id: number;
  sender: Pick<User, "id" | "name" | "avatar"> & { email?: string };
  created_at: string;
};

export type OutgoingInvite = {
  id: number;
  recipient: Pick<User, "id" | "name" | "avatar"> & { email?: string };
  created_at: string;
};

export type Invites = {
  incoming: IncomingInvite[];
  outgoing: OutgoingInvite[];
};
