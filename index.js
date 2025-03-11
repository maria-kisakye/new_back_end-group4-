const express = require('express');
const db = require('./config');
const auth = require('./authenticate');
const app = express();
const router = express.Router();
const cors = require('cors');
const PORT = process.env.PORT || 3001;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

app.use(cors());

app.use(express.json());

const sql =
`CREATE TABLE IF NOT EXISTS president (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100),
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

// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });

app.post('/addPresident',(req,res)=>{
    const {id, username, password} = req.body;
    if (!id || !username || !password ) {
        return res.status(400).json({ message: "All fields are required" });
    }
    //encrpt the password
    const hashedPassword = bcrypt.hashSync(password, 10);
    const sql = 'INSERT INTO President VALUES (?,?,?)';
    db.query(sql,[id, username, hashedPassword],(error,result)=>{
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
    const {username} = req.body;
    const sql = 'DELETE FROM President WHERE username = ?';
    db.query(sql,username,(error,result)=>{
        if(error) throw error;
        res.send('President deleted from database');
    })
});

const sql1 = 
`CREATE TABLE IF NOT EXISTS student (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) ,
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
    const {id, username,password} = req.body;
    if (!id || !username || !password ) {
            return res.status(400).json({ message: "All fields are required" });
        }
    //encrpt the password
    const hashedPassword = bcrypt.hashSync(password, 10);
    const sql1 = "INSERT INTO Student (id,username, password) VALUES (?, ?, ?)";
    
    db.query(sql1,[id,username,hashedPassword],(error,result)=>{
        if(error) throw error;
        res.send('Student added to database');
})});

//login
// - brcypt / compare
exports.login = async (req, res) => {
    const { username, password } = req.body;
  
    try {
      const user = await db.User.findOne({ where: { username } });
  
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
  
      const isMatch = await bcrypt.compare(password, hashedPassword);
  
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
        }
    
        const payload = {
            user: {
                id: user.id
            }
        };
    
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.status(200).json({ token });
            }
        );
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
      }
    };



app.get('/getStudent',(req,res)=>{
    const sql1 = 'SELECT * FROM Student';
    db.query(sql1,(error,result)=>{
        if(error) throw error;
        res.send(result);
    })
});

app.delete('/deleteStudent',(req,res)=>{
    const {username} = req.body;
    const sql1 = 'DELETE FROM Student WHERE username = ?';
    db.query(sql1,username,(error,result)=>{
        if(error) throw error;
        res.send('Student deleted from database');
    })
});

const sql2 = 
`CREATE TABLE IF NOT EXISTS admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100),
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
    const {id, username,password} = req.body;
    if (!id || !username || !password ) {
        return res.status(400).json({ message: "All fields are required" });
    }
    //encrpt the password
    const hashedPassword = bcrypt.hashSync(password, 10);
    const sql2 = 'INSERT INTO Admin VALUES (?,?,?)';
    db.query(sql2,[id,username,hashedPassword],(error,result)=>{
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
    const {username} = req.body;
    const sql2 = 'DELETE FROM Admin WHERE username = ?';
    db.query(sql2,username,(error,result)=>{
        if(error) throw error;
        res.send('Admin deleted from database');
    })
});

app.get('/', (req,res) => {
    res.send('Hello from backend')
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
