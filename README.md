# tiny-matchmaking
```
Tiny Node.js matchmaking server.
```

# Install
```
$ npm i tiny-matchmaking --s
```
# Info
This package exposes one MatchMakingServer and one MatchMakingClient class. 
The server class encapsulates a WebSocket server, event emitter, and a pool of objects submitted by remote clients, it takes a callback function as an argument whose 
purpose is to determine whether any two objects in the pool should be considered matches (takes two objects as arguments and returns boolean).
This function can consider whatever predicates you like as long as the relevant information is contained within the pool object.
Each client object **must**:
 - Expose the same fields
 - Contain a unique `id` field

### Quick server example
```js
const {MatchMakingServer} = require('tiny-matchmaking');
// example function that determines whether two objects should be considered a match.
// function is always called with two parameters, both are objects from the pool.
// must return boolean.
// each object looks like:
// {
//  socket: WebSocket,
//  time_joined: number, (time when queue was joined)
//  data: { ...OBJECT SUBMITTED TO POOL BY CLIENT }
// }
const is_match = (user_1, user_2) => { // MUST RETURN BOOLEAN
    return Math.abs(user_1.data.elo - user_2.data.elo) < 100;
}

// Instantiate the server: 
// @port: number 
// @match_function: (player_1, player_2) => boolean -> (whatever you want beyond that)
// @options (optional) {
//  queue_time: number  -> (how many ms for each client to stay in queue before giving up)
//  poll_interval: number -> (how often to check the pool for matches
//  allowed_clients: string[] -> (ip whitelist, not considered if nothing is passed in)
//  disallowed_clients: string[] -> (ip blacklist, not considered if nothing is passed in)
//  https_server: HttpsServer -> (if you want to use wss you will need to pass you own server in, otherwise a http server is created for you) (UNTESTED)
// }
const server = new MatchMakingServer(5000, is_match, {poll_interval: 1000, queue_time: 20000});
```
All that is left to do from here is listen for the single event emitted by the server when a match is found, and implement the logic
you require the server to execute before alerting the clients. This leaves you with:
```js
const {MatchMakingServer} = require('tiny-matchmaking');

const is_match = (user_1, user_2) => { // MUST RETURN BOOLEAN
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
```
The results sent back to the clients inside the event listener will be handled by a callback function passed in to the MatchMakingClient constructor.
Client instances can be instantiated at a single middlepoint to handle multiple clients (like on a Discord bot) or on individual application instances.
The constructor takes a server URL and the callback discussed above, and exposes a single method (match) which will send a client to the matchmaking pool and
execute the callback when the server responds with the match results.
### Quick client example
```js
const {MatchMakingClient} = require('tiny-matchmaking');

// example function to handle whatever you sent back from the server on each client.
const client_match_result_handler = (args) => {
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

const player_1 = {id: 1, elo: 150};
client.match(player_1);
```

