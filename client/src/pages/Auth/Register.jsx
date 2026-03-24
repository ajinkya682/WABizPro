import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';

const calculateStrength = (pwd) => {
  let s = 0;
  if (pwd.length > 5) s += 1;
  if (pwd.length > 8) s += 1;
  if (/[A-Z]/.test(pwd)) s += 1;
  if (/[0-9]/.test(pwd)) s += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) s += 1;
  return s;
};

const Register = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({ name: '', businessName: '', email: '', password: '', confirmPassword: '', terms: false });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const pwdStrength = calculateStrength(formData.password);
  const strengthText = ['Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][pwdStrength] || 'Weak';
  const strengthColor = ['bg-danger', 'bg-danger', 'bg-warning', 'bg-primary', 'bg-success', 'bg-success'][pwdStrength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match'); return;
    }
    if (!formData.terms) {
      setError('You must accept the terms and conditions'); return;
    }
    const res = await register({
      name: formData.name, email: formData.email, password: formData.password, businessName: formData.businessName
    });
    if (res.success) {
      toast.success('Registration successful! Welcome aboard. 🚀');
      navigate('/dashboard');
    } else {
      setError(res.message);
      toast.error(res.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 py-8">
      <Card className="w-full max-w-lg p-8">
        <div className="text-center mb-6">
          <div className="flex justify-center items-center gap-2 text-primary font-bold text-3xl mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">✨</div>
            WABiz Pro
          </div>
          <p className="text-text-secondary">Create a new account and launch your business.</p>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name *" name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} required />
          <Input label="Business Name *" name="businessName" placeholder="Acme Corp" value={formData.businessName} onChange={handleChange} required />
          <Input label="Email Address *" name="email" type="email" placeholder="john@acme.com" value={formData.email} onChange={handleChange} required />
          
          <div>
            <Input label="Password *" name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
            {formData.password.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden flex">
                  <div className={`h-full ${strengthColor} transition-all duration-300`} style={{ width: `${(pwdStrength / 5) * 100}%` }}></div>
                </div>
                <span className="text-[10px] uppercase font-bold text-text-secondary w-16 text-right w-20">{strengthText}</span>
              </div>
            )}
          </div>
          
          <Input label="Confirm Password *" name="confirmPassword" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} required />

          <label className="flex items-start gap-2 cursor-pointer mt-2">
            <input type="checkbox" name="terms" checked={formData.terms} onChange={handleChange} className="rounded border-gray-300 text-primary mt-1 w-4 h-4 cursor-pointer" />
            <span className="text-sm text-text-secondary">
              I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
            </span>
          </label>

          <Button type="submit" className="w-full h-11 text-base mt-4" disabled={isLoading}>
            {isLoading ? <Spinner size="sm" /> : 'Create Account'}
          </Button>
        </form>

        <p className="text-center text-text-secondary text-sm mt-6">
          Already have an account? <Link to="/login" className="text-primary hover:text-primary-dark font-medium transition-colors">Login</Link>
        </p>
      </Card>
    </div>
  );
};

export default Register;
