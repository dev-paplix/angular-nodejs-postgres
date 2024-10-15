Creating table in database:

To login to psql:

psql -h localhost -U your_username -d your_database

To migrate the table to the datbase:

 \i ${location}table.sql

 To generate the jwt:

 1- node 
 2- require('crypto').randomBytes(64).toString('hex')