# PokedexApi

---

## Requisitos Previos
Asegúrate de tener instalados los siguientes programas en tu sistema antes de comenzar:
- **Git**: Para clonar el repositorio.
- **Node.js y npm**: Para instalar dependencias y ejecutar el backend.
- **Docker y Docker Compose**: Para orquestar los contenedores del proyecto.

---

## Instalación y Configuración

1. Clona este repositorio en el directorio de tu preferencia:

   ```bash
   git clone https://github.com/juancarloslopez26/PokedexSoap.git

2. Cambia al directorio del proyecto:

   ```bash
   cd PokedexSoap
3. Instala las dependencias de Node.js:
   ```bash
   npm install xml2js axios 
   npm install
4. Haz los port fordward para que puedas usar las imagenes localmemte:
   ```bash
   kubectl port-forward --namespace kube-system service/registry 5000:80
   docker run --rm -it --network=host alpine ash -c "apk add socat && socat TCP-LISTEN:5000,reuseaddr,fork TCP:host.docker.internal:5000"
5. Aplica todos los archivos yml:
   ```bash
   minikube start
   kubectl create namespace jclo-api  
   kubectl create namespace odm-database
   kubectl apply -f Secretos.yml
   kubectl apply -f pv/mongo-pv-pvc.yml
   kubectl apply -f pv/mysql-pv-pvc.yml
   kubectl apply -f deployments/mongo-deployment.yaml
   kubectl apply -f deployments/mysql-deployment.yaml
   kubectl apply -f deployments/soap-api-deployment.yaml
   kubectl apply -f deployments/rest-api-deployment.yaml
6. Contruye los contenedores:
   ```bash
   docker-compose up -d --build      
     
    
### Detener los contenedores
Si deseas detener los contenedores, borrar el volumen utilizado y eliminar la imagen construida localmente, ejecuta:
   ```bash
   docker-compose down --rmi local -v
