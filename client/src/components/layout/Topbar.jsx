import React from 'react';
import { Bell } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useLocation } from 'react-router-dom';

const getBreadcrumb = (pathname) => {
  const path = pathname.split('/')[1];
  if (!path) return 'Dashboard';
  return path.charAt(0).toUpperCase() + path.slice(1);
};

const Topbar = () => {
  const { user } = useAuthStore();
  const location = useLocation();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 z-10 shadow-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-text-primary capitalize">
          {getBreadcrumb(location.pathname)}
        </h1>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex flex-col text-right">
          <span className="text-sm font-medium text-text-primary">Welcome back, {user?.name}</span>
          <span className="text-xs text-text-secondary">{user?.businessName}</span>
        </div>

        <button className="relative p-2 text-text-secondary hover:bg-gray-100 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full ring-2 ring-white"></span>
        </button>

        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-sm">
          {getInitials(user?.name)}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
