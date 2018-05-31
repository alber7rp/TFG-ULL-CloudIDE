var os = require('os');
var MySqlAsync = require('mysql');
var config = require('./config.json');
var moment = require('moment');

module.exports = {

    cleanaddress : function(ip){
      var aux = ip;
      if (aux.substr(0, 7) == "::ffff:") {
        aux = aux.substr(7);
      }
      return aux;
    },

    getiplocal : function(){

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
  },

    createnewconnection : function(){
      var connectionAsync = MySqlAsync.createPool({
        host: config.host_bbdd_mysql,
        user: config.user_bbdd_mysql,
        password: config.password_bbdd_mysql,
        database : config.database_bbdd_mysql,
        //debug : true,
        acquireTimeout : 10000000000000000000000000000,
        connectTimeout : 1000000000000000000000000000000000000000,
        connectionLimit : 5,
        queueLimit : 0
      });
      console.log("una conexion creada");

      connectionAsync.on('release', function (connection) {
      console.log('Connection %d released', connection.threadId);
    });

      return connectionAsync;
    },

    eliminardirectoriosolo : function(usuario, motivo, callback){
      var exec = require('child_process').exec, child, salida;

      child = exec('./sh/eliminardirectorio.sh '+config.password_root +" "+ 1 +" "+ config.path_almacenamiento + " " + usuario +" "+ motivo,
        function (error, stdout, stderr) {
          // Imprimimos en pantalla con console.log
          salida = stdout;
          // controlamos el error
          if (error !== null) {
            console.log('exec error: ' + error);
          }
          console.log("Salida estándar: " + salida);
          console.log("Se ha eliminado");
          callback();
      });
    },

    eliminardirectoriotodo : function(motivo, callback){
      var exec = require('child_process').exec, child, salida;

      child = exec('./sh/eliminardirectorio.sh '+config.password_root +" "+ 2 +" "+ config.path_almacenamiento + " " + motivo,
        function (error, stdout, stderr) {
          // Imprimimos en pantalla con console.log
          salida = stdout;
          // controlamos el error
          if (error !== null) {
            console.log('exec error: ' + error);
          }
          console.log("Salida estándar: " + salida);
          console.log("Se ha eliminado");
          callback();
      });
    },

    dateFormat : function(){
      return moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
    },

    getCleanedString : function(cadena){
     // Definimos los caracteres que queremos eliminar
     var specialChars = " !@#$^&%*()+=-[]\/{}|:<>?,.";

     // Los eliminamos todos
     for (var i = 0; i < specialChars.length; i++) {
         cadena= cadena.replace(new RegExp("\\" + specialChars[i], 'gi'), '');
     }

     // Lo queremos devolver limpio en minusculas
     cadena = cadena.toLowerCase();

     // Quitamos espacios y los sustituimos por _ porque nos gusta mas asi
     cadena = cadena.replace(/ /g,"_");

     // Quitamos acentos y "ñ". Fijate en que va sin comillas el primer parametro
     cadena = cadena.replace(/á/gi,"a");
     cadena = cadena.replace(/é/gi,"e");
     cadena = cadena.replace(/í/gi,"i");
     cadena = cadena.replace(/ó/gi,"o");
     cadena = cadena.replace(/ú/gi,"u");
     cadena = cadena.replace(/ñ/gi,"n");
     return cadena;
  }



}
