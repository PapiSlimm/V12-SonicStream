import React, { useState, useMemo, useEffect, useCallback, lazy, Suspense } from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Users, 
  FileVideo, 
  MessageSquare, 
  LogOut, 
  BarChart3, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Send,
  Plus,
  X,
  User as UserIcon,
  Info,
  Search,
  ChevronLeft,
  ChevronRight,
  Bell,
  Palette,
  Zap,
  Loader2,
  Sparkles,
  Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { ServiceVideoSummary } from './ServiceVideoSummary';
import { Music, Activity, Sliders, Mic2 } from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';

type DashboardView = 'Dashboard' | 'Analytics' | 'Projects' | 'Messages' | 'Monetization' | 'DAW' | 'Templates' | 'Settings';

interface Task {
  id: string;
  title: string;
  assignedTo: string;
  dueDate: string;
  status: 'Todo' | 'In Progress' | 'Completed';
  priority: 'High' | 'Medium' | 'Low';
}

interface Project {
  id: string;
  name: string;
  status: 'Completed' | 'In Progress' | 'In Review' | 'Planning' | 'Scheduled' | 'Live';
  progress: number;
  date: string;
  description: string;
  team: string[];
  tasks?: Task[];
}

const initialProjects: Project[] = [
  { 
    id: '1', 
    name: 'Brand Film V2', 
    status: 'In Review', 
    progress: 85, 
    date: 'Mar 15, 2024',
    description: 'Final color grading and sound design for the main brand film. Incorporating feedback from the creative director.',
    team: ['Alex R.', 'Sarah C.', 'Mike T.'],
    tasks: [
      { id: 't1', title: 'Color Grading', assignedTo: 'Alex R.', dueDate: '2024-03-20', status: 'In Progress', priority: 'High' },
      { id: 't2', title: 'Sound Mix', assignedTo: 'Mike T.', dueDate: '2024-03-22', status: 'Todo', priority: 'Medium' }
    ]
  },
  { 
    id: '2', 
    name: 'SEO Strategy Q2', 
    status: 'Completed', 
    progress: 100, 
    date: 'Mar 10, 2024',
    description: 'Comprehensive SEO audit and strategy implementation for the upcoming quarter. Focus on organic growth.',
    team: ['Jessica L.', 'David K.'],
    tasks: [
      { id: 't3', title: 'Keyword Research', assignedTo: 'Jessica L.', dueDate: '2024-03-05', status: 'Completed', priority: 'High' },
      { id: 't4', title: 'Backlink Audit', assignedTo: 'David K.', dueDate: '2024-03-08', status: 'Completed', priority: 'Medium' }
    ]
  },
  { 
    id: '3', 
    name: 'Social Assets', 
    status: 'In Progress', 
    progress: 45, 
    date: 'Mar 22, 2024',
    description: 'Creation of high-impact social media assets for Instagram and TikTok campaigns.',
    team: ['Sarah C.', 'Chris P.']
  },
  { 
    id: '4', 
    name: 'Website Redesign', 
    status: 'Planning', 
    progress: 10, 
    date: 'Apr 05, 2024',
    description: 'Initial wireframing and user experience research for the new corporate website.',
    team: ['Mike T.', 'Jessica L.']
  },
  { 
    id: '5', 
    name: 'Product Shoot', 
    status: 'Scheduled', 
    progress: 0, 
    date: 'Apr 12, 2024',
    description: 'Studio photography session for the new product line launch. Lighting and set design in progress.',
    team: ['Alex R.', 'Chris P.']
  },
];

const performanceData = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: 800 },
  { name: 'May', value: 500 },
  { name: 'Jun', value: 900 },
  { name: 'Jul', value: 700 },
];

const audienceData = [
  { name: '0s', value: 100 },
  { name: '10s', value: 85 },
  { name: '20s', value: 70 },
  { name: '30s', value: 60 },
  { name: '40s', value: 55 },
  { name: '50s', value: 45 },
  { name: '60s', value: 40 },
];

const trafficData = [
  { name: 'Direct', value: 400 },
  { name: 'Social', value: 300 },
  { name: 'Search', value: 300 },
  { name: 'Referral', value: 200 },
];

const COLORS = ['#ef4444', '#f87171', '#dc2626', '#991b1b'];

const AIAssistant = lazy(() => import('./AIAssistant').then(m => ({ default: m.AIAssistant })));
const ChatRoom = lazy(() => import('./ChatRoom').then(m => ({ default: m.ChatRoom })));
const StepSequencer = lazy(() => import('./StepSequencer').then(m => ({ default: m.StepSequencer })));
const Timeline = lazy(() => import('./Timeline').then(m => ({ default: m.Timeline })));
const Mixer = lazy(() => import('./Mixer').then(m => ({ default: m.Mixer })));
const AIStudio = lazy(() => import('./AIStudio').then(m => ({ default: m.AIStudio })));

import { ProjectPortal } from './ProjectPortal.tsx';
import { useAuthStore } from '../store/useStore.ts';

// New types for real data
interface BackendProject {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  date: string;
  team: string[];
  tasks?: any[];
  createdAt: string;
  _count?: { assets: number };
}

