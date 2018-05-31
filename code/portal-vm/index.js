var express = require('express');
var config = require('./config.json');
var functions = require('./functions.js');
var firewall = require('./firewall.js');
var bodyParser = require('body-parser');
async = require("async");
var ovirt = require('./ovirt.js');
var sesion = require('./sesion.js');
var addresses = functions.getiplocal();




var pool = functions.createnewconnection();
var app = express();
app.use(bodyParser.urlencoded({extended : false}));
app.use(bodyParser.json());
app.use('/cloud', express.static('./client/views'));
app.use('/', express.static('./client/views'));

app.set('views', './client/views'); //Configuramos el directorio de vistas
app.set('view engine', 'ejs');

firewall.inicializar(); //borramos iptables anteriores

var regexp = /\balu\d{10}\b/; //Expresion regular para saber si el usuario es un alumno o un profesor







var websocket_client = require("socket.io").listen(config.puerto_websocket_clients);
var websocket_vms = require('socket.io')(config.puerto_websocket_vms,{
  pingTimeout: 3000,
  pingInterval: 3000
});
var websocket_servers = require('socket.io').listen(config.puerto_websocket_servers);
var n = config.numero_max_serverxuser;
var maxusers = config.numero_max_users;
var socket_client_servers = new Map();
sesion.createsession(app, websocket_client); //creamos la sesion
var ip_vms = new Map();
var user_socket = new Map();
var bloqueo_tablas = "LOCK TABLES VMS WRITE, VMS as v1 READ, Ovirt_Pendientes_Up_AddStart WRITE, Ovirt_Pendientes_Up_AddStart as ovpuas READ, Ultima_conexion WRITE, Ultima_conexion as uc READ, Eliminar_servicio_usuario WRITE, Eliminar_servicio_usuario as esu READ, Eliminar_servicio WRITE, Eliminar_servicio as es READ, Servicios WRITE, Servicios as s1 READ, Matriculados WRITE, Matriculados as m1 READ, Ovirt WRITE, Ovirt as ov READ, Ovirt_Pendientes WRITE, Ovirt_Pendientes as ovp READ, Banco_ip WRITE, Banco_ip as bip READ, Firewall WRITE, Firewall as f1 READ, Pendientes WRITE, Pendientes as p1 READ, Asignaciones WRITE, Asignaciones as a1 READ, Cola WRITE, Cola as c1 READ";


//AUTENTICACION POR CAS ULL
var CASAuthentication = require('./cas-authentication.js');

// Create a new instance of CASAuthentication.
var cas = new CASAuthentication({
    cas_url     : 'https://login.ull.es/cas-1',
    service_url : 'http://cloudide.iaas.ull.es',
    session_info     : 'cas_userinfo',
    destroy_session : false

});

///////



// OVIRT //////////////////////

var ovirt_vms = function(){
console.log("OVIRT");

pool.getConnection(function(err, connection) {
  connection.query(bloqueo_tablas,function(error, results, fields) {
  connection.query("SELECT COUNT(*) AS total FROM ( SELECT ip_vm FROM VMS as v1 WHERE prioridad=1 UNION SELECT ip_vm FROM Ovirt_Pendientes as ovp WHERE tipo='up') as t1", function(error, total, fields) {
    connection.query("SELECT COUNT(DISTINCT usuario) AS total FROM Cola as c1", function(error, total_usuarios_cola, fields) {

    if(((total_usuarios_cola[0].total/config.numero_max_users)+config.numero_vm_reserva) > total[0].total){
      console.log("OVIRT -> hay menos en cola");


      var inicio = 0;
      var limite = ((total_usuarios_cola[0].total/config.numero_max_users)+config.numero_vm_reserva)-total[0].total;

      var bucle = function(contador){

        console.log("Añadimos vm");
        connection.query("SELECT * FROM Banco_ip as bip WHERE ip NOT IN ( SELECT ip_vm FROM Ovirt as ov) LIMIT 1", function(error, escoger_ip, fields) {
          connection.query("INSERT INTO Ovirt (Name, ip_vm) VALUES ('ULL-CloudIDE-backend-"+escoger_ip[0].ip+"', '"+escoger_ip[0].ip+"')", function(error, result, fields) {
            connection.query("INSERT INTO Ovirt_Pendientes (Name, ip_vm, tipo) VALUES ('ULL-CloudIDE-backend-"+escoger_ip[0].ip+"', '"+escoger_ip[0].ip+"', 'up')", function(error, result, fields) {
              connection.query("INSERT INTO Ovirt_Pendientes_Up_AddStart (Name, ip_vm) VALUES ('ULL-CloudIDE-backend-"+escoger_ip[0].ip+"', '"+escoger_ip[0].ip+"')", function(error, result, fields) {

              connection.query("SELECT count(*) as total FROM Ovirt_Pendientes_Up_AddStart as ovpuas ", function(error, contar_ovp_up, fields) {
                if(contar_ovp_up[0].total == 1){

                  var bucle2 = function(ip){
                  ovirt.add_and_start_vm("ULL-CloudIDE-backend-"+ip,ip, function(){
                    pool.getConnection(function(err, conexion) {
                      conexion.query(bloqueo_tablas,function(error, results, fields) {
                        conexion.query("DELETE FROM Ovirt_Pendientes_Up_AddStart WHERE ip_vm='"+ip+"'", function(error, result, fields) {
                            console.log("VM added and started " + "ULL-CloudIDE-backend-"+ip);
                            conexion.query("SELECT count(*) as total FROM Ovirt_Pendientes_Up_AddStart as ovpuas ", function(error, contar_ovp_up, fields) {
                              if(contar_ovp_up[0].total != 0){
                                conexion.query("SELECT ip_vm FROM Ovirt_Pendientes_Up_AddStart as ovpuas LIMIT 1", function(error, escoger_ovp, fields) {
                                  bucle2(escoger_ovp[0].ip_vm);
                                  conexion.query("UNLOCK TABLES",function(error, results, fields) {
                                        console.log("liberando tablas");

                                      conexion.release();
                                  });
                                });
                              }
                              else{
                                conexion.query("UNLOCK TABLES",function(error, results, fields) {
                                      console.log("liberando tablas");

                                    conexion.release();
                                });
                              }
                            });
                        });
                      });
                    });
                  });
                }
                bucle2(escoger_ip[0].ip);
              }
              contador++;
              if(contador  < limite){
                bucle(contador);
              }
              else{
                connection.query("UNLOCK TABLES",function(error, results, fields) {
                      console.log("liberando tablas");

                    connection.release();
                });
              }
            });
          });
            });
          });
        });
      }

      bucle(inicio);
      }


    else{


      connection.query("SELECT COUNT(*) AS total FROM VMS as v1 WHERE prioridad=1", function(error, total, fields) {
        if(total[0].total > config.numero_vm_reserva){
          console.log("OVIRT -> hay más");

          var limite = total[0].total-config.numero_vm_reserva;
          var inicio = 0;

          var bucle = function(contador){

            console.log("Stop and Remove VM");
            connection.query("SELECT ip_vm FROM VMS as v1 WHERE prioridad=1 LIMIT 1", function(error, escoger_vm, fields) {
              connection.query("DELETE FROM VMS WHERE ip_vm='"+escoger_vm[0].ip_vm+"'", function(error, result, fields) {
                connection.query("INSERT INTO Ovirt_Pendientes (Name, ip_vm, tipo) VALUES ('ULL-CloudIDE-backend-"+escoger_vm[0].ip_vm+"', '"+escoger_vm[0].ip_vm+"', 'down')", function(error, result, fields) {
                  connection.query("SELECT count(*) as total FROM Ovirt_Pendientes as ovp WHERE tipo='down' ", function(error, contar_ovp_down, fields) {
                    if(contar_ovp_down[0].total == 1){

                      var bucle2 = function(ip){
                      ovirt.stop_and_remove_vm("ULL-CloudIDE-backend-"+ip, function(){
                        pool.getConnection(function(err, conexion) {
                          conexion.query(bloqueo_tablas,function(error, results, fields) {
                            conexion.query("DELETE FROM Ovirt_Pendientes WHERE ip_vm='"+ip+"'", function(error, result, fields) {
                              conexion.query("DELETE FROM Ovirt WHERE ip_vm='"+ip+"'", function(error, result, fields) {
                                console.log("VM stopped and removed " + "ULL-CloudIDE-backend-"+ip);
                                conexion.query("SELECT count(*) as total FROM Ovirt_Pendientes as ovp WHERE tipo='down' ", function(error, contar_ovp_down, fields) {
                                  if(contar_ovp_down[0].total != 0){
                                    conexion.query("SELECT ip_vm FROM Ovirt_Pendientes as ovp WHERE tipo='down' LIMIT 1", function(error, escoger_ovp, fields) {
                                      bucle2(escoger_ovp[0].ip_vm);
                                      conexion.query("UNLOCK TABLES",function(error, results, fields) {
                                            console.log("liberando tablas");

                                          conexion.release();
                                      });
                                    });
                                  }
                                  else{
                                    conexion.query("UNLOCK TABLES",function(error, results, fields) {
                                          console.log("liberando tablas");

                                        conexion.release();
                                    });
                                  }
                                });
                              });
                            });
                          });
                        });
                      });
                    }
                    bucle2(escoger_vm[0].ip_vm);
                  }
                  contador++;
                  if(contador  < limite){
                    bucle(contador);
                  }
                  else{
                    connection.query("UNLOCK TABLES",function(error, results, fields) {
                          console.log("liberando tablas");

                        connection.release();
                    });
                  }
                });
              });
            });
          });
          }

          bucle(inicio);




        }
        else{
          connection.query("UNLOCK TABLES",function(error, results, fields) {
                console.log("liberando tablas");

              connection.release();
          });
        }

      });
    }


  });
});
});
});

}


ovirt_vms(); //Llamamos a ovirt


/////////////////////////////////////////




var comprobarservidor = function(){
  // INSERTAR SERVIDOR EN BBDD
  console.log("Comprobando servidor...");
  pool.getConnection(function(err, connection) {
    if(err)console.log(err);
    connection.query("INSERT INTO Servidores (ip_server) SELECT '"+addresses[1]+"' FROM dual WHERE NOT EXISTS (SELECT * FROM Servidores WHERE ip_server='"+addresses[1]+"')", function(error, results, fields){
      connection.release();
    });
  });
}

comprobarservidor();

setInterval(comprobarservidor, 600000);



