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

// instantiate the server, (port, match_function, options (optional) {
//  queue_time: number (how many ms for each client to stay in queue before giving up)
//  poll_interval: number (how often to check the pool for matches
//  allowed_clients: string[] (ip whitelist, not considered if nothing is passed in)
//  disallowed_clients: string[] (ip blacklist, not considered if nothing is passed in)
// }
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