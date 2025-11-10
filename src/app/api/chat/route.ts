import { google } from '@ai-sdk/google';
import { streamText, convertToCoreMessages } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: google('gemini-2.5-flash'),
    system: `You are an expert AI tutor specialized in personalized learning. 
    Your role is to:
    1. Assess the student's current knowledge level through questions
    2. Adapt explanations based on their understanding
    3. Provide clear, step-by-step explanations
    4. Offer practice problems and check comprehension
    5. Track progress and suggest next topics
    6. Be encouraging and supportive
    7. Use examples and analogies to clarify concepts
    
    When a student asks a question:
    - First assess their current understanding
    - Break down complex topics into manageable chunks
    - Provide interactive learning opportunities
    - Give constructive feedback
    - Suggest related topics for deeper learning`,
    messages: convertToCoreMessages(messages),
  });

  return result.toDataStreamResponse();
}
