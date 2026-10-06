import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, FileText, ExternalLink } from 'lucide-react';
import { SectionCard } from '../../components/ui/SectionCard';
import { Button } from '../../components/ui/Button';
import { toast } from '../../components/ui/Toast';

export const ComplianceDashboard = () => {
  const [takedowns, setTakedowns] = useState<any[]>([]);
  const [metadataIssues, setMetadataIssues] = useState<any[]>([]);

  const fetchComplianceData = async () => {
    try {
      const tdResponse = await fetch('/api/admin/compliance/takedowns');
      const metaResponse = await fetch('/api/admin/compliance/metadata');
      setTakedowns(await tdResponse.json());
      setMetadataIssues(await metaResponse.json());
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchComplianceData();
  }, []);

  const handleAction = async (id: number, type: 'takedown' | 'metadata', action: 'approve' | 'reject') => {
    try {
      await fetch(`/api/admin/compliance/${type}/${id}/${action}`, { method: 'POST' });
      toast.success(`${type} request ${action}ed`);
      fetchComplianceData();
    } catch {
      toast.error("Failed to process action");
    }
  };

  return (
    <div className="space-y-8 p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-black uppercase tracking-tighter">Compliance Central</h1>
        <div className="flex gap-4">
          <SectionCard className="py-2 px-4 flex items-center gap-2">
            <Shield className="text-emerald-500" size={18} />
            <span className="text-xs font-bold uppercase">Rights Verified: 98%</span>
          </SectionCard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SectionCard title="Active Copyright Disputes">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="text-orange-500" size={20} />
            <span className="text-sm font-bold uppercase text-zinc-400">Notices</span>
          </div>
          <div className="space-y-4">
            {takedowns.length === 0 ? (
              <p className="text-zinc-500 text-sm">No pending takedown requests.</p>
            ) : takedowns.map(td => (
              <div key={td.id} className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white">{td.trackTitle}</h4>
                    <p className="text-xs text-zinc-500">Reported by: {td.reporterEmail}</p>
                  </div>
                  <span className="px-2 py-1 bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase rounded">
                    {td.status}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 italic">"{td.reason}"</p>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-red-500 text-white" onClick={() => handleAction(td.id, 'takedown', 'approve')}>Enforce</Button>
                  <Button size="sm" variant="outline" onClick={() => handleAction(td.id, 'takedown', 'reject')}>Dismiss</Button>
                  <Button size="sm" variant="ghost" className="flex items-center gap-1">
                    <ExternalLink size={14} />
                    Evidence
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="ISRC/UPC Integrity QC">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="text-blue-500" size={20} />
            <span className="text-sm font-bold uppercase text-zinc-400">Metadata Issues</span>
          </div>
          <div className="space-y-4">
            {metadataIssues.map(issue => (
              <div key={issue.id} className="p-4 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white">{issue.title}</h4>
                  <p className="text-[10px] text-zinc-500 font-mono">{issue.isrc || 'MISSING ISRC'} | {issue.upc || 'MISSING UPC'}</p>
                  <div className="mt-1 flex gap-2">
                    {issue.errors.map((err: string, i: number) => (
                      <span key={i} className="text-[8px] bg-red-500/10 text-red-400 px-1 rounded uppercase font-bold">{err}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="border-emerald-500/20 text-emerald-500" onClick={() => handleAction(issue.id, 'metadata', 'approve')}>Verify</Button>
                  <Button size="sm" variant="outline" className="border-red-500/20 text-red-500" onClick={() => handleAction(issue.id, 'metadata', 'reject')}>Reject</Button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
};
