import WebSocket from 'ws';
import https from 'https';

export type PoolItem = {
    socket: WebSocket,
    time_joined: number,
    data: any
}

export type ServerOptions = {
    allowed_clients?: string[] | null;
    disallowed_clients?: string[] | null;
    queue_time?: number;
    poll_interval?: number;
    https_server?: https.Server
}