//ESTABLECEMOS CONEXION CON LOS DEMÁS SERVIDORES
pool.getConnection(function(err, connection) {
  var conexion = connection;
  if(err) console.log(err);
  conexion.query("SELECT * FROM Servidores WHERE ip_server<>'"+addresses[1]+"'",function(error, results, fields) {

    var servers = results;
    conexion.release();
    async.forEach(servers, function(item, callback) {

            var ip_server = item.ip_server;
            socket_client_servers.set(ip_server, require('socket.io-client')('http://'+ip_server+':'+config.puerto_websocket_servers, {
            reconnection : true,
            reconnectionDelay:0,
            reconnectionDelay:100}));

            socket_client_servers.get(ip_server).on('disconnect', function () {
              pool.getConnection(function(err, connection) {
              var conexion = connection;
              conexion.query(bloqueo_tablas,function(error, results, fields) {
                conexion.query("DELETE FROM Servidores WHERE ip_server='"+ip_server+"'",function(error, result, fields) {
                  socket_client_servers.get(ip_server).disconnect();
                  socket_client_servers.delete(ip_server);
                  console.log('server disconnected');
                  conexion.query("UNLOCK TABLES",function(error, results, fields) {
                    console.log("liberando tablas");

                  conexion.release();
                  comprobarservidor();
              });

            });
          });
        });
      });

          socket_client_servers.get(ip_server).on('prueba', function (data) {
            console.log('prueba recibida');
          });

          socket_client_servers.get(ip_server).on('enviar-resultado', function (data) {
            console.log('enviar resultado');
            if(user_socket.get(data.user) != undefined){
              broadcastclient(data.user, "resultado", {"motivo" : data.motivo});
            }
          });

          socket_client_servers.get(ip_server).on('enviar-stop', function (data) {
            console.log('enviar stopp');
            if(user_socket.get(data.user) != undefined){
              broadcastclient(data.user, "stop", {"motivo" : data.motivo});
            }
          });

          socket_client_servers.get(ip_server).on('deletednat', function (data) {
            console.log('servers deletednat');
            firewall.deletednat(data);
          });

          socket_client_servers.get(ip_server).on("dnatae-eliminarsolo", function (data) {
            console.log('servers deletednat');
            firewall.dnatae("eliminarsolo", data.ip_origen, data.ipvm, data.puerto);
          });

          socket_client_servers.get(ip_server).on("añadirsolo", function (data) {
            console.log('servers deletednat');
            firewall.dnatae("añadirsolo", data.ip_origen, data.ipvm, data.puerto);
          });

          socket_client_servers.get(ip_server).on("añadircomienzo", function (data) {
            console.log('servers deletednat');
            firewall.dnatae("añadircomienzo", data.ip_origen, data.ipvm, data.puerto);
          });

        }, function(err) {
            if (err) console.log(err);
      });
  });
});



  var vmfree = function(){

    pool.getConnection(function(err, connection) {
      var conexion = connection;
      console.log("VMFREE");
        conexion.query(bloqueo_tablas,function(error, results, fields) {
          conexion.query("SELECT COUNT(*) AS total FROM Cola AS c1",function(error, cola_, fields) {
            conexion.query("SELECT COUNT(*) AS total FROM VMS AS v1",function(error, vms_, fields) {

                  if((vms_[0].total != 0)&&(cola_[0].total != 0)){
                    var promise2 = new Promise(function(resolve, reject) {
                    console.log("Existen vm libres y hay motivos en cola");
                      conexion.query("SELECT * FROM Cola AS c1 LIMIT 1",function(error, cola_user, fields) {
                        conexion.query("SELECT * FROM Cola AS c1 WHERE usuario='"+cola_user[0].usuario+"'",function(error, cola_user1, fields) {
                            conexion.query("SELECT * FROM VMS AS v1 ORDER BY prioridad ASC LIMIT 1",function(error, cola_vm, fields) {
                              if(ip_vms.get(cola_vm[0].ip_vm)!= undefined){
                              async.forEach(cola_user1, function(item, callback) {
                                    conexion.query("INSERT INTO Pendientes (ip_vm, motivo, usuario, tipo) VALUES ('"+cola_vm[0].ip_vm+"', '"+item.motivo+"','"+cola_user[0].usuario+"', 'up')",function(error, results, fields) {
                                      var json = {"user" : cola_user[0].usuario, "motivo" : item.motivo};
                                      getsocketfromip(cola_vm[0].ip_vm).emit("load", json);

                                      if(item == cola_user1[cola_user1.length-1]){
                                        resolve();
                                      }
                                    });

                                  }, function(err) {
                                      if (err) console.log(err);}
                                );
                              }
                              else{
                                resolve("false");
                              }
                            });
                        });
                      });
                    });

                    promise2.then(function(result) {
                      if(result != "false"){
                      conexion.query("SELECT * FROM Cola AS c1 LIMIT 1",function(error, cola_user, fields) {
                        conexion.query("SELECT * FROM VMS AS v1 ORDER BY prioridad ASC LIMIT 1",function(error, cola_vm, fields) {
                          conexion.query("SELECT count(DISTINCT usuario) AS total FROM (SELECT DISTINCT usuario from Asignaciones WHERE ip_vm='"+cola_vm[0].ip_vm+"' UNION SELECT DISTINCT usuario FROM Pendientes WHERE ip_vm='"+cola_vm[0].ip_vm+"') AS tmp",function(error, numero_users_vm, fields) {
                            console.log("tiene " + numero_users_vm[0].total + " usuarios la maquina virtual");
                            if(numero_users_vm[0].total == config.numero_max_users){
                              conexion.query("DELETE FROM VMS WHERE ip_vm='"+cola_vm[0].ip_vm+"'",function(error, cola_vm, fields) {
                              });
                            }
                            else{
                              conexion.query("UPDATE VMS SET prioridad=0 WHERE ip_vm='"+cola_vm[0].ip_vm+"'",function(error, results, fields) {
                                console.log("actualizamos vm");
                              });

                            }

                                conexion.query("DELETE FROM Cola WHERE usuario='"+cola_user[0].usuario+"'",function(error, results, fields) {
                                  console.log("enviado a vm");
                                  conexion.query("UNLOCK TABLES");
                                  conexion.release();
                                  vmfree();
                                });

                        });
                      });
                    });
                  }
                  else{
                    conexion.query("UNLOCK TABLES",function(error, results, fields) {
                    conexion.release();
                    vmfree();

                  });
                  }


                    }, function(err) {
                      console.log(err);
                    });
              }
              else{
                conexion.query("UNLOCK TABLES");
                conexion.release();

              }
            });
          });
        });
  });
}

  var getsocketfromip = function(ip){
    return ip_vms.get(ip)[ip_vms.get(ip).length-1];
  }

  var broadcastservers = function(evento, data){
    console.log("Enviando broadcastservers");

    socket_client_servers.forEach(function(value, key, map){
      value.emit(evento, data);
    });

    websocket_servers.sockets.emit(evento,data);


  }


  var broadcastclient = function(user, evento, data){
    var socks = user_socket.get(user);
    if(socks != undefined){
      socks.forEach(function(value, key, map){
        value.emit(evento, data);
      });
    }
  }


  ////////////////////"/ Firewall

  pool.getConnection(function(err, connection) {
    console.log("ZONA FIREWALL");
    var conexion = connection;

    conexion.query("SELECT * FROM Firewall NATURAL JOIN Asignaciones",function(error, results, fields) {
      var auxiliar = new Map();
      conexion.release();
      async.forEach(results, function(item, callback) {
        console.log("firewall usuario " + item.usuario);
        if(auxiliar.get({"ip_origen" : item.ip_origen,"usuario" : item.usuario}) == undefined){
          firewall.dnatae("añadircomienzo", item.ip_origen, item.ip_vm,0);
          auxiliar.set({"ip_origen" : item.ip_origen, "usuario" : item.usuario}, true);
        }

        firewall.dnatae("añadirsolo", item.ip_origen, item.ip_vm, item.puerto);

          }, function(err) {
              if (err) console.log(err);}
        );
      });
  });



  /////////////////////



//WEBSOCKET////////////////////////////