export const ClientDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<DashboardView>('Dashboard');
  const [activeDAWTab, setActiveDAWTab] = useState<'Timeline' | 'Sequencer' | 'Mixer' | 'AI Studio'>('Timeline');
  const { user, token, setUser, logout: handleLogout, loading: isAuthLoading, fetchMe } = useAuthStore();
  const [projects, setProjects] = useState<BackendProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  
  // View State
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [projectFilters, setProjectFilters] = useState<string[]>(['All']);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskSortBy, setTaskSortBy] = useState<'dueDate' | 'priority' | 'status'>('dueDate');
  const [taskSortOrder, setTaskSortOrder] = useState<'asc' | 'desc'>('asc');
  const [newTask, setNewTask] = useState({
    title: '',
    assignedTo: '',
    priority: 'Medium' as const,
    dueDate: '',
    status: 'Todo' as any
  });
  const [dashboardWidgets, setDashboardWidgets] = useState<string[]>(['Stats', 'Performance', 'RecentProjects', 'Tasks', 'AIInsights']);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [isStripeLoading, setIsStripeLoading] = useState(false);
  const [isIdentityLoading, setIsIdentityLoading] = useState(false);

  const handleStartVerification = async () => {
    setIsIdentityLoading(true);
    try {
      const res = await fetch('/api/identity/create-session', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.client_secret) {
        // In a real app, use Stripe Identity SDK
        alert("Launching V12 Verification Portal (Stripe Identity). In this demo environment, verification will be simulated via webhooks.");
        
        // SIMULATION: Just for the demo/build process to show it works
        // Practically, we wait for the webhook.
        // But I'll provide a 'Simulate Success' for the user if they are in dev.
      } else {
        throw new Error(data.error || 'Failed to start verification');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsIdentityLoading(false);
    }
  };
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    status: 'Planning' as any
  });

  const fetchProjects = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        status: projectFilters.join(','),
        search: debouncedSearch,
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });
      const res = await fetch(`/api/projects?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      
      const parsedProjects = data.map((p: any) => ({
        ...p,
        progress: p.progress || (p.status === 'Completed' ? 100 : p.status === 'In Review' ? 80 : 20),
        date: new Date(p.createdAt).toLocaleDateString(),
        team: typeof p.team === 'string' ? p.team.split(',').map((t: string) => t.trim()) : (p.team || []),
        tasks: p.tasks || []
      }));
      
      setProjects(parsedProjects);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [projectFilters, debouncedSearch, currentPage, token]);

  const fetchTemplates = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/project-templates', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error('Failed to fetch templates');
    }
  }, [token]);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications');
    }
  }, [token]);

  const fetchMessages = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/messages', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Failed to fetch messages');
    }
  }, [token]);

  const fetchUser = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 401) handleLogout();
        throw new Error('Failed to fetch user profile');
      }
      const data = await res.json();
      setUser(data, token);
      if (data.dashboard_widgets) {
        setDashboardWidgets(data.dashboard_widgets.split(','));
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, [token, handleLogout, setUser]);

  useEffect(() => {
    if (token) {
      fetchUser();
      fetchProjects();
      fetchNotifications();
      fetchMessages();
      fetchTemplates();
    }
  }, [token, fetchUser, fetchProjects, fetchNotifications, fetchMessages, fetchTemplates]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (user?.theme_color) {
      document.documentElement.style.setProperty('--v12-red', user.theme_color);
    } else {
      document.documentElement.style.setProperty('--v12-red', '#EF4444');
    }
  }, [user?.theme_color]);

  // WebSocket for real-time updates
  useEffect(() => {
    if (!token || !user) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}?userId=${user.id}`);
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'NOTIFICATION') {
        setNotifications(prev => [message.data, ...prev]);
      } else if (message.type === 'PROJECT_STATUS_CHANGED') {
        fetchProjects();
      }
    };
    return () => ws.close();
  }, [token, user, fetchProjects]);

  const toggleWidget = (id: string) => {
    const newWidgets = dashboardWidgets.includes(id) 
      ? dashboardWidgets.filter(w => w !== id) 
      : [...dashboardWidgets, id];
    setDashboardWidgets(newWidgets);
  };

  const moveWidget = (id: string, direction: 'up' | 'down') => {
    const index = dashboardWidgets.indexOf(id);
    if (index === -1) return;
    const newWidgets = [...dashboardWidgets];
    if (direction === 'up' && index > 0) {
      [newWidgets[index], newWidgets[index - 1]] = [newWidgets[index - 1], newWidgets[index]];
    } else if (direction === 'down' && index < dashboardWidgets.length - 1) {
      [newWidgets[index], newWidgets[index + 1]] = [newWidgets[index + 1], newWidgets[index]];
    }
    setDashboardWidgets(newWidgets);
  };

  const saveDashboardLayout = async (widgets: string[]) => {
    if (!token) return;
    try {
      await fetch('/api/me', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ dashboard_widgets: widgets.join(',') })
      });
    } catch (err) {
      console.error('Failed to save dashboard layout');
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newProject)
      });
      if (!res.ok) throw new Error('Failed to create project');
      await fetchProjects();
      setIsCreateModalOpen(false);
      setNewProject({ name: '', description: '', status: 'Planning' as any });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProject = async (id: string, updates: any) => {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed to update project');
      await fetchProjects();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete project');
      await fetchProjects();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddTask = async (projectId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTask)
      });
      if (res.ok) {
        await fetchProjects();
        setIsTaskModalOpen(false);
        setNewTask({ title: '', assignedTo: '', dueDate: '', status: 'Todo', priority: 'Medium' });
      }
    } catch (err) { console.error(err); }
  };

  const updateTaskStatus = async (projectId: string, taskId: string, status: any) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) await fetchProjects();
    } catch (err) { console.error(err); }
  };

  const handleSaveTemplate = async (project: any) => {
    if (!token) return;
    try {
      const res = await fetch('/api/project-templates', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: `${project.name} Template`,
          description: project.description,
          status: project.status
        })
      });
      if (res.ok) fetchTemplates();
    } catch (err) { console.error(err); }
  };

  const handleSelectTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setNewProject({
        name: template.name.replace(' Template', ''),
        description: template.description,
        status: template.status as any
      });
    }
  };

  const exportProjectsCSV = () => {
    const headers = ['ID', 'Name', 'Status', 'Progress', 'Date', 'Description', 'Team'];
    const csvContent = [
      headers.join(','),
      ...projects.map(p => [
        p.id,
        `"${p.name}"`,
        p.status,
        `${p.progress}%`,
        p.date,
        `"${p.description}"`,
        `"${p.team.join(', ')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `v12_projects_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const markNotificationAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (!token) return;
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) { console.error(err); }
  };

  const handleStripeCheckout = async (priceId: string) => {
    if (!user) return;
    setIsStripeLoading(true);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ priceId, customerEmail: user.email })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsStripeLoading(false);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      const res = await fetch(`/api/project-templates/${templateId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchTemplates();
    } catch (err) { console.error(err); }
  };

  const availableWidgets = [
    { id: 'Stats', name: 'Key Stats', icon: <TrendingUp size={16} /> },
    { id: 'Performance', name: 'Performance Overview', icon: <BarChart3 size={16} /> },
    { id: 'RecentProjects', name: 'Recent Projects', icon: <Layout size={16} /> },
    { id: 'Tasks', name: 'Mission Log', icon: <CheckCircle2 size={16} /> },
    { id: 'AIInsights', name: 'AI Insights', icon: <Sparkles size={16} /> },
  ];

  const stats = [
    { label: 'Ad Spend', value: '$4,250', change: '+12%', icon: <TrendingUp size={20} /> },
    { label: 'Impressions', value: '1.2M', change: '+25%', icon: <Users size={20} /> },
    { label: 'Video Views', value: '45.8K', change: '+18%', icon: <FileVideo size={20} /> },
    { label: 'Conversions', value: '342', change: '+8%', icon: <TrendingUp size={20} /> },
  ];

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    try {
      const res = await fetch(`/api/projects/${projectToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete project');
      await fetchProjects();
      setIsConfirmDeleteOpen(false);
      setProjectToDelete(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const renderView = () => {
    if (selectedProjectId) {
      return <ProjectPortal projectId={selectedProjectId} onBack={() => setSelectedProjectId(null)} />;
    }

        switch (activeView) {
          case 'Dashboard':
        return (
          <>
            {/* Brand Energy Section */}
            <div className="mb-10 glass-card p-8 border-v12-red/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-v12-red/10 blur-[100px] -z-10" />
              <div className="max-w-3xl">
                <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 leading-none">
                  Step into the future of design with <span className="text-v12-red">V12 Multimedia Design Studio.</span> ✨
                </h2>
                <p className="text-v12-gray-400 text-sm leading-relaxed mb-6">
                  We craft visually striking, highly functional digital experiences that elevate your brand and connect with your audience. 
                  From modern web layouts to bold brand identities, we turn ideas into polished visuals that make an impact. 
                  What design trend are you loving right now? Drop it in the comments.
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                    <span className="text-[10px] font-black uppercase tracking-widest text-v12-red">#V12Lifestyle</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                    <span className="text-[10px] font-black uppercase tracking-widest text-v12-red">#BrandLove</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                    <span className="text-[10px] font-black uppercase tracking-widest text-v12-red">#Streetwear</span>
                  </div>
                </div>
              </div>
            </div>

            {!user?.isVerified && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10 p-6 bg-v12-red/10 border border-v12-red/30 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-v12-red/20 rounded-xl flex items-center justify-center text-v12-red border border-v12-red/30">
                    <Zap size={24} />
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-v12-red">Verification Required: Proof of Identity</div>
                    <p className="text-[10px] font-bold text-v12-gray-400 uppercase tracking-widest mt-1">Unlock the Creator Marketplace and enable "Live" mission deployment by completing your ID check.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveView('Settings')}
                  className="px-8 py-3 bg-v12-red text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-v12-red/90 transition-all shadow-lg shadow-v12-red/20"
                >
                  Start V12 ID Check
                </button>
              </motion.div>
            )}

            {/* Customization Controls */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-v12-gray-500">Workspace Layout</h3>
                <button 
                  onClick={() => {
                    if (isCustomizing) {
                      saveDashboardLayout(dashboardWidgets);
                    }
                    setIsCustomizing(!isCustomizing);
                  }}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                    isCustomizing ? "bg-v12-red border-v12-red text-white" : "bg-white/5 border-white/10 text-v12-gray-400 hover:border-v12-red hover:text-v12-red"
                  )}
                >
                  {isCustomizing ? 'Save Layout' : 'Customize Widgets'}
                </button>
              </div>
              {isCustomizing && (
                <div className="flex gap-2">
                  {availableWidgets.map(w => (
                    <button
                      key={w.id}
                      onClick={() => toggleWidget(w.id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all",
                        dashboardWidgets.includes(w.id) ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-white/5 border-white/10 text-v12-gray-500"
                      )}
                    >
                      {w.icon}
                      {w.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* AI Service Summary Video */}
            <div className="mb-10">
              <ServiceVideoSummary />
            </div>

            <div className="space-y-10">
              {dashboardWidgets.map((widgetId) => {
                if (widgetId === 'Stats') return (
                  <div key="Stats" className="relative group">
                    {isCustomizing && (
                      <div className="absolute -top-4 -right-4 z-10 flex gap-2">
                        <button onClick={() => moveWidget('Stats', 'up')} className="p-2 bg-v12-gray-800 border border-white/10 hover:bg-v12-red rounded-lg"><ChevronLeft className="rotate-90" size={14} /></button>
                        <button onClick={() => moveWidget('Stats', 'down')} className="p-2 bg-v12-gray-800 border border-white/10 hover:bg-v12-red rounded-lg"><ChevronRight className="rotate-90" size={14} /></button>
                        <button onClick={() => toggleWidget('Stats')} className="p-2 bg-v12-red border border-black rounded-lg"><X size={14} /></button>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {stats.map((stat) => (
                        <div key={stat.label} className="glass-card p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-white/5 rounded-lg text-v12-red">{stat.icon}</div>
                            <span className="text-xs font-bold text-emerald-400">{stat.change}</span>
                          </div>
                          <div className="text-2xl font-bold mb-1">{stat.value}</div>
                          <div className="text-v12-gray-400 text-xs uppercase tracking-widest">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );

                if (widgetId === 'Performance') return (
                  <div key="Performance" className="relative group">
                    {isCustomizing && (
                      <div className="absolute -top-4 -right-4 z-10 flex gap-2">
                        <button onClick={() => moveWidget('Performance', 'up')} className="p-2 bg-v12-gray-800 border border-white/10 hover:bg-v12-red rounded-lg"><ChevronLeft className="rotate-90" size={14} /></button>
                        <button onClick={() => moveWidget('Performance', 'down')} className="p-2 bg-v12-gray-800 border border-white/10 hover:bg-v12-red rounded-lg"><ChevronRight className="rotate-90" size={14} /></button>
                        <button onClick={() => toggleWidget('Performance')} className="p-2 bg-v12-red border border-black rounded-lg"><X size={14} /></button>
                      </div>
                    )}
                    <div className="glass-card p-8 min-h-[400px] flex flex-col">
                      <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold">Performance Overview</h2>
                        <select className="bg-v12-gray-900 border border-white/10 rounded-lg px-3 py-1 text-sm text-white">
                          <option>Last 30 Days</option>
                          <option>Last 90 Days</option>
                        </select>
                      </div>
                      <div className="flex-grow h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={performanceData}>
                            <defs>
                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                            <Tooltip contentStyle={{ backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} itemStyle={{ color: '#ef4444' }} />
                            <Area type="monotone" dataKey="value" stroke="#ef4444" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                );

                if (widgetId === 'RecentProjects') return (
                  <div key="RecentProjects" className="relative group">
                    <div className="flex items-center justify-between mb-8">
                       <h2 className="text-xl font-bold uppercase tracking-tighter">Live Missions</h2>
                       <button 
                         onClick={() => setActiveView('Projects')}
                         className="text-[10px] font-black uppercase tracking-widest text-v12-red border-b border-v12-red hover:text-white hover:border-white transition-all"
                       >
                         View Deployment Grid
                       </button>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {projects.slice(0, 5).map((p) => (
                         <motion.div 
                           key={p.id}
                           whileHover={{ y: -5 }}
                           onClick={() => setSelectedProjectId(p.id)}
                           className="glass-card p-6 cursor-pointer border-white/5 hover:border-v12-red/30 transition-all"
                         >
                            <h4 className="text-lg font-black uppercase tracking-tighter mb-4 truncate">{p.name}</h4>
                            <div className="flex items-center justify-between">
                               <span className="text-[10px] font-black uppercase tracking-widest text-v12-red">{p.status}</span>
                               <ChevronRight size={16} className="text-v12-gray-600" />
                            </div>
                         </motion.div>
                       ))}
                       <button 
                         onClick={() => setIsCreateModalOpen(true)}
                         className="flex flex-col items-center justify-center gap-4 py-8 border-2 border-dashed border-white/5 rounded-2xl text-v12-gray-500 hover:text-white"
                       >
                         <Plus size={24} />
                         <span className="text-[10px] font-black uppercase tracking-widest">New Mission</span>
                       </button>
                    </div>
                  </div>
                );

                if (widgetId === 'Tasks') return (
                  <div key="Tasks" className="relative group">
                    {isCustomizing && (
                      <div className="absolute -top-4 -right-4 z-10 flex gap-2">
                        <button onClick={() => moveWidget('Tasks', 'up')} className="p-2 bg-v12-gray-800 border border-white/10 hover:bg-v12-red rounded-lg"><ChevronLeft className="rotate-90" size={14} /></button>
                        <button onClick={() => moveWidget('Tasks', 'down')} className="p-2 bg-v12-gray-800 border border-white/10 hover:bg-v12-red rounded-lg"><ChevronRight className="rotate-90" size={14} /></button>
                        <button onClick={() => toggleWidget('Tasks')} className="p-2 bg-v12-red border border-black rounded-lg"><X size={14} /></button>
                      </div>
                    )}
                    <div className="glass-card p-8 border-white/10 h-full">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold uppercase tracking-tight">Mission Log</h2>
                        <span className="text-[10px] font-black uppercase tracking-widest text-v12-gray-500">
                          {projects.reduce((acc, p) => acc + (p.tasks?.filter(t => t.status !== 'Completed').length || 0), 0)} Open
                        </span>
                      </div>
                      <div className="space-y-4">
                        {projects.flatMap(p => (p.tasks || []).map(t => ({ ...t, projectName: p.name, projectId: p.id }))).filter(t => t.status !== 'Completed').slice(0, 4).map((task) => (
                          <div key={task.id} className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-v12-red/30 transition-all group/task">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-black uppercase tracking-widest text-v12-red">{task.projectName}</span>
                              <span className={cn(
                                "text-[8px] font-black uppercase tracking-widest",
                                task.priority === 'High' ? "text-v12-red" : "text-amber-400"
                              )}>
                                {task.priority}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold tracking-tight mb-2 group-hover/task:text-v12-red transition-colors">{task.title}</h4>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-v12-gray-800 flex items-center justify-center text-[8px] font-black border border-white/10">
                                  {task.assignedTo[0]}
                                </div>
                                <span className="text-[10px] font-bold text-v12-gray-400">{task.assignedTo}</span>
                              </div>
                              <span className="text-[9px] font-black uppercase tracking-widest text-v12-gray-500">{task.dueDate}</span>
                            </div>
                          </div>
                        ))}
                        {projects.every(p => !p.tasks || p.tasks.length === 0) && (
                          <div className="text-center py-10 opacity-30 italic text-xs font-bold uppercase tracking-widest">
                            No critical tasks active
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );

                if (widgetId === 'AIInsights') return (
                  <div key="AIInsights" className="relative group">
                    {isCustomizing && (
                      <div className="absolute -top-4 -right-4 z-10 flex gap-2">
                        <button onClick={() => moveWidget('AIInsights', 'up')} className="p-2 bg-v12-gray-800 border border-white/10 hover:bg-v12-red rounded-lg"><ChevronLeft className="rotate-90" size={14} /></button>
                        <button onClick={() => moveWidget('AIInsights', 'down')} className="p-2 bg-v12-gray-800 border border-white/10 hover:bg-v12-red rounded-lg"><ChevronRight className="rotate-90" size={14} /></button>
                        <button onClick={() => toggleWidget('AIInsights')} className="p-2 bg-v12-red border border-black rounded-lg"><X size={14} /></button>
                      </div>
                    )}
                    <div className="glass-card p-8 border-v12-red/20">
                      <div className="flex items-center gap-3 mb-6">
                        <Sparkles className="text-v12-red" size={24} />
                        <h2 className="text-xl font-bold uppercase tracking-tighter">AI Strategic Insights</h2>
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-v12-red mb-2">Trend Analysis</h3>
                          <p className="text-xs text-v12-gray-300">Multimedia content with brutalist aesthetics is seeing a 40% increase in engagement among Gen Z audiences.</p>
                        </div>
                        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">Optimization Tip</h3>
                          <p className="text-xs text-v12-gray-300">Your recent video views are peaking at 10 AM. Consider scheduling your next Brand Film release for this window.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
                return null;
              })}
            </div>

            {/* Lifestyle Section */}
            <div className="mt-20 glass-card p-10 border-white/10 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/tech-background/1920/1080')] opacity-10 grayscale" />
              <div className="relative z-10 max-w-2xl mx-auto">
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 italic">More than just a studio, it's a lifestyle. 🖤</h2>
                <p className="text-v12-gray-400 text-sm leading-relaxed mb-8">
                  Rep the V12 Multimedia Design Studio brand with our exclusive gear! Our passion for creativity extends beyond the studio walls. 
                  Stay tuned for how you can get your hands on some V12 merch!
                </p>
                <div className="flex justify-center gap-4 text-[10px] font-black uppercase tracking-widest text-v12-gray-500">
                  <span>#V12Lifestyle</span>
                  <span>#BrandLove</span>
                  <span>#Streetwear</span>
                  <span>#CreativeCulture</span>
                </div>
              </div>
            </div>

            {/* Community Section */}
            <div className="mt-10 grid md:grid-cols-2 gap-6">
              <div className="glass-card p-8 border-emerald-500/20">
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">Your creative journey starts here. 🤝</h3>
                <p className="text-v12-gray-400 text-sm leading-relaxed">
                  At V12 Multimedia Design Studio, we believe in fostering a community where ideas flourish and collaborations thrive. 
                  Our lounge is more than just a waiting area; it's a space for inspiration, connection, and making great things happen. 
                  Come create with us!
                </p>
              </div>
              <div className="glass-card overflow-hidden">
                <img 
                  src="https://picsum.photos/seed/media-studio/800/600" 
                  alt="V12 Studio Lounge" 
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </>
        );
      case 'Analytics':
        const projectStats = projects.reduce((acc: any, p) => {
          acc[p.status] = (acc[p.status] || 0) + 1;
          return acc;
        }, {});
        const statusData = Object.entries(projectStats).map(([name, value]) => ({ name, value }));

        return (
          <div className="space-y-6">
            <div className="glass-card p-8">
              <h2 className="text-2xl font-bold mb-6 uppercase tracking-tighter">Deep Analytics</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-v12-gray-400 uppercase tracking-widest">Project Status Distribution</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statusData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
                        <YAxis stroke="#9ca3af" fontSize={10} />
                        <Tooltip 
                          cursor={{fill: 'rgba(255,255,255,0.05)'}}
                          contentStyle={{ backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                        <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-v12-gray-400 uppercase tracking-widest">Conversion Funnel</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Awareness', value: '85%', color: 'bg-v12-red' },
                      { label: 'Interest', value: '62%', color: 'bg-v12-red/80' },
                      { label: 'Desire', value: '45%', color: 'bg-v12-red/60' },
                      { label: 'Action', value: '12%', color: 'bg-v12-red/40' },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span>{item.label}</span>
                          <span>{item.value}</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className={cn("h-full", item.color)} style={{ width: item.value }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="glass-card p-6">
                <h3 className="font-bold mb-4 uppercase tracking-tight">Project Health</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="glass-card p-6">
                <h3 className="font-bold mb-4 uppercase tracking-tight">Traffic Sources</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={trafficData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {trafficData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="glass-card p-6">
                <h3 className="font-bold mb-4 uppercase tracking-tight">Performance Metrics</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Avg Rendering Time', value: '4.2s', status: 'Optimal' },
                    { label: 'Server Response', value: '124ms', status: 'Fast' },
                    { label: 'Uptime', value: '99.9%', status: 'Stable' },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between p-2 bg-white/5 rounded">
                      <span className="text-[10px] font-bold text-v12-gray-400 uppercase">{stat.label}</span>
                      <div className="text-right">
                        <div className="text-xs font-black">{stat.value}</div>
                        <div className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">{stat.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 'Projects':
        return (
          <div className="space-y-6">
            {error && (
              <div className="bg-v12-red/10 border border-v12-red/20 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3 text-v12-red text-sm font-bold">
                  <AlertCircle size={18} />
                  {error}
                </div>
                <button onClick={() => setError(null)} className="text-v12-gray-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>
            )}

            <div className="glass-card p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold uppercase tracking-tighter">Active Projects</h2>
                  <div className="flex flex-wrap gap-2">
                    {['All', 'Completed', 'Live', 'In Progress', 'In Review', 'Planning', 'Scheduled'].map((f) => (
                      <button
                        key={f}
                        onClick={() => {
                          setProjectFilters(prev => {
                            if (f === 'All') return ['All'];
                            const next = prev.filter(p => p !== 'All');
                            if (next.includes(f)) {
                              const filtered = next.filter(p => p !== f);
                              return filtered.length === 0 ? ['All'] : filtered;
                            }
                            return [...next, f];
                          });
                          setCurrentPage(1);
                        }}
                        aria-label={`Filter by ${f}`}
                        className={cn(
                          "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                          projectFilters.includes(f) 
                            ? "bg-v12-red text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]" 
                            : "bg-white/5 text-v12-gray-400 hover:bg-white/10"
                        )}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-v12-gray-400" size={16} />
                    <input 
                      type="text"
                      placeholder="Search missions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white/5 border-2 border-white/10 rounded-full pl-10 pr-4 py-2 text-xs font-bold focus:border-v12-red outline-none transition-colors"
                    />
                  </div>
                  <button 
                    onClick={exportProjectsCSV}
                    aria-label="Export projects to CSV"
                    className="btn btn-outline py-2.5 px-6 text-xs flex items-center gap-2 w-full sm:w-auto"
                  >
                    <BarChart3 size={16} />
                    Export CSV
                  </button>
                  <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    aria-label="Create new project"
                    className="btn btn-primary py-2.5 px-6 text-xs flex items-center gap-2 w-full sm:w-auto"
                  >
                    <Plus size={16} />
                    New Project
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left" aria-label="Projects table">
                  <thead>
                    <tr className="border-b border-white/10 text-v12-gray-400 text-xs uppercase tracking-widest">
                      <th className="pb-4 font-bold">Project Name</th>
                      <th className="pb-4 font-bold">Status</th>
                      <th className="pb-4 font-bold">Timeline</th>
                      <th className="pb-4 font-bold">Team</th>
                      <th className="pb-4 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {isLoading ? (
                      // Skeleton Screens
                      Array.from({ length: itemsPerPage }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="py-4"><div className="h-4 bg-white/5 rounded w-32" /></td>
                          <td className="py-4"><div className="h-6 bg-white/5 rounded-full w-20" /></td>
                          <td className="py-4"><div className="h-4 bg-white/5 rounded w-24" /></td>
                          <td className="py-4"><div className="h-7 bg-white/5 rounded-full w-20" /></td>
                          <td className="py-4 text-right"><div className="h-4 bg-white/5 rounded w-16 ml-auto" /></td>
                        </tr>
                      ))
                    ) : (
                      projects.map((project) => (
                        <tr key={project.id} className="group hover:bg-white/5 transition-colors">
                          <td className="py-4 font-bold">{project.name}</td>
                          <td className="py-4">
                            <span className={cn(
                              "text-[10px] font-black uppercase px-3 py-1 rounded-full border",
                              (project.status === 'Completed' || project.status === 'Live')
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                : project.status === 'In Review'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-v12-red/10 text-v12-red border-v12-red/20'
                            )}>
                              {project.status}
                            </span>
                          </td>
                          <td className="py-4 text-sm text-v12-gray-400">{project.date}</td>
                          <td className="py-4">
                            <div className="flex -space-x-2">
                              {(Array.isArray(project.team) ? project.team : []).map((member, i) => (
                                <div key={i} className="w-7 h-7 rounded-full bg-v12-gray-800 border-2 border-v12-gray-900 flex items-center justify-center text-[8px] font-bold text-v12-red" title={member.trim()}>
                                  {member.trim().split(' ').map(n => n[0]).join('')}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="py-4 text-right flex items-center justify-end gap-4">
                            <button 
                              onClick={() => {
                                setSelectedProject(project);
                                setIsDetailsModalOpen(true);
                              }}
                              className="text-v12-red hover:text-white transition-colors text-xs font-black uppercase tracking-widest"
                            >
                              Details
                            </button>
                            {user?.role === 'admin' && (
                              <button 
                                onClick={() => handleDeleteProject(project.id)}
                                className="text-v12-gray-400 hover:text-v12-red transition-colors"
                                title="Delete Project"
                              >
                                <X size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                {!isLoading && projects.length === 0 && (
                  <div className="py-20 text-center text-v12-gray-400 font-bold uppercase tracking-widest text-sm">
                    No projects found in this category
                  </div>
                )}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-8 pt-8 border-t border-white/5">
                <div className="text-xs text-v12-gray-400 font-bold uppercase tracking-widest">
                  Showing {projects.length} results
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="p-2 bg-white/5 rounded-lg text-v12-gray-400 hover:text-white disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-xs font-black w-8 text-center">{currentPage}</span>
                  <button 
                    disabled={projects.length < itemsPerPage}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="p-2 bg-white/5 rounded-lg text-v12-gray-400 hover:text-white disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
              {isDetailsModalOpen && selectedProject && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-2xl bg-v12-gray-900 border-2 border-white/10 p-8 shadow-2xl"
                  >
                    <button 
                      onClick={() => setIsDetailsModalOpen(false)}
                      className="absolute top-6 right-6 text-v12-gray-400 hover:text-white transition-colors"
                    >
                      <X size={24} />
                    </button>

                    <div className="mb-8">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={cn(
                          "text-[10px] font-black uppercase px-3 py-1 rounded-full border",
                          selectedProject.status === 'Completed' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-v12-red/10 text-v12-red border-v12-red/20'
                        )}>
                          {selectedProject.status}
                        </span>
                        <span className="text-xs text-v12-gray-400 font-bold uppercase tracking-widest">{selectedProject.date}</span>
                      </div>
                      <h3 className="text-4xl font-black uppercase tracking-tighter">{selectedProject.name}</h3>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 mb-8">
                      <div className="md:col-span-2 space-y-6">
                        <div>
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-v12-gray-400 mb-2">Description</h4>
                          <p className="text-v12-gray-300 leading-relaxed">{selectedProject.description}</p>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-v12-gray-400">Project Progress</h4>
                            <span className="text-xs font-black text-v12-red">{selectedProject.progress}%</span>
                          </div>
                          <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${selectedProject.progress}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="h-full bg-v12-red shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                            />
                          </div>
                        </div>
                        
                        {/* Task Management */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-v12-gray-400">Mission Tasks</h4>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <span className="text-[8px] font-black uppercase tracking-widest text-v12-gray-500">Sort:</span>
                                <select 
                                  value={taskSortBy}
                                  onChange={(e) => setTaskSortBy(e.target.value as any)}
                                  className="bg-transparent text-[9px] font-black uppercase tracking-widest text-v12-red outline-none cursor-pointer"
                                >
                                  <option value="dueDate">Due Date</option>
                                  <option value="priority">Priority</option>
                                  <option value="status">Status</option>
                                </select>
                                <button 
                                  onClick={() => setTaskSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                  className="text-v12-red hover:text-white transition-colors"
                                >
                                  {taskSortOrder === 'asc' ? <ChevronRight size={12} className="rotate-90" /> : <ChevronRight size={12} className="-rotate-90" />}
                                </button>
                              </div>
                              <button 
                                onClick={() => setIsTaskModalOpen(true)}
                                className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-v12-red hover:text-white transition-colors"
                              >
                                <Plus size={12} />
                                Add Task
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {selectedProject.tasks && selectedProject.tasks.length > 0 ? (
                              [...selectedProject.tasks].sort((a, b) => {
                                let comparison = 0;
                                if (taskSortBy === 'dueDate') {
                                  comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                                } else if (taskSortBy === 'priority') {
                                  const priorityMap = { 'High': 3, 'Medium': 2, 'Low': 1 };
                                  comparison = priorityMap[a.priority || 'Medium'] - priorityMap[b.priority || 'Medium'];
                                } else if (taskSortBy === 'status') {
                                  const statusMap = { 'Todo': 1, 'In Progress': 2, 'Completed': 3 };
                                  comparison = statusMap[a.status] - statusMap[b.status];
                                }
                                return taskSortOrder === 'asc' ? comparison : -comparison;
                              }).map((task) => (
                                <div key={task.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg group">
                                  <div className="flex items-center gap-3">
                                    <button 
                                      onClick={() => updateTaskStatus(selectedProject.id, task.id, task.status === 'Completed' ? 'Todo' : 'Completed')}
                                      className={cn(
                                        "w-5 h-5 border-2 rounded flex items-center justify-center transition-colors",
                                        task.status === 'Completed' ? "bg-v12-red border-v12-red" : "border-white/20 hover:border-v12-red"
                                      )}
                                    >
                                      {task.status === 'Completed' && <CheckCircle2 size={12} className="text-white" />}
                                    </button>
                                    <div>
                                      <div className={cn("text-xs font-bold", task.status === 'Completed' && "line-through text-v12-gray-500")}>
                                        {task.title}
                                      </div>
                                      <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest">
                                        <span className="text-v12-gray-500">{task.assignedTo}</span>
                                        <span className="text-v12-gray-600">•</span>
                                        <span className={cn(
                                          task.priority === 'High' ? "text-v12-red" : 
                                          task.priority === 'Medium' ? "text-amber-400" : 
                                          "text-v12-gray-400"
                                        )}>
                                          {task.priority || 'Medium'}
                                        </span>
                                        <span className="text-v12-gray-600">•</span>
                                        <span className="text-v12-gray-400">{task.dueDate}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className={cn(
                                    "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                                    task.status === 'Completed' ? "bg-emerald-500/20 text-emerald-400" : "bg-v12-red/20 text-v12-red"
                                  )}>
                                    {task.status}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-6 border-2 border-dashed border-white/5 rounded-xl text-v12-gray-500 text-[10px] font-bold uppercase tracking-widest">
                                No tasks assigned to this mission
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Monetization Options for Project */}
                        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-v12-red mb-4">Direct Monetization</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <button className="flex flex-col items-center justify-center p-4 border border-white/10 rounded-xl hover:border-v12-red transition-all group">
                              <Zap size={20} className="mb-2 text-v12-gray-400 group-hover:text-v12-red" />
                              <span className="text-[10px] font-bold uppercase tracking-widest">Pay-Per-View</span>
                            </button>
                            <button className="flex flex-col items-center justify-center p-4 border border-white/10 rounded-xl hover:border-v12-red transition-all group">
                              <Palette size={20} className="mb-2 text-v12-gray-400 group-hover:text-v12-red" />
                              <span className="text-[10px] font-bold uppercase tracking-widest">Subscription</span>
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-v12-gray-400 mb-3">Assigned Team</h4>
                          <div className="space-y-3">
                            {selectedProject && (Array.isArray(selectedProject.team) ? selectedProject.team : []).map((member, i) => (
                              <div key={i} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-v12-red/10 flex items-center justify-center text-[10px] font-black text-v12-red border border-v12-red/20">
                                  {member.trim().split(' ').map(n => n[0]).join('')}
                                </div>
                                <span className="text-sm font-bold">{member.trim()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-6 border-t border-white/5">
                      <button 
                        onClick={() => handleSaveTemplate(selectedProject)}
                        className="btn btn-outline py-2 px-6 text-xs font-black uppercase tracking-widest border-v12-red/30 text-v12-red hover:bg-v12-red hover:text-white"
                      >
                        Save as Template
                      </button>
                      <button className="btn btn-outline py-2 px-6 text-xs font-black uppercase tracking-widest">Archive</button>
                      <button className="btn btn-primary py-2 px-6 text-xs font-black uppercase tracking-widest">Open Workspace</button>
                    </div>
                  </motion.div>
                </div>
              )}

              {isTaskModalOpen && selectedProject && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsTaskModalOpen(false)}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-md bg-v12-gray-900 border-2 border-white/10 p-8 shadow-2xl"
                  >
                    <button 
                      onClick={() => setIsTaskModalOpen(false)}
                      className="absolute top-6 right-6 text-v12-gray-400 hover:text-white transition-colors"
                    >
                      <X size={24} />
                    </button>

                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-8">Assign New Task</h3>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-v12-gray-400">Task Title</label>
                        <input 
                          type="text" 
                          value={newTask.title}
                          onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                          className="w-full bg-white/5 border-2 border-white/10 p-4 font-bold text-sm focus:border-v12-red outline-none transition-colors" 
                          placeholder="E.G. FINAL COLOR GRADING"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-v12-gray-400">Assigned To</label>
                        <input 
                          type="text" 
                          value={newTask.assignedTo}
                          onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
                          className="w-full bg-white/5 border-2 border-white/10 p-4 font-bold text-sm focus:border-v12-red outline-none transition-colors" 
                          placeholder="E.G. ALEX R."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-v12-gray-400">Priority</label>
                          <select 
                            value={newTask.priority}
                            onChange={(e) => setNewTask({...newTask, priority: e.target.value as any})}
                            className="w-full bg-white/5 border-2 border-white/10 p-4 font-bold text-sm focus:border-v12-red outline-none transition-colors appearance-none"
                          >
                            <option value="Low">LOW</option>
                            <option value="Medium">MEDIUM</option>
                            <option value="High">HIGH</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-v12-gray-400">Due Date</label>
                          <input 
                            type="date" 
                            value={newTask.dueDate}
                            onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                            className="w-full bg-white/5 border-2 border-white/10 p-4 font-bold text-sm focus:border-v12-red outline-none transition-colors" 
                          />
                        </div>
                      </div>
                      <button 
                        onClick={() => handleAddTask(selectedProject.id)}
                        className="btn btn-primary w-full py-4 text-xs font-black uppercase tracking-widest"
                      >
                        Deploy Task
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}

              {isCreateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsCreateModalOpen(false)}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-lg bg-v12-gray-900 border-2 border-white/10 p-8 shadow-2xl"
                  >
                    <button 
                      onClick={() => setIsCreateModalOpen(false)}
                      className="absolute top-6 right-6 text-v12-gray-400 hover:text-white transition-colors"
                    >
                      <X size={24} />
                    </button>

                    <h3 className="text-3xl font-black uppercase tracking-tighter mb-8">Initiate New Project</h3>

                    <div className="mb-6">
                      <label className="text-[10px] font-black uppercase tracking-widest text-v12-gray-400 mb-2 block">Use Template</label>
                      <select 
                        onChange={(e) => handleSelectTemplate(e.target.value)}
                        className="w-full bg-white/5 border-2 border-white/10 p-4 font-bold text-sm focus:border-v12-red outline-none transition-colors appearance-none"
                      >
                        <option value="">-- SELECT A TEMPLATE --</option>
                        {templates.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>

                    <form onSubmit={handleCreateProject} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-v12-gray-400">Project Name</label>
                        <input 
                          required
                          type="text" 
                          value={newProject.name}
                          onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                          className="w-full bg-white/5 border-2 border-white/10 p-4 font-bold text-sm focus:border-v12-red outline-none transition-colors" 
                          placeholder="E.G. BRAND FILM V3"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-v12-gray-400">Initial Status</label>
                        <select 
                          value={newProject.status}
                          onChange={(e) => setNewProject({...newProject, status: e.target.value as any})}
                          className="w-full bg-white/5 border-2 border-white/10 p-4 font-bold text-sm focus:border-v12-red outline-none transition-colors appearance-none"
                        >
                          <option value="Planning">PLANNING</option>
                          <option value="Live" disabled={!user?.isVerified}>LIVE {(!user?.isVerified) && '(KYC REQ)'}</option>
                          <option value="In Progress">IN PROGRESS</option>
                          <option value="Scheduled">SCHEDULED</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-v12-gray-400">Project Description</label>
                        <textarea 
                          required
                          rows={4}
                          value={newProject.description}
                          onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                          className="w-full bg-white/5 border-2 border-white/10 p-4 font-bold text-sm focus:border-v12-red outline-none transition-colors resize-none" 
                          placeholder="DESCRIBE THE MISSION OBJECTIVES..."
                        />
                      </div>
                      <button type="submit" className="btn btn-primary w-full py-4 font-black uppercase tracking-widest text-sm">
                        Create Project
                      </button>
                    </form>
                  </motion.div>
                </div>
              )}

              {isConfirmDeleteOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsConfirmDeleteOpen(false)}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-sm bg-v12-gray-900 border-2 border-v12-red p-8 shadow-2xl text-center"
                  >
                    <div className="w-16 h-16 bg-v12-red/20 rounded-full flex items-center justify-center mx-auto mb-6 text-v12-red">
                      <AlertCircle size={32} />
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Confirm Deletion</h3>
                    <p className="text-v12-gray-400 text-sm mb-8">This action is irreversible. All project data and tasks will be permanently erased from the V12 grid.</p>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setIsConfirmDeleteOpen(false)}
                        className="btn btn-outline flex-1 py-3 text-xs font-black uppercase tracking-widest"
                      >
                        Abort
                      </button>
                      <button 
                        onClick={confirmDeleteProject}
                        className="btn btn-primary flex-1 py-3 text-xs font-black uppercase tracking-widest bg-v12-red"
                      >
                        Delete
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        );
      case 'Templates':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black uppercase tracking-tighter">Project Blueprints</h2>
              <div className="text-xs text-v12-gray-400 font-bold uppercase tracking-widest">
                {templates.length} Active Templates
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <div key={template.id} className="glass-card p-6 group hover:border-v12-red transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-v12-red/10 rounded-lg text-v12-red">
                      <Layout size={20} />
                    </div>
                    <button 
                      onClick={() => deleteTemplate(template.id)}
                      className="text-v12-gray-500 hover:text-v12-red transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <h3 className="text-xl font-bold mb-2 uppercase tracking-tight">{template.name}</h3>
                  <p className="text-xs text-v12-gray-400 mb-6 line-clamp-2">{template.description}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-v12-red">{template.status}</span>
                    <button 
                      onClick={() => {
                        setNewProject({
                          name: template.name.replace(' Template', ''),
                          description: template.description,
                          status: template.status as any
                        });
                        setIsCreateModalOpen(true);
                      }}
                      className="text-[10px] font-black uppercase tracking-widest hover:text-v12-red transition-colors"
                    >
                      Use Template
                    </button>
                  </div>
                </div>
              ))}
              {templates.length === 0 && (
                <div className="col-span-full py-20 text-center glass-card border-dashed">
                  <Layout size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="text-v12-gray-400 font-bold uppercase tracking-widest text-sm">No templates saved yet</p>
                  <p className="text-[10px] text-v12-gray-500 mt-2">Save a project as a template to see it here</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'Settings':
        const handleProfileUpdate = async (e: React.FormEvent) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget as HTMLFormElement);
          const name = formData.get('name') as string;
          
          if (!token) return;
          try {
            const res = await fetch('/api/me', {
              method: 'PUT',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ name })
            });
            if (res.ok) {
              const updatedUser = await res.json();
              setUser(updatedUser, token);
              setNotifications(prev => [{
                id: Math.random().toString(36).substr(2, 9),
                title: 'Profile Updated',
                message: 'Your profile has been successfully updated.',
                date: 'Just Now',
                read: false
              }, ...prev]);
            }
          } catch (err) {
            console.error('Failed to update profile');
          }
        };

        const handleThemeUpdate = async (color: string) => {
          if (!token) return;
          try {
            const res = await fetch('/api/me', {
              method: 'PUT',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ theme_color: color })
            });
            if (res.ok) {
              const updatedUser = await res.json();
              setUser(updatedUser, token);
            }
          } catch (err) {
            console.error('Failed to update theme');
          }
        };

        return (
          <div className="space-y-12">
            <div className="flex items-center justify-between">
              <h2 className="text-4xl font-black uppercase tracking-tighter">Command Settings</h2>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Verification Section */}
              <div className="glass-card p-10 border-v12-red/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Zap size={100} className="text-v12-red" />
                </div>
                
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-v12-red/10 rounded-2xl flex items-center justify-center text-v12-red border border-v12-red/20">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight">V12 Verification</h3>
                    <p className="text-[10px] font-bold text-v12-gray-500 uppercase tracking-widest leading-none">Proof of Identity (KYC)</p>
                  </div>
                </div>

                <div className="space-y-6 mb-10">
                  <p className="text-sm font-bold text-v12-silver uppercase leading-relaxed">
                    To protect the V12 Marketplace and unlock Emerald Revenue, we require all creators to verify their identity. Trolls and scammers are blocked; only elite pioneers remain.
                  </p>
                  
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                     <div className={cn(
                       "w-3 h-3 rounded-full animate-pulse",
                       user?.isVerified ? "bg-emerald-400" : "bg-v12-red"
                     )} />
                     <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-v12-gray-500">Status</div>
                        <div className="text-xs font-black uppercase tracking-tight">
                          {user?.isVerified ? "IDENTITY VERIFIED" : "UNVERIFIED ACCOUNT"}
                        </div>
                     </div>
                  </div>
                </div>

                <button
                  onClick={handleStartVerification}
                  disabled={user?.isVerified || isIdentityLoading}
                  className={cn(
                    "w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                    user?.isVerified 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default" 
                      : "bg-v12-red hover:bg-v12-red/90 text-white shadow-[0_0_25px_rgba(239,68,68,0.3)] hover:scale-[1.02]"
                  )}
                >
                  {isIdentityLoading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : user?.isVerified ? (
                    <>
                      <CheckCircle2 size={16} />
                      Verification Cleared
                    </>
                  ) : (
                    <>
                      <Zap size={16} />
                      Initialize V12 ID Check
                    </>
                  )}
                </button>
                {!user?.isVerified && (
                  <>
                    <p className="text-[8px] font-bold text-v12-gray-600 uppercase text-center mt-4 tracking-[0.2em]">
                      Stripe Identity Integration • Secure Link
                    </p>
                    <button
                      onClick={async () => {
                        // Secret way to simulate verification for the demo
                        if (!token) return;
                        await fetch('/api/identity/simulate-success', {
                          method: 'POST',
                          headers: { 'Authorization': `Bearer ${token}` }
                        });
                        fetchMe();
                      }}
                      className="w-full mt-4 text-[8px] font-black text-v12-gray-700 hover:text-v12-gray-500 uppercase tracking-widest transition-colors"
                    >
                      [ Debug: Force Verify ]
                    </button>
                  </>
                )}
              </div>

              <div className="glass-card p-10 border-white/10">
                <h3 className="text-xl font-black uppercase tracking-tight mb-8">Profile Configuration</h3>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-v12-gray-500 block mb-2">Display Name</label>
                    <input
                      name="name"
                      type="text"
                      defaultValue={user?.name || ''}
                      className="w-full bg-v12-gray-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-v12-red outline-none transition-colors font-bold uppercase text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-v12-gray-500 block mb-2">Primary Email</label>
                    <input
                      type="email"
                      disabled
                      defaultValue={user?.email || ''}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-v12-gray-500 outline-none font-bold uppercase text-xs cursor-not-allowed"
                    />
                  </div>
                  <button type="submit" className="btn btn-outline w-full py-4 uppercase font-black tracking-widest text-[10px]">
                    Update Global Profile
                  </button>
                </form>
              </div>

              <div className="glass-card p-10 border-white/10">
                <h3 className="text-xl font-black uppercase tracking-tight mb-8">Visual Theme</h3>
                <div className="flex flex-wrap gap-4">
                  {['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'].map((color) => (
                    <button
                      key={color}
                      onClick={() => handleThemeUpdate(color)}
                      className={cn(
                        "w-12 h-12 rounded-xl border-2 transition-all",
                        user?.theme_color === color ? "border-white scale-110" : "border-transparent hover:border-white/20"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 'Monetization':
        return (
          <div className="space-y-6">
            <div className="glass-card p-8">
              <h2 className="text-2xl font-bold uppercase tracking-tighter mb-8">Monetization Engine</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="p-6 border-2 border-white/10 bg-white/5 rounded-2xl hover:border-v12-red transition-all group">
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-3 bg-v12-red/20 rounded-xl text-v12-red">
                      <Palette size={24} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Active</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Subscription Models</h3>
                  <p className="text-sm text-v12-gray-400 mb-6">Create recurring revenue streams with tiered access for your most dedicated fans.</p>
                  
                  {!user?.isVerified && (
                    <div className="p-4 bg-v12-red/10 border border-v12-red/20 rounded-xl mb-6">
                      <div className="flex items-center gap-2 text-v12-red text-[10px] font-black uppercase mb-1">
                        <AlertCircle size={14} />
                        Identity Verification Required
                      </div>
                      <p className="text-[10px] text-v12-gray-400 leading-tight">
                        Proof of Identity (KYC) is mandatory to withdraw funds and activate high-tier subscription plans. Go to Settings to verify your account.
                      </p>
                    </div>
                  )}

                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between text-xs">
                      <span>Basic Access</span>
                      <span className="font-bold">$9.99/mo</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>VIP Experience</span>
                      <span className="font-bold">$24.99/mo</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleStripeCheckout('price_basic_123')}
                    disabled={isStripeLoading}
                    className="btn btn-primary w-full py-3 text-xs flex items-center justify-center gap-2"
                  >
                    {isStripeLoading ? <Loader2 className="animate-spin" size={16} /> : 'Configure Stripe Tiers'}
                  </button>
                </div>

                <div className="p-6 border-2 border-white/10 bg-white/5 rounded-2xl hover:border-v12-red transition-all group">
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-3 bg-v12-red/20 rounded-xl text-v12-red">
                      <Clock size={24} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-v12-gray-400">Setup Required</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Pay-Per-View Events</h3>
                  <p className="text-sm text-v12-gray-400 mb-6">Host exclusive live streams or digital premieres with one-time ticket access.</p>
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between text-xs">
                      <span>Next Event</span>
                      <span className="font-bold">Not Scheduled</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Ticket Price</span>
                      <span className="font-bold">TBD</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleStripeCheckout('price_ppv_123')}
                    disabled={isStripeLoading}
                    className="btn btn-outline w-full py-3 text-xs flex items-center justify-center gap-2"
                  >
                    {isStripeLoading ? <Loader2 className="animate-spin" size={16} /> : 'Create PPV Event'}
                  </button>
                </div>
              </div>
            </div>

            <div className="glass-card p-8">
              <h3 className="text-xl font-bold mb-6">Revenue Analytics</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
                    <YAxis stroke="#9ca3af" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <Area type="monotone" dataKey="value" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
      case 'Messages':
        return (
          <div className="h-[calc(100vh-200px)] glass-card overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-2xl font-bold uppercase tracking-tighter">V12 Comms Hub</h2>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-v12-gray-400">Secure Channel Active</span>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <Suspense fallback={
                <div className="h-full flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-v12-red border-t-transparent rounded-full animate-spin" />
                </div>
              }>
                <ChatRoom roomId="general" title="V12 GLOBAL CHAT" />
              </Suspense>
            </div>
          </div>
        );
      case 'DAW':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-8 bg-white/5 p-2 rounded-2xl border border-white/10 w-fit">
              {[
                { id: 'Timeline', icon: <Activity size={18} /> },
                { id: 'Sequencer', icon: <Music size={18} /> },
                { id: 'Mixer', icon: <Sliders size={18} /> },
                { id: 'AI Studio', icon: <Mic2 size={18} /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveDAWTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                    activeDAWTab === tab.id 
                      ? "bg-v12-red text-white shadow-lg shadow-v12-red/20" 
                      : "text-v12-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  {tab.icon}
                  {tab.id}
                </button>
              ))}
            </div>

            <div className="glass-card p-1 border-white/5 overflow-hidden">
              <Suspense fallback={
                <div className="h-[600px] flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-v12-red border-t-transparent rounded-full animate-spin" />
                </div>
              }>
                {activeDAWTab === 'Timeline' && <Timeline />}
                {activeDAWTab === 'Sequencer' && <StepSequencer />}
                {activeDAWTab === 'Mixer' && <Mixer />}
                {activeDAWTab === 'AI Studio' && <AIStudio />}
              </Suspense>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-v12-gray-900 text-white flex relative overflow-hidden">
      {/* Tech Background Effects */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:30px_30px]" />
        <motion.div 
          animate={{ y: ['-100%', '100%'] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-gradient-to-b from-transparent via-v12-red/20 to-transparent h-40"
        />
      </div>

      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 hidden lg:flex flex-col p-6">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-v12-red rounded flex items-center justify-center rotate-12">
            <span className="font-extrabold text-sm -rotate-12 italic">V12</span>
          </div>
          <span className="font-bold text-lg uppercase tracking-tighter">Portal</span>
        </div>

        <nav className="flex-grow space-y-2">
          {[
            { name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
            { name: 'Analytics', icon: <TrendingUp size={20} /> },
            { name: 'Projects', icon: <FileVideo size={20} /> },
            { name: 'DAW', icon: <Music size={20} /> },
            { name: 'Templates', icon: <Layout size={20} /> },
            { name: 'Monetization', icon: <Palette size={20} /> },
            { name: 'Messages', icon: <MessageSquare size={20} /> },
            { name: 'Settings', icon: <Sparkles size={20} /> },
          ].map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveView(item.name as DashboardView)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors',
                activeView === item.name ? 'bg-v12-red text-white' : 'text-v12-gray-400 hover:bg-white/5 hover:text-white'
              )}
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </button>
          ))}
        </nav>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-v12-gray-400 hover:text-white transition-colors mt-auto"
        >
          <LogOut size={20} />
          <span className="font-medium">Sign Out</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-6 md:p-10 overflow-auto relative">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold">
              {activeView === 'Dashboard' ? `Welcome back, ${user?.name || 'Partner'}` : activeView}
            </h1>
            <p className="text-v12-gray-400">
              {activeView === 'Dashboard' 
                ? "Here's how your brand is accelerating today."
                : `Manage your ${activeView.toLowerCase()} and track your progress.`}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 bg-white/5 rounded-lg text-v12-gray-400 hover:text-white transition-colors relative"
              >
                <Bell size={20} />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-v12-red rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-80 glass-card p-4 z-50 border-v12-red/30"
                  >
                    <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-v12-red">Notifications Center</h3>
                      <button onClick={() => setIsNotificationsOpen(false)} className="text-v12-gray-400 hover:text-white">
                        <X size={14} />
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-v12-red">
                      {notifications.length === 0 ? (
                        <div className="text-center py-8 text-v12-gray-400 text-[10px] font-bold uppercase tracking-widest">
                          No new alerts
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div 
                            key={n.id} 
                            onClick={() => markNotificationAsRead(n.id)}
                            className={cn(
                              "p-3 border-l-2 transition-colors cursor-pointer",
                              n.read ? "bg-white/5 border-white/10" : "bg-v12-red/5 border-v12-red"
                            )}
                          >
                            <div className="text-[10px] font-black uppercase tracking-widest mb-1">{n.title}</div>
                            <div className="text-[10px] text-v12-gray-400 leading-tight mb-2">{n.message}</div>
                            <div className="text-[8px] text-v12-gray-500 font-bold uppercase">{n.date}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="text-right hidden sm:block">
              <div className="font-bold">{user?.name || 'V12 Partner'}</div>
              <div className="text-xs text-v12-red uppercase font-black tracking-widest">{user?.role || 'Client'}</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-v12-red/20 border border-v12-red/50 flex items-center justify-center font-bold text-v12-red overflow-hidden">
              {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'VP'}
            </div>
          </div>
        </header>

        {renderView()}

        {/* AI Assistant Floating Button */}
        <button 
          onClick={() => setIsAIAssistantOpen(true)}
          className="fixed bottom-8 right-8 z-[150] w-16 h-16 bg-v12-red rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform group"
        >
          <Sparkles className="text-white group-hover:rotate-12 transition-transform" size={28} />
          <div className="absolute -top-12 right-0 bg-v12-gray-900 border border-white/10 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            V12 AI Assistant
          </div>
        </button>

        {/* AI Assistant Modal */}
        <AnimatePresence>
          {isAIAssistantOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAIAssistantOpen(false)}
                className="absolute inset-0 bg-black/90 backdrop-blur-xl"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 40 }}
                className="relative w-full max-w-5xl h-[80vh] bg-v12-gray-900 border-2 border-white/10 shadow-2xl overflow-hidden rounded-2xl"
              >
                <button 
                  onClick={() => setIsAIAssistantOpen(false)}
                  className="absolute top-6 right-6 z-[210] text-v12-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
                <Suspense fallback={
                  <div className="h-full flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-v12-red border-t-transparent rounded-full animate-spin" />
                  </div>
                }>
                  <AIAssistant />
                </Suspense>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
