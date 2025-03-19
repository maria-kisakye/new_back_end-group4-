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
app.use(userR);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error' });
});

// Database table creation
const createTables = async () => {
    const tables = [
        {
            name: 'users',
            sql: `CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) UNIQUE,
                email VARCHAR(100) UNIQUE,
                password VARCHAR(255),
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`
        },
        {
            name: 'roles',
            sql: `CREATE TABLE IF NOT EXISTS roles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                role_name VARCHAR(100) UNIQUE
            )`
        },
        {
            name: 'user_roles',
            sql: `CREATE TABLE IF NOT EXISTS user_roles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            role_id INT,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (role_id) REFERENCES roles(id)
            )`
        },
        {
            name: 'events',
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
            name: 'admin_chapter_table',
            sql: `CREATE TABLE IF NOT EXISTS admin_chapter_table (
                chapter_id INT AUTO_INCREMENT PRIMARY KEY,
                chapter_name VARCHAR(100),
                president_name VARCHAR(100),
                description TEXT
            )`
        }
    ];

// Insert default roles if they don't exist
const defaultRoles = [
    "INSERT INTO roles (role_name) SELECT 'admin' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE role_name = 'admin')",
    "INSERT INTO roles (role_name) SELECT 'student' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE role_name = 'student')",
    "INSERT INTO roles (role_name) SELECT 'president' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE role_name = 'president')"
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

// Insert default roles
for (const roleSql of defaultRoles) {
    try {
        await new Promise((resolve, reject) => {
            db.query(roleSql, (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });
    } catch (err) {
        console.error('Error inserting default roles:', err);
    }
}
};

// Initialize tables
createTables();

// Root endpoint (for frontend basic data)
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the API server' });
});

// Generic CRUD operations for users (now using the users table with roles)
const createUserRoutes = () => {
    // Add user with role
    router.post('/addUser', async (req, res) => {
        try {
            const { username, email, password, role } = req.body;
            
            if (!username || !email || !password || !role) {
                return res.status(400).json({ message: "All fields are required" });
            }

            if (!['admin', 'student', 'president'].includes(role)) {
                return res.status(400).json({ message: "Invalid role" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const sqlUser = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;
            
            db.query(sqlUser, [username, email, hashedPassword], (error, result) => {
                if (error) {
                    if (error.code === 'ER_DUP_ENTRY') {
                        return res.status(400).json({ message: 'Username or email already exists' });
                    }
                    throw error;
                }

                const userId = result.insertId;
                // Assign role
                const sqlRole = `INSERT INTO user_roles (user_id, role_id) 
                               SELECT ?, id FROM roles WHERE role_name = ?`;
                
                db.query(sqlRole, [userId, role], (roleError) => {
                    if (roleError) throw roleError;
                    res.status(201).json({ 
                        message: 'User added successfully',
                        id: userId,
                        role: role
                    });
                });
            });
        } catch (error) {
            console.error('Error adding user:', error);
            res.status(500).json({ message: 'Failed to add user' });
        }
    });

    // Get all users with their roles
    router.get('/getUsers', (req, res) => {
        try {
            const sql = `SELECT u.id, u.username, u.email, u.createdAt, r.role_name 
                        FROM users u 
                        LEFT JOIN user_roles ur ON u.id = ur.user_id 
                        LEFT JOIN roles r ON ur.role_id = r.id`;
            db.query(sql, (error, result) => {
                if (error) throw error;
                res.json(result);
            });
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({ message: 'Failed to fetch users' });
        }
    });

    // Delete user
    router.delete('/deleteUser', (req, res) => {
        try {
            const { username } = req.body;
            if (!username) {
                return res.status(400).json({ message: "Username is required" });
            }

            // Delete user roles first (due to foreign key constraint)
            const sqlDeleteRoles = `DELETE ur FROM user_roles ur 
                                  JOIN users u ON ur.user_id = u.id 
                                  WHERE u.username = ?`;
            const sqlDeleteUser = `DELETE FROM users WHERE username = ?`;

            db.query(sqlDeleteRoles, [username], (error1) => {
                if (error1) throw error1;
                
                db.query(sqlDeleteUser, [username], (error2, result) => {
                    if (error2) throw error2;
                    if (result.affectedRows === 0) {
                        return res.status(404).json({ message: 'User not found' });
                    }
                    res.json({ message: 'User deleted successfully' });
                });
            });
        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({ message: 'Failed to delete user' });
        }
    });
};

createUserRoutes();

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Validate input
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        // Query to get user details with role
        const sql = `SELECT u.id, u.username, u.password, r.role_name 
                    FROM users u 
                    JOIN user_roles ur ON u.id = ur.user_id 
                    JOIN roles r ON ur.role_id = r.id 
                    WHERE u.username = ?`;
                    
        db.query(sql, [username], async (error, results) => {
            if (error) throw error;
            
            // Check if user exists
            if (results.length === 0) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const user = results[0];
            
            // Verify password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            // Create payload for JWT
            const payload = {
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role_name
                }
            };

            // Generate token - this is what will be returned to the user
            jwt.sign(
                payload,
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '1h' }, // Token expires in 1 hour
                (err, token) => {
                    if (err) throw err;
                    
                    // Return token and user info in response
                    res.status(200).json({
                        success: true,
                        token: token,  // The JWT token for authentication
                        user: {
                            id: user.id,
                            username: user.username,
                            role: user.role_name
                        }
                    });
                }
            );
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
});

// Add this middleware before the routes
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ message: 'Access denied' });
    
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
};

