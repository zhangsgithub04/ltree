# ⚠️ Environment Setup Required

Before running the application, you need to set up your Google AI API key:

## Steps:

1. **Get your API key** from [Google AI Studio](https://aistudio.google.com/app/apikey)

2. **Create a `.env.local` file** in the root directory:
   ```bash
   cp .env.local.example .env.local
   ```

3. **Add your API key** to `.env.local`:
   ```
   GOOGLE_GENERATIVE_AI_API_KEY=your_actual_api_key_here
   ```

4. **Restart the dev server** if it's already running

The application will not work without this API key!
