import { GoogleCustomSearch } from "langchain/tools";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { PlanAndExecuteAgentExecutor } from "langchain/experimental/plan_and_execute";

const model = new ChatOpenAI({
  openAIApiKey: `${process.env.OPENAI_API_KEY}`,
  modelName: "gpt-4-1106-preview",
  // modelName: "gpt-3.5-turbo-1106",
  verbose: true,
});

const tools = [
  new GoogleCustomSearch({
    apiKey: `${process.env.GOOGLE_SEARCH_API_KEY}`,
    googleCSEId: `${process.env.GOOGLE_SEARCH_ID}`,
  }),
];

const executor = await PlanAndExecuteAgentExecutor.fromLLMAndTools({
  llm: model,
  tools,
});

// const getInput = async () => {
//   process.stdout.write("Agent task: ");
//   for await (const line of console) {
//     return line;
//   }
// };

// const userInput = await getInput();

// const { output } = await executor.call({
//   input: userInput,
// });

// console.log(output);

export async function callAgent(input: string) {
  const { output } = await executor.call({
    input,
  });

  return output;
}
