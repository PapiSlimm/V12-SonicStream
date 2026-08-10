import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  Layout, 
  FileText, 
  Upload, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Download,
  Plus,
  Play,
  Zap,
  User,
  Settings,
  MoreVertical,
  Activity
} from 'lucide-react';
import { useAuthStore } from '../store/useStore.ts';
import { AssetCollaboration } from './AssetCollaboration.tsx';
import { BriefIntelligence } from './BriefIntelligence.tsx';
import { cn } from '../lib/utils.ts';

interface ProjectPortalProps {
  projectId: string;
  onBack: () => void;
}

export function ProjectPortal({ projectId, onBack }: ProjectPortalProps) {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'Brief' | 'Assets' | 'Review'>('Brief');
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const { token, user } = useAuthStore();

  const fetchProject = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProject(data);
      }
    } catch (error) {
      console.error('Failed to fetch project');
    } finally {
      setLoading(false);
    }
  }, [projectId, token]);

  const updateProjectStatus = async (status: string) => {
    if (!token) return;
    try {
      const response = await fetch(`/api/projects/${projectId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        fetchProject();
      } else {
        const errData = await response.json();
        alert(errData.message || errData.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update status');
    }
  };

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-24">
        <Activity className="text-v12-red animate-spin" size={48} />
      </div>
    );
  }

  if (!project) return null;

  const handleAISave = async (concept: any) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/brief`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          goals: project.brief?.goals || '',
          aiProposedStory: JSON.stringify(concept)
        })
      });
      if (res.ok) fetchProject();
    } catch (error) {
       console.error('Failed to save AI concept');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-emerald-400';
      case 'Live': return 'text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
      case 'In Production': return 'text-v12-red';
      case 'Review': return 'text-v12-orange';
      default: return 'text-v12-silver';
    }
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Dynamic Header */}
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="flex-1">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-v12-gray-400 hover:text-v12-red transition-all text-xs font-black uppercase tracking-widest mb-6 border border-white/10 px-4 py-2 rounded-full hover:bg-v12-red/10"
          >
            <ChevronLeft size={16} />
            Back to Command Center
          </button>
          
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none">{project.name}</h1>
            <div className="relative group">
              <span className={cn("text-xs font-bold uppercase tracking-widest border border-current px-3 py-1 mt-2 cursor-pointer", getStatusColor(project.status))}>
                {project.status}
              </span>
              
              <div className="absolute top-full left-0 mt-2 w-48 glass-card border-white/10 hidden group-hover:block z-50 p-2 shadow-2xl">
                {['Initial', 'In Production', 'Review', 'Live', 'Completed'].map((s) => (
                  <button
                    key={s}
                    onClick={() => updateProjectStatus(s)}
                    disabled={s === 'Live' && !user?.isVerified}
                    className={cn(
                      "w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors flex items-center justify-between",
                      project.status === s ? "bg-v12-red/20 text-v12-red" : "hover:bg-white/5 text-v12-gray-400 hover:text-white",
                      s === 'Live' && !user?.isVerified && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {s}
                    {s === 'Live' && !user?.isVerified && <Zap size={10} className="text-v12-gray-600" />}
                    {s === 'Live' && !user?.isVerified && <span className="text-[8px] italic opacity-50">KYC REQ</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className="text-v12-silver font-bold uppercase text-sm max-w-2xl">{project.description}</p>
        </div>

        <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-2 rounded-2xl">
          {(['Brief', 'Assets', 'Review'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                tab === t ? "bg-v12-red text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]" : "text-v12-gray-500 hover:text-white"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* View Content */}
      <AnimatePresence mode="wait">
        <motion.div
           key={tab}
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -20 }}
        >
          {tab === 'Brief' && (
            <div className="space-y-12">
               {/* Project Brief Intelligence */}
               <section>
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Strategic Roadmap</h3>
                    <div className="px-4 py-2 bg-v12-red/10 border border-v12-red/20 text-v12-red text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                       <Zap size={14} className="animate-pulse" />
                       Gemini AI Enhanced
                    </div>
                 </div>
                 <BriefIntelligence 
                   initialGoals={project.brief?.goals} 
                   onSave={handleAISave} 
                 />
               </section>

               {/* Brief Details */}
               <div className="grid lg:grid-cols-2 gap-8">
                 <div className="glass-card p-10 border-white/10">
                   <h4 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                     <FileText className="text-v12-red" />
                     The Core Brief
                   </h4>
                   <div className="space-y-8">
                     <div>
                       <label className="text-[10px] font-black uppercase tracking-widest text-v12-gray-500 block mb-2">Project Goals</label>
                       <p className="text-sm font-bold text-white uppercase">{project.brief?.goals || 'No goals specified yet.'}</p>
                     </div>
                     <div>
                       <label className="text-[10px] font-black uppercase tracking-widest text-v12-gray-500 block mb-2">Target Audience</label>
                       <p className="text-sm font-bold text-white uppercase">{project.brief?.targetAudience || 'Not defined.'}</p>
                     </div>
                     <div>
                       <label className="text-[10px] font-black uppercase tracking-widest text-v12-gray-500 block mb-2">Visual Reference</label>
                       <p className="text-sm font-bold text-white uppercase">{project.brief?.visualReference || 'Cinematic V12 Style.'}</p>
                     </div>
                   </div>
                 </div>

                 {project.brief?.aiProposedStory && (
                   <div className="glass-card p-10 border-v12-red/20 bg-v12-red/5">
                     <h4 className="text-xl font-black uppercase tracking-tighter mb-6 flex items-center gap-3">
                       <Layout className="text-v12-red" />
                       Attached Concept Summary
                     </h4>
                     <div className="space-y-6">
                        {(() => {
                           try {
                             const concept = JSON.parse(project.brief.aiProposedStory);
                             return (
                               <>
                                 <p className="text-xs font-bold text-v12-silver uppercase leading-relaxed line-clamp-4 italic border-l-2 border-v12-red pl-4">
                                   "{concept.scriptConcept}"
                                 </p>
                                 <div className="flex items-center gap-2 text-[10px] font-black text-v12-red uppercase">
                                   <Zap size={14} />
                                   {concept.storyboard.length} FRAMES ARCHIVED
                                 </div>
                               </>
                             );
                           } catch(e) { return null; }
                        })()}
                     </div>
                   </div>
                 )}
               </div>
            </div>
          )}

          {tab === 'Assets' && (
            <div className="space-y-12">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                 <div className="max-w-xl">
                   <h3 className="text-3xl font-black uppercase tracking-tighter mb-2">Vault Architecture</h3>
                   <p className="text-v12-gray-400 font-bold uppercase text-xs">Production stages are siloed and version-controlled for absolute precision.</p>
                 </div>
                 <button className="btn btn-primary px-8 py-4 flex items-center gap-2">
                   <Upload size={20} />
                   Upload New Raw Asset
                 </button>
               </div>

               <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {['Raw', 'Draft', 'Final'].map((stage) => (
                    <div key={stage} className="space-y-6">
                       <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                         <div className="flex items-center gap-3">
                            <span className={cn(
                              "w-2 h-2 rounded-full",
                              stage === 'Final' ? "bg-emerald-400" : stage === 'Draft' ? "bg-v12-orange" : "bg-v12-red"
                            )} />
                            <h4 className="text-sm font-black uppercase tracking-widest">{stage} Assets</h4>
                         </div>
                         <span className="text-[10px] font-black text-v12-gray-500">{project.assets.filter((a: any) => a.stage === stage).length}</span>
                       </div>

                       <div className="space-y-4">
                          {project.assets.filter((a: any) => a.stage === stage).map((asset: any) => (
                            <motion.div 
                              whileHover={{ scale: 1.02 }}
                              key={asset.id}
                              className="glass-card p-6 group cursor-pointer border-white/5 hover:border-v12-red/30"
                              onClick={() => {
                                setSelectedAsset(asset);
                                setTab('Review');
                              }}
                            >
                               <div className="flex items-center justify-between mb-4">
                                 <div className="p-3 bg-white/5 rounded-xl group-hover:bg-v12-red/10 group-hover:text-v12-red transition-all">
                                   <Play size={18} fill={stage === 'Final' ? 'currentColor' : 'none'} />
                                 </div>
                                 <MoreVertical size={16} className="text-v12-gray-600" />
                               </div>
                               <h5 className="font-black uppercase tracking-tighter mb-1 truncate">{asset.name}</h5>
                               <div className="flex items-center justify-between text-[8px] font-black text-v12-gray-500 uppercase">
                                  <span>{asset.type}</span>
                                  <span>{asset.comments.length} Comments</span>
                               </div>
                            </motion.div>
                          ))}
                          {project.assets.filter((a: any) => a.stage === stage).length === 0 && (
                            <div className="py-12 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3 text-v12-gray-600 group hover:border-white/10 transition-all">
                               <Plus size={24} />
                               <span className="text-[10px] font-black uppercase tracking-widest">No {stage} assets</span>
                            </div>
                          )}
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {tab === 'Review' && (
            <div className="space-y-8">
                {selectedAsset ? (
                   <AssetCollaboration 
                     asset={selectedAsset} 
                     projectId={projectId} 
                     onRefresh={fetchProject} 
                   />
                ) : (
                  <div className="py-48 text-center glass-card border-dashed border-white/10">
                     <AlertCircle className="mx-auto mb-6 text-v12-gray-600" size={64} />
                     <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">Choose an asset to review</h3>
                     <p className="text-v12-gray-500 font-bold uppercase text-sm max-w-sm mx-auto">
                        Head over to the Assets tab and select a production draft to start frame-accurate commenting.
                     </p>
                     <button 
                       onClick={() => setTab('Assets')}
                       className="btn btn-outline mt-8 px-10 py-4"
                     >
                        Browse Assets
                     </button>
                  </div>
                )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
