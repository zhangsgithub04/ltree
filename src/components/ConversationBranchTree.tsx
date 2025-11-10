'use client';

import { useEffect, useRef, useState } from 'react';

interface BranchNode {
  id: string;
  content: string;
  role: string;
  children: BranchNode[];
  parent?: string;
  x?: number;
  y?: number;
  depth?: number;
  fullContent?: string;
  clickedItem?: string;
  hasBranches?: boolean;
}

interface ConversationBranchTreeProps {
  tree: Array<{
    id: string;
    content: string;
    role: string;
    children: any[];
    parentId?: string;
    clickedItem?: string;
    timestamp?: number;
    branchFromNodeId?: string;
  }>;
  onNodeClick: (nodeId: string) => void;
}

export default function ConversationBranchTree({ tree: treeData, onNodeClick }: ConversationBranchTreeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [tree, setTree] = useState<BranchNode | null>(null);
  const [tooltip, setTooltip] = useState<{ 
    x: number; 
    y: number; 
    content: string; 
    fullContent: string;
    clickedItem?: string;
    role?: string;
  } | null>(null);

  // Build tree structure from provided tree data
  useEffect(() => {
    if (!treeData || treeData.length === 0) {
      setTree(null);
      return;
    }

    // Convert tree data to BranchNode format
    const convertToBranchNode = (node: any, depth: number = 0): BranchNode => {
      const children = node.children.map((child: any) => convertToBranchNode(child, depth + 1));
      return {
        id: node.id,
        content: node.content.length > 30 ? node.content.substring(0, 30) + '...' : node.content,
        role: node.role,
        children,
        depth,
        fullContent: node.content,
        clickedItem: node.clickedItem,
        hasBranches: children.length > 1,
      };
    };

    // Create root node
    const root: BranchNode = {
      id: 'root',
      content: 'Start',
      role: 'system',
      children: treeData.map(node => convertToBranchNode(node, 1)),
      depth: 0,
      fullContent: 'Conversation Start',
    };

    setTree(root);
  }, [treeData]);

  // Calculate node positions with horizontal branching layout
  useEffect(() => {
    if (!tree || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = canvas.parentElement;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = Math.max(400, container.clientHeight);
    }

    // Clear canvas first
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const nodeRadius = 20;
    const horizontalSpacing = 140;
    const verticalSpacing = 70;
    const startX = 60;
    const centerY = canvas.height / 2;

    // Calculate tree depth for better positioning
    const calculateDepth = (node: BranchNode): number => {
      if (node.children.length === 0) return 0;
      return 1 + Math.max(...node.children.map(calculateDepth));
    };

    // Layout nodes horizontally (left to right) with vertical spacing for siblings
    const layoutNodes = (node: BranchNode, depth: number, minY: number, maxY: number): number => {
      const y = (minY + maxY) / 2;
      node.x = startX + depth * horizontalSpacing;
      node.y = y;

      if (node.children.length === 0) {
        return y;
      }

      if (node.children.length === 1) {
        layoutNodes(node.children[0], depth + 1, minY, maxY);
        return y;
      }

      // Multiple children - distribute them vertically
      const childHeight = (maxY - minY) / node.children.length;
      node.children.forEach((child, index) => {
        const childMinY = minY + index * childHeight;
        const childMaxY = minY + (index + 1) * childHeight;
        layoutNodes(child, depth + 1, childMinY, childMaxY);
      });

      return y;
    };

    const treeHeight = Math.max(300, tree.children.length * verticalSpacing);
    layoutNodes(tree, 0, 50, treeHeight);

    // Draw the tree
    const drawTree = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const drawNode = (node: BranchNode) => {
        if (!node.x || !node.y) return;

        // Draw edges to children
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        
        // Use different colors for branches
        if (node.children.length > 1) {
          node.children.forEach((child, index) => {
            if (child.x && child.y) {
              // Different colors for different branches
              const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
              ctx.strokeStyle = colors[index % colors.length];
              ctx.lineWidth = 3;
              
              // Curved line
              ctx.beginPath();
              ctx.moveTo(node.x! + nodeRadius, node.y!);
              const midX = (node.x! + child.x!) / 2;
              ctx.bezierCurveTo(
                midX, node.y!,
                midX, child.y!,
                child.x! - nodeRadius, child.y!
              );
              ctx.stroke();
            }
          });
        } else {
          node.children.forEach((child) => {
            if (child.x && child.y) {
              // Single path - standard color
              ctx.strokeStyle = '#94a3b8';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(node.x! + nodeRadius, node.y!);
              const midX = (node.x! + child.x!) / 2;
              ctx.bezierCurveTo(
                midX, node.y!,
                midX, child.y!,
                child.x! - nodeRadius, child.y!
              );
              ctx.stroke();
            }
          });
        }

        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
        
        const isUser = node.role === 'user';
        const isSystem = node.role === 'system';
        const hasBranches = node.children.length > 1;
        
        if (node.id === hoveredNode) {
          ctx.fillStyle = isSystem ? '#8b5cf6' : (isUser ? '#2563eb' : '#059669');
          ctx.shadowBlur = 12;
          ctx.shadowColor = isSystem ? '#8b5cf6' : (isUser ? '#3b82f6' : '#10b981');
        } else {
          ctx.fillStyle = isSystem ? '#a78bfa' : (isUser ? '#60a5fa' : '#34d399');
          ctx.shadowBlur = 0;
        }
        
        ctx.fill();
        
        // Special border for nodes with branches
        if (hasBranches) {
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 4;
        } else {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
        }
        ctx.stroke();

        // Draw emoji in node
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const emoji = isSystem ? '🏁' : (isUser ? '👤' : '🤖');
        ctx.fillText(emoji, node.x, node.y);

        // Draw label
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#1e293b';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(node.content, node.x, node.y + nodeRadius + 15);

        // Draw children
        node.children.forEach(drawNode);
      };

      drawNode(tree);
    };

    drawTree();
  }, [tree, hoveredNode]);

  // Handle mouse interactions
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !tree) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const findHoveredNode = (node: BranchNode): BranchNode | null => {
      if (node.x && node.y) {
        const dx = x - node.x;
        const dy = y - node.y;
        if (Math.sqrt(dx * dx + dy * dy) <= 20) {
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
        clickedItem: hoveredNodeData.clickedItem,
        role: hoveredNodeData.role,
      });
    } else {
      setHoveredNode(null);
      setTooltip(null);
    }
  };

  const handleClick = () => {
    if (hoveredNode && hoveredNode !== 'root') {
      onNodeClick(hoveredNode);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 h-full flex flex-col relative">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <span>🌳</span>
        <span>Conversation Tree</span>
        <span className="text-xs text-gray-500">({treeData.length} nodes)</span>
      </h3>
      
      <div className="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
        {!tree ? (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
            <div className="text-center p-6">
              <div className="text-4xl mb-2">🌳</div>
              <p className="font-medium">Branching Conversations</p>
              <p className="text-sm mt-2">Start chatting to see<br />your conversation tree</p>
              <p className="text-xs mt-2 text-gray-400">Waiting for messages...</p>
            </div>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => { setHoveredNode(null); setTooltip(null); }}
            onClick={handleClick}
            className="cursor-pointer w-full h-full"
          />
        )}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div 
          className="fixed z-[9999] bg-gray-900/95 backdrop-blur-sm text-white text-sm rounded-lg p-4 shadow-2xl max-w-3xl pointer-events-none border-2 border-blue-500"
          style={{ 
            left: `${tooltip.x + 15}px`, 
            top: `${tooltip.y - 100}px`,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">
              {tooltip.content === 'Start' ? '🏁' : (tooltip.role === 'user' ? '👤' : '🤖')}
            </span>
            <div className="font-bold text-blue-400">
              {tooltip.content === 'Start' ? 'Conversation Start' : (tooltip.role === 'user' ? 'You' : 'AI Tutor')}
            </div>
          </div>
          <div className="text-gray-100 whitespace-pre-wrap max-h-[400px] overflow-y-auto leading-relaxed p-2 bg-gray-800/50 rounded">
            {tooltip.fullContent}
          </div>
          {tooltip.clickedItem && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="text-xs text-yellow-400 flex items-center gap-1">
                <span>🔗</span>
                <span>Explored from: <span className="font-semibold">{tooltip.clickedItem}</span></span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-500">
          💡 Hover for details · Click items in AI responses to explore branches
        </p>
        <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
          ⭐ Gold borders = Branching points with multiple explorations
        </p>
      </div>
    </div>
  );
}
