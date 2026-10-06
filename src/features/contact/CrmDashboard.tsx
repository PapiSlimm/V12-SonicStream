import { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Tag, 
  Loader2, 
  Inbox,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { apiFetch } from '../../api/apiFetch';
import { CRMContact, CRMInteraction, CRMContactType, CRMLifecycleStage } from '../../types';

export const CrmDashboard: React.FC = () => {
  const [contacts, setContacts] = useState<CRMContact[]>([]);
  const [interactions, setInteractions] = useState<Record<string, CRMInteraction[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  
  // Create Contact modal state
  const [showAddContact, setShowAddContact] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newType, setNewType] = useState<CRMContactType>('fan');
  const [newStage, setNewStage] = useState<CRMLifecycleStage>('lead');
  const [newNotes, setNewNotes] = useState<string>('');
  const [newTagsStr, setNewTagsStr] = useState<string>('');
  const [savingContact, setSavingContact] = useState<boolean>(false);

  // Selected contact for detail drawer and timeline
  const [selectedContact, setSelectedContact] = useState<CRMContact | null>(null);
  const [interactionNotes, setInteractionNotes] = useState<string>('');
  const [interactionType, setInteractionType] = useState<'email' | 'call' | 'meeting' | 'social_message' | 'note'>('email');
  const [savingInteraction, setSavingInteraction] = useState<boolean>(false);

  const fetchContacts = async () => {
    try {
      const data = await apiFetch<CRMContact[]>('/api/crm/contacts');
      setContacts(data);
      if (data.length > 0 && !selectedContact) {
        setSelectedContact(data[0]);
      }
    } catch (err: any) {
      console.error('Failed to load CRM contacts', err);
      toast.error('Could not load contacts');
    } finally {
      setLoading(false);
    }
  };

  const fetchInteractions = async (contactId: string) => {
    try {
      const data = await apiFetch<CRMInteraction[]>(`/api/crm/interactions/${contactId}`);
      setInteractions(prev => ({ ...prev, [contactId]: data }));
    } catch (err: any) {
      console.error('Failed to load interactions', err);
    }
  };

  useEffect(() => {
    fetchContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedContact) {
      fetchInteractions(selectedContact.id);
    }
  }, [selectedContact]);

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      toast.error('Name & Email are required.');
      return;
    }
    setSavingContact(true);
    try {
      const tags = newTagsStr.split(',').map(t => t.trim()).filter(Boolean);
      const payload = {
        name: newName.trim(),
        email: newEmail.trim(),
        phone: newPhone.trim() || undefined,
        type: newType,
        lifecycleStage: newStage,
        notes: newNotes.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined
      };

      const result = await apiFetch<CRMContact>('/api/crm/contacts', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      toast.success('CRM Contact created successfully!');
      
      // Reset
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewType('fan');
      setNewStage('lead');
      setNewNotes('');
      setNewTagsStr('');
      setShowAddContact(false);
      
      // Reload list
      await fetchContacts();
      if (result && result.id) {
        const fullContact: CRMContact = {
          ...result,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastInteractionAt: new Date().toISOString()
        } as any;
        setSelectedContact(fullContact);
      }
    } catch (err: any) {
      toast.error(err.message || 'Error occurred creating contact');
    } finally {
      setSavingContact(false);
    }
  };

  const handleAddInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact) return;
    if (!interactionNotes.trim()) {
      toast.error('Communication details notes are required.');
      return;
    }
    setSavingInteraction(true);
    try {
      await apiFetch<CRMInteraction>('/api/crm/interactions', {
        method: 'POST',
        body: JSON.stringify({
          contactId: selectedContact.id,
          type: interactionType,
          notes: interactionNotes.trim()
        })
      });

      toast.success('Interaction logged!');
      setInteractionNotes('');
      // Refresh interactions and contacts list to update the last Interaction dates
      await fetchInteractions(selectedContact.id);
      await fetchContacts();
    } catch (err: any) {
      toast.error(err.message || 'Failed log interaction');
    } finally {
      setSavingInteraction(false);
    }
  };

  // Filter and search
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          contact.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || contact.type === typeFilter;
    const matchesStage = stageFilter === 'all' || contact.lifecycleStage === stageFilter;
    return matchesSearch && matchesType && matchesStage;
  });

  const getContactIcon = (type: CRMContactType) => {
    switch (type) {
      case 'venue_curator': return '🏰';
      case 'booker': return '🎸';
      case 'promoter': return '📢';
      case 'vip': return '👑';
      default: return '👥';
    }
  };

  const getStageColor = (stage: CRMLifecycleStage) => {
    switch (stage) {
      case 'lead': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/25';
      case 'contact': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25';
      case 'customer': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
      case 'advocate': return 'bg-purple-500/10 text-purple-400 border-purple-500/25';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-emerald-400" size={48} />
          <p className="text-zinc-400 font-medium">Loading Artist CRM Studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-emerald-400">
              <Users size={22} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Audience &amp; Industry Relational CRM</span>
            </div>
            <h1 className="text-5xl font-black tracking-tight uppercase leading-none">Contact CRM Hub</h1>
            <p className="text-zinc-500 text-lg">
              Manage fans, live gig bookers, venue curators, and industry leaders in a unified, stateless platform ledger.
            </p>
          </div>
          <button 
            onClick={() => setShowAddContact(true)}
            className="bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl shadow-black/20 md:self-end"
          >
            <UserPlus size={16} />
            Create Contact Profile
          </button>
        </div>

        {/* Global Overview Counter Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900 border border-white/5 p-6 rounded-3xl">
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Audience</div>
            <div className="text-3xl font-black text-white mt-1">{contacts.length}</div>
          </div>
          <div className="bg-zinc-900 border border-white/5 p-6 rounded-3xl">
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Industry VIPs &amp; Bookers</div>
            <div className="text-3xl font-black text-white mt-1">
              {contacts.filter(c => c.type !== 'fan').length}
            </div>
          </div>
          <div className="bg-zinc-900 border border-white/5 p-6 rounded-3xl">
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Brand Advocates</div>
            <div className="text-3xl font-black text-white mt-1">
              {contacts.filter(c => c.lifecycleStage === 'advocate').length}
            </div>
          </div>
          <div className="bg-zinc-900 border border-white/5 p-6 rounded-3xl">
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Completed Communications</div>
            <div className="text-3xl font-black text-white mt-1">
              {Object.values(interactions).reduce((acc, curr) => acc + curr.length, 0)}
            </div>
          </div>
        </div>

        {/* Main Work Area split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Contacts List Grid (span 5) */}
          <div className="lg:col-span-5 bg-zinc-900 border border-white/5 rounded-[32px] p-6 space-y-6">
            
            {/* Search and Filters */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="text"
                  placeholder="Search contacts by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl pl-12 pr-6 py-3.5 focus:outline-none focus:border-emerald-500 text-white placeholder-zinc-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Profile Type</label>
                  <select 
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 text-zinc-300"
                  >
                    <option value="all">All Types</option>
                    <option value="fan">Fan Only</option>
                    <option value="venue_curator">Venue Curator</option>
                    <option value="booker">Event Booker</option>
                    <option value="promoter">Promoter</option>
                    <option value="vip">VIP Contacts</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Lifecycle Stage</label>
                  <select 
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 text-zinc-300"
                  >
                    <option value="all">All Stages</option>
                    <option value="lead">Lead</option>
                    <option value="contact">Active Contact</option>
                    <option value="customer">Customer</option>
                    <option value="advocate">Loyal Advocate</option>
                  </select>
                </div>
              </div>
            </div>

            {/* List Body */}
            <div className="space-y-3 overflow-y-auto max-h-[550px] pr-2">
              {filteredContacts.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl">
                  <Inbox className="mx-auto text-zinc-600 mb-2" size={36} />
                  <p className="text-zinc-500 text-sm">No profiles found matching search criteria</p>
                </div>
              ) : (
                filteredContacts.map(contact => (
                  <div 
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedContact?.id === contact.id 
                        ? 'bg-white/5 border-emerald-500/30' 
                        : 'bg-black/20 border-white/5 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-lg shrink-0">
                        {getContactIcon(contact.type)}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-bold text-sm text-white truncate">{contact.name}</div>
                        <div className="text-xs text-zinc-500 truncate">{contact.email}</div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${getStageColor(contact.lifecycleStage)}`}>
                        {contact.lifecycleStage}
                      </span>
                      <div className="flex items-center gap-1 text-[9px] text-zinc-500 font-mono">
                        <Clock size={10} />
                        {contact.lastInteractionAt ? new Date(contact.lastInteractionAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Timeline & Communications Detail Workstation (span 7) */}
          <div className="lg:col-span-7 space-y-6">
            {selectedContact ? (
              <div className="bg-zinc-900 border border-white/5 rounded-[32px] p-8 space-y-8">
                
                {/* Profile Detail Card */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-6 border-b border-white/5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{getContactIcon(selectedContact.type)}</span>
                      <h2 className="text-2xl font-black uppercase tracking-tight">{selectedContact.name}</h2>
                    </div>
                    <p className="text-zinc-400 text-sm font-mono">{selectedContact.email}</p>
                    {selectedContact.phone && (
                      <p className="text-zinc-500 text-xs font-mono">{selectedContact.phone}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${getStageColor(selectedContact.lifecycleStage)}`}>
                      STAGE: {selectedContact.lifecycleStage}
                    </span>
                    <span className="bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full text-xs uppercase font-black">
                      {selectedContact.type}
                    </span>
                  </div>
                </div>

                {/* Profile Notes, Tags */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Contact Bio Info</div>
                    <p className="text-zinc-300 leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5">
                      {selectedContact.notes || 'No description provided or logged for this audience contact.'}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Metadata Tags</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedContact.tags && selectedContact.tags.length > 0 ? (
                        selectedContact.tags.map((tag, i) => (
                          <span key={i} className="bg-zinc-800 text-zinc-300 text-xs px-2.5 py-1 rounded-lg border border-white/5 flex items-center gap-1">
                            <Tag size={12} className="text-zinc-500" />
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-zinc-500 text-xs italic">No tag labels assigned.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Log interaction Form */}
                <form onSubmit={handleAddInteraction} className="bg-black/30 border border-white/5 rounded-2xl p-6 space-y-4">
                  <div className="text-xs font-black text-zinc-400 uppercase tracking-widest">Log Communication Event</div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">Medium</label>
                      <select 
                        value={interactionType}
                        onChange={(e) => setInteractionType(e.target.value as any)}
                        className="w-full bg-zinc-900 border border-white/5 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 text-zinc-150"
                      >
                        <option value="email">Email</option>
                        <option value="call">Phone Call</option>
                        <option value="meeting">In-Person Meeting</option>
                        <option value="social_message">Social Media DM</option>
                        <option value="note">Internal Scratchpad Note</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase">Notes &amp; Call Summary</label>
                    <textarea 
                      placeholder="Discussed booking rates, contract clauses, or fan merchandise packages..."
                      value={interactionNotes}
                      onChange={(e) => setInteractionNotes(e.target.value)}
                      rows={2}
                      className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors text-sm resize-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={savingInteraction}
                    className="bg-zinc-100 text-zinc-900 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {savingInteraction ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        Syncing...
                      </>
                    ) : (
                      'Record Event'
                    )}
                  </button>
                </form>

                {/* Interaction History timeline */}
                <div className="space-y-4">
                  <h3 className="text-md font-black uppercase tracking-wide">Communication Timeline</h3>
                  <div className="space-y-4">
                    {!(interactions[selectedContact.id]) || interactions[selectedContact.id].length === 0 ? (
                      <p className="text-zinc-500 text-xs italic pl-4 border-l border-zinc-800">
                        No previous dialogue history. Log a communication event to build contact loyalty.
                      </p>
                    ) : (
                      interactions[selectedContact.id].map(item => (
                        <div key={item.id} className="flex gap-4 items-start relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-[-20px] before:w-[1px] before:bg-zinc-800 last:before:hidden">
                          <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 absolute left-0.5 top-1.5 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          </div>
                          <div className="flex-1 bg-black/20 p-4 rounded-2xl border border-white/5 space-y-2">
                            <div className="flex items-center justify-between text-xs text-zinc-500">
                              <span className="font-mono uppercase text-zinc-400 font-bold">
                                {item.type} communication
                              </span>
                              <span>{new Date(item.createdAt || '').toLocaleString()}</span>
                            </div>
                            <p className="text-[13px] text-zinc-300 leading-relaxed font-sans">{item.notes}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-zinc-900 border border-white/5 rounded-[32px] p-12 text-center text-zinc-500">
                <Users size={32} className="mx-auto text-zinc-700 mb-3" />
                Select a contact from the audience roll to check dialogue threads, metadata, lifecycle stages, and record events.
              </div>
            )}
          </div>

        </div>

        {/* Modal Window: Add contact profile */}
        {showAddContact && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-zinc-900 border border-white/5 rounded-3xl p-8 max-w-lg w-full space-y-6"
            >
              <h3 className="text-2xl font-black uppercase tracking-tight">Create Audience Profile</h3>
              
              <form onSubmit={handleCreateContact} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase">Full Name *</label>
                    <input 
                      type="text" 
                      placeholder="Madison Blake"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      required
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 text-sm text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase">Email *</label>
                    <input 
                      type="email" 
                      placeholder="madison@vipbooking.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      required
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 text-sm text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase">Phone (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="+1 (555) 0192"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 text-sm text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase">Profile Type</label>
                    <select 
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as CRMContactType)}
                      className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-500 text-zinc-300"
                    >
                      <option value="fan">Fan</option>
                      <option value="venue_curator">Venue Curator</option>
                      <option value="booker">Event Booker</option>
                      <option value="promoter">Promoter</option>
                      <option value="vip">VIP</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase">Lifecycle Stage</label>
                    <select 
                      value={newStage}
                      onChange={(e) => setNewStage(e.target.value as CRMLifecycleStage)}
                      className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-500 text-zinc-300"
                    >
                      <option value="lead">Lead</option>
                      <option value="contact">Active Contact</option>
                      <option value="customer">Customer</option>
                      <option value="advocate">Loyal Advocate</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase">Tags (comma-separated)</label>
                    <input 
                      type="text" 
                      placeholder="vip, labels, coachella"
                      value={newTagsStr}
                      onChange={(e) => setNewTagsStr(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 text-sm text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase">Internal Bio Details</label>
                  <textarea 
                    placeholder="Brief description about who they are or past gigs they promoted..."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 text-sm text-white resize-none"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddContact(false)}
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-black text-xs uppercase tracking-widest text-center"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={savingContact}
                    className="flex-1 py-4 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-widest text-center"
                  >
                    {savingContact ? (
                      <Loader2 className="animate-spin mx-auto" size={16} />
                    ) : (
                      'Save Contact'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

      </div>
    </div>
  );
};
