var os = require('os');
var config = require('./config.json');

var getiplocal = function(){

var interfaces = os.networkInterfaces();
var addresses = [];
for (var k in interfaces) {
    for (var k2 in interfaces[k]) {
        var address = interfaces[k][k2];
        if (address.family === 'IPv4' && !address.internal) {
            addresses.push(address.address);
            console.log(address.address);
        }
    }
}
return addresses;
}

var internet = function(modo, ip_source, ip_dest, port, callback){
  var exec = require('child_process').exec, child, salida;

  child = exec(config.path+'internet.sh ' + config.rootpassword + " " + config.ip_server_interior,
    function (error, stdout, stderr) {
      // Imprimimos en pantalla con console.log
      salida = stdout;
      // controlamos el error
      if (error !== null) {
        console.log('exec error: ' + error);
      }
      console.log("Salida estándar internet: " + salida);
    });

}

var network = function(ip){
  var exec = require('child_process').exec, child, salida;

  child = exec(config.path+'network.sh ' + config.rootpassword + " " + ip,
    function (error, stdout, stderr) {
      // Imprimimos en pantalla con console.log
      salida = stdout;
      // controlamos el error
      if (error !== null) {
        console.log('exec error: ' + error);
      }
      console.log("Salida estándar internet: " + salida);
    });

}

var cleandockerimages = function(){
  var exec = require('child_process').exec, child, salida;

  child = exec(config.path+'cleandockerimages.sh ' + config.rootpassword,
    function (error, stdout, stderr) {
      // Imprimimos en pantalla con console.log
      salida = stdout;
      // controlamos el error
      if (error !== null) {
        console.log('exec error: ' + error);
      }
      console.log("Salida estándar internet: " + salida);
    });

}

module.exports.network = network;
module.exports.cleandockerimages = cleandockerimages;
module.exports.getiplocal = getiplocal;
module.exports.internet = internet;
