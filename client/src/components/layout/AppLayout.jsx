import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const AppLayout = () => (
  <div className="flex h-screen bg-bg overflow-hidden">
    <Sidebar />
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      <Topbar />
      <main className="flex-1 overflow-y-auto p-6 min-w-0">
        <Outlet />
      </main>
    </div>
  </div>
);

export default AppLayout;
