# tiny-matchmaking
```
Tiny Node.js matchmaking server.
```

# Install
```
$ npm i tiny-matchmaking --s
```
# Info
This package exposes two classes (MatchMakingServer and MatchMakingClient). 
The server class encapsulates a WebSocket server, and a Map of objects submitted by remote clients. 

The server must take a callback function as a constructor argument whose purpose is to determine whether any two objects in the pool should be considered matches (takes two client objects as arguments and returns boolean).

The server constructor can take a second (optional) callback argument which also accepts two client objects as arguments, the return value of this function will be sent back to both clients.

If this second callback is not passed the response to each client will look like:
```js
{
    client: any, // object initially submitted to pool
    opponent: any // client object which was considered a match
}
```
These functions can both consider whatever predicates you like as long as the relevant information is contained within the client objects.
Each client object **must**:
 - Expose the same fields
 - Contain a unique `id` field

For example:
```js
const client_obj = {
    id: 34523, // can be number or string
    elo: 500,
    power: 9000,
    name: "p4_"
}
```
You can send a client object with any fields you like as long as each client is exposing the same interface.
Using the above example, the callback functions would be working with two client objects in the form:
```js
{
    socket: WebSocket,  // no methods for working with this are exposed, socket operations are handled internally by the MatchMakingServer and MatchMakingClient instances.
    time_joined: number, // time this client joined queue
    id: number,
    elo: number,
    power: number,
    name: string
}
```
### Server Callbacks
Example function that determines whether two objects should be considered a match.
Function is always called with two parameters, both are client objects from the pool.
Must return boolean.
```js
const is_match = (user_1, user_2) => {
    return Math.abs(user_1.elo - user_2.elo) < 100;
}
```
Example function for parsing results if the default response doesn't suit your use case.
Function is always called with two parameters, both are client objects from the pool.
```js
const results_func = (client_1, client_2) => {
    return client_1.power > client_2.power
        ? {winner: client_1.id, loser: client_2.id}
        : {winner: client_2.id, loser: client_1.id};
}
```
### MatchMakingServer Example
From here, instantiating the server is as simple as:
```js
// Constructor params
// @port: number 
// @match_function: (client_1, client_2) => boolean -> (whatever you want beyond that)
// @results_function? (optional): ((client_1, client_2) => any) | null;
// @options? (optional): {
//  queue_time: number  -> (how many ms for each client to stay in queue before giving up)
//  poll_interval: number -> (how often to check the pool for matches
//  allowed_clients: string[] -> (ip whitelist, not considered if nothing is passed in)
//  disallowed_clients: string[] -> (ip blacklist, not considered if nothing is passed in)
//  https_server: HttpsServer -> (if you want to use wss you will need to pass you own server in, otherwise a http server is created for you) (UNTESTED)
// }

const { MatchMakingServer } = require('tiny-matchmaking');

// with results function
const server = new MatchMakingServer(5000, is_match, results_function, {poll_interval: 1000, queue_time: 20000});
// without
const server = new MatchMakingServer(5000, is_match, null, {poll_interval: 1000, queue_time: 20000});
```

The results sent back to the clients will be handled by a callback function passed in to the MatchMakingClient constructor.

Client instances can be instantiated at a single middlepoint to handle multiple clients (like on a Discord bot) or on individual application instances.

The constructor takes a server URL and the callback discussed above, and exposes a single method (match) which will send a client to the matchmaking pool and
execute the callback when the server responds with the match results.
### Client Callback
Example function to handle whatever you sent back from the server on each client.
```js
const client_match_result_handler = (args) => {
    // eg. you might call client_post_match(args); here
    console.log(`client received results:\n${JSON.stringify(args)}`);
}
```
### MatchMakingClient Example
```js
const { MatchMakingClient } = require('tiny-matchmaking');

const client = new MatchMakingClient('ws://127.0.0.1:5000', client_match_result_handler);
const player_1 = {id: 1, elo: 150, power: 700, name: "Charlie"};
client.match(player_1);
```
The MatchMakingClient instance can be used to keep sending clients to the matchmaking pool (like you might on a Discord bot), or instantiated as needed on each client application instance.

# Full Example
### Server.js
```js
const { MatchMakingServer } = require('tiny-matchmaking');

const is_match_func = (client_1, client_2) => { // MUST RETURN BOOLEAN
    return Math.abs(client_1.elo - client_2.elo) < 100;

}

const results_func = (client_1, client_2) => {
    return client_1.power > client_2.power
        ? {winner: client_1.id, loser: client_2.id}
        : {winner: client_2.id, loser: client_1.id};
}

// choosing not to pass results_func here
const server = new MatchMakingServer(5000, is_match_func, null, {poll_interval: 1000, queue_time: 20000});
```
### Client.js
All client objects are being sent from the same client machine here, in practice they can come from any number of different remote machines.
```js
const {MatchMakingClient} = require('tiny-matchmaking');

const client_match_result_handler = (args) => {
    // eg. you might call client_post_match(args); here
    console.log(`client received results:\n${JSON.stringify(args)}`);
}

const client = new MatchMakingClient('ws://127.0.0.1:5000', client_match_result_handler);

const player_1 = {id: 1, elo: 150, power: 700, name: "John"};
client.match(player_1);

const player_2 = {id: 2, elo: 320, power: 900, name: "Sergio"};
client.match(player_2);

const player_3 = {id: 3, elo: 380, power: 300, name: "Brooklyn"};
client.match(player_3);

const player_4 = {id: 4, elo: 160, power: 450, name: "Miguel"};
client.match(player_4);
```
![example scripts](https://media.giphy.com/media/J9mVvDfIeJiZY0vkFW/giphy.gif)