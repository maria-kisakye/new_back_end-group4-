const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./config');
require('dotenv').config();

const auth = require('./authenticate');
const router = express.Router();
const { register, login } = require('./authenticate');

// User registration with role selection (student, president, admin)
router.post('/register', (req, res) => {
    const {id, name, email, password } = req.body;
    // const validRoles = ["student", "president", "admin"];

    if (!id || !name || !email || !password ) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const sql = "INSERT INTO users (id,name, email, password) VALUES (?, ?, ?, ?)";

    db.query(sql, [id, name, email, hashedPassword], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "User registered successfully" });
    });
});

// // Register user
// exports.register = async (req, res) => {
//   const {id, name, email, password} = req.body;

//   try {
//     let user = await db.User.findOne({ where: { email } });

//     if (user) {
//       return res.status(400).json({ message: 'User already exists' });
//     }

//     user = await db.User.create({
//       id,
//       name,
//       email,
//       password
//     });

//     const payload = {
//       user: {
//         id: user.id
//         // role: user.role
//       }
//     };

//     jwt.sign(
//       payload,
//       process.env.JWT_SECRET,
//       { expiresIn: '1h' },
//       (err, token) => {
//         if (err) throw err;
//         res.status(200).json({ token });
//       }
//     );
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server error');
//   }
// };

// Login user
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await db.User.findOne({ where: { email } });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: user.id
        // role: user.role
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
// Middleware to verify token
exports.verifyToken = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Middleware to authorize admin users
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

// Middleware to authorize chapter presidents
exports.isChapterPresident = (req, res, next) => {
  if (req.user.role !== 'Chapter_president') {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

// Middleware to authorize students
exports.isStudent = (req, res, next) => {
  if (req.user.role !== 'Student') {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

module.exports = router;
module.exports = auth;
module.exports = {
  register
};
module.exports = {
  login
};

// Register user
// router.post('/register', register);

// Login user
// router.post('/login', login);