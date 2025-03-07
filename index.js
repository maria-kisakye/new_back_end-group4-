const express = require('express');
const db = require('./config');

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3006;
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

app.post('/addUser',(req,res)=>{
    const {name, email,password,role} = req.body;
    const sql = 'INSERT INTO Users VALUES (?,?,?,?)';
    db.query(sql,[name,email,password,role],(error,result)=>{
        if(error) throw error;
        res.send('User added to database');
})});

app.get('/getUsers',(req,res)=>{
    const sql = 'SELECT * FROM Users';
    db.query(sql,(error,result)=>{
        if(error) throw error;
        res.send(result);
    })
});