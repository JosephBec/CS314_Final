import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './context/AuthContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={
              <div>
                <Login />
                <p>
                  Don't have an account? <Link to="/register">Register here</Link>
                </p>
              </div>
            } />
            <Route path="/register" element={
              <div>
                <Register />
                <p>
                  Already have an account? <Link to="/login">Login here</Link>
                </p>
              </div>
            } />
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
