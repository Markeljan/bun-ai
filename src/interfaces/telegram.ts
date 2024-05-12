import TelegramBot, { Message } from "node-telegram-bot-api";
import { messageAssistant } from "../agents/assistant";
import { getThreadId, storeThreadId, storeUser } from "../kv/actions";

const token = `${process.env.TELEGRAM_BOT_TOKEN}`;

// Create a bot that uses 'polling' to fetch new updates
export const bot = new TelegramBot(token, { polling: false });

// listen for /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const isGroup = msg.chat.type === "group" || msg.chat.type === "supergroup";
  const startMessage = isGroup
    ? "Hey! Thanks for the invite!  Please add me as an admin so I can read and respond to messages."
    : "Hey! Thanks for the invite.  I'm here to help you with your questions.  Just send me a message and I'll do my best to help you out.";
  bot.sendMessage(chatId, startMessage);
  // save the user or group to the KV store
  const { username, id: userId } = msg.from || { username: null, id: null };
  if (username && userId) {
    console.log("Storing user", username, userId);
    storeUser({ userId: userId, userDetails: { username, chatId: chatId } });
  }
  if (isGroup) {
    const { title, id: chatIdGroup } = msg.chat || { title: null, id: null };
    if (title && chatIdGroup) {
      console.log("Storing group", title, chatIdGroup);
      storeUser({ userId: chatIdGroup, userDetails: { username: title, chatId: chatIdGroup } });
    }
  }
});

// set a new threadId for a user or group
bot.onText(/\/setAgent (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const isGroup = msg.chat.type === "group" || msg.chat.type === "supergroup";
  const agent = match?.[1];
  const { username, id: userId } = msg.from || { username: null, id: null };
  if (username && userId && agent) {
    console.log("Storing user", username, userId, "with agent", agent);
    storeThreadId({ userId: userId, threadId: agent });
  }
  if (isGroup) {
    const { title, id: chatIdGroup } = msg.chat || { title: null, id: null };
    if (title && chatIdGroup && agent) {
      console.log("Storing group", title, chatIdGroup, "with agent", agent);
      storeThreadId({ userId: chatIdGroup, threadId: agent });
    }
  }
  bot.sendMessage(chatId, `Set agent to ${agent}`);
});

// listen for tagged messages
bot.onText(/^(?!\/start)(.*)/, async (msg) => {
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
        bot.sendMessage(msg.chat.id, output);
      } catch (e) {
        console.error(e);
      }
    }
  }

  // handle group messages
  if (msg.chat.type === "group" || msg.chat.type === "supergroup") {
    // require the bot to be tagged in the message (lowercase and uppercase)
    if (!msg.text?.toLowerCase().includes("@bun_ai_bot")) {
      return;
    }
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
        bot.sendMessage(chatIdGroup, output);
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
