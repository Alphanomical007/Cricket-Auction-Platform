// Dynamically resolve WebSocket URL so it works through VS Code Port Forwarding
const getWsUrl = () => {
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/api/auction/ws`;
  }
  return process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/api/auction/ws";
};

export type AuctionMessage = {
  type: string;
  [key: string]: unknown;
};

export class AuctionSocket {
  private ws: WebSocket | null = null;
  private eventId: number;
  private token: string;
  private handlers: Map<string, ((msg: AuctionMessage) => void)[]> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private manuallyClosed = false;

  constructor(eventId: number, token: string) {
    this.eventId = eventId;
    this.token = token;
  }

  connect() {
    this.manuallyClosed = false;
    const url = `${getWsUrl()}/${this.eventId}?token=${this.token}`;
    this.ws = new WebSocket(url);

    this.ws.onmessage = (e) => {
      try {
        const msg: AuctionMessage = JSON.parse(e.data);
        const handlers = this.handlers.get(msg.type) || [];
        const wildcards = this.handlers.get("*") || [];
        [...handlers, ...wildcards].forEach((h) => h(msg));
      } catch {}
    };

    this.ws.onclose = () => {
      if (this.manuallyClosed) return;
      this.reconnectTimer = setTimeout(() => this.connect(), 3000);
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  on(type: string, handler: (msg: AuctionMessage) => void) {
    const existing = this.handlers.get(type) || [];
    this.handlers.set(type, [...existing, handler]);
  }

  off(type: string, handler: (msg: AuctionMessage) => void) {
    const existing = this.handlers.get(type) || [];
    this.handlers.set(type, existing.filter((h) => h !== handler));
  }

  disconnect() {
    this.manuallyClosed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }
}
