var config = require('./config.json');

module.exports = {

  createsession : function(app, websocket_client){

var session = require("express-session");
var redis   = require("redis");
var socketIOSession = require("socket.io.session");
var redisStore = require('connect-redis')(session);

var client  = redis.createClient(6379, config.host_redis);

client.on("connect",function(){
  console.log("redis conected");

});


var sessionStore = new redisStore({
      "client": client,
      "host": config.host_redis,
      "port": 6379
    });

var sessionSettings = {
    secret: "my-secret",
    resave: true,
    saveUninitialized: true,
    store: sessionStore,
    /*cookie : {
        expires: new Date(253402300000000),
        maxAge: 253402300000000
    }*/

};


var socketSession = socketIOSession(sessionSettings);


app.use(session(sessionSettings));
websocket_client.use(socketSession.parser);

}

}
