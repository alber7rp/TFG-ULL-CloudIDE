
var mostrarerror = function(error){
  document.getElementById("error").innerHTML = error;
  $("#myModal").modal();
}

$('#myModal').on('hidden.bs.modal', function () {
    location.reload(true);
})

socket.on('resultado', function (data) {
  document.getElementById("progressapagar-"+data.motivo).style.display = "none";
  document.getElementById("botonenlace-"+data.motivo).style.display = "block";
  document.getElementById("progressencender-"+data.motivo).style.display = "none";
  document.getElementById("botonencender-"+data.motivo).style.display = "none";
  document.getElementById("botonapagar-"+data.motivo).style.display = "block";
  document.getElementById("x-"+data.motivo).style.display = "none";
});

socket.on('stop', function (data) {

  document.getElementById("progressapagar-"+data.motivo).style.display = "none";
  document.getElementById("botonenlace-"+data.motivo).style.display = "none";
  document.getElementById("progressencender-"+data.motivo).style.display = "none";
  document.getElementById("botonencender-"+data.motivo).style.display = "block";
  document.getElementById("botonapagar-"+data.motivo).style.display = "none";
  document.getElementById("x-"+data.motivo).style.display = "block";
});

socket.on('data-error', function (data) {
  mostrarerror(data.msg);
});

socket.on('reload', function (data) {
  location.reload(true);
});


function encender(idd){
var id = idd.replace("botonencender-","");
socket.emit("obtenerenlace", id);

document.getElementById("progressapagar-"+id).style.display = "none";
document.getElementById("botonenlace-"+id).style.display = "none";
document.getElementById("botonencender-"+id).style.display = "none";
document.getElementById("botonapagar-"+id).style.display = "none";
document.getElementById("progressencender-"+id).style.display = "block";

}

function apagar(idd){
  var id = idd.replace("botonapagar-","");

socket.emit("stopenlace", id);

document.getElementById("progressapagar-"+id).style.display = "block";
document.getElementById("x-"+id).style.display = "none";
document.getElementById("botonencender-"+id).style.display = "none";
document.getElementById("botonapagar-"+id).style.display = "none";
document.getElementById("progressencender-"+id).style.display = "none";

}



//made by vipul mirajkar thevipulm.appspot.com
var TxtType = function(el, toRotate, period) {
        this.toRotate = toRotate;
        this.el = el;
        this.loopNum = 0;
        this.period = parseInt(period, 10) || 2000;
        this.txt = '';
        this.tick();
        this.isDeleting = false;
    };

    TxtType.prototype.tick = function() {
        var i = this.loopNum % this.toRotate.length;
        var fullTxt = this.toRotate[i];

        if (this.isDeleting) {
        this.txt = fullTxt.substring(0, this.txt.length - 1);
        } else {
        this.txt = fullTxt.substring(0, this.txt.length + 1);
        }

        this.el.innerHTML = '<span class="wrap">'+this.txt+'</span>';

        var that = this;
        var delta = 200 - Math.random() * 100;

        if (this.isDeleting) { delta /= 2; }

        if (!this.isDeleting && this.txt === fullTxt) {
        delta = this.period;
        this.isDeleting = true;
        } else if (this.isDeleting && this.txt === '') {
        this.isDeleting = false;
        this.loopNum++;
        delta = 500;
        }

        setTimeout(function() {
        that.tick();
        }, delta);
    };

    window.onload = function() {
        var elements = document.getElementsByClassName('typewrite');
        for (var i=0; i<elements.length; i++) {
            var toRotate = elements[i].getAttribute('data-type');
            var period = elements[i].getAttribute('data-period');
            if (toRotate) {
              new TxtType(elements[i], JSON.parse(toRotate), period);
            }
        }
        // INJECT CSS
        var css = document.createElement("style");
        css.type = "text/css";
        css.innerHTML = ".typewrite > .wrap { border-right: 0.08em solid #fff}";
        document.body.appendChild(css);
    };







    $(document).ready(function() {
        $("div.bhoechie-tab-menu>div.list-group>a").click(function(e) {
            e.preventDefault();
            $(this).siblings('a.active').removeClass("active");
            $(this).addClass("active");
            var index = $(this).index();
            $("div.bhoechie-tab>div.bhoechie-tab-content").removeClass("active");
            $("div.bhoechie-tab>div.bhoechie-tab-content").eq(index).addClass("active");
        });




    });


    var parsearemails = function(id){
      var a = id.split("-");
      $( ".entrada-"+a[1] ).remove();
      //$( ".entrada2-"+a[1] ).remove();
      var contenido = $('#'+id).val();
      var exp = new RegExp(/[A-Za-z0-9._%+-]+@([a-z0-9]+\.)+[A-Za-z]{2,6}/g);
      var valores = contenido.match(exp);

      if(valores != null){
        console.log(valores);
        for(var i=0; i<valores.length; i++){

          //$('#idform-'+a[1]).append('<input class="entrada-'+a[1]+'" type="checkbox" name="usuario" value="'+valores[i]+'"> <span class="entrada2-'+a[1]+'" >'+valores[i]+'</span>');
          $('#emaildetected-'+a[1]).append('<div class="form-check entrada-'+a[1]+'"><label><input type="checkbox" name="usuario" value="'+valores[i]+'" checked> <span class="label-text">'+valores[i]+'</span></label></div>');
        }
      }
    }

    function getCleanedString(cadena){
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


    var comprobardisponibilidadnombre = function(id){

      var a = id.split("-");
      $("#boton-"+a[1]).prop("disabled",true);
      var palabra = getCleanedString($('#'+id).val());
      if(palabra.length > 2){
      var datos = {"nombre" : palabra};
      $.ajax({
						type: 'GET',
            dataType: "json",
        contentType: 'application/json', //see that
						//data: JSON.stringify(datos),
				        contentType: 'application/json',
                        url: '/comprobardisponibilidad?nombre='+palabra,
                        success: function(data) {
                            console.log(data.valido);
                            if(data.valido == false){
                              $("#boton-"+a[1]).prop("disabled",true);
                              $("#nombrevalido-"+a[1]).hide();
                              $("#nombrenovalido-"+a[1]).show();
                            }
                            else{
                              $("#boton-"+a[1]).prop("disabled",false);
                              $("#nombrenovalido-"+a[1]).hide();
                              $("#nombrevalido-"+a[1]).show();
                            }
                        }
                    });
        }
        else{
          $("#boton-"+a[1]).prop("disabled",true);
          $("#nombrevalido-"+a[1]).hide();
          $("#nombrenovalido-"+a[1]).show();
        }

    }


    var preguntaeliminarusuarios = function (id){
      var a = id.split("-");

      if (confirm('¿Estas seguro de eliminar éstos usuarios?. Si aceptas se borrarán los datos de los entornos de cada usuario para éste servicio.')){
       $( "#formularioeliminarusuarios-"+a[1] ).submit();
      }

    }

    var preguntaeliminarservicio = function (id){
      var a = id.split("-");

      if (confirm('¿Estas seguro de eliminar éste servicio?. Si aceptas se borrarán los datos de los entornos de cada usuario para éste servicio. El nombre del servicio no se podrá volver a utilizar hasta que el proceso se haya completado')){
       $( "#formularioeliminarservicio-"+a[1] ).submit();
      }

    }
