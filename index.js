const express = require('express');
const db = require('./config');

const app = express();

const PORT = process.env.PORT || 3001;
const sql = 
`CREATE TABLE IF NOT EXISTS users (
    name VARCHAR(100) ,
    email VARCHAR(50),
    password VARCHAR(50),
    role VARCHAR(50)
)`;

db.query(sql, (err, result) => {
    if (err) {
        console.error('Error creating table:', err);
        return;
    }
    console.log('Table created successfully');
});


app.get('/', (req, res) => {
    res.send('Welcome to API!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});