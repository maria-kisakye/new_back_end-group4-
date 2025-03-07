const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
require('dotenv').config();

const router = express.Router();

// User registration with role selection (student, president, admin)
router.post('/register', (req, res) => {
    const { name, email, password, role } = req.body;
    const validRoles = ["student", "president", "admin"];

    if (!name || !email || !password || !role || !validRoles.includes(role.toLowerCase())) {
        return res.status(400).json({ message: "All fields are required, and role must be student, president, or admin" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const sql = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";

    db.query(sql, [name, email, hashedPassword, role.toLowerCase()], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "User registered successfully" });
    });
});

// Register user
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    let user = await db.User.findOne({ where: { email } });

    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = await db.User.create({
      name,
      email,
      password,
      role
    });

    const payload = {
      user: {
        id: user.id,
        role: user.role
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
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.status(200).json({ token, role: user.role });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};