websocket_servers.on('connection', function(socket){
  console.log("server conectado");

  socket_client_servers.set(functions.cleanaddress(socket.handshake.address), socket);

  socket.on('disconnect', function () {

      pool.getConnection(function(err, connection) {
      var conexion = connection;
      conexion.query(bloqueo_tablas,function(error, results, fields) {
        conexion.query("DELETE FROM Servidores WHERE ip_server='"+functions.cleanaddress(socket.handshake.address)+"'",function(error, result, fields) {
          socket_client_servers.get(functions.cleanaddress(socket.handshake.address)).disconnect();
          socket_client_servers.delete(functions.cleanaddress(socket.handshake.address));
          console.log('server disconnected');
          conexion.query("UNLOCK TABLES",function(error, results, fields) {
            console.log("liberando tablas");

          conexion.release();
          comprobarservidor();

      });
      });
    });
  });
});

  socket.on('prueba', function (data) {
    console.log('prueba recibida');
  });

  socket.on('enviar-resultado', function (data) {
    console.log('enviar resultado');
    if(user_socket.get(data.user) != undefined){
      broadcastclient(data.user, "resultado", {"motivo" : data.motivo});
    }
    else{
      console.log("no tengo el usuario");
    }
  });

  socket.on('enviar-stop', function (data) {
    console.log('enviar stopp');

    if(user_socket.get(data.user) != undefined){
      broadcastclient(data.user, "stop", {"motivo" : data.motivo});
    }
    else{
      console.log("no tengo el usuario");
    }
  });

  socket.on('deletednat', function (data) {
    console.log('servers deletednat');
    firewall.deletednat(data);
  });

  socket.on("dnatae-eliminarsolo", function (data) {
    console.log('servers eliminarsolo');
    firewall.dnatae("eliminarsolo", data.ip_origen, data.ipvm, data.puerto);
  });

  socket.on("añadirsolo", function (data) {
    console.log('servers añadirsolo');
    firewall.dnatae("añadirsolo", data.ip_origen, data.ipvm, data.puerto);
  });

  socket.on("añadircomienzo", function (data) {
    console.log('servers deletednat');
    firewall.dnatae("añadircomienzo", data.ip_origen, data.ipvm, data.puerto);
  });


})



 websocket_client.on('connection', function (socket) {

    console.log("Conexión cliente de " +  socket.id + " Con ip " + socket.handshake.address);
    if(socket.session.user){
      if(user_socket.get(socket.session.user) == undefined){
        user_socket.set(socket.session.user, new Map());
      }
      var aux = user_socket.get(socket.session.user);
      aux.set(socket.id, socket);
      console.log("tiene conectados a la vez " + aux.size);
      user_socket.set(socket.session.user, aux);
    }

    socket.on('disconnect', function () {
      console.log('client disconnected');
      if(socket.session.user){
        if(user_socket.get(socket.session.user) != undefined){
          var aux = user_socket.get(socket.session.user);
          aux.delete(socket.id);
          if(aux.size == 0){
            console.log("no hay mas usuario "+ socket.session.user);
            user_socket.delete(socket.session.user);
          }
          else{
            user_socket.set(socket.session.user, aux);
          }
          console.log("tiene conectados a la vez " + aux.size);
        }
      }
    });


  socket.on('stopenlace', function(data){
      if(socket.session.user){
        if(functions.cleanaddress(socket.handshake.address) != socket.session.ip_origen){ //si la ip con la que se logueo es diferente a la que tiene ahora mismo la sesion
          if(user_socket.get(socket.session.user) != undefined){
            socket.emit("data-error", {"msg" : "Está accediendo desde una ip diferente a la inicial"} );
          }
          console.log("Está accediendo desde una ip diferente a la inicial");
        }
        else{

          console.log("parar enlace " + data);
          pool.getConnection(function(err, connection) {
          var conexion = connection;

          conexion.query(bloqueo_tablas,function(error, results, fields) {
            conexion.query("SELECT COUNT(*) AS total FROM Matriculados AS m1 WHERE usuario='"+socket.session.user+"' AND motivo='"+data+"'",function(error, existe_matriculados, fields) {
              if(existe_matriculados[0].total != 0){
                conexion.query("SELECT COUNT(*) AS total FROM (SELECT motivo FROM `Eliminar_servicio_usuario` as esu WHERE usuario='"+socket.session.user+"' AND motivo='"+data+"' UNION SELECT motivo FROM Eliminar_servicio as es WHERE motivo='"+data+"') AS alias",function(error, total, fields) {
                  if(total[0].total == 0){
            conexion.query("SELECT COUNT(*) AS total FROM Pendientes AS p1 WHERE motivo='"+data+"' AND usuario='"+socket.session.user+"'",function(error, resultspendientes, fields) {
              if(resultspendientes[0].total == 0){
              conexion.query("SELECT * FROM Asignaciones AS a1 WHERE motivo='"+data+"' AND usuario='"+socket.session.user+"'",function(error, results, fields) {
                if(results.length != 0){

                  if(ip_vms.get(results[0].ip_vm) != undefined){
                    var socket_vm = getsocketfromip(results[0].ip_vm);
                    conexion.query("INSERT INTO Pendientes (ip_vm, motivo, usuario, tipo) VALUES ('"+results[0].ip_vm+"', '"+results[0].motivo+"','"+socket.session.user+"', 'down')",function(error, results2, fields) {
                      var json = {"user" : socket.session.user, "motivo" : data, "puerto" : results[0].puerto};
                      socket_vm.emit("stop", json);
                        console.log("enviado stop");
                        conexion.query("UNLOCK TABLES",function(error, results, fields) {
                          conexion.release();
                        });
                    });
                  }
                  else{
                    console.log("no puede eliminar");
                    if(user_socket.get(socket.session.user) != undefined){
                      socket.emit("data-error", {"msg" : "No se puede eliminar"} );
                    }
                    conexion.query("UNLOCK TABLES",function(error, results, fields) {
                      conexion.release();
                    });
                  }

                }

                else{
                  if(user_socket.get(socket.session.user) != undefined){
                    socket.emit("data-error", {"msg" : "No se puede eliminar"} );
                  }
                  console.log("no puede eliminar");
                  conexion.query("UNLOCK TABLES",function(error, results, fields) {
                    conexion.release();
                  });
                }
              });
          }
            else{
              if(user_socket.get(socket.session.user) != undefined){
                socket.emit("data-error", {"msg" : "No se puede eliminar"} );
              }
              console.log("no puede eliminar");
              conexion.query("UNLOCK TABLES",function(error, results, fields) {
                conexion.release();
              });
            }
            });
          }
            else{
              if(user_socket.get(socket.session.user) != undefined){
                socket.emit("data-error", {"msg" : "No se puede eliminar"} );
              }
              console.log("no puede eliminar");
              conexion.query("UNLOCK TABLES",function(error, results, fields) {
                conexion.release();
              });
            }
          });
          }
            else{
              if(user_socket.get(socket.session.user) != undefined){
                socket.emit("data-error", {"msg" : "No está matriculado de este servidor"} );
              }
              console.log("No esta matriculado");
              conexion.query("UNLOCK TABLES",function(error, results, fields) {
                conexion.release();
              });
            }
          });
            });
          });
      }
  }
});







    socket.on('obtenerenlace', function (data) {
      if(socket.session.user){
        if(functions.cleanaddress(socket.handshake.address) != socket.session.ip_origen){ //si la ip con la que se logueo es diferente a la que tiene ahora mismo la sesion
          console.log("la ip no es la misma");
          if(user_socket.get(socket.session.user) != undefined){
            socket.emit("data-error", {"msg" : "Está accediendo desde una ip diferente a la inicial"} );
          }
        }
        else{

          pool.getConnection(function(err, connection) {
          var conexion = connection;


        console.log("Ha pedido enlace" + data + socket.session.user);
        var bool = false;
        conexion.query(bloqueo_tablas,function(error, results, fields) {
          console.log(socket.session.user);
          console.log("Ha pedido enlace" + data + socket.session.user);

        var promise3 = new Promise(function(resolve, reject) {

          conexion.query("SELECT COUNT(*) AS total FROM Matriculados AS m1 WHERE usuario='"+socket.session.user+"' AND motivo='"+data+"'",function(error, existe_matriculados, fields) {
            if(existe_matriculados[0].total != 0){
              conexion.query("SELECT COUNT(*) AS total FROM (SELECT motivo FROM `Eliminar_servicio_usuario` as esu WHERE usuario='"+socket.session.user+"' AND motivo='"+data+"' UNION SELECT motivo FROM Eliminar_servicio as es WHERE motivo='"+data+"') AS alias",function(error, total, fields) {
                if(total[0].total == 0){
          conexion.query("SELECT COUNT(*) AS total FROM Asignaciones AS a1 WHERE usuario='"+socket.session.user+"'",function(error, row, fields) {
            conexion.query("SELECT COUNT(*) AS total FROM Asignaciones AS a1 WHERE usuario='"+socket.session.user+"' AND motivo='"+data+"'",function(error, motivototal, fields) {
                  conexion.query("SELECT COUNT(*) AS total FROM Pendientes AS p1 WHERE usuario='"+socket.session.user+"' AND motivo='"+data+"'",function(error, pendientes1, fields) {
                    console.log("Hay en pendiente del motivo " +pendientes1[0].total +" y en asignaciones " + motivototal[0].total);
                    if((pendientes1[0].total == 0) && (motivototal[0].total == 0)){

                        console.log("no esta en pendientes ni en asignaciones");
                        conexion.query("SELECT COUNT(*) AS total FROM Cola AS c1 WHERE usuario='"+socket.session.user+"'",function(error, total_cola, fields) {

                          var existiruser = total_cola[0].total; //cuantos en cola

                            conexion.query("SELECT COUNT(*) AS total FROM Pendientes AS p1 WHERE usuario='"+socket.session.user+"' AND tipo='up'",function(error, pendientes1total, fields) {

                                conexion.query("SELECT COUNT(*) AS total FROM Cola AS c1 WHERE usuario='"+socket.session.user+"' AND motivo='"+data+"'",function(error, cola_user, fields) {

                                  if(cola_user[0].total == 0){

                                    if((existiruser + row[0].total + pendientes1total[0].total)  < n){
                                      console.log("se inserta en la cola");
                                        conexion.query("INSERT INTO Cola (motivo, usuario) VALUES ('"+data+"','"+socket.session.user+"')",function(error, results, fields) {
                                          bool = true;
                                          resolve("se inserta");
                                        });
                                    }
                                    else{
                                      console.log("supera el numero de servidores");
                                      if(user_socket.get(socket.session.user) != undefined){
                                        socket.emit("data-error", {"msg" : "Supera el número máximo de servidores"} );
                                      }
                                      resolve("supera");
                                    }
                                  }


                                  else{
                                    console.log("ya esta en la cola");
                                    if(user_socket.get(socket.session.user) != undefined){
                                      socket.emit("data-error", {"msg" : "Ya está en el sistema"} );
                                    }
                                    resolve("ya esta");
                                  }

                                });
                            });

                        });
                  }
                  else{
                    console.log("pendientes fail o bbdd fail");
                    if(user_socket.get(socket.session.user) != undefined){
                      socket.emit("data-error", {"msg" : "Ya está en el sistema"} );
                    }
                    resolve("principal");
                  }

              });
              });
              });
            }
            else{
              console.log("Este servicio se está desmatriculando");
              if(user_socket.get(socket.session.user) != undefined){
                socket.emit("data-error", {"msg" : "Este servicio se está desmatriculando"} );
              }
              resolve("no matriculado");
            }
            });
            }
              else{
                console.log("No está matriculado de este servidor");
                if(user_socket.get(socket.session.user) != undefined){
                  socket.emit("data-error", {"msg" : "No está matriculado de este servidor"} );
                }
                resolve("no matriculado");
              }
            });


              }, function(err) {
                console.log(err);
              });

                promise3.then(function(result) {
                  console.log("comprobando bool");

                      if(bool == true){
                        console.log("bool es true");

                          var promise6 = new Promise(function(resolve, reject) {
                            conexion.query("SELECT COUNT(*) AS total FROM Asignaciones AS a1 WHERE usuario='"+socket.session.user+"'",function(error, row, fields) {

                              conexion.query("SELECT COUNT(*) AS total FROM Pendientes AS p1 WHERE usuario='"+socket.session.user+"'",function(error, pendientes1total, fields) {
                              if(((row[0].total + pendientes1total[0].total) > 0)){

                                  conexion.query("SELECT ip_vm FROM Pendientes AS p1 WHERE usuario='"+socket.session.user+"'",function(error, pip, fields) {

                                    var socket_vm=0;
                                    var ip =0;
                                    var promise4 = new Promise(function(resolve, reject) {
                                      if(pip.length == 0){
                                          conexion.query("SELECT ip_vm FROM Asignaciones AS a1 WHERE usuario='"+socket.session.user+"'",function(error, aip, fields) {
                                            ip = aip[0].ip_vm;
                                            resolve();
                                          });

                                      }
                                      else{
                                        ip = pip[0].ip_vm;
                                        resolve();

                                      }
                                    });

                                    promise4.then(function(result) {

                                      if(ip_vms.get(ip) == undefined){ //si la vm no esta disponible
                                        conexion.query("DELETE FROM Cola WHERE usuario='"+socket.session.user+"'",function(error, result, fields) {
                                          console.log("no se puede obtener enlace");
                                          if(user_socket.get(socket.session.user) != undefined){
                                            socket.emit("data-error", {"msg" : "No se puede obtener el servidor"} );
                                          }
                                          resolve();
                                        });
                                      }
                                      else{
                                        socket_vm = getsocketfromip(ip);
                                        conexion.query("SELECT motivo FROM Cola AS c1 WHERE usuario='"+socket.session.user+"'",function(error, cola_user_motivos, fields) {
                                          var servers = cola_user_motivos;
                                          var promise = new Promise(function(resolve, reject) {
                                            async.forEach(servers, function(item, callback) {
                                              var json = {"user" : socket.session.user, "motivo" : item.motivo};
                                            socket_vm.emit("load", json);
                                              console.log("enviado a su maquina");
                                                conexion.query("INSERT INTO Pendientes (ip_vm, motivo, usuario, tipo) VALUES ('"+ip+"', '"+item.motivo+"','"+socket.session.user+"', 'up')",function(error, results, fields) {
                                                  if(item == servers[servers.length-1]){
                                                    resolve("resolver");
                                                  }
                                                });

                                                }, function(err) {
                                                    if (err) console.log(err);}
                                              );
                                            });

                                            promise.then(function(result) {
                                                conexion.query("DELETE FROM Cola WHERE usuario='"+socket.session.user+"'");

                                              console.log(result);
                                              resolve();
                                            }, function(err) {
                                              console.log(err);
                                            });


                                        });
                                    }

                                },function(err){});


                                });

                              }
                              else{
                                console.log("todavia no tiene nada asignado");
                                resolve();
                              }
                              });
                            });

                            }, function(err) {
                                if (err) console.log(err);}
                          );





                          promise6.then(function(result) {

                              conexion.query("SELECT COUNT(*) AS total FROM Cola AS c1",function(error, cola_, fields) {
                                conexion.query("SELECT COUNT(*) AS total FROM VMS AS v1",function(error, vms_, fields) {

                                      if((vms_[0].total != 0)&&(cola_[0].total != 0)){
                                        var promise2 = new Promise(function(resolve, reject) {
                                        console.log("hay maquinas libres y algo en la cola");
                                          conexion.query("SELECT * FROM VMS AS v1 ORDER BY prioridad ASC LIMIT 1",function(error, cola_vm, fields) {
                                            conexion.query("SELECT * FROM Cola AS c1 LIMIT 1",function(error, cola_user, fields) {

                                              conexion.query("SELECT * FROM Cola AS c1 WHERE usuario='"+cola_user[0].usuario+"'",function(error, cola_user1, fields) {
                                                if(ip_vms.get(cola_vm[0].ip_vm) != undefined){
                                                  async.forEach(cola_user1, function(item, callback) {

                                                        conexion.query("INSERT INTO Pendientes (ip_vm, motivo, usuario, tipo) VALUES ('"+cola_vm[0].ip_vm+"', '"+item.motivo+"','"+cola_user[0].usuario+"', 'up')",function(error, results, fields) {
                                                          var json = {"user" : cola_user[0].usuario, "motivo" : item.motivo};
                                                          getsocketfromip(cola_vm[0].ip_vm).emit("load", json);

                                                          if(item == cola_user1[cola_user1.length-1]){
                                                            console.log("es el ultimo");
                                                            resolve("salir");
                                                          }
                                                        });


                                                      }, function(err) {
                                                          if (err) console.log(err);}
                                                    );
                                                  }
                                                  else{
                                                    resolve("false");
                                                  }

                                                });




                                            });

                                          });

                                        });



                                        promise2.then(function(result) {
                                          if(result != "false"){
                                          conexion.query("SELECT * FROM Cola AS c1 LIMIT 1",function(error, cola_user, fields) {
                                            conexion.query("SELECT * FROM VMS AS v1 ORDER BY prioridad ASC LIMIT 1",function(error, cola_vm, fields) {
                                            conexion.query("SELECT count(DISTINCT usuario) AS total FROM (SELECT DISTINCT usuario from Asignaciones as a1 WHERE ip_vm='"+cola_vm[0].ip_vm+"' UNION SELECT DISTINCT usuario FROM Pendientes as p1 WHERE ip_vm='"+cola_vm[0].ip_vm+"') AS tmp",function(error, numero_users_vm, fields) {
                                              console.log("tiene " + numero_users_vm[0].total + " usuarios la maquina virtual");
                                              if(numero_users_vm[0].total == config.numero_max_users){
                                              conexion.query("DELETE FROM VMS WHERE ip_vm='"+cola_vm[0].ip_vm+"'",function(error, cola_vm, fields) {
                                                  console.log("eliminado 1");
                                                    });
                                              }
                                              else{

                                                conexion.query("UPDATE VMS SET prioridad=0 WHERE ip_vm='"+cola_vm[0].ip_vm+"'",function(error, results, fields) {
                                                  console.log("actualizamos vm");
                                                });

                                              }

                                                  conexion.query("DELETE FROM Cola WHERE usuario='"+cola_user[0].usuario+"'",function(error, results, fields) {
                                                    console.log("enviado a vm");
                                                    conexion.query("UNLOCK TABLES",function(error, results, fields) {
                                                    conexion.release();
                                                    ovirt_vms();

                                                  });
                                                  });

                                              });

                                          });


                                        });
                                      }
                                      else{
                                        conexion.query("UNLOCK TABLES",function(error, results, fields) {
                                        conexion.release();
                                        //ovirt_vms();

                                      });
                                      }


                                        }, function(err) {
                                          console.log(err);
                                        });



                                        }
                                        else{
                                          conexion.query("UNLOCK TABLES",function(error, results, fields) {
                                          conexion.release();
                                          ovirt_vms();

                                        });
                                        }
                                      });
                                      });






                          }, function(err) {
                            console.log(err);
                          });


                        }
                          else{
                            console.log("bool es falso");
                            conexion.query("UNLOCK TABLES",function(error, results, fields) {
                            conexion.release();
                            ovirt_vms();

                          });
                          }

                        }, function(err) {
                          console.log(err);
                        });
                });
              });
          }
          }

    else{
      console.log("Acceso sin sesión de usuario");
      if(user_socket.get(socket.session.user) != undefined){
        socket.emit("data-error", {"msg" : "Accesso sin iniciar sesión"} );
      }
    }



  });



  });


 websocket_vms.on('connection', function (socket) {

   var ipvm = functions.cleanaddress(socket.handshake.address);
   console.log("Conexión de " +  socket.id + " Con ip " + ipvm);

   //ip_vms.set(ipvm, socket);
   if(ip_vms.get(ipvm) == undefined){
     ip_vms.set(ipvm, new Array());
   }
   var aux = ip_vms.get(ipvm);
   aux.push(socket);
   ip_vms.set(ipvm, aux);

   console.log("ip_vms tiene longitud > " + ip_vms.size);

   pool.getConnection(function(err, connection) {
   var conexion = connection;
   conexion.query(bloqueo_tablas,function(error, results, fields) {

     conexion.query("SELECT * FROM Ovirt_Pendientes as ovp WHERE ip_vm='"+ipvm+"'",function(error, existe_pendientes_ovirt, fields) {
       var bool = true;
    var promesaovirt = new Promise(function(resolve, reject) {
       if(existe_pendientes_ovirt.length != 0){
         if(existe_pendientes_ovirt[0].tipo == 'down'){
           bool = false;
           resolve();
         }
         else{
           conexion.query("DELETE FROM Ovirt_Pendientes WHERE ip_vm='"+ipvm+"'",function(error, results, fields) {
             resolve();
           });
         }

       }
       else{
         resolve();
       }
     });

       promesaovirt.then(function(result) {
         if(bool == true){
     conexion.query("SELECT COUNT(*) AS total FROM VMS as v1 WHERE ip_vm='"+ipvm+"'",function(error, existe, fields) {
       var promesaprimera = new Promise(function(resolve, reject) {
       if(existe[0].total == 0){
         conexion.query("SELECT count(DISTINCT usuario) AS total FROM (SELECT DISTINCT usuario from Asignaciones as a1 WHERE ip_vm='"+ipvm+"' UNION SELECT DISTINCT usuario FROM Pendientes as p1 WHERE ip_vm='"+ipvm+"') AS tmp",function(error, numero_users_vm, fields) {
           console.log("tiene " + numero_users_vm[0].total + " usuarios la maquina virtual");
           if(numero_users_vm[0].total == 0){
             connection.query("INSERT INTO VMS (prioridad, ip_vm) VALUES (1,'"+ipvm+"')", function(error, results, fields) {
               resolve();
             });
           }
           else if(numero_users_vm[0].total < config.numero_max_users){

             connection.query("INSERT INTO VMS (prioridad, ip_vm) VALUES (0,'"+ipvm+"')", function(error, results, fields) {
               resolve();
             });

           }
           else{
             resolve();
           }



           });
       }
       else{
         resolve();
       }
     });

        promesaprimera.then(function(result) {
         console.log("Una VM ha arrancado");
           conexion.query("SELECT COUNT(*) AS total FROM VMS as v1",function(error, vms_, fields) {
               conexion.query("SELECT COUNT(*) AS total FROM Cola as c1",function(error, total_cola, fields) {
                 console.log("tiene "+vms_[0].total+" "+total_cola[0].total);
                 if((vms_[0].total != 0)&&(total_cola[0].total != 0)){
                     conexion.query("SELECT * FROM Cola as c1 LIMIT 1",function(error, cola_user, fields) {
                       conexion.query("SELECT * FROM Cola as c1 WHERE usuario='"+cola_user[0].usuario+"'",function(error, cola_user1, fields) {
                           conexion.query("SELECT * FROM VMS as v1 ORDER BY prioridad ASC LIMIT 1",function(error, cola_vm, fields) {

                             if(ip_vms.get(cola_vm[0].ip_vm) != undefined){
                             var promise5 = new Promise(function(resolve, reject) {
                               async.forEach(cola_user1, function(item, callback) {

                                   conexion.query("INSERT INTO Pendientes (ip_vm, motivo, usuario, tipo) VALUES ('"+cola_vm[0].ip_vm+"', '"+item.motivo+"','"+cola_user[0].usuario+"', 'up')",function(error, results, fields) {
                                     var json = {"user" : cola_user[0].usuario, "motivo" : item.motivo};
                                     getsocketfromip(cola_vm[0].ip_vm).emit("load", json);
                                     if(item == cola_user1[cola_user1.length-1]){
                                       resolve();
                                     }
                                   });


                                 });



                                   }, function(err) {
                                       if (err) console.log(err);}
                                 );

                               promise5.then(function(result) {

                                     conexion.query("SELECT count(DISTINCT usuario) AS total FROM (SELECT DISTINCT usuario from Asignaciones as a1 WHERE ip_vm='"+cola_vm[0].ip_vm+"' UNION SELECT DISTINCT usuario FROM Pendientes as p1 WHERE ip_vm='"+cola_vm[0].ip_vm+"') AS tmp",function(error, numero_users_vm, fields) {
                                       console.log("tiene " + numero_users_vm[0].total + " usuarios la maquina virtual");
                                       if(numero_users_vm[0].total == config.numero_max_users){
                                       conexion.query("DELETE FROM VMS WHERE ip_vm='"+cola_vm[0].ip_vm+"'",function(error, cola_vm, fields) {

                                           conexion.query("DELETE FROM Cola WHERE usuario='"+cola_user[0].usuario+"'",function(error, results, fields) {
                                             console.log("enviado a vm");
                                             conexion.query("UNLOCK TABLES",function(error, results, fields) {
                                             conexion.release();

                                             vmfree();
                                             ovirt_vms();
                                           });
                                           });
                                             });
                                       }
                                       else{

                                         conexion.query("UPDATE VMS SET prioridad=0 WHERE ip_vm='"+cola_vm[0].ip_vm+"'",function(error, results, fields) {
                                           console.log("actualizamos vm");

                                           conexion.query("DELETE FROM Cola WHERE usuario='"+cola_user[0].usuario+"'",function(error, results, fields) {
                                             console.log("enviado a vm");
                                             conexion.query("UNLOCK TABLES",function(error, results, fields) {
                                             conexion.release();

                                             vmfree();
                                             ovirt_vms();
                                           });

                                           });
                                         });

                                       }



                                       });




                                   }, function(err) {
                                     console.log(err);
                                   });

                                 }
                                 else{
                                   conexion.query("UNLOCK TABLES",function(error, results, fields) {
                                   conexion.release();

                                   //ovirt_vms();
                                 });

                                 }

                                 });
                                 });
                                 });
                               }

                               else{
                                 conexion.query("UNLOCK TABLES",function(error, results, fields) {
                                 conexion.release();
                                 ovirt_vms();

                               });
                               }
                           });
                         });
                       });
                       });
                     }
                     else{
                    conexion.query("UNLOCK TABLES",function(error, results, fields) {
                       conexion.release();
                       ovirt_vms();
                     });
                     }
                     });
                     });
                   });
                   });





    socket.on('disconnect', function () {
      console.log('VM disconnected ' + ipvm);

        if(ip_vms.get(ipvm)!= undefined){
          if(ip_vms.get(ipvm).length != 0){
        ip_vms.get(ipvm)[0].disconnect();
        ip_vms.get(ipvm).shift();
        if(ip_vms.get(ipvm).length == 0){
          ip_vms.delete(ipvm);
          pool.getConnection(function(err, connection) {
          var conexion = connection;
          conexion.query(bloqueo_tablas,function(error, results, fields) {
          conexion.query("DELETE FROM VMS WHERE ip_vm='"+ipvm+"'",function(error, result, fields) {

            conexion.query("UNLOCK TABLES",function(error, results, fields) {
              console.log("liberando tablas");
            conexion.release();

          });
        });
      });
    });
        }
      }
    }
    comprobarservidor();

});




socket.on('loaded', function (data) {
  console.log("Che server loaded" + JSON.stringify(data));
  pool.getConnection(function(err, connection) {
  var conexion = connection;

  var promise = new Promise(function(resolve, reject) {
  conexion.query(bloqueo_tablas,function(error, results, fields) {
  conexion.query("SELECT * FROM Pendientes AS p1 WHERE ip_vm='"+ipvm+"' AND motivo='"+data.motivo+"' AND usuario='"+data.user+"'",function(error, pen, fields) {


      if(pen.length != 0){
          conexion.query("INSERT INTO Asignaciones (ip_vm, usuario, motivo, puerto) VALUES ('"+ipvm+"','"+pen[0].usuario+"','"+pen[0].motivo+"',"+data.puerto+")",function(error, results, fields) {
          //pendientes[i].client.emit("resultado", pendientes[i].motivo+" "+pendientes[i].vm+':'+arreglo[1] );

          console.log("es del usuario " + pen[0].usuario);
          conexion.query("SELECT COUNT(*) AS total FROM Asignaciones AS a1 WHERE usuario='"+pen[0].usuario+"'",function(error, row, fields) {
            conexion.query("SELECT ip_origen FROM Firewall AS f1 WHERE usuario='"+pen[0].usuario+"'",function(error, firewall1, fields) {
              if(error) console.log(error);

              if((row[0].total > 1) && (firewall1.length != 0)){ //Ya hay dentro

                var min = 0;
                var max = firewall1.length;

                var bucle = function(){
                  if(min < max){
                      broadcastservers("añadirsolo", {"ip_origen" : firewall1[min].ip_origen, "ipvm" : ipvm, "puerto" : data.puerto});
                      firewall.dnatae("añadirsolo", firewall1[min].ip_origen, ipvm, data.puerto, function(){
                        min++;
                        bucle();
                      });
                    }
                  else{
                    if(user_socket.get(pen[0].usuario) != undefined){
                      broadcastclient(pen[0].usuario, "resultado", {"motivo" : data.motivo} );
                    }
                    else{
                      broadcastservers("enviar-resultado", {"motivo" : data.motivo, "user" : data.user});
                    }
                    conexion.query("DELETE FROM Pendientes WHERE usuario='"+pen[0].usuario+"' AND motivo='"+pen[0].motivo+"' AND tipo='up'",function(error, results, fields) {
                      console.log("pendiente realizado");
                      resolve();
                    });
                  }

                }
                bucle();
              }
              else if((firewall1.length != 0)){ //es el primero
                console.log("firewall primero");

                var min = 0;
                var max = firewall1.length;

                var bucle = function(){
                  if(min < max){
                    broadcastservers("añadircomienzo", {"ip_origen" : firewall1[min].ip_origen, "ipvm" : ipvm, "puerto" : data.puerto});
                    firewall.dnatae("añadircomienzo", firewall1[min].ip_origen, ipvm, 0, function(){
                      broadcastservers("añadirsolo", {"ip_origen" : firewall1[min].ip_origen, "ipvm" : ipvm, "puerto" : data.puerto});
                      firewall.dnatae("añadirsolo", firewall1[min].ip_origen, ipvm, data.puerto, function(){
                        min++;
                        bucle();
                      });
                    });
                    }
                  else{
                    if(user_socket.get(pen[0].usuario) != undefined){
                      broadcastclient(pen[0].usuario, "resultado", {"motivo" : data.motivo} );
                    }
                    else{
                      broadcastservers("enviar-resultado", {"motivo" : data.motivo, "user" : data.user});
                    }
                    conexion.query("DELETE FROM Pendientes WHERE usuario='"+pen[0].usuario+"' AND motivo='"+pen[0].motivo+"' AND tipo='up'",function(error, results, fields) {
                      console.log("pendiente realizado");
                      resolve();
                    });
                  }

                }
                bucle();

              }
              else{
                conexion.query("DELETE FROM Pendientes WHERE usuario='"+pen[0].usuario+"' AND motivo='"+pen[0].motivo+"' AND tipo='up'",function(error, results, fields) {
                  console.log("pendiente realizado");
                  resolve();
                });
              }



          });
        });
      });
      }
      else{
        resolve();
      }

    });
    });
    });



    promise.then(function(result) {
      conexion.query("SELECT COUNT(*) AS total FROM (SELECT motivo FROM `Eliminar_servicio_usuario` as esu WHERE usuario='"+data.user+"' AND motivo='"+data.motivo+"' UNION SELECT motivo FROM Eliminar_servicio as es WHERE motivo='"+data.motivo+"') AS alias",function(error, total, fields) {
        if(total[0].total != 0){
          if(ip_vms.get(ipvm) != undefined){
            var socket_vm = getsocketfromip(ipvm);
            conexion.query("INSERT INTO Pendientes (ip_vm, motivo, usuario, tipo) VALUES ('"+ipvm+"', '"+data.motivo+"','"+data.user+"', 'down')",function(error, results2, fields) {
              var json = {"user" : data.user, "motivo" : data.motivo, "puerto" : data.puerto};
              socket_vm.emit("stop", json);
                console.log("enviado stop");
                conexion.query("UNLOCK TABLES",function(error, results, fields) {
                  console.log("liberando tablas");
                conexion.release();

              });
            });
          }
          else{
            conexion.query("UNLOCK TABLES",function(error, results, fields) {
              console.log("liberando tablas");
            conexion.release();

          });
          }
        }
        else{
          conexion.query("SELECT count(*) AS total FROM Eliminar_servicio as es WHERE motivo='"+data.motivo+"'",function(error, result, fields) {
            if(result[0].total != 0){
              if(ip_vms.get(ipvm) != undefined){
                var socket_vm = getsocketfromip(ipvm);
                conexion.query("INSERT INTO Pendientes (ip_vm, motivo, usuario, tipo) VALUES ('"+ipvm+"', '"+data.motivo+"','"+data.user+"', 'down')",function(error, results2, fields) {
                  var json = {"user" : data.user, "motivo" : data.motivo, "puerto" : data.puerto};
                  socket_vm.emit("stop", json);
                    console.log("enviado stop");
                    conexion.query("UNLOCK TABLES",function(error, results, fields) {
                      console.log("liberando tablas");
                    conexion.release();

                  });
                });
              }
              else{
                conexion.query("UNLOCK TABLES",function(error, results, fields) {
                  console.log("liberando tablas");
                conexion.release();

              });
              }

            }
            else{
              conexion.query("UNLOCK TABLES",function(error, results, fields) {
                console.log("liberando tablas");
              conexion.release();

            });
            }
          });
        }
      });



    }, function(err) {
      console.log(err);
    });
});

});



    socket.on('stopped', function (data) {
      console.log("Che server stopped" + JSON.stringify(data));
      pool.getConnection(function(err, connection) {
      var conexion = connection;
      conexion.query(bloqueo_tablas,function(error, results, fields) {
        conexion.query("SELECT * FROM Asignaciones AS a1 WHERE ip_vm='"+ipvm+"' AND motivo='"+data.motivo+"' AND usuario='"+data.user+"'",function(error, asignaciones, fields) {
          console.log("tamaño" + asignaciones.length);

            var promise = new Promise(function(resolve, reject) {
                if(asignaciones.length != 0){
                  conexion.query("DELETE FROM Asignaciones WHERE motivo='"+asignaciones[0].motivo+"' AND usuario='"+asignaciones[0].usuario+"'",function(error, results, fields) {
                      conexion.query("DELETE FROM Pendientes WHERE usuario='"+asignaciones[0].usuario+"' AND motivo='"+asignaciones[0].motivo+"' AND tipo='down'",function(error, results, fields) {
                        conexion.query("SELECT count(DISTINCT usuario) AS total FROM (SELECT DISTINCT usuario from Asignaciones as a1 WHERE ip_vm='"+asignaciones[0].ip_vm+"' UNION SELECT DISTINCT usuario FROM Pendientes as p1 WHERE ip_vm='"+asignaciones[0].ip_vm+"') AS tmp",function(error, numero_users_vm, fields) {
                          conexion.query("SELECT count(*) AS total FROM VMS AS v1 WHERE ip_vm='"+asignaciones[0].ip_vm+"'",function(error, existe_vm, fields) {
                            var promise2 = new Promise(function(resolve, reject) {
                              console.log("tiene " + numero_users_vm[0].total);
                              if(numero_users_vm[0].total == 0){
                                if(existe_vm[0].total != 0){
                                  console.log("liberando vm...");

                                conexion.query("UPDATE VMS SET prioridad=1 WHERE ip_vm='"+ipvm+"'",function(error, results, fields) {
                                  resolve();
                                });
                              }
                              else{
                                console.log("liberando vm...");

                              conexion.query("INSERT INTO VMS (prioridad, ip_vm) VALUES (1,'"+ipvm+"')",function(error, results, fields) {
                                resolve();
                              });
                              }
                              }
                              else if(numero_users_vm[0].total < config.numero_max_users){
                                if(existe_vm[0].total != 0){
                                console.log("actualizo vm");
                                conexion.query("UPDATE VMS SET prioridad=0 WHERE ip_vm='"+ipvm+"'",function(error, results, fields) {
                                  if(error) console.log(error);
                                  resolve();
                                });
                              }
                              else{
                                console.log("actualizo vm");
                                conexion.query("INSERT INTO VMS (prioridad, ip_vm) VALUES (0,'"+ipvm+"')",function(error, results, fields) {
                                  if(error) console.log(error);
                                  resolve();
                                });
                              }
                              }
                              else{
                                resolve();
                              }
                            });

                            promise2.then(function(result) {

                              conexion.query("SELECT COUNT(*) AS total FROM Asignaciones AS a1 WHERE usuario='"+asignaciones[0].usuario+"'",function(error, total_asignaciones_user, fields) {
                                conexion.query("SELECT ip_origen FROM Firewall AS f1 WHERE usuario='"+asignaciones[0].usuario+"'",function(error, firewall1, fields) {
                                  if(firewall1.length != 0){
                                    if(total_asignaciones_user[0].total != 0){

                                      var min = 0;
                                      var max = firewall1.length;

                                      var bucle = function(){
                                        if(min < max){
                                          broadcastservers("dnatae-eliminarsolo", {"ip_origen" : firewall1[min].ip_origen, "ipvm" : asignaciones[0].ip_vm, "puerto" : data.puerto});
                                          firewall.dnatae("eliminarsolo", firewall1[min].ip_origen, asignaciones[0].ip_vm, data.puerto, function(){
                                            min++;
                                            bucle();
                                          });

                                        }
                                        else{
                                          if(user_socket.get(asignaciones[0].usuario) != undefined){
                                            broadcastclient(asignaciones[0].usuario, "stop", {"motivo" : asignaciones[0].motivo});
                                          }
                                          else{
                                            broadcastservers("enviar-stop", {"user" : asignaciones[0].usuario, "motivo" : asignaciones[0].motivo});
                                          }
                                          resolve();
                                        }

                                      }
                                      bucle();
                                    }
                                    else{
                                      console.log("eliminar por completo");

                                      var min = 0;
                                      var max = firewall1.length;

                                      var bucle = function(){
                                        if(min < max){
                                          broadcastservers("deletednat", firewall1[min].ip_origen);
                                          firewall.deletednat(firewall1[min].ip_origen, function(){
                                            min++;
                                            bucle();
                                          });

                                        }
                                        else{
                                          if(user_socket.get(asignaciones[0].usuario) != undefined){
                                            broadcastclient(asignaciones[0].usuario, "stop", {"motivo" : asignaciones[0].motivo});
                                          }
                                          else{
                                            broadcastservers("enviar-stop", {"user" : asignaciones[0].usuario, "motivo" : asignaciones[0].motivo});
                                          }

                                          resolve();
                                        }

                                      }
                                      bucle();
                                    }
                                  }
                                  else{
                                    resolve();
                                  }

                                });
                              });

                            }, function(err) {
                              console.log(err);
                            });
                          });
                          });
                      });
                  });
                }
                else{
                  resolve();
                }
            });

            promise.then(function(result) {

              conexion.query("SELECT count(*) AS total FROM Eliminar_servicio as es WHERE motivo='"+data.motivo+"'",function(error, total, fields) {
                if(total[0].total != 0){

                  conexion.query("DELETE FROM Eliminar_servicio_usuario WHERE usuario='"+data.user+"' AND motivo='"+data.motivo+"'",function(error, result, fields) {
                    conexion.query("DELETE FROM Matriculados WHERE usuario='"+data.user+"' AND motivo='"+data.motivo+"'",function(error, result, fields) {
                      conexion.query("DELETE FROM Ultima_conexion WHERE usuario='"+data.user+"' AND motivo='"+data.motivo+"'",function(error, result, fields) {
                        conexion.query("SELECT count(*) AS total FROM Matriculados as m1 WHERE motivo='"+data.motivo+"'",function(error, result, fields) {
                          if(result[0].total == 0){
                            functions.eliminardirectoriotodo(data.motivo, function(){
                              pool.getConnection(function(err, connection) {
                                connection.query(bloqueo_tablas,function(error, results, fields) {
                                  connection.query("DELETE FROM Eliminar_servicio WHERE motivo='"+data.motivo+"'",function(error, result, fields) {
                                    connection.query("DELETE FROM Servicios WHERE motivo='"+data.motivo+"'",function(error, result, fields) {
                                      connection.query("UNLOCK TABLES",function(error, results, fields) {
                                        connection.release();
                                      });
                                    });
                                  });
                                });
                              });
                            });
                            conexion.query("UNLOCK TABLES",function(error, results, fields) {
                              console.log("liberando tablas");
                            conexion.release();

                            vmfree();
                            ovirt_vms();
                          });
                          }
                          else{
                            conexion.query("UNLOCK TABLES",function(error, results, fields) {
                              console.log("liberando tablas");
                            conexion.release();

                            vmfree();
                            ovirt_vms();
                          });
                          }
                        });
                      });
                    });
                  });

                }
                else{
                  conexion.query("SELECT COUNT(*) AS total FROM (SELECT motivo FROM `Eliminar_servicio_usuario` as esu WHERE usuario='"+data.user+"' AND motivo='"+data.motivo+"' UNION SELECT motivo FROM Eliminar_servicio as es WHERE motivo='"+data.motivo+"') AS alias",function(error, result, fields) {
                    if(result[0].total != 0){




                      functions.eliminardirectoriosolo(data.user, data.motivo, function(){
                        pool.getConnection(function(err, conexion) {
                          conexion.query(bloqueo_tablas,function(error, results, fields) {
                            conexion.query("SELECT count(*) AS total FROM Eliminar_servicio as es WHERE motivo='"+data.motivo+"'",function(error, result, fields) {
                              if(result[0].total == 0){
                                conexion.query("DELETE FROM Eliminar_servicio_usuario WHERE usuario='"+data.user+"' AND motivo='"+data.motivo+"'",function(error, result, fields) {
                                  conexion.query("DELETE FROM Matriculados WHERE usuario='"+data.user+"' AND motivo='"+data.motivo+"'",function(error, result, fields) {
                                    conexion.query("DELETE FROM Ultima_conexion WHERE usuario='"+data.user+"' AND motivo='"+data.motivo+"'",function(error, result, fields) {
                                      conexion.query("UNLOCK TABLES",function(error, results, fields) {
                                        conexion.release();
                                      });
                                    });
                                  });
                                });
                              }
                              else{
                                conexion.query("DELETE FROM Eliminar_servicio_usuario WHERE usuario='"+data.user+"' AND motivo='"+data.motivo+"'",function(error, result, fields) {
                                  conexion.query("DELETE FROM Matriculados WHERE usuario='"+data.user+"' AND motivo='"+data.motivo+"'",function(error, result, fields) {
                                    conexion.query("DELETE FROM Ultima_conexion WHERE usuario='"+aux+"' AND motivo='"+data.motivo+"'",function(error, result, fields) {
                                      conexion.query("SELECT count(*) AS total FROM Matriculados as m1 WHERE motivo='"+data.motivo+"'",function(error, result, fields) {
                                        if(result[0].total == 0){
                                          functions.eliminardirectoriotodo(req.body['nombreservicio'], function(){
                                            pool.getConnection(function(err, connection) {
                                              connection.query(bloqueo_tablas,function(error, results, fields) {
                                                connection.query("DELETE FROM Eliminar_servicio WHERE motivo='"+data.motivo+"'",function(error, result, fields) {
                                                  connection.query("DELETE FROM Servicios WHERE motivo='"+data.motivo+"'",function(error, result, fields) {
                                                    connection.query("UNLOCK TABLES",function(error, results, fields) {
                                                      connection.release();
                                                    });
                                                  });
                                                });
                                              });
                                            });
                                          });
                                          conexion.query("UNLOCK TABLES",function(error, results, fields) {
                                            conexion.release();
                                          });
                                        }
                                        else{
                                          conexion.query("UNLOCK TABLES",function(error, results, fields) {
                                            conexion.release();
                                          });
                                        }
                                      });
                                    });
                                  });
                                });
                              }
                          });
                        });
                      });
                    });

                    conexion.query("UNLOCK TABLES",function(error, results, fields) {
                      console.log("liberando tablas");
                    conexion.release();

                    vmfree();
                    ovirt_vms();
                  });


                    }
                    else{
                      conexion.query("UNLOCK TABLES",function(error, results, fields) {
                        console.log("liberando tablas");
                      conexion.release();

                      vmfree();
                      ovirt_vms();
                    });
                    }
                  });
                }
              });







            }, function(err) {
              console.log(err);
            });
          });
        });
    });
      });
    });


