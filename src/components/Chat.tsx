'use client';

import { useChat } from 'ai/react';
import { useState, useRef, useEffect } from 'react';
import ProgressTracker from './ProgressTracker';
import TopicSuggestions from './TopicSuggestions';
import ConversationTree from './ConversationTree';
import ConversationBranchTree from './ConversationBranchTree';
import SessionsList from './SessionsList';
import ShareButton from './ShareButton';

// Component to render message content with clickable list items
function MessageContent({ content, onItemClick, messageId }: { 
  content: string; 
  onItemClick: (text: string, messageId: string) => void;
  messageId: string;
}) {
  const lines = content.split('\n');
  const renderedLines = lines.map((line, index) => {
    // Match numbered lists (1. , 2. , etc.) or bulleted lists (- , * , • )
    const numberedMatch = line.match(/^(\s*)(\d+)\.\s+(.+)$/);
    const bulletMatch = line.match(/^(\s*)[-*•]\s+(.+)$/);
    
    if (numberedMatch) {
      const [, indent, number, text] = numberedMatch;
      return (
        <div key={index} className="flex gap-2 my-1">
          <span className="flex-shrink-0">{number}.</span>
          <button
            onClick={() => onItemClick(text, messageId)}
            className="text-left hover:underline hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
          >
            {text}
          </button>
        </div>
      );
    }
    
    if (bulletMatch) {
      const [, indent, text] = bulletMatch;
      return (
        <div key={index} className="flex gap-2 my-1">
          <span className="flex-shrink-0">•</span>
          <button
            onClick={() => onItemClick(text, messageId)}
            className="text-left hover:underline hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
          >
            {text}
          </button>
        </div>
      );
    }
    
    return <div key={index}>{line || '\u00A0'}</div>;
  });
  
  return <div>{renderedLines}</div>;
}

