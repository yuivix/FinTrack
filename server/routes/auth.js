const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const pool = require('../db')
const authenticateToken = require('../middleware/auth')

router.post('/register', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' })
  }

  if (password.length < 8) {
  return res.status(400).json({ error: 'Password must be at least 8 characters.' })
}

if (!/[A-Z]/.test(password)) {
  return res.status(400).json({ error: 'Password must contain at least one uppercase letter.' })
}

if (!/[a-z]/.test(password)) {
  return res.status(400).json({ error: 'Password must contain at least one lowercase letter.' })
}

if (!/[0-9]/.test(password)) {
  return res.status(400).json({ error: 'Password must contain at least one number.' })
}

if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
  return res.status(400).json({ error: 'Password must contain at least one special character.' })
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(email)) {
  return res.status(400).json({ error: 'Please enter a valid email address.' })
}

try {
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
  if (existing.rows.length > 0) {
    return res.status(400).json({ error: 'An account with that email already exists.' })
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const result = await pool.query(
    'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
    [email, hashedPassword]
  )
  res.json({ user: result.rows[0] })
  } catch (err) {
  res.status(500).json({ error: err.message })
  }
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' })
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    const user = result.rows[0]
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' })

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials.' })

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({ token })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, created_at FROM users WHERE id = $1',
      [req.user.id]
    )
    res.json({ user: result.rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router