////////////////////////////////////////


/// RUTAS WEB ////////////////////////////


app.get('/', function(req,res){
var ip_origen = functions.cleanaddress(req.connection.remoteAddress);
  if(req.session.user == undefined){
    broadcastservers('deletednat', ip_origen);
    firewall.deletednat(ip_origen, function(){
      pool.getConnection(function(err, connection) {
      var conexion = connection;
      conexion.query("DELETE FROM Firewall WHERE ip_origen='"+functions.cleanaddress(req.connection.remoteAddress)+"'",function(error, results, fields) {
        conexion.release();
        res.render('index', {});
      });
    });
  });
  }
  else{
    if(ip_origen != req.session.ip_origen){ //si la ip con la que se logueo es diferente a la que tiene ahora mismo la sesion
      res.redirect('/logout');
    }
    else{
    res.redirect('/controlpanel');
  }
  }

});

app.get('/controlpanel', function(req,res){
  var ip_origen = functions.cleanaddress(req.connection.remoteAddress);
if(req.session.user != undefined){
  if(ip_origen != req.session.ip_origen){ //si la ip con la que se logueo es diferente a la que tiene ahora mismo la sesion
    res.redirect('/logout');
  }
  else{
  console.log(req.session.user);
  if(req.session.rol == "profesor"){
    pool.getConnection(function(err, connection) {
    var conexion = connection;
    conexion.query("SELECT * FROM Matriculados NATURAL JOIN Asignaciones WHERE usuario='"+req.session.user+"' AND motivo NOT IN ( SELECT motivo FROM Pendientes WHERE tipo='down' AND usuario='"+req.session.user+"')",function(error, upped, fields) {
      conexion.query("SELECT * FROM Matriculados NATURAL JOIN Asignaciones NATURAL JOIN Pendientes WHERE usuario='"+req.session.user+"'",function(error, dowing, fields) {
        conexion.query("SELECT usuario, motivo FROM Matriculados NATURAL JOIN Pendientes WHERE usuario='"+req.session.user+"' AND tipo='up' UNION ALL SELECT usuario, motivo FROM Matriculados NATURAL JOIN Cola WHERE usuario='"+req.session.user+"'",function(error, upping, fields) {
          conexion.query("SELECT * FROM Matriculados WHERE usuario='"+req.session.user+"' AND motivo NOT IN (SELECT motivo FROM Pendientes WHERE usuario='"+req.session.user+"' UNION SELECT motivo FROM Asignaciones WHERE usuario='"+req.session.user+"' UNION SELECT motivo FROM Cola WHERE usuario='"+req.session.user+"')",function(error, rest, fields) {
            conexion.query("SELECT motivo FROM Servicios WHERE usuario='"+req.session.user+"' AND motivo NOT IN (SELECT motivo FROM Eliminar_servicio)",function(error, motivos, fields) {
              var tservicios = [];
              var max = motivos.length;
              var min = 0;

              var bucle = function(){
                if(min < max){
                  conexion.query("SELECT * FROM Matriculados NATURAL JOIN Ultima_conexion WHERE motivo='"+motivos[min].motivo+"' AND usuario NOT IN ( SELECT usuario FROM Eliminar_servicio_usuario WHERE motivo='"+motivos[min].motivo+"')",function(error, result, fields) {
                    conexion.query("SELECT usuario FROM Asignaciones WHERE motivo='"+motivos[min].motivo+"'",function(error, result2, fields) {
                      var set = new Set();
                      var usuarios = [];
                      for(var j=0; j<result2.length; j++){
                        set.add(result2[j].usuario);
                      }
                      for(var i=0; i<result.length; i++){
                        if(set.has(result[i].usuario)){
                          var a = {"usuario":result[i].usuario, "estado":"up", "fecha" : result[i].fecha}
                          usuarios.push(a);
                        }
                        else{
                          var a = {"usuario":result[i].usuario, "estado":"down", "fecha" : result[i].fecha}
                          usuarios.push(a);
                        }
                      }
                      var aux = {"motivo" : motivos[min].motivo, "usuarios" : usuarios};
                      tservicios.push(aux);
                      min++;
                      bucle();
                    });
                  });
                }
                else{
                  conexion.release();
                  res.render('controlpanelprofesor', {ip_server_che: config.ip_server_exterior, user : req.session.user, encendidos : upped, apagandose : dowing, encendiendose : upping, resto : rest, servicios : tservicios});
                }
              }

              bucle();
            });
          });
        });
      });
    });
  });
  }
  else{
    pool.getConnection(function(err, connection) {
    var conexion = connection;
    conexion.query("SELECT * FROM Matriculados NATURAL JOIN Asignaciones WHERE usuario='"+req.session.user+"' AND motivo NOT IN ( SELECT motivo FROM Pendientes WHERE tipo='down' AND usuario='"+req.session.user+"')",function(error, upped, fields) {
      conexion.query("SELECT * FROM Matriculados NATURAL JOIN Asignaciones NATURAL JOIN Pendientes WHERE usuario='"+req.session.user+"'",function(error, dowing, fields) {
        conexion.query("SELECT usuario, motivo FROM Matriculados NATURAL JOIN Pendientes WHERE usuario='"+req.session.user+"' AND tipo='up' UNION ALL SELECT usuario, motivo FROM Matriculados NATURAL JOIN Cola WHERE usuario='"+req.session.user+"'",function(error, upping, fields) {
          conexion.query("SELECT * FROM Matriculados WHERE usuario='"+req.session.user+"' AND motivo NOT IN (SELECT motivo FROM Pendientes WHERE usuario='"+req.session.user+"' UNION SELECT motivo FROM Asignaciones WHERE usuario='"+req.session.user+"' UNION SELECT motivo FROM Cola WHERE usuario='"+req.session.user+"')",function(error, rest, fields) {
            conexion.release();
            res.render('controlpanelalumno', {ip_server_che: config.ip_server_exterior, user : req.session.user, encendidos : upped, apagandose : dowing, encendiendose : upping, resto : rest});
          });
        });
      });
    });
  });
  }
}
}
else{
res.redirect('/');
}
});

