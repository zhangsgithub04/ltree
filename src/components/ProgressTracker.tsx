'use client';

import { useState, useEffect } from 'react';

interface ProgressTrackerProps {
  progress: {
    topicsLearned: number;
    questionsAsked: number;
    currentLevel: string;
  };
  currentSessionId: string | null;
  messages: Array<{ role: string; content: string; timestamp?: string | number }>;
  conversationTree: any[];
}

type TabType = 'session' | 'overall';

export default function ProgressTracker({ progress, currentSessionId, messages, conversationTree }: ProgressTrackerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('session');
  const [overallStats, setOverallStats] = useState({
    totalSessions: 0,
    totalMessages: 0,
    totalBranches: 0,
    averageSessionLength: 0,
    publicSessions: 0,
    streak: 3,
  });

  // Calculate current session stats
  const sessionStats = {
    messageCount: messages.length,
    userMessages: messages.filter(m => m.role === 'user').length,
    aiMessages: messages.filter(m => m.role === 'assistant').length,
    branches: conversationTree.reduce((count, node) => {
      const countChildren = (n: any): number => {
        if (!n.children || n.children.length === 0) return 0;
        if (n.children.length > 1) return 1 + n.children.reduce((sum: number, child: any) => sum + countChildren(child), 0);
        return n.children.reduce((sum: number, child: any) => sum + countChildren(child), 0);
      };
      return count + countChildren(node);
    }, 0),
    topicsExplored: progress.topicsLearned,
  };

  // Load overall stats from API
  useEffect(() => {
    const loadOverallStats = async () => {
      try {
        const response = await fetch('/api/sessions');
        const data = await response.json();
        
        if (response.ok && data.sessions) {
          const sessions = data.sessions;
          const totalMessages = sessions.reduce((sum: number, s: any) => sum + (s.messageCount || 0), 0);
          const totalBranches = sessions.reduce((sum: number, s: any) => {
            const tree = s.conversationTree || [];
            return sum + tree.reduce((count: number, node: any) => {
              const countChildren = (n: any): number => {
                if (!n.children || n.children.length === 0) return 0;
                if (n.children.length > 1) return 1 + n.children.reduce((s: number, c: any) => s + countChildren(c), 0);
                return n.children.reduce((s: number, c: any) => s + countChildren(c), 0);
              };
              return count + countChildren(node);
            }, 0);
          }, 0);
          
          setOverallStats({
            totalSessions: sessions.length,
            totalMessages,
            totalBranches,
            averageSessionLength: sessions.length > 0 ? Math.round(totalMessages / sessions.length) : 0,
            publicSessions: sessions.filter((s: any) => s.isPublic).length,
            streak: 3, // This could be calculated based on session dates
          });
        }
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };

    loadOverallStats();
  }, [currentSessionId]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <span>📊</span>
        <span>Stats</span>
      </h3>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('session')}
            className={`flex-1 px-3 py-2 text-sm font-medium transition-colors rounded-t-lg ${
              activeTab === 'session'
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            📝 Current Session
          </button>
          <button
            onClick={() => setActiveTab('overall')}
            className={`flex-1 px-3 py-2 text-sm font-medium transition-colors rounded-t-lg ${
              activeTab === 'overall'
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            🏆 Overall
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'session' ? (
          <div className="space-y-4">
            {/* Session Overview */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {sessionStats.messageCount}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Total Messages
                </div>
              </div>
            </div>

            {/* Message Breakdown */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  {sessionStats.userMessages}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-center justify-center gap-1">
                  <span>👤</span>
                  <span>Your Questions</span>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {sessionStats.aiMessages}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-center justify-center gap-1">
                  <span>🤖</span>
                  <span>AI Responses</span>
                </div>
              </div>
            </div>

            {/* Exploration Stats */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🌿</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Branches Created</span>
                </div>
                <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                  {sessionStats.branches}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎯</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Topics Explored</span>
                </div>
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {sessionStats.topicsExplored}
                </div>
              </div>
            </div>

            {/* Engagement Indicator */}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Engagement Level</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (sessionStats.branches + sessionStats.topicsExplored) * 10)}%` }}
                  ></div>
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {sessionStats.branches + sessionStats.topicsExplored > 5 ? 'High' : sessionStats.branches + sessionStats.topicsExplored > 2 ? 'Medium' : 'Low'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Overall Progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Level</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {progress.currentLevel}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                  style={{ width: '35%' }}
                ></div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {overallStats.totalSessions}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Total Sessions
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {overallStats.totalMessages}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Total Messages
                </div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📊</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Avg Session Length</span>
                </div>
                <div className="text-sm font-bold text-gray-900 dark:text-white">
                  {overallStats.averageSessionLength} msgs
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🌳</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Total Branches</span>
                </div>
                <div className="text-sm font-bold text-gray-900 dark:text-white">
                  {overallStats.totalBranches}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🌐</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Public Sessions</span>
                </div>
                <div className="text-sm font-bold text-gray-900 dark:text-white">
                  {overallStats.publicSessions}
                </div>
              </div>
            </div>

            {/* Streak */}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Streak</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Keep learning daily!</div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {overallStats.streak} days
                </div>
              </div>
            </div>

            {/* Learning Summary */}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Your Learning Journey</div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">{progress.topicsLearned} topics explored</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">{progress.questionsAsked} questions asked</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">{overallStats.totalBranches} learning paths created</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
