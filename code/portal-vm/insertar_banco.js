
var functions = require('./functions.js');
async = require("async");

var lowEnd = 51;
var highEnd = 254;

var list = [];
for (var i = lowEnd; i <= highEnd; i++) {
    list.push(i);
}


var pool = functions.createnewconnection();

pool.getConnection(function(err, connection) {

  async.forEach(list, function(item, callback) {
    connection.query("INSERT INTO Banco_ip (ip_vm) VALUES ('10.6.134."+item+"')");

    if(item == list[list.length-1]){
      connection.release();
    }
  });
});
