# **ULL-CloudIDE** : Plataforma de entornos de desarrollo para la docencia
![](/img/logo.png)
___
### **¿En qué consiste esta plataforma?**
En este proyecto, se ha desarrollado e implantado un sistema que permite tanto a profesores como alumnos de la Universidad de La Laguna, hacer uso de entornos de desarrollo integrado en la nube. Éste objetivo viene producido por la necesidad de facilitar la creación y el testeo de proyectos informáticos en el ámbito docente.

De manera resumida, el principal servicio que pretende dar es el IDE Eclipse Che. Para escalar y proporcionar la privacidad necesaria, se ha tenido que diseñar un esquema de red específico, interno a la ULL y haciendo uso del sistema de virtualización de oVirt implantado en el IaaS.

Por otro lado, se ha hecho uso del servidor CAS alojado en las instalaciones internas, por lo que solo aquel que tenga credenciales institucionales podrá acceder a la herramienta.

Como se ha nombrado, en la plataforma coexisten dos roles:
* **Profesores**: Éstos podrán crear nuevos servicios, asignarlos a los usuarios que crea convenientes, eliminarlos, etc. Un profesor también puede ser alumno, por ello también podrán acceder a aquellos IDEs que le hayan asignado.
* **Alumnos**: Éstos se limitarán al encendido, apagado y acceso de los IDEs asignados por sus profesores.

![](/img/screenshot.png)

### **Enlaces de interés**
* [Plataforma ULL-CloudIDE](http://cloudide.iaas.ull.es/): Enlace para acceder a la plataforma. Previamente se debe estar en la red interna de la ULL (VPN, aulas, centro de cálculo, etc).
* [Documentación sobre el desarrollo y uso de ULL-CloudIDE](https://github.com/alber7rp/TFG-ULL-CloudIDE/blob/master/memory/ULL-CloudIDE%20Plataforma%20de%20entornos%20de%20desarrollo%20para%20la%20docencia.pdf)
* [Documentación oficial de Eclipse Che](https://www.eclipse.org/che/docs/)
