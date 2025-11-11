'use client';

import { useState } from 'react';

interface ShareButtonProps {
  sessionId: string | null;
  isPublic?: boolean;
  shareToken?: string;
}

export default function ShareButton({ sessionId, isPublic = false, shareToken }: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(isPublic);
  const [showCopied, setShowCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleShare = async () => {
    if (!sessionId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !isSharing }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSharing(!isSharing);
        
        if (!isSharing && data.shareUrl) {
          // Copy link to clipboard
          const fullUrl = `${window.location.origin}${data.shareUrl}`;
          await navigator.clipboard.writeText(fullUrl);
          setShowCopied(true);
          setTimeout(() => setShowCopied(false), 3000);
        }
      }
    } catch (error) {
      console.error('Error toggling share:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareToken) return;

    const shareUrl = `${window.location.origin}/share/${shareToken}`;
    await navigator.clipboard.writeText(shareUrl);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 3000);
  };

  if (!sessionId) return null;

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          onClick={handleToggleShare}
          disabled={isLoading}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            isSharing
              ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
          }`}
          title={isSharing ? 'Chat is public' : 'Make chat public'}
        >
          {isLoading ? (
            '⏳'
          ) : isSharing ? (
            <>🌐 Public</>
          ) : (
            <>🔒 Private</>
          )}
        </button>

        {isSharing && shareToken && (
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg text-sm font-medium transition-colors"
            title="Copy share link"
          >
            {showCopied ? '✓ Copied!' : '🔗 Copy Link'}
          </button>
        )}
      </div>

      {showCopied && (
        <div className="absolute top-full mt-2 right-0 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap z-50">
          Link copied to clipboard!
        </div>
      )}
    </div>
  );
}
