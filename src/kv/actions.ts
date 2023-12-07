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

export async function storeThreadId({ userId, threadId }: { userId: string | number; threadId: string }) {
  const threadKey = `threadId:${userId}`;
  await kv.set(threadKey, threadId);
}

export async function getThreadId(userId: string | number) {
  const threadKey = `threadId:${userId}`;
  const threadId = await kv.get(threadKey);
  return threadId as string | undefined;
}
