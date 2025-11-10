'use client';

import { useChat } from 'ai/react';
import { useState, useRef, useEffect } from 'react';
import ProgressTracker from './ProgressTracker';
import TopicSuggestions from './TopicSuggestions';
import ConversationTree from './ConversationTree';
import ConversationBranchTree from './ConversationBranchTree';

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

interface ConversationGraph {
  nodes: Map<string, TreeBranch>;
  edges: Map<string, string[]>; // parentId -> childrenIds
  rootId: string;
  branches: Map<string, string[]>; // nodeId -> list of branch nodeIds
}

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput, append } = useChat();
  const [learningProgress, setLearningProgress] = useState({
    topicsLearned: 0,
    questionsAsked: 0,
    currentLevel: 'Beginner',
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<'tree' | 'progress'>('progress');
  const [conversationGraph, setConversationGraph] = useState<ConversationGraph>({
    nodes: new Map(),
    edges: new Map(),
    rootId: 'root',
    branches: new Map()
  });
  const [currentBranchPath, setCurrentBranchPath] = useState<string[]>([]);
  const [conversationTree, setConversationTree] = useState<TreeBranch[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(0);
  const pendingBranchRef = useRef<{ fromNodeId: string; clickedItem: string } | null>(null);

  // Build conversation graph dynamically based on messages and interactions
  useEffect(() => {
    if (messages.length === 0) {
      setConversationGraph({
        nodes: new Map(),
        edges: new Map(),
        rootId: 'root',
        branches: new Map()
      });
      setConversationTree([]);
      lastMessageCountRef.current = 0;
      return;
    }

    // Process ALL messages every time to ensure graph is complete
    const newGraph: ConversationGraph = {
      nodes: new Map(),
      edges: new Map(),
      rootId: 'root',
      branches: new Map()
    };

    // Process all messages
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const timestamp = Date.now() + i;

      // Check if this is a branch point (user clicked on a list item)
      const branchInfo = pendingBranchRef.current;
      const isBranchStart = branchInfo && i === messages.length - 2; // Second to last message

      // Create node for this message
      const node: TreeBranch = {
        id: message.id,
        content: message.content,
        role: message.role,
        children: [],
        timestamp,
        parentId: i > 0 ? messages[i - 1].id : undefined,
        clickedItem: isBranchStart ? branchInfo?.clickedItem : undefined,
        branchFromNodeId: isBranchStart ? branchInfo?.fromNodeId : undefined
      };

      newGraph.nodes.set(message.id, node);

      // Update edges - for branching, connect to the source node instead of just previous message
      let actualParentId = node.parentId;
      
      if (node.branchFromNodeId) {
        // This is a branch - connect to the node we branched from
        actualParentId = node.branchFromNodeId;
        
        // Track this as a branch
        const branches = newGraph.branches.get(node.branchFromNodeId) || [];
        if (!branches.includes(message.id)) {
          branches.push(message.id);
          newGraph.branches.set(node.branchFromNodeId, branches);
        }
      }

      if (actualParentId) {
        const siblings = newGraph.edges.get(actualParentId) || [];
        if (!siblings.includes(message.id)) {
          siblings.push(message.id);
          newGraph.edges.set(actualParentId, siblings);
        }
      }
    }

    // Clear pending branch after processing
    if (pendingBranchRef.current && messages.length >= lastMessageCountRef.current + 2) {
      pendingBranchRef.current = null;
    }

    setConversationGraph(newGraph);
  }, [messages]);

  // Build tree structure from graph for visualization
  useEffect(() => {
    if (conversationGraph.nodes.size === 0) {
      console.log('No graph nodes, skipping tree build');
      setConversationTree([]);
      return;
    }

    console.log('Building tree from graph with', conversationGraph.nodes.size, 'nodes');
    console.log('Branches:', Array.from(conversationGraph.branches.entries()));

    const buildTreeFromGraph = (): TreeBranch[] => {
      const tree: TreeBranch[] = [];
      const visited = new Set<string>();

      const buildNode = (nodeId: string): TreeBranch | null => {
        if (visited.has(nodeId)) return null;
        visited.add(nodeId);

        const node = conversationGraph.nodes.get(nodeId);
        if (!node) {
          console.log('Node not found:', nodeId);
          return null;
        }

        // Get children - both regular sequence and branches
        const regularChildren = conversationGraph.edges.get(nodeId) || [];
        const branchChildren = conversationGraph.branches.get(nodeId) || [];
        
        // Combine and deduplicate
        const allChildIds = [...new Set([...regularChildren, ...branchChildren])];
        
        const children = allChildIds
          .map(childId => buildNode(childId))
          .filter((child): child is TreeBranch => child !== null);

        return {
          ...node,
          children
        };
      };

      // Find root nodes (first user message in conversation)
      const firstMessage = messages[0];
      if (firstMessage) {
        console.log('Building from first message:', firstMessage.id);
        const rootNode = buildNode(firstMessage.id);
        if (rootNode) {
          console.log('Root node built with', rootNode.children.length, 'children');
          tree.push(rootNode);
        } else {
          console.log('Failed to build root node');
        }
      }

      console.log('Final tree:', tree);
      return tree;
    };

    setConversationTree(buildTreeFromGraph());
  }, [conversationGraph, messages]);

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

  return (
    <div className="relative">
      <div className="flex flex-col gap-6">
        {/* Top Section - Learning Path and Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Learning Path Panel - Left Side */}
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
          {/* Messages Container */}
          <div className="h-[450px] overflow-y-auto p-6 space-y-4">
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

      {/* Bottom Section - Conversation Tree spanning full width */}
      <div className="w-full">
        <div className="h-[300px]">
          <ConversationBranchTree tree={conversationTree} onNodeClick={handleNodeClick} />
        </div>
        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded">
            Debug: {messages.length} messages, {conversationTree.length} tree nodes, {conversationGraph.nodes.size} graph nodes
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
      <div className="h-full flex flex-col p-4">
        {/* Panel Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActivePanel('progress')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              activePanel === 'progress'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            📊 Progress
          </button>
          <button
            onClick={() => setActivePanel('tree')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              activePanel === 'tree'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            🌳 Tree
          </button>
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-auto">
          {activePanel === 'progress' ? (
            <div className="space-y-4">
              <ProgressTracker progress={learningProgress} />
              <TopicSuggestions />
            </div>
          ) : (
            <div className="text-center p-6 text-gray-500 dark:text-gray-400">
              <p>The conversation tree is displayed at the bottom of the screen</p>
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
