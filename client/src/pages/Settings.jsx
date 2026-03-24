import React, { useState, useEffect } from 'react';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import { Save, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const DEFAULT_API_BASE_URL = 'https://wabizpro.onrender.com/api';

const Settings = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [business, setBusiness] = useState({
    name: '', phone: '', email: '', address: '', about: '',
    metaAppId: '', metaBusinessId: '', phoneNumberId: '', systemUserToken: '', webhookVerifyToken: ''
  });

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const res = await api.get('/business');
        if (res.data.business) {
          setBusiness({
            name: '',
            phone: '',
            email: '',
            address: '',
            about: '',
            metaAppId: '',
            metaBusinessId: '',
            phoneNumberId: '',
            systemUserToken: '',
            webhookVerifyToken: '',
            ...res.data.business,
            metaAppId: res.data.business.metaApiConfig?.appId || '',
            metaBusinessId: res.data.business.metaApiConfig?.businessAccountId || res.data.business.wabaId || '',
            phoneNumberId: res.data.business.whatsappPhoneNumberId || '',
            systemUserToken: res.data.business.metaApiConfig?.systemUserToken || res.data.business.whatsappAccessToken || '',
            webhookVerifyToken: res.data.business.metaApiConfig?.webhookVerifyToken || '',
          });
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchBusiness();
  }, []);

  const handleChange = (e) => setBusiness({ ...business, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: business.name, phone: business.phone, email: business.email, address: business.address, about: business.about,
        whatsappAccessToken: business.systemUserToken,
        whatsappPhoneNumberId: business.phoneNumberId,
        wabaId: business.metaBusinessId,
        metaApiConfig: {
          appId: business.metaAppId,
          businessAccountId: business.metaBusinessId,
          systemUserToken: business.systemUserToken,
          webhookVerifyToken: business.webhookVerifyToken
        }
      };
      await api.put('/business', payload);
      toast.success('Settings updated successfully');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update settings'); }
    finally { setSaving(false); }
  };

  const generateToken = () => {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setBusiness({ ...business, webhookVerifyToken: token });
  };

  if (loading) return <div className="flex h-full items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="h-full flex flex-col space-y-6 max-w-5xl mx-auto pb-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary mt-1">Manage your business profile and integrations</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-text-primary border-b border-border pb-4 mb-4">Business Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Business Name" name="name" value={business.name} onChange={handleChange} required />
            <Input label="Business Email" type="email" name="email" value={business.email} onChange={handleChange} required />
            <Input label="WhatsApp Phone Number" name="phone" value={business.phone} onChange={handleChange} placeholder="e.g. +1234567890" required />
            <Input label="Address" name="address" value={business.address} onChange={handleChange} />
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-text-primary mb-1.5 block">About Business</label>
              <textarea 
                name="about" value={business.about} onChange={handleChange} 
                className="w-full px-4 py-2 bg-white border border-border rounded-lg outline-none focus:border-primary min-h-[100px] resize-y"
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-text-primary border-b border-border pb-4 mb-4">Meta API Integration</h2>
          <p className="text-sm text-text-secondary mb-6">
            Connect your WhatsApp Business API account to send and receive messages. 
            <a href="#" className="text-primary hover:underline ml-1">Read the setup guide</a>.
          </p>

          <div className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-medium text-text-primary">WhatsApp Business Account ID</label>
                {business.metaBusinessId ? <span className="flex items-center gap-1 text-xs text-success font-medium"><CheckCircle size={14}/> Configured</span> : <span className="flex items-center gap-1 text-xs text-danger font-medium"><AlertCircle size={14}/> Missing</span>}
              </div>
              <input type="text" name="metaBusinessId" value={business.metaBusinessId} onChange={handleChange} className="w-full px-4 py-2 bg-white border border-border rounded-lg outline-none focus:border-primary" placeholder="e.g. 101234567890123" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-medium text-text-primary">Meta App ID</label>
                {business.metaAppId ? <span className="flex items-center gap-1 text-xs text-success font-medium"><CheckCircle size={14}/> Configured</span> : <span className="flex items-center gap-1 text-xs text-danger font-medium"><AlertCircle size={14}/> Missing</span>}
              </div>
              <input type="text" name="metaAppId" value={business.metaAppId} onChange={handleChange} className="w-full px-4 py-2 bg-white border border-border rounded-lg outline-none focus:border-primary" placeholder="e.g. 123456789012345" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-medium text-text-primary">System User Access Token</label>
                {business.systemUserToken ? <span className="flex items-center gap-1 text-xs text-success font-medium"><CheckCircle size={14}/> Configured</span> : <span className="flex items-center gap-1 text-xs text-danger font-medium"><AlertCircle size={14}/> Missing</span>}
              </div>
              <input type="password" name="systemUserToken" value={business.systemUserToken} onChange={handleChange} className="w-full px-4 py-2 bg-white border border-border rounded-lg outline-none focus:border-primary" placeholder="EAAB..." />
              <p className="text-xs text-text-secondary mt-1">Needs permanent token with 'whatsapp_business_messaging' and 'whatsapp_business_management' permissions.</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-medium text-text-primary">Phone Number ID</label>
                {business.phoneNumberId ? <span className="flex items-center gap-1 text-xs text-success font-medium"><CheckCircle size={14}/> Configured</span> : <span className="flex items-center gap-1 text-xs text-danger font-medium"><AlertCircle size={14}/> Missing</span>}
              </div>
              <input type="text" name="phoneNumberId" value={business.phoneNumberId} onChange={handleChange} className="w-full px-4 py-2 bg-white border border-border rounded-lg outline-none focus:border-primary" placeholder="e.g. 123456789012345" />
              <p className="text-xs text-text-secondary mt-1">This is required for real WhatsApp sending and webhook mapping.</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-medium text-text-primary">Webhook Verify Token</label>
                {business.webhookVerifyToken ? <span className="flex items-center gap-1 text-xs text-success font-medium"><CheckCircle size={14}/> Configured</span> : <span className="flex items-center gap-1 text-xs text-danger font-medium"><AlertCircle size={14}/> Missing</span>}
              </div>
              <div className="flex gap-2">
                <input type="text" name="webhookVerifyToken" value={business.webhookVerifyToken} onChange={handleChange} className="flex-1 px-4 py-2 bg-white border border-border rounded-lg outline-none focus:border-primary" placeholder="Custom random string" />
                <Button type="button" variant="outline" onClick={generateToken}><RefreshCw size={18}/></Button>
              </div>
              <p className="text-xs text-text-secondary mt-1">Copy this exact token when setting up the webhook in your Meta App Dashboard.</p>
            </div>
            
            {business.webhookVerifyToken && (
               <div className="p-4 bg-[#F0F2F5] rounded-xl border border-border mt-4">
                 <h4 className="font-semibold text-sm mb-2 text-text-primary">Webhook Configuration Values to use in Meta:</h4>
                 <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                   <div className="font-medium text-text-secondary">Callback URL:</div>
                   <div className="font-mono bg-white px-2 py-0.5 rounded border border-border truncate">{import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL}/webhook/whatsapp</div>
                   <div className="font-medium text-text-secondary">Verify Token:</div>
                   <div className="font-mono bg-white px-2 py-0.5 rounded border border-border">{business.webhookVerifyToken}</div>
                 </div>
               </div>
            )}
          </div>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={saving}>
            {saving ? <Spinner size="sm"/> : <Save size={18} />} Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};
export default Settings;
