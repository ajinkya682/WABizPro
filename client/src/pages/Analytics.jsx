import React, { useEffect, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import { BarChart2, MessageSquare, TrendingUp, Users } from 'lucide-react';

const Analytics = () => {
  const [range, setRange] = useState(30);
  const [data, setData] = useState({ overview: {}, messages: [], campaigns: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [oRes, mRes, cRes] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/analytics/messages', { params: { days: range } }),
          api.get('/analytics/campaigns'),
        ]);
        setData({
          overview: oRes.data || {},
          messages: Array.isArray(mRes.data) ? mRes.data : [],
          campaigns: Array.isArray(cRes.data) ? cRes.data : [],
        });
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [range]);

  if (loading) return <div className="h-full flex items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Analytics Deep Dive</h1>
          <p className="text-sm text-text-secondary mt-1">Detailed performance metrics</p>
        </div>
        <select value={range} onChange={e => setRange(Number(e.target.value))} className="px-4 py-2 border border-border rounded-lg bg-white shadow-sm outline-none focus:border-primary">
          <option value={7}>Last 7 Days</option>
          <option value={30}>Last 30 Days</option>
          <option value={90}>Last 90 Days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Contacts', value: data.overview.contacts, icon: Users, color: 'text-blue-500', bg: 'bg-blue-100' },
          { label: 'Sent Messages', value: data.overview.messagesSent, icon: MessageSquare, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Avg Open Rate', value: '68%', icon: TrendingUp, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Campaigns Run', value: data.overview.campaigns, icon: BarChart2, color: 'text-purple-500', bg: 'bg-purple-100' },
        ].map((s, i) => (
          <Card key={i} className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-text-secondary">{s.label}</h3>
              <div className={`p-2 rounded-lg ${s.bg} ${s.color}`}><s.icon size={20} /></div>
            </div>
            <p className="text-3xl font-bold text-text-primary">{s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6 min-w-0">
        <h3 className="text-lg font-bold text-text-primary mb-6">Traffic Volume</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.messages} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMsgs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00A884" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00A884" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#667781" tickLine={false} axisLine={false} />
              <YAxis stroke="#667781" tickLine={false} axisLine={false} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9EDEF" />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Area type="monotone" dataKey="sent" stroke="#00A884" strokeWidth={3} fillOpacity={1} fill="url(#colorMsgs)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6 min-w-0">
        <h3 className="text-lg font-bold text-text-primary mb-6">Campaign ROI</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.campaigns} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#667781" tickLine={false} axisLine={false} />
              <YAxis stroke="#667781" tickLine={false} axisLine={false} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9EDEF" />
              <Tooltip cursor={{ fill: '#F0F2F5' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="sent" stackId="a" fill="#1A1A2E" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};
export default Analytics;
