# ops-microservices

Este repositorio contiene dos componentes principales de Kubernetes (*builder* y *api-builder*) donde el seguindo es capas de conectarse con el primero a travez de peticiones REST.

## Tabla de Contenido

   1. [Detalles de implementation](#1-implementation-details)
   2. [Uso](#2-usage)
   3. [Elecciones y Suposiciones](#3-some-choices-and-assumptions)

## 1. Detalles de implementation.

La implementacion está separada dentro de dos carpetas donde cada una de ellas hace referncia a cada uno de los componentes creados dentro de un cluster de k8s.

### Builder
Este componente puede ser dividido en dos partes, una es un *Servidor NFS* y la otra ya es propiamente el *Jenkins*. 

El servidor NFS fue necesario crearlo ya que dentro de lo que se pide para persistencia es un PV de tipo NFS y dado que no todos los clusters de k8s cuentan con esta opcion, fue necesario la implementacion previa de sus componentes. Este componente tiene un servicio para exponerlo, un replicaiton controller y los respectivos volumenes.

El Jenkins dado que es un componente de tipo Stateful requiere persistencia en el host y es por ello que para garantizar mantener la informacion en caso que un Centro 1 falle y poder levantar el Centro 2 sin perdida de informacion se le pone un volumen de tipo NFS (provisto en muchos casos por los proveedores de nube comunes). Este componente cuenta con un rbac, unas relgas de ingress (para darle la redireccion desde el host solicitado) y el despliegue (con la configuracion requerida).

### API-Builder
Este componente tambien está dividido en dos partes.

La principal es una imagen custom basada en una imagen de NGINX expuesta en el puerto 8081 bajo una configuracion especifica para hacer de Reverse-Proxy que redirecciona el trafico a un segundo componente. Dicha configuracion se inyecta al momento de la creacion de la imagen docker, que posteriormente es desplegada en el registry publico de docker.

El segundo componente es un servidor NodeJS que es quien se encarga de recibir la peticion en el path especificado. Una vez recibe esta peticion realiza dos request de manera sincrona al Jenkins para poder realizar la ejecucion de un Job de manera remota. Este componente está consgruido con express y el uso de la libreria http para realizar las peticiones.

## 2. Uso y despliegue.

Como prerequisito se debe instalar un Nginx Ingress controller el cual dependerá que tipo de cluster utilices, para mi caso local fue instalado con Helm (https://kubernetes.github.io/ingress-nginx/deploy/#using-helm). 

Ya que se tienen dependencias entre varios de los componentes:
1. Se despliega todo lo que está dentro del folder **builder/k8s/01-NFS_Server/**
2. Se despliega el Jenkins que es todo lo que se encuentra dentro del folder **builder/k8s/**

Hasta aqui va la primera etapa de desplieue de Kubernetes para el primer *builder*, ahora se debe configurar el Jenkins.
3. Para la prueba desde un entorno local primero se debe averiguar la ip en donde está corriendo nuestro cluster, para mi caso que estoy utiizando minikube con `minikube ip`. Ya con esto agrego la redireccion del DNS solicitado a la IP de mi cluster agregando las rutas al archivo local `/etc/hosts`. (**Nota:** esto es porque mi maquina local es Ubuntu, en caso de ser Windows la ruta cambia.)
Se vería algo asi ya que la IP de mi minikube es `192.168.99.112`:
```
cat /etc/hosts
#F5 Networks Inc. :File modified by VPN process
127.0.0.1	localhost
127.0.1.1	CO-IT01734
192.168.99.112  builder.localhost.com
192.168.99.112  api-builder.localhost.com
```

4. En este paso se realiza la configuracion del Jenkins donde previamente debes ejecutar `kubectl -n jenkins logs <pod-id>` para poder saber el password inicial. Ademas dado que no es solo para una prueba he configurado tanto user y password del administrador como 'admin' para ambos (**Nota:** es importante tenerlo presente pues para pasos posteriores como la ejecucion remota del job de Jenkins son estos lo que se han usado.)

5. Ahora se debe configurar el Job de jenkins que para el caso de la prueba lo debemos llamar *pipeline-groovy* y es de tipo Pipeline. Este se puede configurar con el Jenkinsfile que se encuentra en la ruta **builder/src** bien sea copiandolo y pegandolo o llamando directamente al repositorio y señalando la ruta del dicho archivo.

6. Para el despligue del componente *api-builder* ya se encuentran preconstruidas la imagenes docker tanto del servidor Nginx como del servidor NodeJS, por lo que para despelegarlo solo basta con desplegar todos los compontes de k8s que se encuentran dentro de la ruta **api-builder/k8s**. 

7. Para probar que todo quedó configurado completamente se debe realizar una peticion a `api-builder.localhost.com/build` lo cual ejecutará el Job de Jenkins con el nombre especificado anteriormente y con las credenciales mencionadas en el punto 4. (**Nota:** dichas credenciales estan almacenadas dentro del componente 'secretes nodeserver'.)


## 3.Elecciones y Suposiciones.

- Minikube como mi cluster de K8s.
- Instalacion del Nginx ingress controller con Helm.
- Jenkins user = admin y password = admin. (Utiizando para la autenticacion)
- Redireccion local manipulando el archivo `/etc/hosts` para probar la redireccion desde los DNS solicitados.
- Creacion de dos imagenes custom y subidas a mi registry publico de docker, una para el servidor Node y la otra para la configuracion del Nginx como reverse-proxy.
- Aplicacion NodeJS es quien realiza la peticion al Jenkins.
- Credenciales configuradas haciendo uso del Secrets y doblemente cifradas en base64.
- Aprovicionamiento de un servidor NFS para emular un proveedor de volumenes de tipo NFS.