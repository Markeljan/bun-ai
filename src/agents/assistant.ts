import { experimental_AssistantResponse } from "ai";
import OpenAI from "openai";
import { MessageContentText } from "openai/resources/beta/threads/messages/messages";

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: `${process.env.OPENAI_API_KEY}`,
});

async function sendMessageToThread({ threadId, message }: { threadId?: string | null; message: string }) {
  // Create a thread if needed
  const resolvedThreadId = threadId ?? (await openai.beta.threads.create({})).id;

  // Add a message to the thread
  const createdMessage = await openai.beta.threads.messages.create(resolvedThreadId, {
    role: "user",
    content: message,
  });

  return experimental_AssistantResponse(
    { threadId: resolvedThreadId, messageId: createdMessage.id },
    async ({ threadId, sendMessage }) => {
      // Run the assistant on the thread
      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: `${process.env.OPENAI_ASSISTANT_ID}`,
      });

      async function waitForRun(run: OpenAI.Beta.Threads.Runs.Run) {
        // Poll for status change
        while (run.status === "queued" || run.status === "in_progress") {
          // delay for 500ms:
          await new Promise((resolve) => setTimeout(resolve, 500));

          run = await openai.beta.threads.runs.retrieve(threadId!, run.id);
        }

        // Check the run status
        if (
          run.status === "cancelled" ||
          run.status === "cancelling" ||
          run.status === "failed" ||
          run.status === "expired"
        ) {
          throw new Error(run.status);
        }

        if (run.status === "requires_action") {
          if (run.required_action?.type === "submit_tool_outputs") {
            const tool_outputs = run.required_action.submit_tool_outputs.tool_calls.map((toolCall) => {
              const parameters = JSON.parse(toolCall.function.arguments);

              switch (toolCall.function.name) {
                // case "getRoomTemperature": {
                //   const temperature = homeTemperatures[parameters.room as keyof typeof homeTemperatures];

                //   return {
                //     tool_call_id: toolCall.id,
                //     output: temperature.toString(),
                //   };
                // }

                // case "setRoomTemperature": {
                //   homeTemperatures[parameters.room as keyof typeof homeTemperatures] = parameters.temperature;

                //   return {
                //     tool_call_id: toolCall.id,
                //     output: `temperature set successfully`,
                //   };
                // }

                default:
                  throw new Error(`Unknown tool call function: ${toolCall.function.name}`);
              }
            });

            run = await openai.beta.threads.runs.submitToolOutputs(threadId!, run.id, { tool_outputs });

            await waitForRun(run);
          }
        }
      }

      await waitForRun(run);

      // Get new thread messages (after our message)
      const responseMessages = (
        await openai.beta.threads.messages.list(threadId, {
          after: createdMessage.id,
          order: "asc",
        })
      ).data;

      // Send the messages
      for (const message of responseMessages) {
        sendMessage({
          id: message.id,
          role: "assistant",
          content: message.content.filter((content) => content.type === "text") as Array<MessageContentText>,
        });
      }
    }
  );
}

// helper function to convert a stream to a string
async function streamToString(stream: any) {
  const reader = stream.getReader();
  let result = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    result += new TextDecoder().decode(value);
  }

  return result;
}

// Use the function

export const messageAssistant = async ({ threadId, message }: { threadId?: string; message: string }) => {
  const assistantResponse = await sendMessageToThread({ threadId, message });
  const assistantStream = await assistantResponse.body;

  if (assistantStream) {
    const data = await streamToString(assistantStream);

    // remove the first 2 characters:
    const dataTrimmed = data.substring(2);
    // split the string at 4:
    const splitData = dataTrimmed.split("4:");
    // parse remaining data:
    const parsedData1 = JSON.parse(splitData[0]);
    const parsedData2 = JSON.parse(splitData[1]);

    const threadId = parsedData1.threadId;
    const responseText = parsedData2.content[0].text.value;

    return { output: responseText, threadId: threadId };
  }

  return { output: "Error getting assistant response.", threadId: null };
};
