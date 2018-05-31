
var functions = require('./functions.js');
var config = require('./config.json');
var PythonShell = require('python-shell');


var pool = functions.createnewconnection();


    pool.getConnection(function(err, connection) {

      connection.query('TRUNCATE Cola', function(error, results, fields) {
        console.log(".");
        connection.query('TRUNCATE Firewall', function(error, results, fields) {
          console.log("..");
          connection.query('TRUNCATE Pendientes', function(error, results, fields) {
            console.log("...");
            connection.query('TRUNCATE VMS', function(error, results, fields) {
              console.log("....");
              connection.query('TRUNCATE Asignaciones', function(error, results, fields) {
                console.log(".....");
                  connection.query('TRUNCATE Servidores', function(error, results, fields) {
                    console.log("......");
                      connection.query('TRUNCATE Ovirt', function(error, results, fields) {
                        console.log(".......");
                        connection.query('TRUNCATE Eliminar_servicio', function(error, results, fields) {
                          console.log(".........");
                          connection.query('TRUNCATE Eliminar_servicio_usuario', function(error, results, fields) {
                            console.log("..........");
                              connection.query('TRUNCATE Ovirt_Pendientes', function(error, results, fields) {
                                console.log("............");
                                  connection.query('TRUNCATE Ovirt_Pendientes_Up_AddStart', function(error, results, fields) {
                                    console.log("empty BBDD");
                                    connection.release();

                                    var options = {
                                      mode: 'text',
                                      scriptPath: './ovirtpython'
                                    };

                                    PythonShell.run('stop_and_remove_all_vm.py', options, function (err, results) {
                                      if (err) throw err;
                                      // results is an array consisting of messages collected during execution
                                      console.log('results: %j', results);
                                      process.exit();

                                      });
                                  });
                                });
                          });
                      });
                  });
                });
              });
            });
          });
        });
      });

    });
