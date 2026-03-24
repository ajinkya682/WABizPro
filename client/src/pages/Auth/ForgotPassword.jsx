import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

const ForgotPassword = () => {
  const { forgotPassword, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    const res = await forgotPassword(email);
    if (res.success) {
      toast.success('Reset link sent!');
      setIsSent(true);
    } else {
      toast.error(res.message || 'Failed to send reset link');
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center relative">
        <Link to="/login" className="absolute left-6 top-6 text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1 text-sm font-medium">
          <ArrowLeft size={16} /> Back
        </Link>

        {isSent ? (
          <div className="py-8 animate-in fade-in zoom-in duration-300 flex flex-col items-center">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center text-success mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Check your email</h2>
            <p className="text-text-secondary text-base mb-8 px-4">
              We have sent a password reset link to <br/>
              <span className="font-semibold text-text-primary">{email}</span>
            </p>
            <Button onClick={() => window.open('https://gmail.com')} className="w-full">
              Open Email App
            </Button>
          </div>
        ) : (
          <div className="mt-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-6">
              <Mail size={32} />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Forgot Password?</h2>
            <p className="text-text-secondary text-sm mb-8 px-4">
              No worries, we'll send you reset instructions.
            </p>

            <form onSubmit={handleSubmit} className="text-left space-y-6">
              <Input 
                label="Email Address" 
                type="email" 
                placeholder="Enter your email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? <Spinner size="sm" /> : 'Reset Password'}
              </Button>
            </form>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ForgotPassword;
