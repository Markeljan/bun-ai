import { OpenAIAssistantRunnable } from "langchain/experimental/openai_assistant";

// create a new assistant
// const assistant = await OpenAIAssistantRunnable.createAssistant({
//   model: "gpt-3.5-turbo-1106",
//   tools: [],
//   clientOptions: {
//     apiKey: process.env.OPENAI_API_KEY,
//   },
// });

// plain assistant with no name / instructions
const assistantId = "asst_2vELwUcKR8rwJMUfwsyVk8ov";
const assistant = new OpenAIAssistantRunnable({
  assistantId,
  asAgent: true,
  clientOptions: {
    apiKey: process.env.OPENAI_API_KEY,
  },
});

export async function callAgent(input: string): Promise<string | { output: string; threadId: string }> {
  const agentResponse = await assistant.invoke({
    threadId: "thread_tJiE0NkZiTGLcZEXz5lLMQkC",
    content: input,
  });

  if ("returnValues" in agentResponse) {
    const { returnValues, threadId } = agentResponse;
    const output = returnValues?.output;
    return { output, threadId };
  }

  const { threadId } = agentResponse[0];

  // either the agent failed or invoked a tool
  return { output: "Failed to receve an output from the agent.  Please try again.", threadId: threadId };
}
