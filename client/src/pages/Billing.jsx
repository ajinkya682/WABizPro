import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import { Check, CreditCard, Download, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const PLANS = [
  { id: 'starter', name: 'Starter', price: 2900, priceStr: '₹2,900', contacts: 1000, campaigns: 5, features: ['1,000 Contacts', '5 Campaigns/mo', 'Basic Templates', 'Standard Support'] },
  { id: 'pro', name: 'Pro', price: 7900, priceStr: '₹7,900', contacts: 10000, campaigns: -1, features: ['10,000 Contacts', 'Unlimited Campaigns', 'Advanced Analytics', 'Priority Support', 'Chatbot Builder'], popular: true },
  { id: 'elite', name: 'Elite', price: 14900, priceStr: '₹14,900', contacts: -1, campaigns: -1, features: ['Unlimited Contacts', 'Unlimited Campaigns', 'White-label Support', 'Dedicated Account Mgr', 'Custom Integrations'] }
];

const Billing = () => {
  const [sub, setSub] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState(null);

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const res = await api.get('/billing/subscription');
        setSub(res.data.subscription);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchBilling();
  }, []);

  const handleUpgrade = async (planId, amount) => {
    setProcessingPlan(planId);
    try {
      if (!window.Razorpay) {
        throw new Error('Razorpay checkout is not loaded yet');
      }

      const { data } = await api.post('/billing/create-order', { planId, amount });
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, 
        amount: data.amount,
        currency: data.currency,
        name: "WABiz Pro",
        description: `${planId} Plan Upgrade`,
        order_id: data.id,
        handler: async function (response) {
          try {
            await api.post('/billing/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId
            });
            toast.success('Payment successful! Plan upgraded.');
            setSub({ ...sub, planId, status: 'active', currentPeriodEnd: new Date(Date.now() + 30*24*60*60*1000) });
          } catch (err) { toast.error('Payment verification failed'); }
        },
        prefill: { name: "User", email: "user@example.com" },
        theme: { color: "#00A884" }
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){ toast.error(response.error.description); });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initialize payment');
    } finally {
      setProcessingPlan(null);
    }
  };

  if (loading) return <div className="flex h-full items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="h-full flex flex-col space-y-6 max-w-6xl mx-auto pb-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Billing & Plans</h1>
        <p className="text-sm text-text-secondary mt-1">Manage your subscription and billing history</p>
      </div>

      <div className="bg-[#1A1A2E] text-white rounded-2xl p-6 md:p-8 flex items-center justify-between shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary rounded-full blur-[100px] opacity-20 -mr-20 -mt-20"></div>
        <div className="relative z-10 w-full">
          <div className="flex justify-between items-start w-full">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold capitalize">{sub?.planId || 'Starter'} Plan</h2>
                <Badge variant={sub?.status === 'active' ? 'success' : 'warning'}>{sub?.status || 'Active'}</Badge>
              </div>
              <p className="text-gray-400">
                Your next billing date is <span className="text-white font-medium">{sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString()}</span>
              </p>
            </div>
            
            <div className="flex items-center gap-4 bg-white/10 px-4 py-3 rounded-xl border border-white/10 backdrop-blur-md">
              <div className="text-center px-4 border-r border-white/20">
                <div className="text-3xl font-bold text-primary">{sub?.messagesSent || 0}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">Msgs Sent</div>
              </div>
              <div className="text-center px-4">
                <div className="text-3xl font-bold text-white">{sub?.contactsCount || 0}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">Contacts</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-bold text-text-primary mb-6 text-center">Setup your plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PLANS.map(plan => (
            <Card key={plan.id} className={`p-8 relative ${plan.popular ? 'border-2 border-primary shadow-xl scale-105 z-10' : 'border border-border'}`}>
              {plan.popular && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">Most Popular</div>}
              
              <h3 className="text-2xl font-bold text-text-primary mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-text-primary">{plan.priceStr}</span>
                <span className="text-text-secondary">/month</span>
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex gap-3 text-text-secondary text-sm items-center">
                    <Check size={18} className="text-primary flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>

              <Button 
                onClick={() => handleUpgrade(plan.id, plan.price)} 
                variant={plan.popular ? 'primary' : 'outline'} 
                className="w-full py-3"
                disabled={processingPlan === plan.id || sub?.planId === plan.id}
              >
                {processingPlan === plan.id ? <Spinner size="sm" /> : sub?.planId === plan.id ? 'Current Plan' : 'Upgrade Plan'}
              </Button>
            </Card>
          ))}
        </div>
      </div>
      
      <div className="mt-8">
        <h3 className="text-lg font-bold text-text-primary mb-4">Billing History</h3>
        <Card className="p-0 overflow-hidden border-border">
          {invoices.length > 0 ? (
            <table className="w-full text-sm">
               <thead className="bg-gray-50 border-b border-border">
                 <tr>
                   <th className="text-left py-3 px-4 font-semibold text-text-secondary uppercase text-xs tracking-wide">Date</th>
                   <th className="text-left py-3 px-4 font-semibold text-text-secondary uppercase text-xs tracking-wide">Amount</th>
                   <th className="text-left py-3 px-4 font-semibold text-text-secondary uppercase text-xs tracking-wide">Plan</th>
                   <th className="text-left py-3 px-4 font-semibold text-text-secondary uppercase text-xs tracking-wide">Status</th>
                   <th className="text-left py-3 px-4 font-semibold text-text-secondary uppercase text-xs tracking-wide">Invoice</th>
                 </tr>
               </thead>
               <tbody>
                 {invoices.map((inv, i) => (
                   <tr key={i} className="border-b border-border last:border-0 hover:bg-gray-50/50 transition">
                     <td className="py-3 px-4 text-text-primary">{new Date(inv.date).toLocaleDateString()}</td>
                     <td className="py-3 px-4 text-text-primary">{inv.amount}</td>
                     <td className="py-3 px-4 text-text-primary capitalize">{inv.planId}</td>
                     <td className="py-3 px-4"><Badge variant="success">Paid</Badge></td>
                     <td className="py-3 px-4"><button className="text-text-secondary hover:text-primary"><Download size={18}/></button></td>
                   </tr>
                 ))}
               </tbody>
            </table>
          ) : (
             <div className="p-8 text-center text-text-secondary text-sm">No billing history found.</div>
          )}
        </Card>
      </div>

    </div>
  );
};
export default Billing;