interface TreeBranch {
  id: string;
  content: string;
  role: string;
  children: TreeBranch[];
  parentId?: string;
  timestamp: number;
  clickedItem?: string; // Track which list item was clicked to create this branch
  branchFromNodeId?: string; // Track which node this branched from
}

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput, append, setMessages } = useChat();
  const [learningProgress, setLearningProgress] = useState({
    topicsLearned: 0,
    questionsAsked: 0,
    currentLevel: 'Beginner',
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<'sessions' | 'tree' | 'progress'>('sessions');
  const [conversationTree, setConversationTree] = useState<TreeBranch[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState<string>('New Conversation');
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [shareToken, setShareToken] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pendingBranchRef = useRef<{ fromNodeId: string; clickedItem: string } | null>(null);
  const treeNodesMapRef = useRef<Map<string, TreeBranch>>(new Map());
  const processedMessageIdsRef = useRef<Set<string>>(new Set());
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Build and maintain tree structure
  useEffect(() => {
    if (messages.length === 0) {
      setConversationTree([]);
      treeNodesMapRef.current.clear();
      processedMessageIdsRef.current.clear();
      pendingBranchRef.current = null;
      return;
    }

    // Process only new messages
    const newMessages = messages.filter(msg => !processedMessageIdsRef.current.has(msg.id));
    
    if (newMessages.length === 0) {
      return; // No new messages to process
    }

    console.log('Processing', newMessages.length, 'new messages');
    console.log('Pending branch:', pendingBranchRef.current);

    newMessages.forEach((message, index) => {
      const globalIndex = messages.findIndex(m => m.id === message.id);
      
      // Create node
      const node: TreeBranch = {
        id: message.id,
        content: message.content,
        role: message.role,
        children: [],
        timestamp: Date.now() + globalIndex,
        clickedItem: undefined,
        branchFromNodeId: undefined,
      };

      // Determine parent
      let parentNode: TreeBranch | undefined;

      if (pendingBranchRef.current && index === 0) {
        // This is a branch - connect to the node we branched from
        const branchFromId = pendingBranchRef.current.fromNodeId;
        parentNode = treeNodesMapRef.current.get(branchFromId);
        
        if (parentNode) {
          node.branchFromNodeId = branchFromId;
          node.clickedItem = pendingBranchRef.current.clickedItem;
          console.log('Creating branch from', branchFromId, 'for item:', node.clickedItem);
        }
        
        pendingBranchRef.current = null; // Clear after use
      } else if (globalIndex > 0) {
        // Regular sequential message - connect to previous message
        const prevMessage = messages[globalIndex - 1];
        parentNode = treeNodesMapRef.current.get(prevMessage.id);
      }

      // Add to tree structure
      treeNodesMapRef.current.set(message.id, node);
      
      if (parentNode) {
        // Check if this child already exists to avoid duplicates
        if (!parentNode.children.find(child => child.id === node.id)) {
          parentNode.children.push(node);
          console.log('Added child', node.id, 'to parent', parentNode.id);
        }
      } else {
        // This is a root node
        setConversationTree((prevTree) => {
          if (prevTree.length === 0) {
            console.log('Set root node:', node.id);
            return [node];
          }
          return prevTree;
        });
      }

      processedMessageIdsRef.current.add(message.id);
    });

    // Trigger re-render by updating state
    setConversationTree((prevTree) => [...prevTree]);
    
    console.log('Tree structure updated');
    console.log('Nodes map size:', treeNodesMapRef.current.size);
  }, [messages]);

  // Auto-save session when messages or tree change
  useEffect(() => {
    if (messages.length === 0 || !currentSessionId) {
      return;
    }

    // Debounce save to avoid too frequent API calls
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        // Generate title from first user message if still "New Conversation"
        let title = sessionTitle;
        if (title === 'New Conversation' && messages.length > 0) {
          const firstUserMessage = messages.find(m => m.role === 'user');
          if (firstUserMessage) {
            title = firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '');
            setSessionTitle(title);
          }
        }

        await fetch(`/api/sessions/${currentSessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            messages: messages.map(m => ({
              id: m.id,
              role: m.role,
              content: m.content,
              timestamp: new Date().toISOString(),
            })),
            conversationTree,
          }),
        });
        
        console.log('Session saved:', currentSessionId);
      } catch (error) {
        console.error('Error saving session:', error);
      }
    }, 1000); // Save after 1 second of inactivity

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [messages, conversationTree, currentSessionId, sessionTitle]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    handleSubmit(e);
    setLearningProgress(prev => ({
      ...prev,
      questionsAsked: prev.questionsAsked + 1,
    }));
  };

  const handleItemClick = (text: string, sourceMessageId: string) => {
    // Store branch information before sending new message
    pendingBranchRef.current = {
      fromNodeId: sourceMessageId,
      clickedItem: text
    };

    // Send the new question
    append({
      role: 'user',
      content: `Tell me more about: ${text}`
    });

    setLearningProgress(prev => ({
      ...prev,
      questionsAsked: prev.questionsAsked + 1,
      topicsLearned: prev.topicsLearned + 1,
    }));
  };

  const handleNodeClick = (nodeId: string) => {
    // Find the message and scroll to it
    const messageElement = document.getElementById(`message-${nodeId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageElement.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
      setTimeout(() => {
        messageElement.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
      }, 2000);
    }
  };

  const handleNewSession = async () => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Conversation' }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setCurrentSessionId(data.session.id);
        setSessionTitle('New Conversation');
        setMessages([]);
        setConversationTree([]);
        treeNodesMapRef.current.clear();
        processedMessageIdsRef.current.clear();
        pendingBranchRef.current = null;
      }
    } catch (error) {
      console.error('Error creating new session:', error);
    }
  };

  const handleSelectSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      const data = await response.json();
      
      if (response.ok) {
        setCurrentSessionId(data.session.id);
        setSessionTitle(data.session.title);
        
        // Load conversation tree first
        const loadedTree = data.session.conversationTree || [];
        
        // Rebuild tree state from loaded tree
        treeNodesMapRef.current.clear();
        processedMessageIdsRef.current.clear();
        pendingBranchRef.current = null;
        
        // Recursively rebuild the tree nodes map
        const rebuildTreeMap = (branches: TreeBranch[]) => {
          branches.forEach(branch => {
            treeNodesMapRef.current.set(branch.id, branch);
            processedMessageIdsRef.current.add(branch.id);
            if (branch.children && branch.children.length > 0) {
              rebuildTreeMap(branch.children);
            }
          });
        };
        
        rebuildTreeMap(loadedTree);
        
        // Set tree first
        setConversationTree(loadedTree);
        
        // Then load messages from MongoDB
        const loadedMessages = data.session.messages || [];
        setMessages(loadedMessages);
        
        // Load sharing info
        setIsPublic(data.session.isPublic || false);
        setShareToken(data.session.shareToken);
        
        // Close sidebar on mobile
        setIsSidebarOpen(false);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  // Create initial session on mount
  useEffect(() => {
    if (!currentSessionId) {
      handleNewSession();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative">
      <div className="flex flex-col gap-6">
        {/* Top Section - Learning Path and Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Conversation Flow Panel - Left Side */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="lg:sticky lg:top-4">
              <div className="h-[500px]">
                <ConversationTree messages={messages} onNodeClick={handleNodeClick} />
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-4 order-1 lg:order-2 relative">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Chat Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {sessionTitle}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {messages.length} messages
              </p>
            </div>
            <ShareButton 
              sessionId={currentSessionId} 
              isPublic={isPublic}
              shareToken={shareToken}
            />
          </div>
          
          {/* Messages Container */}
          <div className="h-[400px] overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-20">
                <div className="text-6xl mb-4">🎓</div>
                <h2 className="text-2xl font-semibold mb-2">Start Your Learning Journey</h2>
                <p>Ask me anything you&apos;d like to learn about!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  id={`message-${message.id}`}
                  className={`flex transition-all duration-300 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <div className="text-sm font-semibold mb-1">
                      {message.role === 'user' ? 'You' : 'AI Tutor'}
                    </div>
                    {message.role === 'user' ? (
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    ) : (
                      <MessageContent 
                        content={message.content} 
                        onItemClick={handleItemClick}
                        messageId={message.id}
                      />
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <form onSubmit={handleFormSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Ask a question or request a topic..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        </div>

        {/* Floating Toggle Button - Top Right */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="fixed top-20 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all"
          aria-label="Toggle sidebar"
        >
          {isSidebarOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </button>
      </div>
      </div>

      {/* Bottom Section - Learning Path Tree spanning full width */}
      <div className="w-full">
        <div className="h-[300px]">
          <ConversationBranchTree tree={conversationTree} onNodeClick={handleNodeClick} />
        </div>
        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded">
            Debug: {messages.length} messages, {conversationTree.length} tree roots, {treeNodesMapRef.current.size} total nodes
          </div>
        )}
      </div>
      </div>

    {/* Sliding Right Panel */}
    <div
      className={`fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-40 ${
        isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="h-full flex flex-col">
        {/* Panel Tabs */}
        <div className="flex gap-1 p-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActivePanel('sessions')}
            className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
              activePanel === 'sessions'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            💬 Chats
          </button>
          <button
            onClick={() => setActivePanel('progress')}
            className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
              activePanel === 'progress'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            📊 Stats
          </button>
          <button
            onClick={() => setActivePanel('tree')}
            className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
              activePanel === 'tree'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            🌳 Info
          </button>
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-hidden">
          {activePanel === 'sessions' ? (
            <SessionsList
              onSelectSession={handleSelectSession}
              onNewSession={handleNewSession}
              currentSessionId={currentSessionId}
            />
          ) : activePanel === 'progress' ? (
            <div className="p-4 space-y-4 overflow-y-auto h-full">
              <ProgressTracker progress={learningProgress} />
              <TopicSuggestions />
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400 overflow-y-auto h-full">
              <div className="space-y-4">
                <p className="font-medium">📜 Conversation Flow</p>
                <p className="text-sm">Shows your linear conversation timeline in the left panel</p>
                <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
                <p className="font-medium">🗺️ Learning Path Tree</p>
                <p className="text-sm">Displays branching conversations at the bottom</p>
                <p className="text-xs mt-2">Click items in AI responses to explore branches!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Overlay */}
    {isSidebarOpen && (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-30"
        onClick={() => setIsSidebarOpen(false)}
      />
    )}
    </div>
  );
}
