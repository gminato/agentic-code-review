import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  GitCommit, 
  GitPullRequest, 
  Eye,
  Bot, 
  Clock, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  User
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { cn } from '../utils/cn';

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
}

const SidebarItem = ({ to, icon, label, collapsed }: SidebarItemProps) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2 transition-all duration-200 group border-l-2 border-transparent',
          'text-on-surface-variant hover:text-on-surface hover:bg-floating/50',
          isActive && 'bg-charcoal text-on-surface border-primary'
        )
      }
    >
      <span className='shrink-0'>{icon}</span>
      {!collapsed && <span className='text-body-sm font-medium'>{label}</span>}
    </NavLink>
  );
};

export const Sidebar = () => {
  const [collapsed, setCollapsed] = React.useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <aside 
      className={cn(
        'flex flex-col h-screen bg-charcoal border-r border-border-primary transition-all duration-300 ease-in-out z-20 shrink-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className='flex items-center justify-between p-4 border-b border-border-primary h-14 bg-charcoal'>
        {!collapsed && <span className='text-headline tracking-tighter uppercase font-bold text-primary'>Agentic</span>}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className='p-1 rounded hover:bg-floating text-on-surface-variant hover:text-on-surface transition-colors'
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <div className='flex-1 overflow-y-auto py-4 space-y-1'>
        <SidebarItem to='/dashboard' icon={<LayoutDashboard size={18} />} label='Dashboard' collapsed={collapsed} />
        <SidebarItem to='/reviews' icon={<GitCommit size={18} />} label='Review' collapsed={collapsed} />
        <SidebarItem to='/pull-requests' icon={<GitPullRequest size={18} />} label='Pull Requests' collapsed={collapsed} />
        <SidebarItem to='/diff' icon={<Eye size={18} />} label='Diff' collapsed={collapsed} />
        <SidebarItem to='/agents' icon={<Bot size={18} />} label='Agents' collapsed={collapsed} />
        <SidebarItem to='/cron' icon={<Clock size={18} />} label='Cron Jobs' collapsed={collapsed} />
      </div>

      <div className='mt-auto border-t border-border-primary py-2'>
        <SidebarItem to='/settings' icon={<Settings size={18} />} label='Settings' collapsed={collapsed} />
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 px-3 py-2 w-full transition-all duration-200 text-on-surface-variant hover:text-rose hover:bg-rose/5 border-l-2 border-transparent',
          )}
        >
          <LogOut size={18} className='shrink-0' />
          {!collapsed && <span className='text-body-sm font-medium'>Logout</span>}
        </button>

        <div className={cn(
          'mx-3 mt-4 mb-4 p-2 bg-obsidian border border-border-primary rounded flex items-center gap-3',
          collapsed ? 'px-1 justify-center' : 'px-3'
        )}>
          <div className='w-8 h-8 rounded-sm bg-charcoal flex items-center justify-center shrink-0 border border-border-primary overflow-hidden'>
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.username} className='w-full h-full object-cover' />
            ) : (
              <User size={14} />
            )}
          </div>
          {!collapsed && (
            <div className='flex flex-col min-w-0'>
              <span className='text-label-caps truncate text-on-surface'>{user?.username || 'User'}</span>
              <span className='text-[10px] text-on-surface-variant truncate font-mono'>{user?.email || 'user@example.com'}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
