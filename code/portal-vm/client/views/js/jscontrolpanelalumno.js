
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
