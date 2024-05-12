import { kv } from "@vercel/kv";

export type UserDetails = {
  username: string;
  chatId: string | number;
};
export async function storeUser({ userId, userDetails }: { userId: string | number; userDetails: UserDetails }) {
  const userKey = `userDetails:${userId}`;
  await kv.set(userKey, userDetails);
}

export async function getUser(userId: string | number) {
  const userKey = `userDetails:${userId}`;
  const userDetails = await kv.get(userKey);
  return userDetails as UserDetails | undefined;
}

type Thread = {
  threadId: string;
  assistantId: string;
};

export async function storeThread({ userId, thread }: { userId: string | number; thread: Thread }) {
  const threadKey = `threadId:${userId}`;
  await kv.set(threadKey, thread);
}

export async function getThread(userId: string | number) {
  const threadKey = `threadId:${userId}`;
  const thread = await kv.get(threadKey);
  return thread as Thread | undefined;
}
