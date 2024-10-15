DROP TABLE IF EXISTS users;  -- Drop the table if it already exists

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(250),
    contactNumber VARCHAR(20),
    email VARCHAR(250) UNIQUE,
    password VARCHAR(60),
    status VARCHAR(20),
    role VARCHAR(20)
);


INSERT INTO users (name, contactNumber, email, password, status, role) 
VALUES ('Admin', '0182165910', 'admin@gmail.com', 'test', 'true', 'admin');
