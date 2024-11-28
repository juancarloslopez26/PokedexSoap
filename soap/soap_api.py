from flask import Flask, request, Response # type: ignore
from spyne import Application, rpc, ServiceBase, Integer, Unicode, Iterable # type: ignore
from spyne.protocol.soap import Soap11 # type: ignore
from spyne.server.wsgi import WsgiApplication # type: ignore
from database import fetch_trainer_by_id, insert_trainer

# Inicializar Flask
app = Flask(__name__)

# Definir el servicio SOAP
class TrainerService(ServiceBase):
    @rpc(Integer, _returns=Iterable(Unicode))
    def GetTrainer(ctx, id):
        """Devuelve la información de un entrenador dado su ID desde la base de datos."""
        trainer = fetch_trainer_by_id(id)
        if trainer:
            yield f"ID: {trainer['id']}"
            yield f"Name: {trainer['nombre']}"
            yield f"Age: {trainer['edad']}"
            yield f"Pokemon ID: {trainer['pokemonId'] or 'None'}"
        else:
            yield "Trainer not found"

    @rpc(Unicode, Integer, Unicode, _returns=Unicode)
    def PostTrainer(ctx, name, age, pokemon_id=None):
        """Añade un nuevo entrenador al sistema y lo guarda en la base de datos."""
        new_id = insert_trainer(name, age, pokemon_id)
        return f"Trainer '{name}' with ID {new_id} added successfully."

# Configurar Spyne
soap_app = Application(
    [TrainerService],
    tns="trainer.soap.api",
    in_protocol=Soap11(validator="lxml"),
    out_protocol=Soap11(),
)

# Conectar Spyne con Flask
wsgi_app = WsgiApplication(soap_app)

@app.route("/soap", methods=["POST"])
def soap_endpoint():
    # Pasar la solicitud al servidor SOAP de Spyne
    environ = request.environ.copy()
    environ["wsgi.input"] = request.stream
    environ["CONTENT_LENGTH"] = request.content_length or "0"

    # Crear una lista para capturar la respuesta
    response_body = []

    # Función de ayuda para capturar la respuesta WSGI
    def start_response(status, headers, exc_info=None):
        response_body.append((status, headers))

    # Procesar la solicitud WSGI
    response_data = wsgi_app(environ, start_response)
    
    # Extraer estado y encabezados
    status, headers = response_body[0]
    
    # Crear la respuesta Flask
    return Response(
        response_data,
        status=int(status.split(" ")[0]),
        headers=dict(headers),
        content_type="text/xml; charset=utf-8"
    )

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=4000)
