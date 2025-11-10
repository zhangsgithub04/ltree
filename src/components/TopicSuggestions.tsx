export default function TopicSuggestions() {
  const topics = [
    { name: 'Mathematics', icon: '📐', color: 'bg-blue-100 dark:bg-blue-900' },
    { name: 'Science', icon: '🔬', color: 'bg-green-100 dark:bg-green-900' },
    { name: 'Programming', icon: '💻', color: 'bg-purple-100 dark:bg-purple-900' },
    { name: 'Languages', icon: '🌍', color: 'bg-yellow-100 dark:bg-yellow-900' },
    { name: 'History', icon: '📚', color: 'bg-red-100 dark:bg-red-900' },
    { name: 'Art', icon: '🎨', color: 'bg-pink-100 dark:bg-pink-900' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Explore Topics
      </h3>
      
      <div className="grid grid-cols-2 gap-3">
        {topics.map((topic) => (
          <button
            key={topic.name}
            className={`${topic.color} p-3 rounded-lg hover:scale-105 transition-transform text-center`}
          >
            <div className="text-2xl mb-1">{topic.icon}</div>
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {topic.name}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Recommended For You
        </h4>
        <ul className="space-y-2">
          <li className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Linear Algebra Basics</span>
          </li>
          <li className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>React Fundamentals</span>
          </li>
          <li className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Spanish Conversation</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
