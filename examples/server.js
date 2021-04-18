const { MatchMakingServer } = require("../dist/server");

// example function that determines whether two objects should be considered a match.
// function is always called with two parameters, both are objects from the pool.
// must return boolean.
// each client object looks like:
// {
//  socket: WebSocket,
//  time_joined: number, (time when queue was joined)
//  ...FIELDS SUBMITTED TO POOL BY CLIENT (eg: ...{id: 89734, elo: 300})
// }
const is_match_func = (client_1, client_2) => { // MUST RETURN BOOLEAN
    return Math.abs(client_1.elo - client_2.elo) < 100;

}

// optional results function
// if not passed server response to client will be in form:
// {
//  client: <object sent by client>,
//  opponent: <object client was matched with>
// }
// otherwise response will be whatever this function returns
const results_func = (client_1, client_2) => {
    return client_1.power > client_2.power
        ? {winner: client_1.id, loser: client_2.id}
        : {winner: client_2.id, loser: client_1.id};
}

// instantiate the server, (port, match_function, options (optional) {
//  queue_time: number (how many ms for each client to stay in queue before giving up)
//  poll_interval: number (how often to check the pool for matches
//  allowed_clients: string[] (ip whitelist, not considered if nothing is passed in)
//  disallowed_clients: string[] (ip blacklist, not considered if nothing is passed in)
// }
const server = new MatchMakingServer(5000, is_match_func, null, {poll_interval: 1000, queue_time: 20000});
