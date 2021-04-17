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

// client machine 1
const player_1 = {id: 1, elo: 150};
client.match(player_1);
// 2
const player_2 = {id: 2, elo: 320};
client.match(player_2);
// 3
const player_3 = {id: 3, elo: 380};
client.match(player_3);
// 4
const player_4 = {id: 4, elo: 160};
client.match(player_4);

// let i = 5;
// setInterval(() => {
//     client.match({id: i, elo: 300});
//     i++;
// }, 200);