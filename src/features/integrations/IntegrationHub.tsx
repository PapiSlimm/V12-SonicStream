import { useState } from 'react';
import { Link as LinkIcon, Share2, Globe, BarChart3, DollarSign, Database, CheckCircle2, PlusCircle, ExternalLink } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useOAuthIntegration } from '../../hooks/useOAuthIntegration';

interface IntegrationCardProps {
  title: string;
  icon: any;
  services: string[];
  onConnect: (service: string) => void;
  connectedServices?: string[];
}

const IntegrationCard = ({ title, icon: Icon, services, onConnect, connectedServices = [] }: IntegrationCardProps) => (
  <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-[40px] space-y-6 hover:border-emerald-500/20 transition-all group">
    <div className="flex items-center justify-between">
      <div className="p-4 bg-zinc-800 rounded-2xl group-hover:bg-emerald-500/10 transition-all">
        <Icon className="text-zinc-400 group-hover:text-emerald-400" size={24} />
      </div>
      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-800/50 px-3 py-1 rounded-full">
        {services.length} Available
      </span>
    </div>
    
    <div className="space-y-2">
      <h3 className="text-xl font-bold text-white">{title}</h3>
      <p className="text-sm text-zinc-500">Connect your favorite {title.toLowerCase()} tools.</p>
    </div>

    <div className="space-y-3">
      {services.map((service) => {
        const isConnected = connectedServices.includes(service);
        return (
          <div 
            key={service} 
            className={cn(
              "flex items-center justify-between p-4 rounded-2xl border transition-all",
              isConnected 
                ? "bg-emerald-500/5 border-emerald-500/20" 
                : "bg-black/40 border-white/5 hover:border-white/10"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-2 h-2 rounded-full",
                isConnected ? "bg-emerald-500 animate-pulse" : "bg-zinc-700"
              )} />
              <span className={cn("font-bold text-sm", isConnected ? "text-emerald-400" : "text-zinc-300")}>
                {service}
              </span>
            </div>
            <button
              onClick={() => onConnect(service)}
              className={cn(
                "p-2 rounded-xl transition-all",
                isConnected 
                  ? "bg-emerald-500/20 text-emerald-400" 
                  : "bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-white"
              )}
            >
              {isConnected ? <CheckCircle2 size={18} /> : <PlusCircle size={18} />}
            </button>
          </div>
        );
      })}
    </div>
  </div>
);

export const IntegrationHub = () => {
  const [connections] = useState({
    distribution: ['Bandzoogle', 'DPM Network'],
    website: ['WordPress', 'Webflow', 'Bandzoogle'],
    analytics: ['Google Analytics', 'Mixpanel'],
    payments: ['Stripe', 'PayPal'],
    storage: ['AWS S3', 'Cloudflare R2']
  });

  const [connectedServices, setConnectedServices] = useState<string[]>(['Stripe', 'AWS S3']);
  const { connectService } = useOAuthIntegration('');

  const handleConnect = async (service: string) => {
    console.log(`Connecting to ${service}...`);
    // In a real app, this would trigger the OAuth flow
    // For this demo, we'll simulate a successful connection
    if (connectedServices.includes(service)) {
      setConnectedServices(prev => prev.filter(s => s !== service));
    } else {
      // Simulate OAuth popup
      const success = await connectService();
      if (success) {
        setConnectedServices(prev => [...prev, service]);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-16">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-8">
          <div className="p-6 bg-emerald-500/10 rounded-[32px] border border-emerald-500/20">
            <LinkIcon size={48} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent tracking-tighter">
              Integration Hub
            </h1>
            <p className="text-xl text-zinc-400 mt-2">Connect your ecosystem with one-click OAuth</p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-3xl border border-white/5">
          <div className="text-right">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">API Status</p>
            <p className="text-sm font-bold text-emerald-400">All Systems Operational</p>
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        <IntegrationCard 
          title="Music Distribution"
          icon={Share2}
          services={connections.distribution}
          onConnect={handleConnect}
          connectedServices={connectedServices}
        />
        <IntegrationCard 
          title="Website Builders"
          icon={Globe}
          services={connections.website}
          onConnect={handleConnect}
          connectedServices={connectedServices}
        />
        <IntegrationCard 
          title="Analytics"
          icon={BarChart3}
          services={connections.analytics}
          onConnect={handleConnect}
          connectedServices={connectedServices}
        />
        <IntegrationCard 
          title="Payments"
          icon={DollarSign}
          services={connections.payments}
          onConnect={handleConnect}
          connectedServices={connectedServices}
        />
        <IntegrationCard 
          title="Content Storage"
          icon={Database}
          services={connections.storage}
          onConnect={handleConnect}
          connectedServices={connectedServices}
        />
        
        {/* API Docs Card */}
        <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 p-8 rounded-[40px] flex flex-col justify-between space-y-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-black text-white">Developer API</h3>
            <p className="text-zinc-400">Build custom integrations with our robust REST API and Webhooks.</p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-purple-400">
              <ExternalLink size={16} />
              Read Documentation
            </div>
            <button className="w-full py-4 bg-white text-black rounded-2xl font-black hover:bg-zinc-200 transition-all">
              Generate API Key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
