// app/graph/GraphCanvas.tsx
'use client';

import { GraphCanvas } from 'reagraph';

// モックデータ: 自分を中心とした関係性グラフ
const nodes = [
    { id: 'me', label: '自分', fill: '#4CAF50' },  // 自分を緑色で強調
    { id: 'user1', label: 'ユーザーA', fill: '#2196F3' },
    { id: 'user2', label: 'ユーザーB', fill: '#2196F3' },
    { id: 'user3', label: 'ユーザーC', fill: '#2196F3' },
    { id: 'user4', label: 'ユーザーD', fill: '#2196F3' },
    { id: 'user5', label: 'ユーザーE', fill: '#2196F3' },
];

// エッジ（関係性）
const edges = [
    // 自分からユーザーAへいいね送信
    { 
        id: 'me-like-user1', 
        source: 'me', 
        target: 'user1', 
        label: 'いいね送信',
        size: 2,
    },
    
    // ユーザーBから自分へいいね受信
    { 
        id: 'user2-like-me', 
        source: 'user2', 
        target: 'me', 
        label: 'いいね受信',
        size: 2,
    },
    
    // ユーザーCとマッチング（双方向いいね）
    { 
        id: 'me-match-user3-1', 
        source: 'me', 
        target: 'user3', 
        label: 'マッチ',
        size: 3,
    },
    { 
        id: 'me-match-user3-2', 
        source: 'user3', 
        target: 'me', 
        label: 'マッチ',
        size: 3,
    },
    
    // ユーザーDとマッチング（双方向いいね）
    { 
        id: 'me-match-user4-1', 
        source: 'me', 
        target: 'user4', 
        label: 'マッチ',
        size: 3,
    },
    { 
        id: 'me-match-user4-2', 
        source: 'user4', 
        target: 'me', 
        label: 'マッチ',
        size: 3,
    },
    
    // 自分からユーザーEへいいね送信
    { 
        id: 'me-like-user5', 
        source: 'me', 
        target: 'user5', 
        label: 'いいね送信',
        size: 2,
    },
];

export default function Canvas() {
    return (
        <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
            <div style={{ 
                position: 'absolute', 
                top: 20, 
                left: 20, 
                zIndex: 1000,
                background: 'rgba(255,255,255,0.9)',
                padding: '15px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>関係性グラフ</h3>
                <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                    <div>🟢 <strong>緑:</strong> 自分</div>
                    <div>🔵 <strong>青:</strong> 他のユーザー</div>
                    <div>→ <strong>いいね送信:</strong> 自分から相手へ</div>
                    <div>← <strong>いいね受信:</strong> 相手から自分へ</div>
                    <div>⇄ <strong>マッチ:</strong> 双方向いいね</div>
                </div>
            </div>
            <GraphCanvas
                nodes={nodes}
                edges={edges}
                labelType="none"
                layoutType="forceDirected3d"
                draggable
                edgeLabelPosition="natural"
                onNodeClick={(node) => console.log('クリックしたノード:', node.id)}
                onEdgeClick={(edge) => console.log('クリックしたエッジ:', edge.id)}
            />
        </div>
    );
}