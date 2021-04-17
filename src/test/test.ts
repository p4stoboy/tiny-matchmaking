import { MatchMakingServer } from "../server";
import { MatchMakingClient } from "../client";
import {PoolItem} from "../types";

// function that determines whether two objects should be considered a match.
// each object looks like:
// {
//  socket: WebSocket,
//  time_joined: number, (time when queue was joined)
//  data: { ...OBJECT SUBMITTED TO POOL BY CLIENT }
// }
const is_match = (user_1: PoolItem, user_2: PoolItem): boolean => {
    return Math.abs(user_1.data.elo - user_2.data.elo) < 100;

}

const server = new MatchMakingServer(5000, is_match, {poll_interval: 1000, queue_time: 20000});

// handle logic for when match is found
server.emitter.on('match', (m1, m2) => {
    // do battle routine or pass this to another function
    // eg. const results = do_battle(m1, m2);
    const results = {winner: m1.data.id, loser: m2.data.id};
    console.log(`SERVER: Match over:  ${JSON.stringify(results)}`);

    // send whatever info you need to back to clients.
    // results will be passed in to client results handler function on each client
    m1.socket.send(JSON.stringify({id: m1.data.id, results: {...results}}));
    m2.socket.send(JSON.stringify({id: m2.data.id, results: {...results}}));

    // make sure you close the connections
    m1.socket.close();
    m2.socket.close();
});

// function to handle whatever you sent back from the server on each client.
const client_match_result_handler = (args: any) => {
    // eg. client_post_match(args);
    console.log(`client id: ${args.id} received results: w: ${args.results.winner} l: ${args.results.loser}`);
}

// create client operator and pass in handler function
// call client.match({PLAYER_OBJECT}) to add a player to the pool.
// PLAYER_OBJECT is assigned to the 'data' property of the object passed in
// to the server callback functions.
const client = new MatchMakingClient('ws://127.0.0.1:5000', client_match_result_handler);

// example PLAYER_OBJECT:
// {
//  id: any (EVERY PLAYER OBJECT SENT TO THE SERVER MUST HAVE THIS PROPERTY)
//  ... any other properties you want
// }
let i = 1;
setInterval(() => {
    client.match({id: i, elo: 300});
    i++;
    }, 200);

