# PokedexApi

---

## Requisitos Previos
Asegúrate de tener instalados los siguientes programas en tu sistema antes de comenzar:
- **Git**: Para clonar el repositorio.
- **Node.js y npm**: Para instalar dependencias y ejecutar el backend.
- **Docker y Docker Compose**: Para orquestar los contenedores del proyecto desde docker.
- **Minikube y kubectl**: Para orquestar los contenedores del proyecto desde kubernetes.

---

## Instalación y Configuración

1. Clona este repositorio en el directorio de tu preferencia:

   ```bash
   git clone https://github.com/juancarloslopez26/PokedexSoap.git

2. Cambia al directorio del proyecto:

   ```bash
   cd PokedexSoap

3. Inicia minikube
   ```bash
   minikube start
   
4. Haz los port forward para que puedas usar las imagenes localmemte:
   ```bash
   kubectl port-forward --namespace kube-system service/registry 5000:80
   docker run --rm -it --network=host alpine ash -c "apk add socat && socat TCP-LISTEN:5000,reuseaddr,fork TCP:host.docker.internal:5000"

5. Construye las imágenes para la api soap (trainers) y la api rest (pokedex) con el tag 10
   ```bash
   docker build -t localhost:5000/trainers:10 .
   docker build -t localhost:5000/pokedex:10 .

6. Haz un docker push para que las imaggenes estén disponibles para minikube:
   ```bash
   docker push localhost:5000/trainers:10
   docker push localhost:5000/pokedex:10 
   
7. Aplica todos los archivos yml:
   ```bash
   kubectl create namespace jclo-api  
   kubectl create namespace odm-database
   kubectl apply -f pv/mongo-pv-pvc.yml
   kubectl apply -f pv/mysql-pv-pvc.yml
   kubectl apply -f deployments/mongo-deployment.yaml
   kubectl apply -f deployments/mysql-deployment.yaml
   kubectl apply -f deployments/soap-api-deployment.yaml
   kubectl apply -f deployments/rest-api-deployment.yaml
   
8. Consulta la dirección IP externa que tiene el servicio de la Rest Api para conectarse con el LoadBalancer:
   ```bash
   kubectl get svc -n jclo-api

9. Inicia el minikube tunnel
    ```bash
   minikube tunnel     

10. Deberás ingresar a tu navegador en la ruta <ExternalIP>:3000/swaggerIndex, y desde ahi podrás probar todos los endpoints de la api Rest
 
### Para probar la api rest con docker-compose
1. Levantar los contenedores
   ```bash
   docker-compose up -d --build
2. Después de esperar 5 minutos para que mysql empiece, consultar los endpoint en localhost:3000/swaggerIndex

3. Apagar los contenedores y borrar los volumenes e imagenes creadas localmente:
   ```bash
   docker-compose down --rmi local -v