app.get('/cloud/:motivo', function(req,res){
  var ip_origen = functions.cleanaddress(req.connection.remoteAddress);
  if(req.session.user != undefined){
    if(ip_origen != req.session.ip_origen){ //si la ip con la que se logueo es diferente a la que tiene ahora mismo la sesion
      res.redirect('/logout');
    }
    else{
    pool.getConnection(function(err, connection) {
      var conexion = connection;
      conexion.query("SELECT * FROM Asignaciones WHERE usuario='"+req.session.user+"' AND motivo='"+req.params.motivo+"'", function(err, row) {
        if (err) throw err;
        conexion.release();
        if(row.length != 0){
          conexion.query("UPDATE Ultima_conexion SET fecha='"+functions.dateFormat()+"' WHERE usuario='"+req.session.user+"' AND motivo='"+req.params.motivo+"'",function(error, result, fields) {
            res.render('cloud', {user : req.session.user, motivo : req.params.motivo, ip_server_che : config.ip_server_exterior, port_server_che : row[0].puerto});
          });
        }
        else{
          res.render('error', {});
        }
      });
  });
}
  }
  else{
    res.redirect('/');
  }

});

app.get('/autenticacion', cas.bounce, function(req,res){
var ip_origen = functions.cleanaddress(req.connection.remoteAddress);

  if(req.session.user != undefined){
    if(ip_origen != req.session.ip_origen){ //si la ip con la que se logueo es diferente a la que tiene ahora mismo la sesion
      res.redirect('/logout');
    }
    else{
      res.redirect('/');
    }
  }
    else{

//borrar iptables de esta ip por si acaso
      broadcastservers('deletednat', ip_origen);
      firewall.deletednat(ip_origen, function(){
      pool.getConnection(function(err, connection) {
        var conexion = connection;
        conexion.query("DELETE FROM Firewall WHERE ip_origen='"+ip_origen+"'",function(error, results, fields) {


          req.session.user = req.session["cas_userinfo"].username;

  //req.session.user = req.session["cas_userinfo"].username;
  req.session.ip_origen = ip_origen;
  if(regexp.test(req.session.user) == true){
    req.session.rol = "alumno";
  }
  else{
    req.session.rol = "profesor";
  }

    conexion.query("INSERT INTO Firewall (usuario, ip_origen) VALUES ('"+req.session.user+"','"+ip_origen+"')",function(error, results, fields) {

      //Actualizamos iptables
      conexion.query("SELECT ip_vm, puerto FROM Asignaciones WHERE usuario='"+req.session.user+"'", function(err,row){

        conexion.release();

        if(err) console.log(err);

        var min = 0;
        var max = row.length;

        var bucle = function(){
          if(min < max){
            if(min == 0){
              broadcastservers("añadircomienzo", ip_origen +" "+ row[min].ip_vm +" "+ row[min].puerto)
              firewall.dnatae("añadircomienzo", ip_origen, row[min].ip_vm, 0, function(){
                broadcastservers("añadirsolo", ip_origen +" "+ row[min].ip_vm +" "+ row[min].puerto);
                firewall.dnatae("añadirsolo", ip_origen, row[min].ip_vm, row[min].puerto, function(){
                  min++;
                  bucle();
                });
              });
            }
            else{
              broadcastservers("añadirsolo", ip_origen +" "+ row[min].ip_vm +" "+ row[min].puerto);
              firewall.dnatae("añadirsolo", ip_origen, row[min].ip_vm, row[min].puerto, function(){
                min++;
                bucle();
              });
            }

          }
          else{
            setTimeout(function(){
              res.redirect('/controlpanel');
  	        }, 3000);
          }

        }

        bucle();

      });
  });
});
});
});
}
});


