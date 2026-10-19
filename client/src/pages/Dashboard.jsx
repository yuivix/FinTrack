import { useState, useEffect } from 'react'
import axios from 'axios'
import Navbar from '../components/Navbar'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { usePlaidLink } from 'react-plaid-link'

function Dashboard() {
  const [transactions, setTransactions] = useState([])
  const [formData, setFormData] = useState({ amount: '', category: '', description: '', date: '' })
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)
  const [chartTab, setChartTab] = useState('bar')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [editFormData, setEditFormData] = useState({ amount: '', category: '', description: '', date: '' })
  const [filterStart, setFilterStart] = useState('')
  const [filterEnd, setFilterEnd] = useState('')
  const [linkToken, setLinkToken] = useState(null)
  const [bankConnected, setBankConnected] = useState(false)

  const token = localStorage.getItem('token')

  const fetchUser = async () => {
    try {
      const res = await axios.get('http://localhost:5000/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(res.data.user)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchTransactions = async () => {
    try {
      const res = await axios.get('http://localhost:5000/transactions', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setTransactions(res.data.transactions)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchLinkToken = async () => {
    try {
      const res = await axios.post('http://localhost:5000/plaid/create-link-token', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setLinkToken(res.data.link_token)
    } catch (err) {
      console.error(err)
    }
  }

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (public_token) => {
      try {
        await axios.post('http://localhost:5000/plaid/exchange-token', { public_token }, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setBankConnected(true)
      } catch (err) {
        console.error(err)
      }
    }
  })

  useEffect(() => {
    fetchUser()
    fetchTransactions()
    fetchLinkToken()
  }, [])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.post('http://localhost:5000/transactions', formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setFormData({ amount: '', category: '', description: '', date: '' })
      fetchTransactions()
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/transactions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchTransactions()
    } catch (err) {
      console.error(err)
    }
  }

  const handleEditClick = (transaction) => {
    setEditingTransaction(transaction)
    setEditFormData({
      amount: transaction.amount,
      category: transaction.category,
      description: transaction.description || '',
      date: transaction.date?.slice(0, 10)
    })
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.put(`http://localhost:5000/transactions/${editingTransaction.id}`, editFormData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setEditingTransaction(null)
      fetchTransactions()
    } catch (err) {
      console.error(err)
    }
  }

  const handleSync = async () => {
    try {
      const res = await axios.post('http://localhost:5000/plaid/sync', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert(res.data.message)
      fetchTransactions()
    } catch (err) {
      console.error(err)
    }
  }

  const totalThisMonth = transactions
    .filter(t => new Date(t.date).getMonth() === new Date().getMonth() &&
      new Date(t.date).getFullYear() === new Date().getFullYear())
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)

  const topCategory = transactions.length > 0
    ? Object.entries(
      transactions.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount)
        return acc
      }, {})
    ).sort((a, b) => b[1] - a[1])[0][0]
    : '—'

  const filteredTransactions = transactions.filter(t => {
    const date = new Date(t.date)
    const start = filterStart ? new Date(filterStart) : null
    const end = filterEnd ? new Date(filterEnd) : null
    if (start && date < start) return false
    if (end && date > end) return false
    return true
  })

  const years = [...new Set(transactions.map(t => new Date(t.date).getFullYear()))].sort((a, b) => b - a)
  if (!years.includes(selectedYear)) years.push(selectedYear)

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  const barData = Object.entries(
    transactions
      .filter(t => new Date(t.date).getFullYear() === selectedYear && new Date(t.date).getMonth() === selectedMonth)
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount)
        return acc
      }, {})
  ).map(([category, amount]) => ({ category, amount: parseFloat(amount.toFixed(2)) }))

  const lineData = months.map((month, i) => ({
    month: month.slice(0, 3),
    amount: parseFloat(
      transactions
        .filter(t => new Date(t.date).getFullYear() === selectedYear && new Date(t.date).getMonth() === i)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)
        .toFixed(2)
    )
  }))

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif' }}>
      <Navbar user={user} />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>

        {/* Dashboard Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#111' }}>Dashboard</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => open()} disabled={!ready} style={{ ...btnStyle, background: '#1a2e1a', padding: '10px 20px', fontSize: '14px' }}>
              {bankConnected ? '✓ Bank Connected' : 'Connect Bank'}
            </button>
            {bankConnected && (
              <button onClick={handleSync} style={{ ...btnStyle, padding: '10px 20px', fontSize: '14px' }}>
                Sync Transactions
              </button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <div style={summaryCard}>
            <div style={summaryLabel}>Spent This Month</div>
            <div style={summaryValue}>${totalThisMonth.toFixed(2)}</div>
          </div>
          <div style={summaryCard}>
            <div style={summaryLabel}>Total Transactions</div>
            <div style={summaryValue}>{transactions.length}</div>
          </div>
          <div style={summaryCard}>
            <div style={summaryLabel}>Top Category</div>
            <div style={summaryValue}>{topCategory}</div>
          </div>
        </div>

        {/* Add Transaction + Recent Transactions side by side */}
        <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>

          {/* Add Transaction */}
          <div style={{ ...cardStyle, flex: 1, marginBottom: 0 }}>
            <h2 style={sectionTitle}>Add Transaction</h2>
            {error && <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input name="amount" type="number" placeholder="Amount" value={formData.amount} onChange={handleChange} required style={inputStyle} />
              <select name="category" value={formData.category} onChange={handleChange} required style={inputStyle}>
                <option value="">Select category</option>
                <option value="Food">Food</option>
                <option value="Shopping">Shopping</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Transport">Transport</option>
                <option value="Health">Health</option>
                <option value="Other">Other</option>
              </select>
              <input name="description" type="text" placeholder="Description (optional)" value={formData.description} onChange={handleChange} style={inputStyle} />
              <input name="date" type="date" value={formData.date} onChange={handleChange} required style={inputStyle} />
              <button type="submit" style={btnStyle}>Add Transaction</button>
            </form>
          </div>

          {/* Recent Transactions */}
          <div style={{ ...cardStyle, flex: 1, marginBottom: 0, maxHeight: '335px', overflowY: 'auto' }}>
            <h2 style={sectionTitle}>Recent Transactions</h2>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
              <input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)} style={{ ...inputStyle, fontSize: '12px', padding: '6px 10px' }} />
              <span style={{ color: '#888', fontSize: '12px' }}>to</span>
              <input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} style={{ ...inputStyle, fontSize: '12px', padding: '6px 10px' }} />
              {(filterStart || filterEnd) && (
                <button onClick={() => { setFilterStart(''); setFilterEnd('') }} style={{ background: '#f0f0f0', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer', color: '#555' }}>
                  Clear
                </button>
              )}
            </div>
            {filteredTransactions.length === 0 ? (
              <p style={{ color: '#888', fontSize: '14px' }}>No transactions yet.</p>
            ) : (
              filteredTransactions.map(t => (
                <div key={t.id} style={transactionRow}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '15px', color: '#111' }}>{t.category}</div>
                    <div style={{ color: '#888', fontSize: '13px' }}>
                      {t.description ? `${t.description} · ` : ''}{new Date(t.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ fontWeight: '600', fontSize: '16px', color: '#1a2e1a' }}>${t.amount}</div>
                    <button onClick={() => handleEditClick(t)} style={editBtn}>Edit</button>
                    <button onClick={() => handleDelete(t.id)} style={deleteBtn}>Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

        {/* Spending Overview */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={sectionTitle}>Spending Overview</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} style={inputStyle}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              {chartTab === 'bar' && (
                <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} style={inputStyle}>
                  {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            <button onClick={() => setChartTab('bar')} style={{ ...tabBtn, background: chartTab === 'bar' ? '#1a2e1a' : '#f0f0f0', color: chartTab === 'bar' ? '#fff' : '#555' }}>
              By Category
            </button>
            <button onClick={() => setChartTab('line')} style={{ ...tabBtn, background: chartTab === 'line' ? '#1a2e1a' : '#f0f0f0', color: chartTab === 'line' ? '#fff' : '#555' }}>
              By Month
            </button>
          </div>

          {chartTab === 'bar' ? (
            barData.length === 0 ? (
              <p style={{ color: '#888', fontSize: '14px' }}>No transactions for this period.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => `$${value}`} />
                  <Bar dataKey="amount" fill="#1a2e1a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => `$${value}`} />
                <Line type="monotone" dataKey="amount" stroke="#1a2e1a" strokeWidth={2} dot={{ fill: '#1a2e1a' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

      {/* Edit Modal */}
      {editingTransaction && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h2 style={{ ...sectionTitle, marginBottom: '20px' }}>Edit Transaction</h2>
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input name="amount" type="number" value={editFormData.amount} onChange={e => setEditFormData({ ...editFormData, amount: e.target.value })} required style={inputStyle} />
              <select name="category" value={editFormData.category} onChange={e => setEditFormData({ ...editFormData, category: e.target.value })} required style={inputStyle}>
                <option value="">Select category</option>
                <option value="Food">Food</option>
                <option value="Shopping">Shopping</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Transport">Transport</option>
                <option value="Health">Health</option>
                <option value="Other">Other</option>
              </select>
              <input name="description" type="text" placeholder="Description (optional)" value={editFormData.description} onChange={e => setEditFormData({ ...editFormData, description: e.target.value })} style={inputStyle} />
              <input name="date" type="date" value={editFormData.date} onChange={e => setEditFormData({ ...editFormData, date: e.target.value })} required style={inputStyle} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" style={{ ...btnStyle, flex: 1 }}>Save Changes</button>
                <button type="button" onClick={() => setEditingTransaction(null)} style={{ ...btnStyle, flex: 1, background: '#f0f0f0', color: '#555' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

const cardStyle = {
  background: '#fff',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '24px',
  border: '1px solid #eee',
}

const sectionTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#111',
  marginBottom: '16px',
}

const inputStyle = {
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1.5px solid #e0e0e0',
  fontSize: '14px',
  outline: 'none',
  fontFamily: 'sans-serif',
}

const btnStyle = {
  padding: '12px',
  background: '#1e3a8a',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  fontSize: '15px',
  fontWeight: '500',
  cursor: 'pointer',
}

const transactionRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '14px 0',
  borderBottom: '1px solid #f0f0f0',
  minHeight: '64px',
}

const deleteBtn = {
  background: '#fee2e2',
  color: '#dc2626',
  border: 'none',
  borderRadius: '6px',
  padding: '6px 12px',
  cursor: 'pointer',
  fontSize: '13px',
}

const summaryCard = {
  flex: 1,
  background: '#fff',
  borderRadius: '12px',
  padding: '20px 24px',
  border: '1px solid #eee',
}

const summaryLabel = {
  fontSize: '12px',
  color: '#888',
  marginBottom: '8px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

const summaryValue = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#1a2e1a',
}

const tabBtn = {
  padding: '6px 16px',
  borderRadius: '6px',
  border: 'none',
  fontSize: '13px',
  fontWeight: '500',
  cursor: 'pointer',
}

const editBtn = {
  background: '#e8f0fe',
  color: '#1e3a8a',
  border: 'none',
  borderRadius: '6px',
  padding: '6px 12px',
  cursor: 'pointer',
  fontSize: '13px',
}

const modalOverlay = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 200,
}

const modalBox = {
  background: '#fff',
  borderRadius: '16px',
  padding: '32px',
  width: '100%',
  maxWidth: '440px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
}

export default Dashboard