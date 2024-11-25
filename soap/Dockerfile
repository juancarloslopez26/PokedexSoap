FROM python:3.10-slim

# Instalar dependencias del sistema para lxml
RUN apt-get update && apt-get install -y libxml2-dev libxslt-dev gcc

# Instalar dependencias de Python
RUN pip install flask spyne lxml mysql-connector-python

# Copiar los archivos
COPY soap_api.py /app/soap_api.py
COPY database.py /app/database.py

WORKDIR /app

# Exponer el puerto de la API
EXPOSE 5000

# Comando para ejecutar la API
CMD ["python", "soap_api.py"]