app.get('/logout',cas.logout, function(req,res){

  var ip_origen = functions.cleanaddress(req.connection.remoteAddress);

  firewall.tcpkillestablished(ip_origen);

    var user = req.session.user;

    req.session.user = undefined;
    req.session.ip_origen = undefined;
    req.session.destroy();




    broadcastservers('deletednat', ip_origen);
    firewall.deletednat(ip_origen, function(){
      pool.getConnection(function(err, connection) {
        var conexion = connection;
        conexion.query("DELETE FROM Firewall WHERE ip_origen='"+ip_origen+"'",function(error, results, fields) {
          conexion.release();
          setTimeout(function(){
            if(user_socket.get(user) != undefined){
              broadcastclient(user, "reload","");
            }
            res.redirect('/');
          },4000);

        });
      });
    });



})

app.get('/comprobardisponibilidad', function(req,res){
  if(req.session.user != undefined){
    if(req.session.rol == "profesor"){
        pool.getConnection(function(err, connection) {
          var conexion = connection;
          conexion.query("SELECT count(*) AS total FROM Servicios WHERE motivo='"+req.query.nombre+"'",function(error, total, fields) {
              conexion.release();
              var datos = {};
              if(total[0].total == 0){
                  datos = {"valido" : true};
                }else{
                  datos = {"valido" : false};
                }
              res.send(datos);
            });
      });
    }else{
      res.send("no disponible");
    }
  }
  else{
    res.send("no disponible");
  }

})

var quitardominio = new RegExp(/\w*/);

app.post('/nuevoservicio', function(req,res){
  if(req.session.user != undefined){
    if(req.session.rol == "profesor"){
      req.body['nombreservicio'] = functions.getCleanedString(req.body['nombreservicio']);
      pool.getConnection(function(err, connection) {
        connection.query(bloqueo_tablas,function(error, results, fields) {
          connection.query("SELECT count(*) AS total FROM Servicios as s1 WHERE motivo='"+req.body['nombreservicio']+"'",function(error, total, fields) {
            if(total[0].total == 0){
              connection.query("INSERT INTO Servicios (usuario, motivo) VALUES ('"+req.session.user+"','"+req.body['nombreservicio']+"')",function(error, result, fields) {
                var valores = req.body['usuario'];
                if(valores != undefined){
                  if(valores instanceof Array){
                    async.forEach(valores, function(item, callback) {
                      var aux = item.match(quitardominio);
                      connection.query("INSERT INTO Matriculados (usuario, motivo) SELECT '"+aux+"','"+req.body['nombreservicio']+"' FROM dual WHERE NOT EXISTS ( SELECT * FROM Matriculados as m1 WHERE usuario='"+aux+"' AND motivo='"+req.body['nombreservicio']+"')",function(error, result, fields) {
                        connection.query("INSERT INTO Ultima_conexion (usuario, motivo) SELECT '"+aux+"','"+req.body['nombreservicio']+"' FROM dual WHERE NOT EXISTS ( SELECT * FROM Ultima_conexion as uc WHERE usuario='"+aux+"' AND motivo='"+req.body['nombreservicio']+"')",function(error, result, fields) {
                          if(item == valores[valores.length-1]){
                            connection.query("UNLOCK TABLES",function(error, results, fields) {
                                console.log("liberando tablas");
                              connection.release();
                              res.redirect('/controlpanel');
                            });
                          }
                        });
                      });
                    });

                  }
                  else{
                    var aux = valores.match(quitardominio);
                    connection.query("INSERT INTO Matriculados (usuario, motivo) SELECT '"+aux+"','"+req.body['nombreservicio']+"' FROM dual WHERE NOT EXISTS ( SELECT * FROM Matriculados as m1 WHERE usuario='"+aux+"' AND motivo='"+req.body['nombreservicio']+"')",function(error, result, fields) {
                      connection.query("INSERT INTO Ultima_conexion (usuario, motivo) SELECT '"+aux+"','"+req.body['nombreservicio']+"' FROM dual WHERE NOT EXISTS ( SELECT * FROM Ultima_conexion as uc WHERE usuario='"+aux+"' AND motivo='"+req.body['nombreservicio']+"')",function(error, result, fields) {
                        connection.query("UNLOCK TABLES",function(error, results, fields) {
                            console.log("liberando tablas");
                          connection.release();
                          res.redirect('/controlpanel');
                        });
                      });
                    });
                  }
                }
                else{
                  connection.query("UNLOCK TABLES",function(error, results, fields) {
                      console.log("liberando tablas");
                    connection.release();
                    res.redirect('/controlpanel');
                  });
                }
              });
            }
            else{
              connection.query("UNLOCK TABLES",function(error, results, fields) {
                  console.log("liberando tablas");
                connection.release();
                res.redirect('/controlpanel');
              });
            }
          });
        });
      });
      }
    }
});




