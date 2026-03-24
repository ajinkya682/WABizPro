import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }
    const res = await login(formData.email, formData.password, formData.rememberMe);
    if (res.success) {
      toast.success('Logged in successfully!');
      navigate('/dashboard');
    } else {
      setError(res.message);
      toast.error(res.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-2 text-primary font-bold text-3xl mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">✨</div>
            WABiz Pro
          </div>
          <p className="text-text-secondary">Welcome back! Please login to your account.</p>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input 
            label="Email Address" 
            name="email" 
            type="email" 
            placeholder="john@example.com"
            value={formData.email}
            onChange={handleChange}
            required 
          />
          
          <div className="relative">
            <Input 
              label="Password" 
              name="password" 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required 
            />
            <button 
              type="button" 
              className="absolute right-3 top-[34px] text-gray-500 hover:text-text-primary"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                name="rememberMe" 
                checked={formData.rememberMe}
                onChange={handleChange}
                className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
              />
              <span className="text-text-secondary">Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-primary hover:text-primary-dark font-medium transition-colors">
              Forgot Password?
            </Link>
          </div>

          <Button type="submit" className="w-full h-11 text-base mt-2" disabled={isLoading}>
            {isLoading ? <Spinner size="sm" /> : 'Login'}
          </Button>
        </form>

        <p className="text-center text-text-secondary text-sm mt-8">
          Don't have an account? <Link to="/register" className="text-primary hover:text-primary-dark font-medium transition-colors">Register</Link>
        </p>
      </Card>
    </div>
  );
};

export default Login;
