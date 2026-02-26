// app/graph/GraphCanvas.tsx
'use client';

import { GraphCanvas, lightTheme, Theme } from 'reagraph';
import { useEffect, useState } from 'react';

interface GraphNode {
    id: string;
    label: string;
    fill: string;
    labelColor: string;
    icon?: string;
    size?: number;
}

interface GraphEdge {
    id: string;
    source: string;
    target: string;
    label: string;
    size: number;
    fill: string;
}

// 画像を円形に加工する関数
const createCircularImage = (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const size = 256; // 高解像度
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                reject(new Error('Canvas context not available'));
                return;
            }
            
            // 円形にクリップ
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2 - 6, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            
            // 画像を描画
            ctx.drawImage(img, 0, 0, size, size);
            
            // クリップをリセットして白い枠線を描画
            ctx.restore();
            ctx.save();
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2 - 6, 0, Math.PI * 2);
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 12;
            ctx.stroke();
            
            // Data URLに変換
            resolve(canvas.toDataURL('image/png'));
        };
        
        img.onerror = () => {
            reject(new Error(`Failed to load image: ${imageUrl}`));
        };
        
        img.src = imageUrl;
    });
};

// モックデータ: 自分を中心とした関係性グラフ（元の画像URL）
const originalNodes: GraphNode[] = [
    { 
        id: 'me', 
        label: 'あなた', 
        fill: '#4CAF50', 
        labelColor: '#000000',
        icon: 'https://images.unsplash.com/photo-1636308600707-e19abecd6246?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        size: 35
    },
    { 
        id: 'user1', 
        label: 'ユーザーA', 
        fill: '#2196F3', 
        labelColor: '#000000',
        icon: 'https://images.unsplash.com/photo-1690444963408-9573a17a8058?q=80&w=627&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        size: 30
    },
    { 
        id: 'user2', 
        label: 'ユーザーB', 
        fill: '#2196F3', 
        labelColor: '#000000',
        icon: 'https://images.unsplash.com/photo-1526510747491-58f928ec870f?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        size: 30
    },
    { 
        id: 'user3', 
        label: 'ユーザーC', 
        fill: '#2196F3', 
        labelColor: '#000000',
        icon: 'https://images.unsplash.com/photo-1583692331501-5339b76cbf1e?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        size: 30
    },
    { 
        id: 'user4', 
        label: 'ユーザーD', 
        fill: '#2196F3', 
        labelColor: '#000000',
        icon: 'https://plus.unsplash.com/premium_photo-1672239496412-ab605befa53f?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        size: 30
    },
    { 
        id: 'user5', 
        label: 'ユーザーE', 
        fill: '#2196F3', 
        labelColor: '#000000',
        icon: 'https://images.unsplash.com/photo-1492288991661-058aa541ff43?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        size: 30
    },
];

// エッジ（関係性）
const edges: GraphEdge[] = [
    // 自分からユーザーAへいいね送信（赤）
    { 
        id: 'me-like-user1', 
        source: 'me', 
        target: 'user1', 
        label: 'いいね送信',
        size: 2,
        fill: '#F44336',
    },
    
    // ユーザーBから自分へいいね受信（青）
    { 
        id: 'user2-like-me', 
        source: 'user2', 
        target: 'me', 
        label: 'いいね受信',
        size: 2,
        fill: '#2196F3',
    },
    
    // ユーザーCとマッチング（双方向いいね - 緑）
    { 
        id: 'me-match-user3-1', 
        source: 'me', 
        target: 'user3', 
        label: 'マッチ',
        size: 3,
        fill: '#4CAF50',
    },
    { 
        id: 'me-match-user3-2', 
        source: 'user3', 
        target: 'me', 
        label: 'マッチ',
        size: 3,
        fill: '#4CAF50',
    },
    
    // ユーザーDとマッチング（双方向いいね - 緑）
    { 
        id: 'me-match-user4-1', 
        source: 'me', 
        target: 'user4', 
        label: 'マッチ',
        size: 3,
        fill: '#4CAF50',
    },
    { 
        id: 'me-match-user4-2', 
        source: 'user4', 
        target: 'me', 
        label: 'マッチ',
        size: 3,
        fill: '#4CAF50',
    },
    
    // 自分からユーザーEへいいね送信（赤）
    { 
        id: 'me-like-user5', 
        source: 'me', 
        target: 'user5', 
        label: 'いいね送信',
        size: 2,
        fill: '#F44336',
    },
];

export default function Canvas() {
    const [nodes, setNodes] = useState<GraphNode[]>(originalNodes);
    
    // 画像を円形に加工
    useEffect(() => {
        const processImages = async () => {
            const processedNodes = await Promise.all(
                originalNodes.map(async (node) => {
                    if (node.icon) {
                        try {
                            const circularIcon = await createCircularImage(node.icon);
                            return { ...node, icon: circularIcon };
                        } catch (error) {
                            console.error(`Failed to process image for ${node.id}:`, error);
                            return node;
                        }
                    }
                    return node;
                })
            );
            setNodes(processedNodes);
        };
        
        processImages();
    }, []);
    
    // カスタムテーマ設定
    const customTheme: Theme = {
        ...lightTheme,
        node: {
            ...lightTheme.node,
            activeFill: '#4CAF50',
            fill: '#2196F3',
            opacity: 1,
        },
        ring: {
            ...lightTheme.ring,
            activeFill: 'white',
            fill: 'white',
        }
    };
    
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
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#000' }}>関係性グラフ</h3>
                <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#000' }}>
                    <div>🟢 <strong>緑ノード:</strong> あなた</div>
                    <div>🔵 <strong>青ノード:</strong> 他のユーザー</div>
                    <div>🔴 <strong>赤矢印:</strong> 自分から相手へのいいね</div>
                    <div>🔵 <strong>青矢印:</strong> 相手から自分へのいいね</div>
                    <div>🟢 <strong>緑矢印:</strong> マッチング（双方向）</div>
                </div>
            </div>
            <GraphCanvas
                nodes={nodes}
                edges={edges}
                theme={customTheme}
                labelType="none"
                sizingType="attribute"
                layoutType="forceDirected3d"
                draggable
                edgeLabelPosition="natural"
                onNodeClick={(node) => console.log('クリックしたノード:', node.id)}
                onEdgeClick={(edge) => console.log('クリックしたエッジ:', edge.id)}
            />
        </div>
    );
}