app.post('/eliminarservicio', function(req,res){
  if(req.session.user != undefined){
    if(req.session.rol == "profesor"){
      pool.getConnection(function(err, connection) {
        connection.query(bloqueo_tablas,function(error, results, fields) {
          connection.query("SELECT count(*) AS total FROM Servicios as s1 WHERE motivo='"+req.body['nombreservicio']+"' AND usuario='"+req.session.user+"'",function(error, total, fields) {
            if(total[0].total == 1){
              connection.query("SELECT count(*) AS total FROM Eliminar_servicio as es WHERE motivo='"+req.body['nombreservicio']+"'",function(error, total, fields) {
                if(total[0].total == 0){
                  connection.query("INSERT INTO Eliminar_servicio (motivo) VALUES ('"+req.body['nombreservicio']+"')",function(error, result, fields) {
                    connection.query("SELECT usuario FROM Matriculados as m1 WHERE motivo='"+req.body['nombreservicio']+"' AND usuario NOT IN (SELECT usuario FROM Eliminar_servicio_usuario WHERE motivo='"+req.body['nombreservicio']+"')",function(error, matriculados, fields) {
                      var max = matriculados.length;
                      var min = 0;

                      var bucle = function(){

                        if(min < max){


                          var aux = matriculados[min].usuario;
                                connection.query("SELECT count(*) AS total FROM Pendientes as p1 WHERE motivo='"+req.body['nombreservicio']+"' AND usuario='"+aux+"'",function(error, total, fields) {
                                  if(total[0].total == 0){
                                    connection.query("DELETE FROM Cola WHERE usuario='"+aux+"' AND motivo='"+req.body['nombreservicio']+"'",function(error, result, fields) { //por si acaso
                                    connection.query("SELECT * FROM Asignaciones as a1 WHERE motivo='"+req.body['nombreservicio']+"' AND usuario='"+aux+"'",function(error, estaasignado, fields) {
                                      if(estaasignado.length == 0){//si no está encendido

                                                  connection.query("DELETE FROM Eliminar_servicio_usuario WHERE usuario='"+aux+"' AND motivo='"+req.body['nombreservicio']+"'",function(error, result, fields) {
                                                    connection.query("DELETE FROM Matriculados WHERE usuario='"+aux+"' AND motivo='"+req.body['nombreservicio']+"'",function(error, result, fields) {
                                                      connection.query("DELETE FROM Ultima_conexion WHERE usuario='"+aux+"' AND motivo='"+req.body['nombreservicio']+"'",function(error, result, fields) {
                                                        connection.query("SELECT count(*) AS total FROM Matriculados as m1 WHERE motivo='"+req.body['nombreservicio']+"'",function(error, result, fields) {
                                                          if(result[0].total == 0){
                                                            functions.eliminardirectoriotodo(req.body['nombreservicio'], function(){
                                                              pool.getConnection(function(err, connection) {
                                                                connection.query(bloqueo_tablas,function(error, results, fields) {
                                                                  connection.query("DELETE FROM Eliminar_servicio WHERE motivo='"+req.body['nombreservicio']+"'",function(error, result, fields) {
                                                                    connection.query("DELETE FROM Servicios WHERE motivo='"+req.body['nombreservicio']+"'",function(error, result, fields) {
                                                                      connection.query("UNLOCK TABLES",function(error, results, fields) {
                                                                        connection.release();
                                                                      });
                                                                    });
                                                                  });
                                                                });
                                                              });
                                                            });
                                                            min++;
                                                            bucle();
                                                          }
                                                          else{
                                                            min++;
                                                            bucle();
                                                          }
                                                        });
                                                      });
                                                    });
                                                  });



                                      }
                                      else{ // si está encendido mandamos a apagar
                                        if(ip_vms.get(estaasignado[0].ip_vm) != undefined){
                                          var socket_vm = getsocketfromip(estaasignado[0].ip_vm);
                                          connection.query("INSERT INTO Pendientes (ip_vm, motivo, usuario, tipo) VALUES ('"+estaasignado[0].ip_vm+"', '"+estaasignado[0].motivo+"','"+aux+"', 'down')",function(error, results2, fields) {
                                            var json = {"user" : aux, "motivo" : estaasignado[0].motivo, "puerto" : estaasignado[0].puerto};
                                            socket_vm.emit("stop", json);
                                              console.log("enviado stop");
                                              min++;
                                              bucle();
                                          });
                                        }
                                        else{
                                          min++;
                                          bucle();
                                        }
                                      }
                                    });
                                  });
                                  }
                                  else{
                                    min++;
                                    bucle();
                                  }
                                });

                        }
                        else{
                          connection.query("SELECT count(*) AS total FROM Matriculados as m1 WHERE motivo='"+req.body['nombreservicio']+"'",function(error, result, fields) {
                            if(result[0].total == 0){
                              connection.query("DELETE FROM Eliminar_servicio WHERE motivo='"+req.body['nombreservicio']+"'",function(error, result, fields) {
                                connection.query("DELETE FROM Servicios WHERE motivo='"+req.body['nombreservicio']+"'",function(error, result, fields) {
                                  connection.query("UNLOCK TABLES",function(error, results, fields) {
                                    connection.release();
                                    res.redirect('/controlpanel');
                                  });
                                });
                              });
                            }
                            else{
                              connection.query("UNLOCK TABLES",function(error, results, fields) {
                                connection.release();
                                res.redirect('/controlpanel');
                              });
                            }
                          });

                        }

                      }

                      bucle();

                    });
                  });
                }
                else{
                  connection.query("UNLOCK TABLES",function(error, results, fields) {
                      console.log("liberando tablas");
                    connection.release();
                    res.redirect('/controlpanel');
                  });
                }
              });
            }
            else{
              connection.query("UNLOCK TABLES",function(error, results, fields) {
                  console.log("liberando tablas");
                connection.release();
                res.redirect('/controlpanel');
              });
            }
          });
        });
      });
    }
  }
});




app.post('/aniadirusuarios', function(req,res){
  if(req.session.user != undefined){
    if(req.session.rol == "profesor"){
      pool.getConnection(function(err, connection) {
        connection.query(bloqueo_tablas,function(error, results, fields) {
          connection.query("SELECT count(*) AS total FROM Servicios as s1 WHERE motivo='"+req.body['nombreservicio']+"' AND usuario='"+req.session.user+"'",function(error, total, fields) {
            if(total[0].total == 1){
              connection.query("SELECT count(*) AS total FROM Eliminar_servicio as es WHERE motivo='"+req.body['nombreservicio']+"'",function(error, result, fields) {
                if(result[0].total == 0){
                var valores = req.body['usuario'];
                if(valores != undefined){
                  if(valores instanceof Array){
                    async.forEach(valores, function(item, callback) {
                      var aux = item.match(quitardominio);
                      connection.query("SELECT count(*) AS total FROM Eliminar_servicio_usuario as esu WHERE motivo='"+req.body['nombreservicio']+"' AND usuario='"+aux+"'",function(error, total, fields) {
                        if(total[0].total == 0){
                          connection.query("INSERT INTO Matriculados (usuario, motivo) SELECT '"+aux+"','"+req.body['nombreservicio']+"' FROM dual WHERE NOT EXISTS ( SELECT * FROM Matriculados as m1 WHERE usuario='"+aux+"' AND motivo='"+req.body['nombreservicio']+"')",function(error, result, fields) {
                            connection.query("INSERT INTO Ultima_conexion (usuario, motivo) SELECT '"+aux+"','"+req.body['nombreservicio']+"' FROM dual WHERE NOT EXISTS ( SELECT * FROM Ultima_conexion as uc WHERE usuario='"+aux+"' AND motivo='"+req.body['nombreservicio']+"')",function(error, result, fields) {
                                connection.query("DELETE FROM Eliminar_servicio_usuario WHERE usuario='"+aux+"' AND motivo='"+req.body['nombreservicio']+"'",function(error, result, fields) {
                                if(item == valores[valores.length-1]){
                                  connection.query("UNLOCK TABLES",function(error, results, fields) {
                                      console.log("liberando tablas");
                                    connection.release();
                                    res.redirect('/controlpanel');
                                  });
                                }
                              });
                            });
                          });
                        }
                        else{
                          if(item == valores[valores.length-1]){
                            connection.query("UNLOCK TABLES",function(error, results, fields) {
                                console.log("liberando tablas");
                              connection.release();
                              res.redirect('/controlpanel');
                            });
                          }
                        }
                      });
                    });

                  }
                  else{
                    var aux = valores.match(quitardominio);
                    connection.query("SELECT count(*) AS total FROM Eliminar_servicio_usuario as esu WHERE motivo='"+req.body['nombreservicio']+"' AND usuario='"+aux+"'",function(error, total, fields) {
                      if(total[0].total == 0){
                        connection.query("INSERT INTO Matriculados (usuario, motivo) SELECT '"+aux+"','"+req.body['nombreservicio']+"' FROM dual WHERE NOT EXISTS ( SELECT * FROM Matriculados as m1 WHERE usuario='"+aux+"' AND motivo='"+req.body['nombreservicio']+"')",function(error, result, fields) {
                          connection.query("INSERT INTO Ultima_conexion (usuario, motivo) SELECT '"+aux+"','"+req.body['nombreservicio']+"' FROM dual WHERE NOT EXISTS ( SELECT * FROM Ultima_conexion as uc WHERE usuario='"+aux+"' AND motivo='"+req.body['nombreservicio']+"')",function(error, result, fields) {
                            connection.query("DELETE FROM Eliminar_servicio_usuario WHERE usuario='"+aux+"' AND motivo='"+req.body['nombreservicio']+"'",function(error, result, fields) {
                              connection.query("UNLOCK TABLES",function(error, results, fields) {
                                  console.log("liberando tablas");
                                connection.release();
                                res.redirect('/controlpanel');
                              });
                            });
                          });
                        });
                      }
                      else{
                        connection.query("UNLOCK TABLES",function(error, results, fields) {
                            console.log("liberando tablas");
                          connection.release();
                          res.redirect('/controlpanel');
                        });
                      }
                    });
                  }
                }
                else{
                  console.log("ERROR -> No se han enviado usuarios");
                  connection.query("UNLOCK TABLES",function(error, results, fields) {
                      console.log("liberando tablas");
                    connection.release();
                    res.redirect('/controlpanel');
                  });
                }
              }
              else{
                console.log("ERROR -> ya se esta eliminando");
                connection.query("UNLOCK TABLES",function(error, results, fields) {
                    console.log("liberando tablas");
                  connection.release();
                  res.redirect('/controlpanel');
                });
              }
              });
            }
            else{
              console.log("ERROR -> no existe en servicios");
              connection.query("UNLOCK TABLES",function(error, results, fields) {
                  console.log("liberando tablas");
                connection.release();
                res.redirect('/controlpanel');
              });
            }
          });
        });
      });
      }
    }
});


