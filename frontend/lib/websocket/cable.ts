/**
 * Action Cable (Rails WebSocket) クライアント
 *
 * 使用例:
 *   const cable = new ActionCableClient();
 *   const unsub = cable.subscribe<AiChunk>(
 *     "AiResponseChannel",
 *     { ar_session_id: 1 },
 *     (data) => console.log(data)
 *   );
 *   // cleanup
 *   unsub();
 *   cable.disconnect();
 */

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3000/cable";

interface RawCableMessage {
  type?: string;
  identifier?: string;
  message?: unknown;
}

type SubscriptionHandler<T = unknown> = (data: T) => void;

export class ActionCableClient {
  private ws: WebSocket | null = null;
  private readonly url: string;
  private handlers = new Map<string, SubscriptionHandler>();
  /** subscribe が呼ばれた時点では未接続の場合があるので保留リストを持つ */
  private pendingSubscriptions: string[] = [];

  constructor(url: string = WS_URL) {
    this.url = url;
  }

  // ── 接続 ──────────────────────────────────────────────────────────────────

  connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) return Promise.resolve();

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        // 接続後に保留していた subscribe コマンドを送信
        for (const identifier of this.pendingSubscriptions) {
          this.ws!.send(JSON.stringify({ command: "subscribe", identifier }));
        }
        this.pendingSubscriptions = [];
        resolve();
      };

      this.ws.onerror = (e) => reject(e);

      this.ws.onmessage = (event: MessageEvent<string>) => {
        try {
          const msg = JSON.parse(event.data) as RawCableMessage;
          // サーバー制御メッセージは無視
          if (
            msg.type === "ping" ||
            msg.type === "welcome" ||
            msg.type === "confirm_subscription"
          )
            return;

          if (msg.message !== undefined && msg.identifier) {
            const handler = this.handlers.get(msg.identifier);
            handler?.(msg.message);
          }
        } catch {
          // JSON パース失敗は無視
        }
      };

      this.ws.onclose = () => {
        this.ws = null;
      };
    });
  }

  // ── チャンネル購読 ──────────────────────────────────────────────────────

  subscribe<T = unknown>(
    channelName: string,
    params: Record<string, unknown>,
    handler: SubscriptionHandler<T>,
  ): () => void {
    const identifier = JSON.stringify({ channel: channelName, ...params });
    this.handlers.set(identifier, handler as SubscriptionHandler);

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ command: "subscribe", identifier }));
    } else {
      this.pendingSubscriptions.push(identifier);
      // 未接続なら接続を開始（エラーは無視、onopen で再送される）
      this.connect().catch(() => {});
    }

    // クリーンアップ関数を返す
    return () => this.unsubscribe(channelName, params);
  }

  // ── チャンネル解除 ──────────────────────────────────────────────────────

  unsubscribe(channelName: string, params: Record<string, unknown>): void {
    const identifier = JSON.stringify({ channel: channelName, ...params });
    this.handlers.delete(identifier);

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ command: "unsubscribe", identifier }));
    }
  }

  // ── 切断 ──────────────────────────────────────────────────────────────────

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
    this.handlers.clear();
    this.pendingSubscriptions = [];
  }
}

/**
 * AiResponseChannel から届くストリーミングチャンク
 * （ARCHITECTURE.md の WebSocket 仕様に準拠）
 */
export type AiResponseChunk = {
  type: "ai_response_chunk" | "ai_response_done";
  text_chunk?: string;
  is_final?: boolean;
  audio_chunk_url?: string;
};
