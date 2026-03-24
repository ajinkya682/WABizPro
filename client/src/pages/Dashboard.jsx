import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import api from '../services/api';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';

const COLORS = ['#00A884', '#25D366', '#FFA500', '#FF4444'];

const StatCard = ({ label, value, icon, color, sub }) => (
  <Card className="p-5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-text-secondary font-medium">{label}</p>
        <p className={`text-3xl font-bold mt-1 ${color}`}>{value ?? 0}</p>
        {sub && <p className="text-xs text-text-secondary mt-1">{sub}</p>}
      </div>
      <div className="text-4xl">{icon}</div>
    </div>
  </Card>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    contacts: 0, campaigns: 0, messagesSent: 0,
    conversations: 0, newContactsThisMonth: 0,
    completedCampaigns: 0, deliveryRate: 0, readRate: 0
  });
  const [deliveryData, setDeliveryData] = useState([]);
  const [campaignData, setCampaignData] = useState([]);
  const [contactGrowth, setContactGrowth] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch one by one to avoid Promise.all timeout killing everything
      const overviewRes = await api.get('/analytics/overview').catch(() => ({ data: {} }));
      setStats(overviewRes.data || {});

      const deliveryRes = await api.get('/analytics/delivery-rates').catch(() => ({ data: [] }));
      setDeliveryData(Array.isArray(deliveryRes.data) ? deliveryRes.data : []);

      const campaignsRes = await api.get('/analytics/campaigns').catch(() => ({ data: [] }));
      setCampaignData(Array.isArray(campaignsRes.data) ? campaignsRes.data : []);

      const growthRes = await api.get('/analytics/contacts-growth').catch(() => ({ data: [] }));
      setContactGrowth(Array.isArray(growthRes.data) ? growthRes.data : []);

    } catch (err) {
      console.error('Dashboard error:', err);
      setError('Failed to load some data. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="text-text-secondary text-sm mt-3">Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-secondary text-sm mt-1">Your WhatsApp marketing overview</p>
        </div>
        <div className="flex gap-2">
          <Link to="/campaigns" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition">
            + New Campaign
          </Link>
          <Link to="/contacts" className="bg-white border border-border text-text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
            + Add Contact
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={fetchData} className="text-orange-700 font-medium hover:underline">Retry</button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Contacts" value={stats?.contacts} icon="👥" color="text-primary" sub={`+${stats?.newContactsThisMonth || 0} this month`} />
        <StatCard label="Messages Sent" value={stats?.messagesSent} icon="📨" color="text-blue-600" sub={`${stats?.deliveryRate || 0}% delivery rate`} />
        <StatCard label="Campaigns" value={stats?.campaigns} icon="📢" color="text-orange-500" sub={`${stats?.completedCampaigns || 0} completed`} />
        <StatCard label="Open Conversations" value={stats?.conversations} icon="💬" color="text-green-600" sub="Awaiting reply" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2 p-5 min-w-0">
          <h3 className="font-semibold text-text-primary mb-4">Contact Growth (30 days)</h3>
          {contactGrowth.length > 0 ? (
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={contactGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E9EDEF" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="contacts" stroke="#00A884" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-text-secondary text-sm">
              <div className="text-center">
                <p className="text-3xl mb-2">📈</p>
                <p>No contact data yet</p>
                <Link to="/contacts" className="text-primary hover:underline mt-1 block">Add contacts to see growth</Link>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-5 min-w-0">
          <h3 className="font-semibold text-text-primary mb-4">Message Status</h3>
          {deliveryData.some(d => d.value > 0) ? (
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deliveryData.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value">
                    {deliveryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-text-secondary text-sm">
              <div className="text-center">
                <p className="text-3xl mb-2">📊</p>
                <p>No messages sent yet</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Campaign Performance */}
      {campaignData.length > 0 && (
        <Card className="p-5 min-w-0">
          <h3 className="font-semibold text-text-primary mb-4">Campaign Performance</h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaignData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E9EDEF" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="sent" fill="#00A884" radius={[4, 4, 0, 0]} name="Sent" />
                <Bar dataKey="delivered" fill="#25D366" radius={[4, 4, 0, 0]} name="Delivered" />
                <Bar dataKey="read" fill="#667781" radius={[4, 4, 0, 0]} name="Read" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="p-5">
        <h3 className="font-semibold text-text-primary mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { to: '/campaigns', icon: '📢', label: 'New Campaign', color: 'bg-green-50 text-green-700 hover:bg-green-100' },
            { to: '/contacts', icon: '👥', label: 'Add Contact', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
            { to: '/templates', icon: '📋', label: 'New Template', color: 'bg-orange-50 text-orange-700 hover:bg-orange-100' },
            { to: '/inbox', icon: '💬', label: 'Open Inbox', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
          ].map(item => (
            <Link key={item.to} to={item.to}
              className={`flex items-center gap-3 p-3 rounded-lg font-medium text-sm transition ${item.color}`}>
              <span className="text-2xl">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
