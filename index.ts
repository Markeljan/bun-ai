import { callAgent } from "./src/agents/researcher";
import { sendSMS } from "./src/twilio";

const agentResponse = await callAgent("Who won Worlds in 2023 for League of Legends?");

sendSMS(agentResponse || "Failed to receve an output from the agent.  Please try again.");
