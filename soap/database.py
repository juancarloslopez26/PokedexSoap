import mysql.connector

# Configuración de la conexión a la base de datos
DB_CONFIG = {
    "host": "mysqldb",  # Nombre del servicio definido en Docker Compose
    "user": "root",     # Usuario definido en el archivo docker-compose
    "password": "admin",  # Contraseña definida en el archivo docker-compose
    "database": "trainers",  # Nombre de la base de datos
}

def get_db_connection():
    """Crea y retorna una conexión a la base de datos."""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except mysql.connector.Error as err:
        print(f"Error al conectar a la base de datos: {err}")
        raise

def fetch_trainer_by_id(trainer_id):
    """Obtiene un entrenador por su ID desde la base de datos."""
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM Trainer WHERE id = %s", (trainer_id,))
        trainer = cursor.fetchone()
        return trainer
    finally:
        cursor.close()
        connection.close()

def insert_trainer(name, age, pokemon_id=None):
    """Inserta un nuevo entrenador en la tabla Trainer."""
    connection = get_db_connection()
    cursor = connection.cursor()
    try:
        cursor.execute(
            "INSERT INTO Trainer (nombre, edad, pokemonId) VALUES (%s, %s, %s)",
            (name, age, pokemon_id),
        )
        connection.commit()
        return cursor.lastrowid  # Retorna el ID del nuevo registro
    finally:
        cursor.close()
        connection.close()
