const express = require('express');
const db = require('./config');
const auth = require('./authenticate');
const app = express();
const router = express.Router();

app.use(express.json());

const PORT = process.env.PORT || 3006;
const sql = 
`CREATE TABLE IF NOT EXISTS president (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(50),
    password VARCHAR(50)
)`;

db.query(sql, (err, result) => {
    if (err) {
        console.error('Error creating table:', err);
        return;
    }
    console.log('President Table created successfully');
});


app.get('/', (req, res) => {
    res.send('Welcome to API!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.post('/addPresident',(req,res)=>{
    const {id, name, email,password} = req.body;
    const sql = 'INSERT INTO President VALUES (?,?,?,?)';
    db.query(sql,[id, name,email,password],(error,result)=>{
        if(error) throw error;
        res.send('President added to database');
})});

app.get('/getPresident',(req,res)=>{
    const sql = 'SELECT * FROM President';
    db.query(sql,(error,result)=>{
        if(error) throw error;
        res.send(result);
    })
});

app.delete('/deletePresident',(req,res)=>{
    const {name} = req.body;
    const sql = 'DELETE FROM President WHERE name = ?';
    db.query(sql,name,(error,result)=>{
        if(error) throw error;
        res.send('President deleted from database');
    })
});

const sql1 = 
`CREATE TABLE IF NOT EXISTS student (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) ,
    email VARCHAR(50),
    password VARCHAR(50)
)`;

db.query(sql1, (err, result) => {
    if (err) {
        console.error('Error creating table:', err);
        return;
    }
    console.log('Student Table created successfully');
});


app.post('/addStudent',(req,res)=>{
    const {id, name, email,password} = req.body;
    const sql1 = 'INSERT INTO Student VALUES (?,?,?,?)';
    db.query(sql1,[id,name,email,password],(error,result)=>{
        if(error) throw error;
        res.send('Student added to database');
})});

app.get('/getStudent',(req,res)=>{
    const sql1 = 'SELECT * FROM Student';
    db.query(sql1,(error,result)=>{
        if(error) throw error;
        res.send(result);
    })
});

app.delete('/deleteStudent',(req,res)=>{
    const {name} = req.body;
    const sql1 = 'DELETE FROM Student WHERE name = ?';
    db.query(sql1,name,(error,result)=>{
        if(error) throw error;
        res.send('Student deleted from database');
    })
});

const sql2 = 
`CREATE TABLE IF NOT EXISTS admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) ,
    email VARCHAR(50),
    password VARCHAR(50)
)`;

db.query(sql2, (err, result) => {
    if (err) {
        console.error('Error creating table:', err);
        return;
    }
    console.log('Admin Table created successfully');
});


app.post('/addAdmin',(req,res)=>{
    const {id, name, email,password} = req.body;
    const sql2 = 'INSERT INTO Admin VALUES (?,?,?,?)';
    db.query(sql2,[id,name,email,password],(error,result)=>{
        if(error) throw error;
        res.send('Admin added to database');
})});

app.get('/getAdmin',(req,res)=>{
    const sql2 = 'SELECT * FROM Admin';
    db.query(sql2,(error,result)=>{
        if(error) throw error;
        res.send(result);
    })
});

app.delete('/deleteAdmin',(req,res)=>{
    const {name} = req.body;
    const sql2 = 'DELETE FROM Admin WHERE name = ?';
    db.query(sql2,name,(error,result)=>{
        if(error) throw error;
        res.send('Admin deleted from database');
    })
});