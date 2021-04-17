import WebSocket from 'ws';

export class MatchMakingClient {

    ip: string;
    call_back: (...args: any[]) => any;

    constructor(
        _server_ip: string,
        _call_back: (...args: any[]) => any
    ) {
        this.ip = _server_ip;
        this.call_back = _call_back;
    }

    match({...args}) {
        const connection = new WebSocket(this.ip);
        connection.onopen = () => {
            if (!args.id) throw new Error(`All objects sent to matchmaking must have the same interface and have an 'id' property`);
            connection.send(JSON.stringify(args));
        };
        connection.onerror = error => {
            console.log(error);
        };
        connection.onmessage = (m) => {
            try {
                this.call_back(JSON.parse(m.data as string));
            } catch (e) {
                console.log(e);
            }
        };
        connection.onclose = () => {
            // console.log('connection closed by host.');
        };
    }
}
