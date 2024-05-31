import express from "express";
import { messageAssistant } from "../agents/assistant";

const { MessagingResponse } = require("twilio").twiml;

const app = express();

// Use middleware to parse JSON and URL-encoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/sms", async (req, res) => {
  const { From: sender, Body: content } = req.body;
  console.log(`Received a message from ${sender}: ${content}`);

  const twiml = new MessagingResponse();

  const { output, threadId } = await messageAssistant({
    message: content,
    threadId: sender,
    assistantId: `${process.env.OPENAI_ASSISTANT_ID}`,
  });

  twiml.message(output);

  console.log(`Thread ID: ${threadId}`);
  console.log(`Sending a message to ${sender}: ${output}`);

  res.type("text/xml").send(twiml.toString());
});

app.listen(3000, () => {
  console.log("Express server listening on port 3000");
});
