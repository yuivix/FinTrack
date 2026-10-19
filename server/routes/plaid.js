const express = require('express')
const router = express.Router()
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid')
const pool = require('../db')
const authenticateToken = require('../middleware/auth')

const config = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
})

const plaidClient = new PlaidApi(config)

// Create a link token
router.post('/create-link-token', authenticateToken, async (req, res) => {
  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: String(req.user.id) },
      client_name: 'FinTrack',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en',
    })
    res.json({ link_token: response.data.link_token })
  } catch (err) {
    console.error(err.response?.data || err.message)
    res.status(500).json({ error: 'Failed to create link token' })
  }
})

// Exchange public token for access token
router.post('/exchange-token', authenticateToken, async (req, res) => {
  const { public_token } = req.body
  try {
    const response = await plaidClient.itemPublicTokenExchange({ public_token })
    const accessToken = response.data.access_token

    await pool.query(
      'UPDATE users SET plaid_access_token = $1 WHERE id = $2',
      [accessToken, req.user.id]
    )
    res.json({ message: 'Bank account connected successfully' })
  } catch (err) {
    console.error(err.response?.data || err.message)
    res.status(500).json({ error: 'Failed to exchange token' })
  }
})

// Sync transactions from Plaid
router.post('/sync', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT plaid_access_token FROM users WHERE id = $1', [req.user.id])
    const accessToken = result.rows[0]?.plaid_access_token

    if (!accessToken) return res.status(400).json({ error: 'No bank account connected' })

    const now = new Date()
    const startDate = new Date(now.setMonth(now.getMonth() - 1)).toISOString().slice(0, 10)
    const endDate = new Date().toISOString().slice(0, 10)

    const response = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
    })

    const plaidTransactions = response.data.transactions

    for (const t of plaidTransactions) {
      await pool.query(
        `INSERT INTO transactions (user_id, amount, category, description, date)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [
          req.user.id,
          Math.abs(t.amount),
          t.category?.[0] || 'Other',
          t.name,
          t.date,
        ]
      )
    }

    res.json({ message: `${plaidTransactions.length} transactions synced` })
  } catch (err) {
    console.error(err.response?.data || err.message)
    res.status(500).json({ error: 'Failed to sync transactions' })
  }
})

module.exports = router