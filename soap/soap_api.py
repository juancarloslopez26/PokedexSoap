import sqlite3
from flask import Flask, request, Response
from spyne import Application, rpc, ServiceBase, Integer, Unicode, Iterable, Array
from spyne.protocol.soap import Soap11
from spyne.server.wsgi import WsgiApplication

# Inicializar Flask
app = Flask(__name__)

# Conectar a la base de datos
DB_PATH = "trainers.db"

def init_db():
    """Inicializa la base de datos si no existe."""
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS trainers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        )
        """)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS pokemons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trainer_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            FOREIGN KEY (trainer_id) REFERENCES trainers (id)
        )
        """)

# Inicializar la base de datos
init_db()

class TrainerService(ServiceBase):
    @rpc(Integer, _returns=Iterable(Unicode))
    def GetTrainer(ctx, id):
        """Devuelve la información de un entrenador dado su ID."""
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM trainers WHERE id = ?", (id,))
            trainer = cursor.fetchone()
            if trainer:
                yield f"ID: {id}"
                yield f"Name: {trainer[0]}"
                cursor.execute("SELECT name FROM pokemons WHERE trainer_id = ?", (id,))
                pokemons = cursor.fetchall()
                for pokemon in pokemons:
                    yield f"Pokemon: {pokemon[0]}"
            else:
                yield "Trainer not found"

    @rpc(Unicode, Array(Unicode), _returns=Unicode)
    def PostTrainer(ctx, name, pokemons):
        """Añade un nuevo entrenador al sistema."""
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            # Insertar el entrenador
            cursor.execute("INSERT INTO trainers (name) VALUES (?)", (name,))
            trainer_id = cursor.lastrowid
            # Insertar los Pokémon
            for pokemon in pokemons:
                cursor.execute("INSERT INTO pokemons (trainer_id, name) VALUES (?, ?)", (trainer_id, pokemon))
            conn.commit()
            return f"Trainer '{name}' with ID {trainer_id} added successfully."

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
