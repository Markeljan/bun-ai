import TelegramBot from "node-telegram-bot-api";
import { messageAssistant } from "../agents/assistant";
import { getThreadId, storeThreadId, storeUser } from "../kv/actions";

const token = `${process.env.TELEGRAM_BOT_TOKEN}`;

// Create a bot that uses 'polling' to fetch new updates
export const bot = new TelegramBot(token, { polling: true });

// listen for /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Welcome to bun-bot!");
  // save the user to KV
  const { username, id: userId } = msg.from || { username: null, id: null };
  if (username && userId) {
    console.log("Storing user", username, userId);
    storeUser({ userId: userId, userDetails: { username, chatId: chatId } });
  }
});

// listen for everthing except /start
bot.onText(/^(?!\/start)(.*)/, async (msg) => {
  const chatId = msg.chat.id;

  const { username, id: userId } = msg.from || { username: null, id: null };
  if (username && userId && msg.text) {
    console.log("Received a message from", msg.from?.username, ":", msg.text);

    // get user's threadId
    const userThreadId = await getThreadId(userId);
    console.log("userThreadId", userThreadId);
    const { output, threadId } = await messageAssistant({ message: msg.text, threadId: userThreadId });
    console.log("Assistant response:", output, threadId);
    // if there was no threadId, store the new created threadId
    if (!userThreadId && threadId) {
      console.log("Storing threadId", threadId, "for user", userId);
      await storeThreadId({ userId: userId, threadId });
    }

    // send a message to the chat acknowledging receipt of their message
    bot.sendMessage(chatId, output);
  }
});

console.log("bun-bot running.");