app.post('/eliminarusuarios', function(req,res){
  if(req.session.user != undefined){
    if(req.session.rol == "profesor"){
      pool.getConnection(function(err, connection) {
        connection.query(bloqueo_tablas,function(error, results, fields) {
          connection.query("SELECT count(*) AS total FROM Servicios as s1 WHERE motivo='"+req.body['nombreservicio']+"' AND usuario='"+req.session.user+"'",function(error, total, fields) {
            if(total[0].total == 1){
              connection.query("SELECT count(*) AS total FROM Eliminar_servicio as es WHERE motivo='"+req.body['nombreservicio']+"'",function(error, result, fields) {
                if(result[0].total == 0){
                var valores = req.body['usuario'];
                if(valores != undefined){
                  if(valores instanceof Array){
                    var max = valores.length;
                    var min = 0;

                    var bucle = function(){
                      if(min < max){


                        var aux = valores[min];
                        connection.query("SELECT count(*) AS total FROM Matriculados as m1 WHERE motivo='"+req.body['nombreservicio']+"' AND usuario='"+aux+"'",function(error, total, fields) {
                          if(total[0].total == 1){
                            connection.query("SELECT count(*) AS total FROM Eliminar_servicio_usuario as esu WHERE motivo='"+req.body['nombreservicio']+"' AND usuario='"+aux+"'",function(error, total, fields) {
                              if(total[0].total == 0){
                            connection.query("INSERT INTO Eliminar_servicio_usuario (usuario, motivo) SELECT '"+aux+"','"+req.body['nombreservicio']+"' FROM dual WHERE NOT EXISTS ( SELECT * FROM Eliminar_servicio_usuario as esu WHERE usuario='"+aux+"' AND motivo='"+req.body['nombreservicio']+"')",function(error, result, fields) {
                              connection.query("SELECT count(*) AS total FROM Pendientes as p1 WHERE motivo='"+req.body['nombreservicio']+"' AND usuario='"+aux+"'",function(error, total, fields) {
                                if(total[0].total == 0){
                                  connection.query("DELETE FROM Cola WHERE usuario='"+aux+"' AND motivo='"+req.body['nombreservicio']+"'",function(error, result, fields) { //por si acaso
                                  connection.query("SELECT * FROM Asignaciones as a1 WHERE motivo='"+req.body['nombreservicio']+"' AND usuario='"+aux+"'",function(error, estaasignado, fields) {
                                    if(estaasignado.length == 0){//si no está encendido
                                      functions.eliminardirectoriosolo(aux, req.body['nombreservicio'], function(){
                                        pool.getConnection(function(err, conexion) {
                                          conexion.query(bloqueo_tablas,function(error, results, fields) {
                                            conexion.query("SELECT count(*) AS total FROM Eliminar_servicio as es WHERE motivo='"+req.body['nombreservicio']+"'",function(error, result, fields) {
                                              if(result[0].total == 0){
                                                conexion.query("DELETE FROM Eliminar_servicio_usuario WHERE usuario='"+aux+"' AND motivo='"+req.body['nombreservicio']+"'",function(error, result, fields) {
                                                  conexion.query("DELETE FROM Matriculados WHERE usuario='"+aux+"' AND motivo='"+req.body['nombreservicio']+"'",function(error, result, fields) {
                                                    conexion.query("DELETE FROM Ultima_conexion WHERE usuario='"+aux+"' AND motivo='"+req.body['nombreservicio']+"'",function(error, result, fields) {
                                                      conexion.query("UNLOCK TABLES",function(error, results, fields) {
                                                        conexion.release();
                                                      });
                                                    });
                                                  });
                                                });
                                              }
                                              else{
                                                conexion.query("DELETE FROM Eliminar_servicio_usuario WHERE usuario='"+aux+"' AND motivo='"+req.body['nombreservicio']+"'",function(error, result, fields) {
                                                  conexion.query("DELETE FROM Matriculados WHERE usuario='"+aux+"' AND motivo='"+req.body['nombreservicio']+"'",function(error, result, fields) {
                                                    conexion.query("SELECT count(*) AS total FROM Matriculados as m1 WHERE motivo='"+req.body['nombreservicio']+"'",function(error, result, fields) {
                                                      conexion.query("DELETE FROM Ultima_conexion WHERE usuario='"+aux+"' AND motivo='"+req.body['nombreservicio']+"'",function(error, result, fields) {
                                                        if(result[0].total == 0){
                                                          functions.eliminardirectoriotodo(req.body['nombreservicio'], function(){
                                                            pool.getConnection(function(err, connection) {
                                                              connection.query(bloqueo_tablas,function(error, results, fields) {
                                                                connection.query("DELETE FROM Eliminar_servicio WHERE motivo='"+req.body['nombreservicio']+"'",function(error, result, fields) {
                                                                  connection.query("DELETE FROM Servicios WHERE motivo='"+req.body['nombreservicio']+"'",function(error, result, fields) {
                                                                    connection.query("UNLOCK TABLES",function(error, results, fields) {
                                                                      connection.release();
                                                                    });
                                                                  });
                                                                });
                                                              });
                                                            });
                                                          });
                                                          conexion.query("UNLOCK TABLES",function(error, results, fields) {
                                                            conexion.release();
                                                          });
                                                        }
                                                        else{
                                                          conexion.query("UNLOCK TABLES",function(error, results, fields) {
                                                            conexion.release();
                                                          });
                                                        }
                                                      });
                                                    });
                                                  });
                                                });
                                              }
                                          });
                                        });
                                      });
                                    });

                                    min++;
                                    bucle();

                                    }
                                    else{ // si está encendido mandamos a apagar
                                      if(ip_vms.get(estaasignado[0].ip_vm) != undefined){
                                        var socket_vm = getsocketfromip(estaasignado[0].ip_vm);
                                        connection.query("INSERT INTO Pendientes (ip_vm, motivo, usuario, tipo) VALUES ('"+estaasignado[0].ip_vm+"', '"+estaasignado[0].motivo+"','"+aux+"', 'down')",function(error, results2, fields) {
                                          var json = {"user" : aux, "motivo" : estaasignado[0].motivo, "puerto" : estaasignado[0].puerto};
                                          socket_vm.emit("stop", json);
                                            console.log("enviado stop");
                                            min++;
                                            bucle();
                                        });
                                      }
                                      else{
                                        min++;
                                        bucle();
                                      }
                                    }
                                  });
                                });
                                }
                                else{
                                  min++;
                                  bucle();
                                }
                              });
                            });
                          }
                          else{
                            min++;
                            bucle();
                          }
                          });
                          }
                        else{
                          min++;
                          bucle();
                        }
                      });




                      }
                      else{
                        connection.query("UNLOCK TABLES",function(error, results, fields) {
                          connection.release();
                          res.redirect('/controlpanel');
                        });
                      }
                    }

                    bucle();


                  }
                  else{
                    var aux = valores;
                    connection.query("SELECT count(*) AS total FROM Matriculados as m1 WHERE motivo='"+req.body['nombreservicio']+"' AND usuario='"+aux+"'",function(error, total, fields) {
                      if(total[0].total == 1){
                        connection.query("SELECT count(*) AS total FROM Eliminar_servicio_usuario as esu WHERE motivo='"+req.body['nombreservicio']+"' AND usuario='"+aux+"'",function(error, total, fields) {
                          if(total[0].total == 0){
                        connection.query("INSERT INTO Eliminar_servicio_usuario (usuario, motivo) SELECT '"+aux+"','"+req.body['nombreservicio']+"' FROM dual WHERE NOT EXISTS ( SELECT * FROM Eliminar_servicio_usuario as esu WHERE usuario='"+aux+"' AND motivo='"+req.body['nombreservicio']+"')",function(error, result, fields) {
                          connection.query("SELECT count(*) AS total FROM Pendientes as p1 WHERE motivo='"+req.body['nombreservicio']+"' AND usuario='"+aux+"'",function(error, total, fields) {
                            if(total[0].total == 0){
                              connection.query("DELETE FROM Cola WHERE usuario='"+aux+"' AND motivo='"+req.body['nombreservicio']+"'",function(error, result, fields) { //por si acaso
                              connection.query("SELECT * FROM Asignaciones as a1 WHERE motivo='"+req.body['nombreservicio']+"' AND usuario='"+aux+"'",function(error, estaasignado, fields) {
                                if(estaasignado.length == 0){//si no está encendido
                                  functions.eliminardirectoriosolo(aux, req.body['nombreservicio'], function(){
                                    pool.getConnection(function(err, conexion) {
                                      conexion.query(bloqueo_tablas,function(error, results, fields) {
                                        conexion.query("SELECT count(*) AS total FROM Eliminar_servicio as es WHERE motivo='"+req.body['nombreservicio']+"'",function(error, result, fields) {
                                          if(result[0].total == 0){
                                            conexion.query("DELETE FROM Eliminar_servicio_usuario WHERE usuario='"+aux+"' AND motivo='"+req.body['nombreservicio']+"'",function(error, result, fields) {
                                              conexion.query("DELETE FROM Matriculados WHERE usuario='"+aux+"' AND motivo='"+req.body['nombreservicio']+"'",function(error, result, fields) {
                                                conexion.query("DELETE FROM Ultima_conexion WHERE usuario='"+aux+"' AND motivo='"+req.body['nombreservicio']+"'",function(error, result, fields) {
                                                  conexion.query("UNLOCK TABLES",function(error, results, fields) {
                                                    conexion.release();
                                                  });
                                                });
                                              });
                                            });
                                          }
                                          else{
                                            conexion.query("DELETE FROM Eliminar_servicio_usuario WHERE usuario='"+aux+"' AND motivo='"+req.body['nombreservicio']+"'",function(error, result, fields) {
                                              conexion.query("DELETE FROM Matriculados WHERE usuario='"+aux+"' AND motivo='"+req.body['nombreservicio']+"'",function(error, result, fields) {
                                                conexion.query("DELETE FROM Ultima_conexion WHERE usuario='"+aux+"' AND motivo='"+req.body['nombreservicio']+"'",function(error, result, fields) {
                                                  conexion.query("SELECT count(*) AS total FROM Matriculados as m1 WHERE motivo='"+req.body['nombreservicio']+"'",function(error, result, fields) {
                                                    if(result[0].total == 0){
                                                      functions.eliminardirectoriotodo(req.body['nombreservicio'], function(){
                                                        pool.getConnection(function(err, connection) {
                                                          connection.query(bloqueo_tablas,function(error, results, fields) {
                                                            connection.query("DELETE FROM Eliminar_servicio WHERE motivo='"+req.body['nombreservicio']+"'",function(error, result, fields) {
                                                              connection.query("DELETE FROM Servicios WHERE motivo='"+req.body['nombreservicio']+"'",function(error, result, fields) {
                                                                connection.query("UNLOCK TABLES",function(error, results, fields) {
                                                                  connection.release();
                                                                });
                                                              });
                                                            });
                                                          });
                                                        });
                                                      });
                                                      conexion.query("UNLOCK TABLES",function(error, results, fields) {
                                                        conexion.release();
                                                      });
                                                    }
                                                    else{
                                                      conexion.query("UNLOCK TABLES",function(error, results, fields) {
                                                        conexion.release();
                                                      });
                                                    }
                                                  });
                                                });
                                              });
                                            });
                                          }
                                      });
                                    });
                                  });
                                });
                                  connection.query("UNLOCK TABLES",function(error, results, fields) {
                                    connection.release();
                                    res.redirect('/controlpanel');
                                  });
                                }
                                else{ // si está encendido mandamos a apagar
                                  if(ip_vms.get(estaasignado[0].ip_vm) != undefined){
                                    var socket_vm = getsocketfromip(estaasignado[0].ip_vm);
                                    connection.query("INSERT INTO Pendientes (ip_vm, motivo, usuario, tipo) VALUES ('"+estaasignado[0].ip_vm+"', '"+estaasignado[0].motivo+"','"+aux+"', 'down')",function(error, results2, fields) {
                                      var json = {"user" : aux, "motivo" : estaasignado[0].motivo, "puerto" : estaasignado[0].puerto};
                                      socket_vm.emit("stop", json);
                                        console.log("enviado stop");
                                        connection.query("UNLOCK TABLES",function(error, results, fields) {
                                          connection.release();
                                          res.redirect('/controlpanel');
                                        });
                                    });
                                  }
                                  else{
                                    connection.query("UNLOCK TABLES",function(error, results, fields) {
                                        console.log("liberando tablas");
                                      connection.release();
                                      res.redirect('/controlpanel');
                                    });
                                  }
                                }
                              });
                            });
                            }
                            else{
                              connection.query("UNLOCK TABLES",function(error, results, fields) {
                                  console.log("liberando tablas");
                                connection.release();
                                res.redirect('/controlpanel');
                              });
                            }
                          });
                        });
                      }
                      else{
                        connection.query("UNLOCK TABLES",function(error, results, fields) {
                            console.log("liberando tablas");
                          connection.release();
                          res.redirect('/controlpanel');
                        });
                      }
                      });
                      }
                    else{
                      connection.query("UNLOCK TABLES",function(error, results, fields) {
                          console.log("liberando tablas");
                        connection.release();
                        res.redirect('/controlpanel');
                      });
                    }
                  });
                  }
                }
                else{
                  console.log("ERROR -> No se han enviado usuarios");
                  connection.query("UNLOCK TABLES",function(error, results, fields) {
                      console.log("liberando tablas");
                    connection.release();
                    res.redirect('/controlpanel');
                  });
                }
              }
              else{
                console.log("ERROR -> ya se esta eliminando");
                connection.query("UNLOCK TABLES",function(error, results, fields) {
                    console.log("liberando tablas");
                  connection.release();
                  res.redirect('/controlpanel');
                });
              }
              });
            }
            else{
              console.log("ERROR -> no existe en servicios");
              connection.query("UNLOCK TABLES",function(error, results, fields) {
                  console.log("liberando tablas");
                connection.release();
                res.redirect('/controlpanel');
              });
            }
          });
        });
      });
      }
    }
});


app.get('*', function(req, res){
  res.render('error', {});
});



app.listen(config.puerto_server, function(){
  console.log("Servidor web escuchando en el puerto " + config.puerto_server);
});

//////////////////////////////////////////