// Chapter management routes with authentication
const createChapterRoutes = () => {
    // Add a new chapter (only admin can add)
    router.post('/addChapter', authenticateToken, async (req, res) => {
        try {
            if (req.user.user.role !== 'admin') {
                return res.status(403).json({ message: 'Only admins can add chapters' });
            }

            const { chapter_name, president_name, description } = req.body;
            
            if (!chapter_name || !president_name) {
                return res.status(400).json({ message: "Chapter name and president name are required" });
            }

            const sql = `INSERT INTO admin_chapter_table (chapter_name, president_name, description) 
                        VALUES (?, ?, ?)`;
            
            db.query(sql, [chapter_name, president_name, description || null], (error, result) => {
                if (error) {
                    if (error.code === 'ER_DUP_ENTRY') {
                        return res.status(400).json({ message: 'Chapter name already exists' });
                    }
                    throw error;
                }

                res.status(201).json({ 
                    message: 'Chapter added successfully',
                    chapter_id: result.insertId,
                    chapter_name: chapter_name
                });
            });
        } catch (error) {
            console.error('Error adding chapter:', error);
            res.status(500).json({ message: 'Failed to add chapter' });
        }
    });

    // Delete a chapter (only admin can delete)
    router.delete('/deleteChapter', authenticateToken, (req, res) => {
        try {
            if (req.user.user.role !== 'admin') {
                return res.status(403).json({ message: 'Only admins can delete chapters' });
            }

            const { chapter_id } = req.body;
            
            if (!chapter_id) {
                return res.status(400).json({ message: "Chapter ID is required" });
            }

            const sql = `DELETE FROM admin_chapter_table WHERE chapter_id = ?`;
            
            db.query(sql, [chapter_id], (error, result) => {
                if (error) throw error;
                
                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: 'Chapter not found' });
                }
                
                res.json({ message: 'Chapter deleted successfully' });
            });
        } catch (error) {
            console.error('Error deleting chapter:', error);
            res.status(500).json({ message: 'Failed to delete chapter' });
        }
    });

    // Get all chapters (accessible to all authenticated users)
    router.get('/getChapters', authenticateToken, (req, res) => {
        try {
            const sql = `SELECT * FROM admin_chapter_table`;
            db.query(sql, (error, result) => {
                if (error) throw error;
                res.json(result);
            });
        } catch (error) {
            console.error('Error fetching chapters:', error);
            res.status(500).json({ message: 'Failed to fetch chapters' });
        }
    });
};

// Initialize routes
// Initialize routes
createUserRoutes();
createChapterRoutes();

// Ensure routes are properly set up before starting the server
app.use('/api', router);

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});