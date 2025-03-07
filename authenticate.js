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