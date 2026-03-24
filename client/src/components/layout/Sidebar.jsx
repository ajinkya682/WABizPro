import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Megaphone, Users, Target, FileText, Bot, MessageSquare, BarChart2, Settings, CreditCard, LogOut } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';

const MainNavLinks = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { path: '/contacts', label: 'Contacts', icon: Users },
  { path: '/segments', label: 'Segments', icon: Target },
  { path: '/templates', label: 'Templates', icon: FileText },
  { path: '/chatbot', label: 'Chatbot', icon: Bot },
  { path: '/inbox', label: 'Inbox', icon: MessageSquare },
  { path: '/analytics', label: 'Analytics', icon: BarChart2 },
];

const BottomNavLinks = [
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/billing', label: 'Billing', icon: CreditCard },
];

const SidebarItem = ({ path, icon: Icon, label, unread }) => (
  <NavLink
    to={path}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-2.5 rounded-lg mb-1 transition-colors duration-200 font-medium text-sm
      ${isActive ? 'bg-primary text-white' : 'text-text-secondary hover:bg-primary/10 hover:text-primary'}
    `}
  >
    <Icon size={20} />
    <span className="flex-1">{label}</span>
    {unread > 0 && (
      <span className="bg-danger text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center">
        {unread > 99 ? '99+' : unread}
      </span>
    )}
  </NavLink>
);

const Sidebar = () => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Optionally fetch unread count here
    const fetchUnread = async () => {
      try {
        const res = await api.get('/inbox/conversations');
        const count = res.data.conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
        setUnreadCount(count);
      } catch (err) {}
    };
    fetchUnread();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-white border-r border-border flex flex-col h-full shadow-sm z-10">
      <div className="p-6">
        <div className="flex items-center gap-2 text-primary font-bold text-2xl tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">✨</div>
          WABiz Pro
        </div>
      </div>

      <div className="flex-1 px-4 overflow-y-auto w-full">
        <div className="space-y-6">
          <div>
            <div className="text-xs uppercase font-semibold text-gray-400 mb-2 px-4 tracking-wider">Main Menu</div>
            {MainNavLinks.map((link) => (
              <SidebarItem key={link.path} {...link} unread={link.path === '/inbox' ? unreadCount : 0} />
            ))}
          </div>
          <div>
            <div className="text-xs uppercase font-semibold text-gray-400 mb-2 px-4 tracking-wider">Settings</div>
            {BottomNavLinks.map((link) => (
              <SidebarItem key={link.path} {...link} />
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-border mt-auto">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg w-full text-text-secondary hover:bg-danger/10 hover:text-danger transition-colors duration-200 font-medium text-sm"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
