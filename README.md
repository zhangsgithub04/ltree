# AI Personalized Learning Platform

A Next.js application powered by Google Gemini AI and Vercel AI SDK that provides personalized, adaptive learning experiences.

## Features

- **AI-Powered Chat Interface**: Interactive learning with Google Gemini AI
- **Progress Tracking**: Monitor your learning journey with detailed statistics
- **Adaptive Learning**: AI adapts to your skill level and learning pace
- **Topic Recommendations**: Get personalized suggestions based on your interests
- **Real-time Streaming**: Fast, responsive AI interactions
- **Dark Mode Support**: Comfortable learning in any lighting condition

## Tech Stack

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Modern, responsive UI styling
- **Vercel AI SDK**: Streaming AI responses and chat management
- **Google Gemini**: Advanced AI language model
- **React**: Component-based UI library

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Google AI API key ([Get one here](https://aistudio.google.com/app/apikey))

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Then edit `.env.local` and add your Google AI API key:
   ```
   GOOGLE_GENERATIVE_AI_API_KEY=your_actual_api_key_here
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. **Start Learning**: Type a question or topic you want to learn about in the chat interface
2. **Track Progress**: View your learning statistics in the sidebar
3. **Explore Topics**: Click on suggested topics to start learning
4. **Interactive Learning**: The AI will adapt explanations to your level and provide practice problems

## Project Structure

```
aiui1/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── chat/
│   │   │       └── route.ts       # AI chat API endpoint
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Home page
│   │   └── globals.css            # Global styles
│   └── components/
│       ├── Chat.tsx               # Main chat interface
│       ├── ProgressTracker.tsx    # Progress tracking component
│       └── TopicSuggestions.tsx   # Topic recommendation component
├── .env.local.example             # Environment template
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.mjs
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

- `GOOGLE_GENERATIVE_AI_API_KEY` - Your Google AI API key (required)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Google Gemini AI](https://ai.google.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## Deployment

Deploy easily on [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add your `GOOGLE_GENERATIVE_AI_API_KEY` environment variable
4. Deploy!

## License

MIT
# ltree
