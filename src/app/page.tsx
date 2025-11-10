import Chat from "@/components/Chat";
import SignOutButton from "@/components/SignOutButton";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getSession();
  
  if (!session) {
    redirect('/signin');
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <header className="text-center mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1"></div>
              <h1 className="flex-1 text-4xl font-bold text-gray-900 dark:text-white">
                AI Personalized Learning
              </h1>
              <div className="flex-1 flex justify-end">
                <SignOutButton userName={session.name} />
              </div>
            </div>
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
