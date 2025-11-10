import Chat from "@/components/Chat";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              AI Personalized Learning
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Your adaptive learning companion powered by Google Gemini
            </p>
          </header>
          <Chat />
        </div>
      </div>
    </main>
  );
}
