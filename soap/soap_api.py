from flask import Flask, request, Response
from spyne import Application, rpc, ServiceBase, Integer, Unicode, Iterable, Array
from spyne.protocol.soap import Soap11
from spyne.server.wsgi import WsgiApplication

# Inicializar Flask
app = Flask(__name__)

# Base de datos simulada
trainers = {
    1: {"name": "Ash Ketchum", "pokemons": ["Pikachu", "Charizard", "Bulbasaur"]},
    2: {"name": "Misty", "pokemons": ["Starmie", "Psyduck"]},
    3: {"name": "Brock", "pokemons": ["Onix", "Geodude", "Vulpix"]},
}

# Definir el servicio SOAP
class TrainerService(ServiceBase):
    @rpc(Integer, _returns=Iterable(Unicode))
    def GetTrainer(ctx, id):
        """Devuelve la información de un entrenador dado su ID."""
        trainer = trainers.get(id)
        if trainer:
            yield f"ID: {id}"
            yield f"Name: {trainer['name']}"
            for pokemon in trainer["pokemons"]:
                yield f"Pokemon: {pokemon}"
        else:
            yield "Trainer not found"

    @rpc(Unicode, Array(Unicode), _returns=Unicode)
    def PostTrainer(ctx, name, pokemons):
        """Añade un nuevo entrenador al sistema."""
        # Generar un nuevo ID basado en el tamaño actual del diccionario
        new_id = max(trainers.keys()) + 1
        trainers[new_id] = {"name": name, "pokemons": pokemons}
        
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
    app.run(host="0.0.0.0", port=5000)
