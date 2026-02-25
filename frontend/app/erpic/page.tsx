'use client';

import React from 'react';
import {
  ReactFlow,
  Node,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// ユーザータイプの定義
interface UserData {
  id: string;
  name: string;
  age: number;
  avatar: string;
  interests: string[];
  isCurrentUser?: boolean;
}

// リレーションタイプ
interface Relation {
  from: string;
  to: string;
  type: 'sent' | 'received' | 'match';
}

// カスタムユーザーノード
const UserNode = ({ data }: { data: UserData }) => {
  return (
    <div
      className={`px-6 py-4 rounded-lg border-2 shadow-lg cursor-move ${
        data.isCurrentUser
          ? 'bg-blue-500 text-white border-blue-700'
          : 'bg-white text-gray-800 border-gray-300'
      }`}
      style={{ width: '220px', height: '140px' }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {data.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-lg truncate">{data.name}</div>
          <div className={`text-sm ${data.isCurrentUser ? 'text-blue-100' : 'text-gray-500'}`}>
            {data.age}歳
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {data.interests.slice(0, 2).map((interest, idx) => (
          <span
            key={idx}
            className={`text-xs px-2 py-1 rounded-full ${
              data.isCurrentUser
                ? 'bg-blue-600 text-blue-100'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {interest}
          </span>
        ))}
      </div>
      {data.isCurrentUser && (
        <div className="mt-2 text-xs font-semibold text-blue-100">あなた</div>
      )}
    </div>
  );
};

const nodeTypes = {
  userNode: UserNode,
};

export default function RelationGraphPage() {
  // 初期ノード定義
  const initialNodes: Node[] = [
    // 中心: ログインユーザー
    {
      id: 'user1',
      type: 'userNode',
      position: { x: 500, y: 300 },
      data: { id: 'user1', name: 'あなた', age: 25, avatar: '😊', interests: ['アニメ', '旅行'], isCurrentUser: true },
    },
    // 右側: いいねを送った相手
    {
      id: 'user2',
      type: 'userNode',
      position: { x: 900, y: 100 },
      data: { id: 'user2', name: 'さくら', age: 24, avatar: '🌸', interests: ['音楽', 'カフェ'] },
    },
    {
      id: 'user4',
      type: 'userNode',
      position: { x: 900, y: 300 },
      data: { id: 'user4', name: '花子', age: 23, avatar: '🌺', interests: ['アニメ', '料理'] },
    },
    {
      id: 'user6',
      type: 'userNode',
      position: { x: 900, y: 500 },
      data: { id: 'user6', name: 'みゆき', age: 24, avatar: '🎨', interests: ['アート', 'カフェ'] },
    },
    // 左側: いいねを受け取った相手
    {
      id: 'user3',
      type: 'userNode',
      position: { x: 100, y: 100 },
      data: { id: 'user3', name: '太郎', age: 27, avatar: '🎸', interests: ['音楽', 'スポーツ'] },
    },
    {
      id: 'user5',
      type: 'userNode',
      position: { x: 100, y: 300 },
      data: { id: 'user5', name: 'ひろし', age: 26, avatar: '⚽', interests: ['スポーツ', '旅行'] },
    },
    {
      id: 'user7',
      type: 'userNode',
      position: { x: 100, y: 500 },
      data: { id: 'user7', name: 'けんた', age: 28, avatar: '🎮', interests: ['ゲーム', 'アニメ'] },
    },
  ];

  // リレーション定義
  const relations: Relation[] = [
    // マッチング（双方向）
    { from: 'user1', to: 'user2', type: 'match' },
    { from: 'user2', to: 'user1', type: 'match' },
    // あなたから送ったいいね
    { from: 'user1', to: 'user4', type: 'sent' },
    { from: 'user1', to: 'user6', type: 'sent' },
    // あなたが受け取ったいいね
    { from: 'user3', to: 'user1', type: 'received' },
    { from: 'user5', to: 'user1', type: 'received' },
    { from: 'user7', to: 'user1', type: 'received' },
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges] = useEdgesState([]);

  // 線の色を取得
  const getLineColor = (type: Relation['type']) => {
    switch (type) {
      case 'sent': return '#3b82f6'; // 青
      case 'received': return '#ef4444'; // 赤
      case 'match': return '#10b981'; // 緑
    }
  };

  // 線のラベルを取得
  const getLabel = (type: Relation['type']) => {
    switch (type) {
      case 'sent': return '💕 いいね';
      case 'received': return '💕 いいね受信';
      case 'match': return '💚 マッチング';
    }
  };

  // ノードの中心座標を取得
  const getNodeCenter = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    return {
      x: node.position.x + 110, // ノード幅の半分
      y: node.position.y + 70,  // ノード高さの半分
    };
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">
          LinkPersona - リレーショングラフ
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          あなたを中心とした「いいね」の関係性を可視化（ノードはドラッグで移動可能）
        </p>
      </div>

      {/* 凡例 */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex gap-6 items-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-1 bg-blue-500"></div>
          <span className="text-gray-700">あなたから送ったいいね</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-1 bg-red-500"></div>
          <span className="text-gray-700">あなたが受け取ったいいね</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-1 bg-green-500"></div>
          <span className="text-gray-700">💚 マッチング成立</span>
        </div>
      </div>

      {/* グラフエリア */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.1 }}
          minZoom={0.5}
          maxZoom={2}
        >
          {/* SVGでカスタムエッジを描画 */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          >
            <defs>
              {/* 矢印マーカー定義 */}
              <marker
                id="arrowhead-blue"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
              </marker>
              <marker
                id="arrowhead-red"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" fill="#ef4444" />
              </marker>
              <marker
                id="arrowhead-green"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" fill="#10b981" />
              </marker>
            </defs>

            {/* リレーションの線を描画 */}
            {relations.map((rel, idx) => {
              const from = getNodeCenter(rel.from);
              const to = getNodeCenter(rel.to);
              const color = getLineColor(rel.type);
              const markerUrl = rel.type === 'sent' ? 'arrowhead-blue' : rel.type === 'received' ? 'arrowhead-red' : 'arrowhead-green';
              const strokeWidth = rel.type === 'match' ? 4 : 3;

              // ラベル位置（線の中央）
              const labelX = (from.x + to.x) / 2;
              const labelY = (from.y + to.y) / 2;

              return (
                <g key={idx}>
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    markerEnd={`url(#${markerUrl})`}
                  />
                  <text
                    x={labelX}
                    y={labelY - 10}
                    fill={color}
                    fontSize="14"
                    fontWeight="700"
                    textAnchor="middle"
                    style={{ pointerEvents: 'none' }}
                  >
                    {getLabel(rel.type)}
                  </text>
                </g>
              );
            })}
          </svg>

          <Background />
          <Controls />
        </ReactFlow>
      </div>

      {/* 統計情報 */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex gap-8 text-sm">
          <div>
            <span className="text-gray-600">ユーザー数: </span>
            <span className="font-bold text-gray-800">{nodes.length}</span>
          </div>
          <div>
            <span className="text-gray-600">リレーション数: </span>
            <span className="font-bold text-gray-800">{relations.length}</span>
          </div>
          <div>
            <span className="text-gray-600">🔵 送ったいいね: </span>
            <span className="font-bold text-blue-600">2</span>
          </div>
          <div>
            <span className="text-gray-600">🔴 受け取ったいいね: </span>
            <span className="font-bold text-red-600">3</span>
          </div>
          <div>
            <span className="text-gray-600">💚 マッチング: </span>
            <span className="font-bold text-green-600">1</span>
          </div>
        </div>
      </div>
    </div>
  );
}

