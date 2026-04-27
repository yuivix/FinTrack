import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import './Auth.css'

function Login() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post('http://localhost:5000/auth/login', formData)
      localStorage.setItem('token', res.data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials')
    }
  }

  return (
    <div className="page-bg">
      <div className="wrap">
        <div className="left">
          <div className="logo">FinTrack</div>
          <div className="header-row">
            <img src="/src/assets/money.png" alt="FinTrack logo" className="logo-icon" />
            <h2>Welcome Back</h2>
          </div>
          <p className="sub">Log in to your FinTrack account</p>
          <div className="divider"></div>
          {error && <p className="auth-error">{error}</p>}
          <form onSubmit={handleSubmit}>
            <div className="field">
              <div className="field-label">Email</div>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="field">
              <div className="field-label">Password</div>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <button type="submit" className="btn-primary">Log in</button>
          </form>
          <div className="login-row">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </div>
        </div>
        <div className="right">
          <div className="right-title">
            <h2>Take control<br />of your finances,<br />today</h2>
          </div>
          <div className="card">
            <div className="card-balance">12,347.23 $</div>
            <div className="card-balance-label">Combined balance</div>
            <div className="card-divider"></div>
            <div className="card-row">
              <div>
                <div className="card-name">Primary Card</div>
                <div className="card-num">3495 •••• •••• 6917</div>
              </div>
              <div className="card-amount">2,546.64$</div>
            </div>
            <div className="card-footer">
              <div className="card-visa">VISA</div>
              <button className="card-view">View All</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login