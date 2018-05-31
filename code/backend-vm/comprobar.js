var config = require('./config.json');
var exec = require('child_process').exec, child;


child = exec('./comprobarche.sh ' +config.rootpassword + ' ' + 8082,
  function (error, stdout, stderr) {
        if (error !== null) {
          console.log('exec error: ' + error);
        }
        console.log(stdout);

        if(stdout == "no existe\n"){
          console.log("no tiene nada");
        }
        else{
          console.log("si que existe");
        }

});
