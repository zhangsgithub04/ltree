'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface TreeNode {
  id: string;
  content: string;
  role: string;
  children: TreeNode[];
  parent?: string;
  x?: number;
  y?: number;
  fullContent?: string;
  timestamp?: string | number;
}

interface ConversationTreeProps {
  messages: Array<{
    id: string;
    content: string;
    role: string;
    timestamp?: string | number;
  }>;
  onNodeClick: (nodeId: string) => void;
}

export default function ConversationTree({ messages, onNodeClick }: ConversationTreeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [tooltip, setTooltip] = useState<{ 
    x: number; 
    y: number; 
    content: string; 
    fullContent: string;
    role?: string;
    timestamp?: string | number;
  } | null>(null);

  // Build tree structure from linear messages
  useEffect(() => {
    if (messages.length === 0) {
      setTree(null);
      return;
    }

    const buildTree = (): TreeNode => {
      const root: TreeNode = {
        id: 'root',
        content: 'Start',
        role: 'user',
        children: [],
      };

      let currentNode = root;
      
      messages.forEach((msg, index) => {
        const node: TreeNode = {
          id: msg.id,
          content: msg.content.slice(0, 25) + (msg.content.length > 25 ? '...' : ''),
          role: msg.role,
          children: [],
          parent: currentNode.id,
          fullContent: msg.content, // Store full content
          timestamp: msg.timestamp,
        };
        
        currentNode.children.push(node);
        currentNode = node;
      });

      return root;
    };

    setTree(buildTree());
  }, [messages]);

  // Calculate node positions
  useEffect(() => {
    if (!tree || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const container = canvas.parentElement;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = Math.max(600, messages.length * 60 + 100);
    }

    const nodeRadius = 25;
    const verticalSpacing = 70;
    const startX = canvas.width / 2;

    // Layout nodes (vertical centered layout)
    const layoutNodes = (node: TreeNode, depth: number, offset: number): number => {
      node.x = startX;
      node.y = offset;

      let currentOffset = offset + verticalSpacing;
      
      node.children.forEach((child) => {
        currentOffset = layoutNodes(child, depth + 1, currentOffset);
      });

      return currentOffset;
    };

    layoutNodes(tree, 0, 50);

    // Draw the tree
    const drawTree = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const drawNode = (node: TreeNode) => {
        if (!node.x || !node.y) return;

        // Draw edges to children
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 3;
        node.children.forEach((child) => {
          if (child.x && child.y) {
            ctx.beginPath();
            ctx.moveTo(node.x!, node.y! + nodeRadius);
            ctx.lineTo(child.x!, child.y! - nodeRadius);
            ctx.stroke();
          }
        });

        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
        
        const isUser = node.role === 'user';
        if (node.id === hoveredNode) {
          ctx.fillStyle = isUser ? '#2563eb' : '#059669';
          ctx.shadowBlur = 15;
          ctx.shadowColor = isUser ? '#3b82f6' : '#10b981';
        } else {
          ctx.fillStyle = isUser ? '#60a5fa' : '#34d399';
          ctx.shadowBlur = 0;
        }
        
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw emoji/icon in node
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isUser ? '👤' : '🤖', node.x, node.y);

        // Draw label below node
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        const maxWidth = 150;
        const text = node.content;
        if (ctx.measureText(text).width > maxWidth) {
          const truncated = text.slice(0, 20) + '...';
          ctx.fillText(truncated, node.x, node.y + nodeRadius + 20);
        } else {
          ctx.fillText(text, node.x, node.y + nodeRadius + 20);
        }

        // Draw children
        node.children.forEach(drawNode);
      };

      drawNode(tree);
    };

    drawTree();
  }, [tree, hoveredNode, messages.length]);

  // Handle mouse move for hover effects
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !tree) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const findHoveredNode = (node: TreeNode): TreeNode | null => {
      if (node.x && node.y) {
        const dx = x - node.x;
        const dy = y - node.y;
        if (Math.sqrt(dx * dx + dy * dy) <= 25) {
          return node;
        }
      }

      for (const child of node.children) {
        const found = findHoveredNode(child);
        if (found) return found;
      }

      return null;
    };

    const hoveredNodeData = findHoveredNode(tree);
    if (hoveredNodeData) {
      setHoveredNode(hoveredNodeData.id);
      setTooltip({
        x: e.clientX,
        y: e.clientY,
        content: hoveredNodeData.content,
        fullContent: hoveredNodeData.fullContent || hoveredNodeData.content,
        role: hoveredNodeData.role,
        timestamp: hoveredNodeData.timestamp,
      });
    } else {
      setHoveredNode(null);
      setTooltip(null);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredNode && hoveredNode !== 'root') {
      onNodeClick(hoveredNode);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 h-full flex flex-col relative">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <span>�</span>
        <span>Conversation Flow</span>
      </h3>
      
      <div className="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-gradient-to-b from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
            <div className="text-center p-6">
              <div className="text-4xl mb-2">�</div>
              <p className="font-medium">Conversation Flow</p>
              <p className="text-sm mt-2">Start chatting to see<br />your conversation timeline</p>
            </div>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => { setHoveredNode(null); setTooltip(null); }}
            onClick={handleClick}
            className="cursor-pointer w-full"
          />
        )}
      </div>

      {/* Tooltip - Use Portal to render at document root */}
      {tooltip && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed bg-gray-900/95 backdrop-blur-sm text-white text-sm rounded-lg p-4 shadow-2xl max-w-md pointer-events-none border-2 border-green-500"
          style={{ 
            left: `${Math.min(tooltip.x + 20, window.innerWidth - 400)}px`, 
            top: `${Math.max(10, tooltip.y - 150)}px`,
            zIndex: 2147483647, // Maximum z-index value
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">
              {tooltip.role === 'user' ? '👤' : '🤖'}
            </span>
            <div className="font-bold text-green-400">
              {tooltip.role === 'user' ? 'You' : 'AI Tutor'}
            </div>
          </div>
          {tooltip.timestamp && (
            <div className="text-xs text-gray-400 mb-2">
              🕒 {new Date(tooltip.timestamp).toLocaleString()}
            </div>
          )}
          <div className="text-gray-100 whitespace-pre-wrap max-h-[300px] overflow-y-auto leading-relaxed p-2 bg-gray-800/50 rounded text-xs">
            {tooltip.fullContent}
          </div>
        </div>,
        document.body
      )}

      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-400 flex items-center justify-center text-[10px]">👤</div>
            <span>You</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-400 flex items-center justify-center text-[10px]">🤖</div>
            <span>AI Tutor</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          💡 Hover for details · Click to jump to message
        </p>
      </div>
    </div>
  );
}
