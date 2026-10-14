import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { loginUser, getCurrentUser } from '../services/authService'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setLoading(true)

    try {
      // 1. Login and receive JWT token
      await loginUser(email, password)

      // 2. Ask backend who is logged in
      const user = await getCurrentUser()

      // 3. If the user originally tried to access
      //    a protected page, return them there.
      const requestedPath = location.state?.from?.pathname

      if (requestedPath) {
        navigate(requestedPath, { replace: true })
        return
      }

      // 4. Otherwise send the user based on their role
      if (user.role === 'admin') {
        navigate('/dashboard', { replace: true })
      } else {
        navigate('/products', { replace: true })
      }
    } catch (error) {
      setError(
        error.response?.data?.detail ||
        'Login failed. Check your email, password, and backend.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="form-card">
      <h1>Login</h1>

      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Login'}
        </button>
      </form>

      <p>
        New customer? <Link to="/register">Create an account</Link>
      </p>
    </section>
  )
}

export default Login