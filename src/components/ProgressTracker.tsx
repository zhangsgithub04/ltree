interface ProgressTrackerProps {
  progress: {
    topicsLearned: number;
    questionsAsked: number;
    currentLevel: string;
  };
}

export default function ProgressTracker({ progress }: ProgressTrackerProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Your Progress
      </h3>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">Level</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {progress.currentLevel}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: '35%' }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {progress.topicsLearned}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Topics Learned
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {progress.questionsAsked}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Questions Asked
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Streak</span>
            <span className="flex items-center gap-1">
              <span className="text-xl">🔥</span>
              <span className="font-semibold">3 days</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
