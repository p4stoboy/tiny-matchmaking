import WebSocket from 'ws';
import https from 'https';

export type PoolItem<T> = T & {
    socket: WebSocket,
    time_joined: number
}

export type ServerOptions = {
    allowed_clients?: string[] | null;
    disallowed_clients?: string[] | null;
    queue_time?: number;
    poll_interval?: number;
    https_server?: https.Server
}
