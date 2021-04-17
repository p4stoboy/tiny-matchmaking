import {Server as WSServer} from 'ws';
import { PoolItem, ServerOptions } from './types';
import { EventEmitter } from 'events';


export class MatchMakingServer {
    wss: WSServer;
    allowed_clients: string[] | null;
    disallowed_clients: string[] | null;
    queue_time: number;
    poll_interval: number;
    pool: Map<string, PoolItem> = new Map<string, PoolItem>();
    is_match: (p1: PoolItem, p2: PoolItem) => boolean;
    emitter: EventEmitter = new EventEmitter();

    constructor(
        _port: number,
        _is_match: (p1: PoolItem, p2: PoolItem) => boolean,
        _options?: ServerOptions
    ) {
        this.allowed_clients = _options?.allowed_clients ? _options.allowed_clients : null;
        this.disallowed_clients = _options?.disallowed_clients ? _options.disallowed_clients : null;
        this.queue_time = _options?.queue_time ? _options.queue_time : 20000;
        this.poll_interval = _options?.poll_interval ? _options.poll_interval : 1000;
        this.wss = new WSServer(
            !_options?.https_server
                ? {port: _port}
                : {server: _options.https_server, port: _port});
        this.is_match = _is_match;
        this.start();
        setInterval(() => this.match_make(), this.poll_interval);
    }

    start() {
        this.wss.on('connection', (ws, req) => {

            const ip = req.socket.remoteAddress ? req.socket.remoteAddress.slice(7) : '';
            console.log('received connection from: ' + ip);

            if (!ip || (this.allowed_clients && !this.allowed_clients?.includes(ip))) {
                console.log(`unauthorised IP: ${ip ? ip : '(no ip)'}`);
                ws.close();
                return;
            }
            if (this.disallowed_clients && this.disallowed_clients?.includes(ip)) {
                console.log(`unauthorised IP: ${ip}`);
                ws.close();
                return;
            }

            //receive player info
            ws.on('message', message => {
                const new_item: PoolItem = {
                    socket: ws,
                    time_joined: Date.now(),
                    data: JSON.parse(message.toString())
                };
                // add player to pool if they are not already in pool
                if (!this.pool.has(new_item.data.id)) {
                    this.pool.set(new_item.data.id, new_item);
                } else {
                    ws.close();
                }
            });
        });
    }

    match_make() {
        if (this.pool.size < 1) {
            return;
        }
        for (const [A, p1] of this.pool) {
            for (const [B, p2] of this.pool) {
                if (p1.data.id !== p2.data.id && this.is_match(p1, p2)) {
                    const a = this.pool.get(A);
                    const b = this.pool.get(B);
                    if (a && b) {
                        this.emitter.emit('match', {...a}, {...b});
                        this.pool.delete(A);
                        this.pool.delete(B);
                    }
                } else {
                    const b = this.pool.get(B);
                    if (b && Date.now() - b.time_joined > this.queue_time) {
                        b.socket.close();
                        this.pool.delete(B);
                    }
                }
            }
        }
    }
}