const express = require('express');
const db = require('./config');
const auth = require('./authenticate');
const app = express();
const router = express.Router();
const cors = require('cors');
const PORT = process.env.PORT || 5000; // Changed to 5000 to match frontend
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

// Middleware
app.use(bodyParser.json());
app.use(cors({
    origin: 'http://localhost:3000', // Frontend URL
    credentials: true,
}));
app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error' });
});

// Database table creation
const createTables = async () => {
    const tables = [
        {
            name: 'president',
            sql: `CREATE TABLE IF NOT EXISTS president (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) UNIQUE,
                password VARCHAR(255),
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`
        },
        {
            name: 'president_manage_events',
            sql: `CREATE TABLE IF NOT EXISTS president_manage_events (
            event_title VARCHAR(100) PRIMARY KEY,
            chapter VARCHAR(100),
            date DATE,
            time TIME,
            location VARCHAR(100),
            description TEXT
            )`
        },
        {
            name: 'student',
            sql: `CREATE TABLE IF NOT EXISTS student (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) UNIQUE,
                password VARCHAR(255),
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`
        },
        {
            name: 'admin',
            sql: `CREATE TABLE IF NOT EXISTS admin (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) UNIQUE,
                password VARCHAR(255),
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`
        }
    ];

    for (const table of tables) {
        try {
            await new Promise((resolve, reject) => {
                db.query(table.sql, (err, result) => {
                    if (err) reject(err);
                    resolve(result);
                });
            });
            console.log(`${table.name} table created successfully`);
        } catch (err) {
            console.error(`Error creating ${table.name} table:`, err);
        }
    }
};

// Initialize tables
createTables();

// Root endpoint (for frontend basic data)
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the API server' });
});

// Generic CRUD operations for each entity
const createEntityRoutes = (entityName) => {
    // Add entity
    app.post(`/api/add${entityName}`, async (req, res) => {
        try {
            const { id, username, password } = req.body;
            
            if (!username || !password) {
                return res.status(400).json({ message: "Username and password are required" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const sql = `INSERT INTO ${entityName} (username, password) VALUES (?, ?)`;
            
            db.query(sql, [username, hashedPassword], (error, result) => {
                if (error) {
                    if (error.code === 'ER_DUP_ENTRY') {
                        return res.status(400).json({ message: `${entityName} already exists` });
                    }
                    throw error;
                }
                res.status(201).json({ 
                    message: `${entityName} added successfully`,
                    id: result.insertId
                });
            });
        } catch (error) {
            console.error(`Error adding ${entityName}:`, error);
            res.status(500).json({ message: `Failed to add ${entityName}` });
        }
    });

    // Get all entities
    app.get(`/api/get${entityName}`, (req, res) => {
        try {
            const sql = `SELECT id, username, createdAt FROM ${entityName}`;
            db.query(sql, (error, result) => {
                if (error) throw error;
                res.json(result);
            });
        } catch (error) {
            console.error(`Error fetching ${entityName}s:`, error);
            res.status(500).json({ message: `Failed to fetch ${entityName}s` });
        }
    });

    // Delete entity
    app.delete(`/api/delete${entityName}`, (req, res) => {
        try {
            const { username } = req.body;
            if (!username) {
                return res.status(400).json({ message: "Username is required" });
            }

            const sql = `DELETE FROM ${entityName} WHERE username = ?`;
            db.query(sql, [username], (error, result) => {
                if (error) throw error;
                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: `${entityName} not found` });
                }
                res.json({ message: `${entityName} deleted successfully` });
            });
        } catch (error) {
            console.error(`Error deleting ${entityName}:`, error);
            res.status(500).json({ message: `Failed to delete ${entityName}` });
        }
    });
};

// Create routes for all entities
['President', 'Student', 'Admin'].forEach(createEntityRoutes);

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        if (!username || !password || !role) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const table = role.toLowerCase();
        if (!['president', 'student', 'admin'].includes(table)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const sql = `SELECT * FROM ${table} WHERE username = ?`;
        db.query(sql, [username], async (error, results) => {
            if (error) throw error;
            
            if (results.length === 0) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const user = results[0];
            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const payload = {
                user: {
                    id: user.id,
                    username: user.username,
                    role: role
                }
            };

            jwt.sign(
                payload,
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '1h' },
                (err, token) => {
                    if (err) throw err;
                    res.json({
                        token,
                        user: {
                            id: user.id,
                            username: user.username,
                            role: role
                        }
                    });
                }
            );
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});