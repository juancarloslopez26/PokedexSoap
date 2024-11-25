-- Seleccionar la base de datos 'trainers'
USE trainers;

-- Crear la tabla 'Trainer'
CREATE TABLE Trainer (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    edad INT NOT NULL,
    pokemonId VARCHAR(50)
);

-- Insertar registros iniciales
INSERT INTO Trainer (nombre, edad, pokemonId) VALUES 
('Ash Ketchum', 10, NULL),
('Misty', 12, NULL),
('Brock', 15, NULL),
('Tracey Sketchit', 14, NULL),
('Professor Oak', 60, NULL);
