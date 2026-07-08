const express = require('express')
const router = express.Router()
/* 
    Pool is a connection pool to the PostgreSQL database, which allows for efficient management of database connections.
    Connections are reused from the pool, which reduces the overhead of establishing a new connection for each request.
*/
const pool = require('../db')
const authenticateToken = require('../middleware/auth')

// get all transactions for logged in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC',
      [req.user.id]
    )
    res.json({ transactions: result.rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// add a transaction
router.post('/', authenticateToken, async (req, res) => {
  const { amount, category, description, date } = req.body

  if (!amount || !category || !date) {
    return res.status(400).json({ error: 'Amount, category and date are required.' })
  }

  try {
    const result = await pool.query(
      'INSERT INTO transactions (user_id, amount, category, description, date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, amount, category, description, date]
    )
    res.json({ transaction: result.rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Delete a transaction
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found.' })
    }
    res.json({ message: 'Transaction deleted.' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// update a transaction
router.put('/:id', authenticateToken, async (req, res) => {
  const { amount, category, description, date } = req.body

  if (!amount || !category || !date) {
    return res.status(400).json({ error: 'Amount, category and date are required.' })
  }

  try {
    const result = await pool.query(
      'UPDATE transactions SET amount = $1, category = $2, description = $3, date = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
      [amount, category, description, date, req.params.id, req.user.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found.' })
    }
    res.json({ transaction: result.rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router