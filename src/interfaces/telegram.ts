import TelegramBot, { Message } from "node-telegram-bot-api";
import { messageAssistant } from "../agents/assistant";
import { getThreadId, storeThreadId, storeUser } from "../kv/actions";

const token = `${process.env.TELEGRAM_BOT_TOKEN}`;

// Create a bot that uses 'polling' to fetch new updates
export const bot = new TelegramBot(token, { polling: false });

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

  // handle private messages
  if (msg.chat.type === "private") {
    const { username, id: userId } = msg.from || { username: null, id: null };
    if (username && userId && msg.text) {
      const msgWithContex = messageWithContext(msg);
      console.log("Received message:", msgWithContex);

      const userThreadId = await getThreadId(userId);

      try {
        const { output, threadId } = await messageAssistant({
          message: msgWithContex,
          threadId: userThreadId,
        });
        console.log("Assistant response:", output, threadId);

        // if there was no threadId, store the new created threadId
        if (!userThreadId && threadId) {
          console.log("Storing threadId", threadId, "for user", userId);
          await storeThreadId({ userId: userId, threadId });
        }

        // send a message to the chat acknowledging receipt of their message
        bot.sendMessage(chatId, output);
      } catch (e) {
        console.error(e);
      }
    }
  }

  // handle group messages
  if (msg.chat.type === "group" || msg.chat.type === "supergroup") {
    const { title, id: chatIdGroup } = msg.chat || { title: null, id: null };
    if (title && chatIdGroup && msg.text) {
      const msgWithContex = messageWithContext(msg);
      console.log("Received message:", msgWithContex);

      const groupThreadId = await getThreadId(chatIdGroup);

      try {
        const { output, threadId } = await messageAssistant({
          message: msgWithContex,
          threadId: groupThreadId,
        });
        console.log("Assistant response:", output, threadId);

        // if there was no threadId, store the new created threadId
        if (!groupThreadId && threadId) {
          console.log("Storing threadId", threadId, "for group", chatIdGroup);
          await storeThreadId({ userId: chatIdGroup, threadId });
        }

        // send a message to the chat acknowledging receipt of their message
        bot.sendMessage(chatId, output);
      } catch (e) {
        console.error(e);
      }
    }
  }
});

const messageWithContext = (message: Message) => {
  return JSON.stringify({
    chatTitle: message.chat.type === "private" ? "private chat" : message.chat.title,
    username: message.from?.username,
    message: message.text,
  });
};

console.log("bun-bot running.");
