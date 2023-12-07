import express from "express";
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

import { callAgent } from "./agents/chat";

function getThreadId(sender: string) {
  // Read the file asynchronously
  fs.readFile("threadIds.txt", "utf8", (err: any, data: any) => {
    if (err) {
      // If file doesn't exist or another error occurs, handle it here
      console.error(err);
      return;
    }

    // Parse the data into an object
    let threadIds;
    try {
      threadIds = JSON.parse(data);
    } catch (parseErr) {
      // If parsing fails, handle error here
      console.error(parseErr);
      return;
    }

    // Check if sender's phone number exists
    if (threadIds[sender]) {
      // If exists, return the thread ID
      return threadIds[sender];
    } else {
      // If not, create a new thread ID
      const newThreadId = uuidv4();
      threadIds[sender] = newThreadId;

}

const { MessagingResponse } = require("twilio").twiml;

const app = express();

// Use middleware to parse JSON and URL-encoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/sms", async (req, res) => {
  const { From: sender, Body: content } = req.body;
  console.log(`Received a message from ${sender}: ${content}`);

  // Get the thread ID for this sender
  const threadId = getThreadId(sender);

  const twiml = new MessagingResponse();

  const agentResponse = await callAgent(content);

  twiml.message(agentResponse || "Failed to receve an output from the agent.  Please try again.");

  res.type("text/xml").send(twiml.toString());
});

app.listen(3000, () => {
  console.log("Express server listening on port 3000");
});
