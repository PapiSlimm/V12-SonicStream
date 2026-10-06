import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  Target, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileCheck, 
  ShieldCheck, 
  Check, 
  Loader2, 
  Plus, 
  Search, 
  Mail, 
  ArrowRight, 
  Lock, 
  Upload, 
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Send,
  Zap,
  DollarSign,
  Activity,
  Award,
  Play,
  RotateCcw,
  CheckSquare,
  Square,
  Trash2,
  FileText,
  Calendar,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Cell, 
  Pie,
  AreaChart,
  Area
} from 'recharts';
import { apiFetch } from '../../api/apiFetch';
import { AIJob } from '../../types';

// Define structural types for lead system
interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  score: number; // qualification score
  stage: 'Targeting' | 'Nurturing' | 'Auto-Booked' | 'Confirmed' | 'Disqualified';
  currentTouchPoint: number; // 1 to 14
  evidenceSubmitted: boolean;
  evidenceUrl?: string;
  evidenceType?: string;
  serviceRequested: string;
  budget: number;
  personInLoopConfirmed: boolean;
  notes: string;
  bookingDate?: string; // scheduled date for bookings
}

// 14 Touchpoints Sequence Core Data
const nurtureSequence = [
  { step: 1, type: "Smart Ad Hit", title: "Invisible Contextual Impression", desc: "AI places hyper-relevant, informational native banner in industry newsletters. No cold outbound." },
  { step: 2, type: "Targeted Insight", title: "Passive Insight Exposure", desc: "Retarget with high-value technical documentation of our Dolby Atmos room. Non-sales content." },
  { step: 3, type: "Engagement Trigger", title: "Resource Download Gateway", desc: "Prospect visits to read public whitepaper. Email captured anonymously/voluntarily." },
  { step: 4, type: "Touchpoint Mail", title: "Direct case study delivery", desc: "System auto-delivers relevant technical specs. No copywriter or generative text, just real facts." },
  { step: 5, type: "Touchpoint Mail", title: "Value-focused service portfolio", desc: "Overview of audio engineering capabilities and proven references." },
  { step: 6, type: "Ad Retargeting", title: "Video Demonstration Clip", desc: "Display real live video mastering session in their professional social feeds." },
  { step: 7, type: "Dynamic Alert", title: "Regional Slot Allocation", desc: "Notify client of available festival support booking slots in their region." },
  { step: 8, type: "Touchpoint Mail", title: "Dynamic Schedule Availability", desc: "Provide secure conditional booking calendar interface based on matching service needs." },
  { step: 9, type: "Nurturing SMS", title: "System status message", desc: "Automated alert notifying them of regional service availability adjustments." },
  { step: 10, type: "Interactive Tool", title: "Interactive Budget Calculator", desc: "Invite prospect to calculate multi-channel tuning and setup prices passively." },
  { step: 11, type: "Proof of Quality", title: "Endorsement Verification", desc: "System delivers signed testimonials and certificates of original festival clients." },
  { step: 12, type: "Due Diligence Quest", title: "Evidence Submission Request", desc: "Notify prospect that to complete autobooking they must provide evidence of licensing/ability." },
  { step: 13, type: "Validation Loop", title: "Document Upload Gateway", desc: "Client uploads required degree, certification, or commercial references." },
  { step: 14, type: "Auto-Booking Trigger", title: "Programmatic Slot Reservation", desc: "System reserves the slot automatically on 90%+ score. Alerts administrator to verify evidence." }
];

export const AiAcquisitionHub = () => {
  const [activeTab, setActiveTab] = useState<'leads' | 'targeting' | 'nurture' | 'bookings' | 'analytics' | 'workers'>('leads');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  
  // Real system background job fetch
  const [apiJobs, setApiJobs] = useState<AIJob[]>([]);
  const [isLoadingApiJobs, setIsLoadingApiJobs] = useState<boolean>(false);

  // Compliance checklist states for booking finalised validation
  const [checkEvidenceAuthentic, setCheckEvidenceAuthentic] = useState<boolean>(false);
  const [checkLiabilityCompliant, setCheckLiabilityCompliant] = useState<boolean>(false);
  const [checkSanctionsScreened, setCheckSanctionsScreened] = useState<boolean>(false);

  // Default seed data for local lead states
  const [leads, setLeads] = useState<Lead[]>([
    {
      id: "lead-1",
      name: "Alex Rivera",
      company: "Sonic Boom Festivals",
      email: "alex@sonicboomfest.com",
      score: 94,
      stage: "Auto-Booked",
      currentTouchPoint: 14,
      evidenceSubmitted: true,
      evidenceUrl: "https://v12-contracts.storage.google.com/proofs/rivera_audio_engineering_degree.pdf",
      evidenceType: "Audio Engineering Major & 3x Festival Reference Letters",
      serviceRequested: "Main Stage Sound Engineering & Stereo Mixing",
      budget: 15000,
      personInLoopConfirmed: false,
      notes: "Acquired via AI Instagram lookalike cohort targeting. Passed all 14 programmatic touchpoints. Autobooked automatically on touchpoint 14 after submitting accredited sound degree.",
      bookingDate: "2026-06-18"
    },
    {
      id: "lead-2",
      name: "Elena Rostova",
      company: "Decibel Records Europe",
      email: "elena@decibelrecords.de",
      score: 83,
      stage: "Nurturing",
      currentTouchPoint: 8,
      evidenceSubmitted: false,
      serviceRequested: "Dolby Atmos Spatial Mastering Album Package",
      budget: 6500,
      personInLoopConfirmed: false,
      notes: "Spotted in AI Facebook Custom Audience. Currently receiving high-engagement non-sales materials (Touchpoint 8: Shared Spatial engineering video study).",
      bookingDate: "2026-06-22"
    },
    {
      id: "lead-3",
      name: "Marcus Sterling",
      company: "Apex Arena Group",
      email: "m.sterling@apexarenas.org",
      score: 97,
      stage: "Confirmed",
      currentTouchPoint: 14,
      evidenceSubmitted: true,
      evidenceUrl: "https://v12-contracts.storage.google.com/proofs/apex_compliance_certificate.pdf",
      evidenceType: "State Level Live Production Insurance & Promoter license V-98213",
      serviceRequested: "Stadium Sound Stage Synchronization & Consultation",
      budget: 45000,
      personInLoopConfirmed: true,
      notes: "AI qualified & automated booking. Verified live promoter license evidence manually. Booking confirmed and funds authorized.",
      bookingDate: "2026-06-10"
    },
    {
      id: "lead-4",
      name: "Chloe Chen",
      company: "Niteflow Underground Events",
      email: "chloe.chen@niteflow.io",
      score: 65,
      stage: "Targeting",
      currentTouchPoint: 3,
      evidenceSubmitted: false,
      serviceRequested: "Club Sound System Tuning & Calibration",
      budget: 3200,
      personInLoopConfirmed: false,
      notes: "Targeted through smart context-based search intent tracking. Level 3 Touchpoint sequence dispatched.",
      bookingDate: "2026-06-25"
    },
    {
      id: "lead-5",
      name: "Dimitri Volk",
      company: "Siberia Rave Coalition",
      email: "demi@siberiaraves.com",
      score: 91,
      stage: "Auto-Booked",
      currentTouchPoint: 14,
      evidenceSubmitted: false,
      serviceRequested: "Multi-Array Sound Calibration Hire",
      budget: 18500,
      personInLoopConfirmed: false,
      notes: "Hit Touchpoint 14. Autobooked programmatically, but evidence has NOT been uploaded yet. Final hold active until siberiaraves uploads license file.",
      bookingDate: "2026-06-29"
    }
  ]);

  // Real-time automatic background nurture worker simulation
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      // Find leads that can be advanced (not Confirmed and not max-nurtured to Disqualified)
      const eligibleLeads = leads.filter(l => l.stage !== 'Confirmed' && l.stage !== 'Disqualified');
      if (eligibleLeads.length === 0) {
        toast('All leads have been processed!', { icon: '💼' });
        setIsSimulating(false);
        return;
      }

      // Pick one random lead to simulate progress update
      const randomIndex = Math.floor(Math.random() * eligibleLeads.length);
      const selected = eligibleLeads[randomIndex];
      
      setLeads(prevLeads => prevLeads.map(lead => {
        if (lead.id === selected.id) {
          const nextTouch = Math.min(lead.currentTouchPoint + 1, 14);
          let newStage = lead.stage;
          let scoreBoost = Math.floor(Math.random() * 6) + 3; // +3% to +8% match score

          if (nextTouch === 14) {
            newStage = 'Auto-Booked';
          } else if (nextTouch > 3) {
            newStage = 'Nurturing';
          }

          const stageLabel = newStage === 'Auto-Booked' ? 'Awaiting Manual Review' : newStage;
          
          toast.success(
            <span>🤖 [AI Pipeline] Advanced <strong>{lead.name}</strong> to Touchpoint <strong>{nextTouch}/14</strong> ({stageLabel})</span>,
            {
              duration: 5000,
              icon: '🔄',
              style: {
                background: '#09090b',
                color: '#fff',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }
            }
          );

          if (nextTouch === 14 && lead.currentTouchPoint < 14) {
            toast('⚠️ Programmatic Auto-Booking detected! Holding funds in escrow pending manual promoter double-verification checklist.', {
              icon: '🚨',
              duration: 7000
            });
          }

          return {
            ...lead,
            currentTouchPoint: nextTouch,
            score: Math.min(lead.score + scoreBoost, 100),
            stage: newStage,
            notes: `${lead.notes}\n[AI Worker System Update: ${new Date().toLocaleTimeString()}] Progressed to Step ${nextTouch}: ${nurtureSequence[nextTouch - 1].title}.`
          };
        }
        return lead;
      }));

    }, 8000);

    return () => clearInterval(interval);
  }, [isSimulating, leads]);

  // Load Real backend jobs to sync with our AI worker display
  const fetchBackendJobs = async () => {
    setIsLoadingApiJobs(true);
    try {
      const data = await apiFetch<AIJob[]>('/api/ai-jobs');
      if (Array.isArray(data)) {
        setJobsFromDb(data);
      }
    } catch (e: any) {
      console.warn("Could not load backend direct-jobs, executing mock queue: ", e.message);
    } finally {
      setIsLoadingApiJobs(false);
    }
  };

  const [jobsFromDb, setJobsFromDb] = useState<AIJob[]>([]);

  useEffect(() => {
    fetchBackendJobs();
  }, []);

  // Run a new simulated or real background AI scan job
  const handleTriggerScraperScan = async () => {
    setIsLoadingApiJobs(true);
    const toastId = toast.loading("Invoking Autonomous lead scraper worker job...");
    try {
      // Execute a real backend job via /api-jobs
      const response = await apiFetch<any>('/api-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobType: 'mastering', // valid enum in database
          inputUrl: 'https://v12-sonicstream.com/leads/scrapers/active_festival_listings.csv'
        })
      });

      // Add a simulated lead to the board
      const rawLeadsNames = ["Theresa Sterling", "Klaus Reinhardt", "Marcus Vance", "Sasha Greywood"];
      const rawCompanies = ["Sub-Bass Berlin Events", "Mainframe Arena", "Apex Festival Group", "Nordic Sound Guild"];
      const randomIdx = Math.floor(Math.random() * rawLeadsNames.length);

      const injected: Lead = {
        id: `scraped-${Date.now().toString().slice(-4)}`,
        name: rawLeadsNames[randomIdx],
        company: rawCompanies[randomIdx],
        email: `contracts@${rawCompanies[randomIdx].toLowerCase().replace(/\s+/g, '')}.de`,
        score: Math.floor(Math.random() * 20) + 75,
        stage: 'Targeting',
        currentTouchPoint: 1,
        evidenceSubmitted: false,
        serviceRequested: "Atmos Venue Calibration & DSP Setup",
        budget: 12000 + Math.floor(Math.random() * 15000),
        personInLoopConfirmed: false,
        bookingDate: `2026-06-${String(Math.floor(Math.random() * 10) + 16).padStart(2, '0')}`, // Date between 2026-06-16 and 2026-06-25
        notes: `Automatically discovered by CRM SoundScraper AI background worker [Job ID: ${response?.id || 'sim-9213'}]. Initial lookalike cohort matching: 92% confidence.`
      };

      setLeads(prev => [injected, ...prev]);
      await fetchBackendJobs();
      toast.success("Autonomous lead target scraping complete! New lead appended.", { id: toastId });
    } catch (err: any) {
      // Fallback manual append
      const fallbackLead: Lead = {
        id: `scraped-${Date.now()}`,
        name: "Theresa Sterling",
        company: "Sub-Bass Berlin Events",
        email: "theresa@subbassberlin.de",
        score: 87,
        stage: 'Targeting',
        currentTouchPoint: 1,
        evidenceSubmitted: false,
        serviceRequested: "Atmos Venue Calibration & DSP Setup",
        budget: 16500,
        personInLoopConfirmed: false,
        bookingDate: "2026-06-16",
        notes: `Discovered by CRM SoundScraper AI background worker. Lookalike matching completed.`
      };
      setLeads(prev => [fallbackLead, ...prev]);
      toast.success("AI pipeline lead discovered and loaded!", { id: toastId });
    } finally {
      setIsLoadingApiJobs(false);
    }
  };

  // Targeting Config State
  const [targetAudience, setTargetAudience] = useState('Festival Promoters, Arena Sound Directors & Live Music Venues looking for professional immersive sound setups.');
  const [dailyBudget, setDailyBudget] = useState(150);
  const [aiOptimizationsEnabled, setAiOptimizationsEnabled] = useState(true);

  // Calendar view state managers
  const [bookingDisplayMode, setBookingDisplayMode] = useState<'calendar' | 'list'>('calendar');
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date(2026, 5, 1)); // Default June 2026

  // New Lead Creation modal state
  const [showAddLead, setShowAddLead] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadCompany, setNewLeadCompany] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadService, setNewLeadService] = useState('');
  const [newLeadBudget, setNewLeadBudget] = useState(15000);
  const [newLeadBookingDate, setNewLeadBookingDate] = useState('2026-06-20');

  // Selected lead for detail view
  const [selectedLeadId, setSelectedLeadId] = useState<string>("lead-1");
  const selectedLead = leads.find(l => l.id === selectedLeadId) || leads[0];

  const handleUpdateBookingDate = (id: string, date: string) => {
    setLeads(prevLeads => prevLeads.map(lead => {
      if (lead.id === id) {
        return {
          ...lead,
          bookingDate: date,
          notes: `${lead.notes}\n[Schedule Update: ${new Date().toLocaleDateString()}] Rescheduled booking date to ${date}.`
        };
      }
      return lead;
    }));
    toast.success('Scheduled booking slot updated on the calendar!');
  };

  const handleRejectBooking = (id: string) => {
    setLeads(prevLeads => prevLeads.map(lead => {
      if (lead.id === id) {
        return {
          ...lead,
          stage: "Disqualified",
          notes: `${lead.notes}\n[Manual Rejection Audit]: ${new Date().toLocaleDateString()} - Human-in-the-Loop reviewer REJECTED this auto-booked lead due to credential or compliance failure.`
        };
      }
      return lead;
    }));
    toast.error('❌ Lead has been rejected and marked as Disqualified.', {
      style: {
        background: '#09090b',
        color: '#f87171',
        border: '1px solid rgba(239, 68, 68, 0.2)'
      }
    });

    // Reset checklist states
    setCheckEvidenceAuthentic(false);
    setCheckLiabilityCompliant(false);
    setCheckSanctionsScreened(false);
  };

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName || !newLeadEmail) {
      toast.error('Name and Email are strictly required fields');
      return;
    }

    const created: Lead = {
      id: `lead-${Date.now().toString().slice(-5)}`,
      name: newLeadName,
      company: newLeadCompany || 'Independent Music Group',
      email: newLeadEmail,
      score: Math.floor(Math.random() * 15) + 70, // starts at decent rating
      stage: 'Targeting',
      currentTouchPoint: 1,
      evidenceSubmitted: false,
      serviceRequested: newLeadService || 'Venue Calibration Hire',
      budget: Number(newLeadBudget),
      personInLoopConfirmed: false,
      notes: 'Prospect manually initialized into Lookalike Targeting sequence. Programmatic step 1 outbound triggered.',
      bookingDate: newLeadBookingDate || '2026-06-20'
    };

    setLeads([created, ...leads]);
    setSelectedLeadId(created.id);
    setNewLeadName('');
    setNewLeadCompany('');
    setNewLeadEmail('');
    setNewLeadService('');
    setNewLeadBudget(15000);
    setNewLeadBookingDate('2026-06-20');
    setShowAddLead(false);
    toast.success('Lead initialized and injected into the 14-touchpoint trust sequence!');
  };

  const handleAdvanceTouchpoint = (id: string) => {
    setLeads(prevLeads => prevLeads.map(lead => {
      if (lead.id === id) {
        const nextTouch = Math.min(lead.currentTouchPoint + 1, 14);
        let nextStage = lead.stage;
        let scoreInc = Math.floor(Math.random() * 4) + 3;
        
        if (nextTouch === 14) {
          nextStage = 'Auto-Booked';
        } else if (nextTouch > 3) {
          nextStage = 'Nurturing';
        }

        const notifyLabel = nextStage === 'Auto-Booked' ? 'Awaiting Human Finalization' : nextStage;
        toast.success(`Advanced touchpoint to ${nextTouch}/14. Current State: ${notifyLabel}`);

        return {
          ...lead,
          currentTouchPoint: nextTouch,
          score: Math.min(lead.score + scoreInc, 100),
          stage: nextStage,
          notes: `${lead.notes}\n[Manual Increment: ${new Date().toLocaleTimeString()}] Triggered Step ${nextTouch}: ${nurtureSequence[nextTouch - 1].title}`
        };
      }
      return lead;
    }));
  };

  const handleVerifyEvidence = (id: string) => {
    setLeads(prevLeads => prevLeads.map(lead => {
      if (lead.id === id) {
        return {
          ...lead,
          evidenceSubmitted: true,
          evidenceType: "Accredited Live Production Certificate & Liability Insurance (State Certified V-98213)",
          evidenceUrl: "https://v12-contracts.storage.google.com/proofs/verified_industry_licensing.pdf"
        };
      }
      return lead;
    }));
    toast.success('Verification evidence document uploaded successfully! Security hold updated.');
  };

  // Enforce Double Diligence Conditional Logic
  const handleConfirmBooking = (id: string) => {
    const leadToConfirm = leads.find(l => l.id === id);
    if (!leadToConfirm) return;
    
    // 1. Strict verification file check
    if (!leadToConfirm.evidenceSubmitted) {
      toast.error('❌ STRICT VIOLATION: Verification evidence file is required before finalizing any bookings!');
      return;
    }

    // 2. Human validation checkmarks
    if (!checkEvidenceAuthentic || !checkLiabilityCompliant || !checkSanctionsScreened) {
      toast.error('❌ STRICT VIOLATION: All manual audit checkboxes must be verified to complete Human-in-the-Loop compliance.');
      return;
    }
    
    setLeads(prevLeads => prevLeads.map(lead => {
      if (lead.id === id) {
        return {
          ...lead,
          stage: "Confirmed",
          personInLoopConfirmed: true,
          notes: `${lead.notes}\n[Manual Human Approval]: ${new Date().toLocaleDateString()} - All compliance checkmarks cleared. Finalized contract bookings and authorized escrow funds transfer with aggregate value of $${lead.budget.toLocaleString()}.`
        };
      }
      return lead;
    }));

    toast.success('Core Verification Complete! Booking is officially CONFIRMED. Escrow payment released.');
    
    // Reset checklists for next review
    setCheckEvidenceAuthentic(false);
    setCheckLiabilityCompliant(false);
    setCheckSanctionsScreened(false);
  };

  // Chart Funnel Data calculation
  const funnelData = [
    { name: "1. Target Audience Ads", value: 500, label: "500 Targeted", color: "#e2536a", desc: "Passive high-intent ad placements" },
    { name: "2. Passive Interest (T2-4)", value: 380, label: "380 Conversions", color: "#c81e3a", desc: "Material & case studies read" },
    { name: "3. Direct Engagement (T5-8)", value: 240, label: "240 Active Readers", color: "#a3182f", desc: "Schedules requested & calculators" },
    { name: "4. Evidence Requests (T9-12)", value: 110, label: "110 Diligence Starts", color: "#7a0f22", desc: "Submitting licenses/degrees" },
    { name: "5. Programmatic Autobooks", value: 34, label: "34 Awaiting Audit", color: "#6366f1", desc: "Reached 14/14 automated line" },
    { name: "6. Cleared & Confirmed", value: 14, label: "14 Escrow Disbursed", color: "#4f46e5", desc: "Human finalized" }
  ];

  // Curve data showing trust/match correlation across 1-14 touchpoints
  const trustFidelityData = [
    { level: "Point 1", score: 62, costCents: 55, name: "Impression" },
    { level: "Point 2", score: 65, costCents: 60, name: "Insight" },
    { level: "Point 3", score: 67, costCents: 65, name: "Trigger" },
    { level: "Point 4", score: 70, costCents: 75, name: "Case Study" },
    { level: "Point 5", score: 74, costCents: 85, name: "Portfolio" },
    { level: "Point 6", score: 77, costCents: 90, name: "Video Demo" },
    { level: "Point 7", score: 80, costCents: 100, name: "Slot Check" },
    { level: "Point 8", score: 83, costCents: 110, name: "Calendar Match" },
    { level: "Point 9", score: 86, costCents: 120, name: "Status Alert" },
    { level: "Point 10", score: 89, costCents: 135, name: "Budget Calc" },
    { level: "Point 11", score: 92, costCents: 150, name: "Social Proof" },
    { level: "Point 12", score: 95, costCents: 165, name: "Diligence Start" },
    { level: "Point 13", score: 97, costCents: 180, name: "File Upload" },
    { level: "Point 14", score: 99, costCents: 210, name: "Auto Reserve" }
  ];

  const stageBreakdownData = [
    { name: 'Targeting Step', value: leads.filter(l => l.stage === 'Targeting').length, color: '#e2536a' },
    { name: 'Nurture Timeline', value: leads.filter(l => l.stage === 'Nurturing').length, color: '#fbbf24' },
    { name: 'Awaiting Audit (14)', value: leads.filter(l => l.stage === 'Auto-Booked').length, color: '#6366f1' },
    { name: 'Manual Confirmed', value: leads.filter(l => l.stage === 'Confirmed').length, color: '#c81e3a' }
  ].filter(item => item.value > 0);

  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          l.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          l.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = filterStage === 'all' || l.stage === filterStage;
    return matchesSearch && matchesStage;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 lg:p-12 font-sans selection:bg-emerald-500/30 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header section with brand identity */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/5 pb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-wider">
                <Sparkles size={12} className="animate-pulse text-emerald-400" />
                <span>Autonomous Conversion Pipeline</span>
              </div>
              {isSimulating && (
                <div className="flex items-center gap-1 text-[9px] text-zinc-400 bg-zinc-900 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                  <span>Real-Time Simulated Outbound Live</span>
                </div>
              )}
            </div>
            
            <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">
              Lead Acquisition Hub
            </h1>
            <p className="text-zinc-400 text-lg max-w-3xl leading-relaxed">
              Integrated lookalike network ad placements, automated non-spammy 14-touchpoint nurture structures, Recharts visual funnel tracking, and strict Human-in-the-Loop credentials clearance checks.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSimulating(!isSimulating)}
              className={`px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${
                isSimulating 
                  ? 'bg-amber-500/15 border-amber-505 text-amber-400 hover:bg-amber-500/20' 
                  : 'bg-zinc-900/60 border-white/5 text-zinc-300 hover:bg-zinc-850 hover:text-white'
              }`}
            >
              <Activity size={14} className={isSimulating ? 'animate-spin' : ''} />
              {isSimulating ? 'Stop Simulator' : 'Simulate Recruiter Runs'}
            </button>

            <button 
              onClick={() => setShowAddLead(true)}
              className="px-6 py-3.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl shadow-black/10"
            >
              <Plus size={16} />
              Inject Prospect
            </button>
          </div>
        </div>

        {/* Dynamic Navigation Tabs */}
        <div className="flex flex-wrap gap-3 border-b border-white/5 pb-5">
          {[
            { id: 'leads', label: 'AI Lead Board', icon: Users, badge: leads.length },
            { id: 'targeting', label: 'Ad Lookalikes', icon: Target },
            { id: 'nurture', label: '14-Step Timeline', icon: Clock },
            { id: 'bookings', label: 'Diligence Audit', icon: ShieldCheck, badge: leads.filter(l => l.stage === 'Auto-Booked').length },
            { id: 'analytics', label: 'Funnel Analytics', icon: TrendingUp },
            { id: 'workers', label: 'AI Workers Ledger', icon: Zap, badge: apiJobs.length > 0 ? apiJobs.length : undefined },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === 'bookings' && selectedLead && selectedLead.stage !== 'Auto-Booked') {
                  // Auto focus onto first autobooked lead for a nicer workflow
                  const firstAutobooked = leads.find(l => l.stage === 'Auto-Booked');
                  if (firstAutobooked) setSelectedLeadId(firstAutobooked.id);
                }
              }}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border ${
                activeTab === tab.id 
                  ? 'bg-zinc-700 text-white border-transparent shadow-lg shadow-black/5' 
                  : 'bg-zinc-950 text-zinc-400 hover:bg-zinc-905 border-white/5 hover:text-white'
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
              {tab.badge !== undefined && (
                <span className={`px-2 py-0.5 text-[9px] rounded-full font-bold ${activeTab === tab.id ? 'bg-black text-white' : 'bg-zinc-900 text-zinc-500'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Main Content Panels switcher */}
        <div className="grid grid-cols-1 gap-12">
          
          {/* TAB 1: AI LEAD BOARD */}
          {activeTab === 'leads' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Segment: Leads list */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-zinc-900 border border-white/5 p-6 rounded-[32px] space-y-6">
                  
                  {/* Search bar and interactive filters */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="relative md:col-span-8">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                        <input 
                          type="text"
                          placeholder="Search high-intent prospects..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full bg-black/40 border border-white/5 rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-emerald-500 text-white placeholder-zinc-500 transition-colors"
                        />
                      </div>
                      
                      <div className="md:col-span-4">
                        <select 
                          value={filterStage}
                          onChange={(e) => setFilterStage(e.target.value)}
                          className="w-full bg-black/40 border border-white/5 rounded-2xl px-4 py-3.5 text-xs focus:outline-none focus:border-emerald-500 text-zinc-300 transition-colors h-full"
                        >
                          <option value="all">All Stages</option>
                          <option value="Targeting">New (Lookalike Targeting)</option>
                          <option value="Nurturing">Nurturing (14-Step Nurture)</option>
                          <option value="Auto-Booked">Qualified (Holds Compliance)</option>
                          <option value="Confirmed">Booked (Human Confirmed)</option>
                          <option value="Disqualified">Disqualified (Rejected)</option>
                        </select>
                      </div>
                    </div>

                    {/* Horizontal stage tab-based filters */}
                    <div className="flex flex-wrap items-center gap-1.5 p-1 bg-black/45 border border-white/5 rounded-2xl overflow-x-auto scrollbar-none">
                      {[
                        { id: 'all', label: 'All', count: leads.length },
                        { id: 'Targeting', label: 'New', count: leads.filter(l => l.stage === 'Targeting').length },
                        { id: 'Nurturing', label: 'Nurturing', count: leads.filter(l => l.stage === 'Nurturing').length },
                        { id: 'Auto-Booked', label: 'Qualified', count: leads.filter(l => l.stage === 'Auto-Booked').length },
                        { id: 'Confirmed', label: 'Booked', count: leads.filter(l => l.stage === 'Confirmed').length },
                        { id: 'Disqualified', label: 'Disqualified', count: leads.filter(l => l.stage === 'Disqualified').length }
                      ].map((item) => {
                        const isActive = filterStage === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setFilterStage(item.id)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 min-h-[44px] shrink-0 border ${
                              isActive 
                                ? 'bg-zinc-700 text-white border-transparent font-extrabold shadow-md shadow-black/10' 
                                : 'text-zinc-400 hover:text-white bg-black/20 hover:bg-zinc-800/40 border-white/5'
                            }`}
                          >
                            <span>{item.label}</span>
                            <span className={`px-1.5 py-0.5 text-[9px] rounded-full font-bold font-mono ${
                              isActive ? 'bg-black/90 text-emerald-400' : 'bg-zinc-900 text-zinc-500 border border-white/5'
                            }`}>
                              {item.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Leads board list renderer */}
                  <div className="space-y-4">
                    {filteredLeads.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl text-zinc-500 text-sm">
                        No clients match filters. Please click &quot;Inject Prospect&quot; to seed!
                      </div>
                    ) : (
                      filteredLeads.map(lead => (
                        <div 
                          key={lead.id}
                          onClick={() => setSelectedLeadId(lead.id)}
                          className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                            selectedLeadId === lead.id 
                              ? 'bg-zinc-800/80 border-emerald-500/30 shadow-md shadow-black/35' 
                              : 'bg-black/20 border-white/5 hover:bg-zinc-900/60'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-white text-md">{lead.name}</span>
                              <span className="text-emerald-400 font-mono text-xs">@{lead.company}</span>
                            </div>
                            <div className="text-sm text-zinc-400">{lead.serviceRequested}</div>
                            
                            <div className="flex items-center gap-4 text-[10px] text-zinc-500 font-mono pt-1">
                              <span>Budget: <strong className="text-zinc-300 font-normal">${lead.budget.toLocaleString()}</strong></span>
                              <span>Touchpoint: <strong className="text-emerald-400">{lead.currentTouchPoint}/14</strong></span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-5 shrink-0 border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                            {/* Score tracker gage */}
                            <div className="text-left">
                              <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block">Lead Affinity</span>
                              <span className={`text-md font-black font-mono ${lead.score >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {lead.score}% Match
                              </span>
                            </div>

                            {/* State labels */}
                            <div className="flex flex-col items-end">
                              <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${
                                lead.stage === 'Confirmed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                lead.stage === 'Auto-Booked' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-505/20 animate-pulse' :
                                lead.stage === 'Nurturing' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                'bg-zinc-800 text-zinc-400 border-white/5'
                              }`}>
                                {lead.stage}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                </div>
              </div>

              {/* Right Segment: Selected Lead details with Touchpoint manual increment tools */}
              <div className="lg:col-span-5 space-y-6">
                {selectedLead ? (
                  <div className="bg-zinc-900 border border-white/5 rounded-[32px] p-8 space-y-6">
                    <div className="space-y-1.5 border-b border-white/5 pb-4">
                      <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-[#c81e3a]">
                        <span>Selected Client Contact</span>
                        <span className="font-mono text-zinc-500">ID: {selectedLead.id}</span>
                      </div>
                      <h2 className="text-2xl font-black tracking-tight">{selectedLead.name}</h2>
                      <p className="text-zinc-400 text-xs font-mono">{selectedLead.email}</p>
                    </div>

                    {/* Progress Touchpoint indicator */}
                    <div className="bg-black/30 p-5 rounded-2xl border border-white/5 space-y-3">
                      <div className="flex justify-between text-xs font-black uppercase tracking-wider text-zinc-400">
                        <span>Programmatic Sequence</span>
                        <span className="text-emerald-400">{selectedLead.currentTouchPoint}/14 Steps Complete</span>
                      </div>
                      
                      {/* Grid representation of 14 steps */}
                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: 14 }).map((_, idx) => (
                          <div 
                            key={idx} 
                            className={`h-2.5 rounded-full transition-all ${
                              idx + 1 <= selectedLead.currentTouchPoint 
                                ? 'bg-emerald-450 bg-emerald-500' 
                                : 'bg-zinc-850 border border-white/5'
                            }`}
                            title={`Touchpoint level ${idx + 1}`}
                          />
                        ))}
                      </div>

                      <div className="text-xs text-zinc-400 pt-1 leading-relaxed">
                        🤖 Outbound phase: <strong className="text-white">{nurtureSequence[selectedLead.currentTouchPoint - 1]?.title}</strong>. This system employs secure, high-engagement documentation assets to gain buy-in—<strong>strictly adhering to GDPR rules by avoiding bulk robocalling or automated cold phone calls</strong>.
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Acquisition Outbound Ledger</h4>
                      <p className="text-zinc-300 text-xs leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {selectedLead.notes}
                      </p>
                    </div>

                    {/* Active dynamic operations */}
                    <div className="pt-4 border-t border-white/5 space-y-3">
                      {selectedLead.currentTouchPoint < 14 && (
                        <button
                          onClick={() => handleAdvanceTouchpoint(selectedLead.id)}
                          className="w-full py-3 bg-zinc-850 hover:bg-zinc-800 text-emerald-400 rounded-xl text-xs uppercase font-black tracking-wider flex items-center justify-center gap-2 border border-white/5 transition-all text-emerald-400"
                        >
                          <Zap size={14} />
                          Trigger Next Touchpoint ({selectedLead.currentTouchPoint + 1}/14)
                        </button>
                      )}

                      {selectedLead.stage === 'Auto-Booked' && (
                        <button
                          onClick={() => {
                            setActiveTab('bookings');
                            // Ensure the checked states reflect current selection
                            setCheckEvidenceAuthentic(false);
                            setCheckLiabilityCompliant(false);
                            setCheckSanctionsScreened(false);
                          }}
                          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs uppercase font-black tracking-widest flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/10"
                        >
                          <ShieldCheck size={16} />
                          Review Awaiting Booking Credentials
                        </button>
                      )}

                      {!selectedLead.evidenceSubmitted && selectedLead.stage !== 'Confirmed' && (
                        <button
                          onClick={() => handleVerifyEvidence(selectedLead.id)}
                          className="w-full py-3 bg-zinc-900 hover:bg-zinc-850 rounded-xl text-xs uppercase font-black tracking-wider flex items-center justify-center gap-2 text-zinc-300 border border-white/10 transition-all"
                        >
                          <Upload size={14} />
                          Upload Verification Document Proof
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-900 border border-white/5 rounded-[32px] p-12 text-center text-zinc-500">
                    Select a prospect from the CRM lead list board to view detailed outreach progression logs.
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: AD TARGETING PARAMETERS */}
          {activeTab === 'targeting' && (
            <div className="bg-zinc-900 border border-white/5 rounded-[40px] p-8 lg:p-12 space-y-8">
              <div className="max-w-3xl space-y-4">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Target size={22} />
                  <span className="text-xs font-black uppercase tracking-widest">Autonomous Lookalike Clustering</span>
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tight">AI Lookalike Target Configurations</h3>
                <p className="text-zinc-400 text-md leading-relaxed">
                  Seed our programmatic campaign clusters. Simple, non-intrusive awareness materials are placed across relevant industry listings for promoters who demonstrate active booking intent on Google Search or LinkedIn. Cold outbound email spam is avoided.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Targeting formulation */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Target Audience Description Seed</label>
                    <textarea 
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      rows={3}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-emerald-500 resize-none font-sans leading-relaxed transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Active Ad Channels</label>
                      <div className="space-y-2">
                        {['Meta Custom Audience Lookalikes', 'Google Ads Search Intent Matching', 'LinkedIn Enterprise Guild Clusters', 'Instagram Professional Video Placements'].map(channel => (
                          <div key={channel} className="p-3 bg-black/25 border border-white/5 rounded-xl text-xs flex items-center justify-between">
                            <span className="font-bold text-zinc-300">{channel}</span>
                            <span className="text-emerald-400 font-mono font-bold uppercase text-[9px] tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded">Running</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-5 bg-black/20 p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Daily Sandbox Campaign Budget</label>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl text-emerald-400 font-black font-mono">$</span>
                          <input 
                            type="number"
                            value={dailyBudget}
                            onChange={(e) => setDailyBudget(Number(e.target.value))}
                            className="bg-transparent text-2xl font-black font-mono w-full focus:outline-none text-white border-0 p-0"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold block">AI Optimization Engine</span>
                          <span className="text-[10px] text-zinc-500 leading-none">Auto-shift funds to lookalike performance</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => {
                            setAiOptimizationsEnabled(!aiOptimizationsEnabled);
                            toast.success(`AI Campaign Balancing ${!aiOptimizationsEnabled ? 'Enabled' : 'Disabled'}`);
                          }}
                          className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${aiOptimizationsEnabled ? 'bg-emerald-500' : 'bg-zinc-800'}`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white transition-all duration-200 ${aiOptimizationsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Performance projections */}
                <div className="bg-black/30 p-8 rounded-3xl border border-white/5 space-y-6">
                  <h4 className="text-sm font-black uppercase tracking-wider text-zinc-300">Cohort Match Rate Diagnostics</h4>
                  
                  <div className="space-y-4 font-mono text-xs">
                    <div className="p-4 bg-zinc-900 border border-white/5 rounded-xl">
                      <div className="text-[9px] text-zinc-500 uppercase">Average Outreach CPC</div>
                      <div className="text-lg font-black text-white mt-1">$0.78 <span className="text-emerald-400 text-[10px] font-bold">-14% vs industry baseline</span></div>
                    </div>

                    <div className="p-4 bg-zinc-900 border border-white/5 rounded-xl">
                      <div className="text-[9px] text-zinc-500">Estimated Weekly Target Volume</div>
                      <div className="text-lg font-black text-white mt-1">45 - 60 qualified leads</div>
                    </div>

                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
                      <ShieldCheck className="text-emerald-400 mt-0.5 shrink-0" size={16} />
                      <div className="text-[11px] text-zinc-300 leading-normal font-sans">
                        <strong>GDPR Compliant Architecture:</strong> Our looking-intent scraping matches are strictly opt-in and cookies-isolated to ensure total compliance.
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: 14-TOUCHPOINT JOURNEY DETAILS */}
          {activeTab === 'nurture' && (
            <div className="bg-zinc-900 border border-white/5 rounded-[40px] p-8 lg:p-12 space-y-8">
              
              <div className="max-w-3xl space-y-4">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Clock size={22} />
                  <span className="text-xs font-black uppercase tracking-widest">Nurture Sequence Trust Loops</span>
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tight">The 14 Programmatic Trust Touchpoints</h3>
                <p className="text-zinc-400 text-md leading-relaxed">
                  How our system works: Potential clients receive passive, educational materials detailing sound systems over 14 distinct checkpoints. Only when the sequence hits touchpoint 14 are bookings auto-registered. Bulk spam or cold calling are never used.
                </p>
              </div>

              {/* 14 step visual cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nurtureSequence.map((step) => {
                  return (
                    <div 
                      key={step.step}
                      className="p-6 bg-black/25 hover:bg-black/40 border border-white/5 rounded-2xl relative flex flex-col justify-between gap-4 transition-all hover:border-white/10 group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 text-xs font-black flex items-center justify-center font-mono border border-white/5 group-hover:border-indigo-400/50 text-indigo-300 transition-colors">
                            {step.step}
                          </div>
                          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-900 px-2 py-1 rounded">
                            {step.type}
                          </span>
                        </div>
                        <h4 className="text-md font-bold text-white group-hover:text-emerald-400 transition-colors">{step.title}</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">{step.desc}</p>
                      </div>

                      {step.step === 14 && (
                        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[10px] text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-2 mt-2">
                          <CheckCircle2 size={12} className="shrink-0" />
                          Automated reserving initiates here
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* TAB 4: STRICT DOUBLE DILIGENCE AUDIT & BOOKINGS */}
          {activeTab === 'bookings' && (
            <div className="space-y-8">
              
              {/* Informative compliance header block */}
              <div className="bg-zinc-900 border border-white/5 rounded-[40px] p-8 lg:p-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-8 space-y-4">
                    <div className="flex items-center gap-2 text-indigo-400 font-black text-xs uppercase tracking-widest">
                      <ShieldAlert size={18} className="text-indigo-400 animate-pulse" />
                      Human-in-the-Loop Booking Verification Gate
                    </div>
                    <h3 className="text-4xl font-black uppercase tracking-tight">Manual Clearance &amp; Verify Safeguards</h3>
                    <p className="text-zinc-400 text-md leading-relaxed font-sans">
                      Our platform automates client outreach up to Touchpoint 14. However, to eliminate fraudulent sound providers or uncertified technicians, we enforce a strict business guardrail:
                    </p>
                    
                    <div className="flex flex-wrap gap-4 pt-2">
                      <div className="flex bg-black/45 border border-white/5 p-1 rounded-2xl shrink-0">
                        <button
                          type="button"
                          onClick={() => setBookingDisplayMode('calendar')}
                          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                            bookingDisplayMode === 'calendar' 
                              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/10' 
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          <Calendar size={13} />
                          Calendar View
                        </button>
                        <button
                          type="button"
                          onClick={() => setBookingDisplayMode('list')}
                          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                            bookingDisplayMode === 'list' 
                              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/10' 
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          <FileText size={13} />
                          Audit List View
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-4 bg-black/40 p-6 rounded-3xl border border-white/5 space-y-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Compliance Status</span>
                      <div className="text-lg font-black text-white">Escrow Release Policy</div>
                    </div>
                    <p className="text-xs text-zinc-400 leading-normal">
                      Funds linked to the direct Stripe subscription are held programmatically in custom locked accounts and cannot be finalized or disburse funds without manual verification passing.
                    </p>
                  </div>
                </div>
              </div>

              {/* Conditional checklist implementation */}
              <div className="space-y-6">
                <h3 className="text-xl font-black uppercase tracking-tight">
                  {bookingDisplayMode === 'calendar' ? 'Interstate Live Production Slots Calendar' : 'Active Bookings Pending Audit Review'}
                </h3>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Column: Calendar or Selector */}
                  <div className="xl:col-span-7 bg-zinc-900 border border-white/5 p-6 rounded-[32px] space-y-6">
                    
                    {bookingDisplayMode === 'calendar' ? (
                      <div className="space-y-4">
                        {/* Month Navigator Header */}
                        <div className="flex justify-between items-center bg-black/35 p-4 rounded-2xl border border-white/5">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                setCurrentCalendarDate(prev => {
                                  const d = new Date(prev);
                                  d.setMonth(d.getMonth() - 1);
                                  return d;
                                });
                              }}
                              className="p-1.5 hover:bg-zinc-805 rounded-lg border border-white/5 text-zinc-300 hover:text-white transition-colors"
                            >
                              <ChevronLeft size={16} />
                            </button>
                            <h4 className="text-lg font-black uppercase tracking-tight">
                              {[
                                "January", "February", "March", "April", "May", "June",
                                "July", "August", "September", "October", "November", "December"
                              ][currentCalendarDate.getMonth()]} {currentCalendarDate.getFullYear()}
                            </h4>
                            <button
                              onClick={() => {
                                setCurrentCalendarDate(prev => {
                                  const d = new Date(prev);
                                  d.setMonth(d.getMonth() + 1);
                                  return d;
                                });
                              }}
                              className="p-1.5 hover:bg-zinc-805 rounded-lg border border-white/5 text-zinc-300 hover:text-white transition-colors"
                            >
                              <ChevronRight size={16} />
                            </button>
                          </div>
                          
                          <span className="text-[10px] font-mono text-zinc-400 bg-black/55 px-3 py-1 rounded-full border border-white/5-v">
                            Today: Jun 16, 2026
                          </span>
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-2">
                          <div>Sun</div>
                          <div>Mon</div>
                          <div>Tue</div>
                          <div>Wed</div>
                          <div>Thu</div>
                          <div>Fri</div>
                          <div>Sat</div>
                        </div>

                        <div className="grid grid-cols-7 gap-1.5">
                          {(() => {
                            const year = currentCalendarDate.getFullYear();
                            const month = currentCalendarDate.getMonth();
                            const firstDay = new Date(year, month, 1).getDay();
                            const totalDays = new Date(year, month + 1, 0).getDate();
                            const prevMonthTotalDays = new Date(year, month, 0).getDate();

                            const cells = [];

                            // Pre-month days padding
                            for (let i = firstDay - 1; i >= 0; i--) {
                              const d = prevMonthTotalDays - i;
                              const m = month === 0 ? 11 : month - 1;
                              const y = month === 0 ? year - 1 : year;
                              cells.push({
                                day: d,
                                dateString: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
                                isCurrentMonth: false
                              });
                            }

                            // Current month days
                            for (let d = 1; d <= totalDays; d++) {
                              cells.push({
                                day: d,
                                dateString: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
                                isCurrentMonth: true
                              });
                            }

                            // Next-month padding
                            const remaining = 42 - cells.length;
                            for (let d = 1; d <= remaining; d++) {
                              const m = month === 11 ? 0 : month + 1;
                              const y = month === 11 ? year + 1 : year;
                              cells.push({
                                day: d,
                                dateString: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
                                isCurrentMonth: false
                              });
                            }

                            return cells.map((cell, idx) => {
                              const dayLeads = leads.filter(l => l.bookingDate === cell.dateString);
                              const isToday = cell.dateString === '2026-06-16';
                              const hasSelected = dayLeads.some(l => l.id === selectedLeadId);

                              return (
                                <div
                                  key={idx}
                                  className={`min-h-[85px] p-2 rounded-xl border flex flex-col justify-between transition-all ${
                                    cell.isCurrentMonth ? 'bg-black/25' : 'bg-black/10 opacity-30 select-none'
                                  } ${
                                    hasSelected 
                                      ? 'border-indigo-500 bg-indigo-500/5' 
                                      : isToday 
                                        ? 'border-emerald-500 shadow-md shadow-emerald-500/5' 
                                        : 'border-white/5 hover:border-zinc-700'
                                  }`}
                                >
                                  {/* Day Number and add button */}
                                  <div className="flex justify-between items-center">
                                    <span className={`text-[10px] font-bold ${
                                      hasSelected
                                        ? 'text-indigo-400 font-black'
                                        : isToday
                                          ? 'bg-zinc-700 text-white px-1.5 py-0.5 rounded-full text-[9px]'
                                          : cell.isCurrentMonth
                                            ? 'text-zinc-300'
                                            : 'text-zinc-650'
                                    }`}>
                                      {cell.day}
                                    </span>
                                    
                                    {cell.isCurrentMonth && (
                                      <button
                                        onClick={() => {
                                          setNewLeadBookingDate(cell.dateString);
                                          setShowAddLead(true);
                                        }}
                                        title={`Schedule lead on ${cell.dateString}`}
                                        className="text-[9px] hover:text-white text-zinc-500 opacity-0 hover:opacity-100 transition-opacity p-0.5"
                                      >
                                        <Plus size={10} />
                                      </button>
                                    )}
                                  </div>

                                  {/* Day Badges */}
                                  <div className="space-y-1 mt-1 block overflow-hidden max-h-[50px] scrollbar-none">
                                    {dayLeads.slice(0, 2).map(l => {
                                      const isLeadAutoBooked = l.stage === 'Auto-Booked';
                                      const isLeadConfirmed = l.stage === 'Confirmed';
                                      const isLeadDisqualified = l.stage === 'Disqualified';
                                      
                                      return (
                                        <div
                                          key={l.id}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedLeadId(l.id);
                                          }}
                                          className={`px-1.5 py-0.5 rounded text-[8px] font-black truncate tracking-wide cursor-pointer border block text-left transition-all ${
                                            l.id === selectedLeadId
                                              ? 'bg-indigo-500 text-white border-transparent scale-[1.03]'
                                              : isLeadConfirmed
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                                : isLeadAutoBooked
                                                  ? 'bg-violet-500/10 text-violet-300 border-violet-500/20 hover:bg-violet-500/20 animate-pulse'
                                                  : isLeadDisqualified
                                                    ? 'bg-zinc-800 text-zinc-500 border-white/5 line-through hover:bg-zinc-750'
                                                    : 'bg-zinc-900/60 text-zinc-400 border-white/5 hover:bg-zinc-800'
                                          }`}
                                          title={`(${l.stage}) ${l.name} - ${l.serviceRequested}`}
                                        >
                                          {l.name.split(' ')[0]} ${Math.round(l.budget / 1000)}k
                                        </div>
                                      );
                                    })}
                                    {dayLeads.length > 2 && (
                                      <div className="text-[7px] text-zinc-500 font-bold uppercase text-center mt-0.5">
                                        +{dayLeads.length - 2} More
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    ) : (
                      // original list selector format
                      <div className="space-y-2">
                        <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block">Choose Auto-Booked Lead</span>
                        {leads.filter(l => l.stage === 'Auto-Booked' || l.stage === 'Confirmed').length === 0 ? (
                          <div className="text-center py-8 text-zinc-500 text-xs">
                            No active autobooked leads currently tracking. Advance some leads in AI Lead Board to step 14 first!
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {leads.filter(l => l.stage === 'Auto-Booked' || l.stage === 'Confirmed').map(l => (
                              <div
                                key={l.id}
                                onClick={() => setSelectedLeadId(l.id)}
                                className={`p-4 rounded-xl border cursor-pointer flex justify-between items-center transition-all ${
                                  selectedLeadId === l.id 
                                    ? 'bg-zinc-800 border-indigo-500/30' 
                                    : 'bg-black/30 border-white/5 hover:bg-zinc-900'
                                }`}
                              >
                                <div className="space-y-0.5">
                                  <div className="font-bold text-sm">{l.name}</div>
                                  <div className="text-[10px] text-zinc-400 font-mono">@{l.company} - ${l.budget.toLocaleString()}</div>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                  l.stage === 'Confirmed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400 animate-pulse'
                                }`}>
                                  {l.stage}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Detailed clearance checklist & approval gate */}
                  <div className="xl:col-span-5 bg-zinc-900 border border-white/5 p-6 rounded-[32px] space-y-6">
                    {selectedLead ? (
                      <div className="space-y-5">
                        
                        <div className="border-b border-white/5 pb-4">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">Audit Target Leads Profile</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                              selectedLead.stage === 'Confirmed' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : selectedLead.stage === 'Disqualified'
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse'
                            }`}>
                              {selectedLead.stage}
                            </span>
                          </div>
                          
                          <h4 className="text-xl font-black mt-1">{selectedLead.name}</h4>
                          <p className="text-zinc-400 text-xs font-mono">Company: {selectedLead.company}</p>
                          <p className="text-zinc-300 text-xs font-mono mt-1">Requested: {selectedLead.serviceRequested}</p>
                        </div>

                        {/* Direct Reschedule Widget */}
                        <div className="flex flex-col gap-1.5 bg-black/35 p-4 border border-white/5 rounded-2xl">
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Scheduled Slot Date Picker</label>
                          <div className="flex gap-2 items-center">
                            <Calendar size={14} className="text-zinc-500 shrink-0" />
                            <input 
                              type="date"
                              value={selectedLead.bookingDate || '2026-06-20'}
                              onChange={(e) => handleUpdateBookingDate(selectedLead.id, e.target.value)}
                              className="bg-black border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 w-full"
                            />
                          </div>
                        </div>

                        {/* 14-Touchpoint Outreach Timeline progression indicator */}
                        <div className="space-y-2.5 p-4 bg-black/25 border border-white/5 rounded-2xl">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">14-Touchpoint Protocol Status</span>
                            <span className="text-xs font-bold text-indigo-400">{selectedLead.currentTouchPoint}/14 Complete</span>
                          </div>
                          
                          <div className="max-h-[160px] overflow-y-auto pr-1 space-y-2 border border-white/5 p-3 rounded-xl bg-black/35 scrollbar-thin">
                            {nurtureSequence.map((step, idx) => {
                              const isCompleted = idx + 1 <= selectedLead.currentTouchPoint;
                              const isActive = idx + 1 === selectedLead.currentTouchPoint;
                              return (
                                <div 
                                  key={step.step} 
                                  className={`p-2.5 rounded-lg border transition-all ${
                                    isActive 
                                      ? 'bg-indigo-500/10 border-indigo-500/30' 
                                      : isCompleted 
                                        ? 'bg-emerald-500/5 border-emerald-500/10 opacity-75' 
                                        : 'bg-black/20 border-white/5 opacity-40'
                                  }`}
                                >
                                  <div className="flex justify-between items-start gap-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black ${
                                        isCompleted ? 'bg-zinc-700 text-white' : 'bg-zinc-800 text-zinc-400'
                                      }`}>
                                        {step.step}
                                      </span>
                                      <span className={`text-[10px] font-black uppercase tracking-wider ${
                                        isActive ? 'text-indigo-400' : isCompleted ? 'text-emerald-400' : 'text-zinc-500'
                                      }`}>
                                        {step.type}
                                      </span>
                                    </div>
                                    {isCompleted && <span className="text-[8px] uppercase font-mono font-bold text-emerald-400">✓ Sent</span>}
                                    {isActive && <span className="text-[8px] uppercase font-mono font-bold text-indigo-400 animate-pulse">● Active</span>}
                                  </div>
                                  <h5 className="text-[11px] font-bold text-zinc-200 mt-1 leading-snug">{step.title}</h5>
                                  <p className="text-[9px] text-zinc-400 leading-normal mt-0.5">{step.desc}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Professional Evidence status section */}
                        <div className="p-4 bg-black/30 border border-white/5 rounded-2xl space-y-3">
                          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Verifiable Credentials</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-mono ${
                              selectedLead.evidenceSubmitted ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                            }`}>
                              {selectedLead.evidenceSubmitted ? 'Proof Uploaded' : 'Missing Documents'}
                            </span>
                          </div>

                          {selectedLead.evidenceSubmitted ? (
                            <div className="space-y-2">
                              <div className="p-3 bg-zinc-900 border border-emerald-500/20 rounded-xl flex items-start gap-3">
                                <FileCheck size={18} className="text-emerald-400 mt-0.5 shrink-0" />
                                <div className="text-xs">
                                  <strong className="text-white block font-sans">Verified File Attachment:</strong>
                                  <span className="text-zinc-350 font-mono text-[10px] leading-snug">{selectedLead.evidenceType}</span>
                                </div>
                              </div>
                              <a 
                                href={selectedLead.evidenceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] font-mono text-emerald-400 font-bold hover:underline inline-flex items-center gap-1"
                              >
                                View Cryptographic Evidence PDF <ExternalLink size={10} />
                              </a>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
                                <AlertTriangle className="shrink-0 mt-0.5 text-amber-400" size={16} />
                                <p className="leading-normal">
                                  <strong>Strict Safeguard Hold:</strong> No verification document file has been uploaded for this client lead yet. Escrow finalization is locked.
                                </p>
                              </div>
                              <button
                                onClick={() => handleVerifyEvidence(selectedLead.id)}
                                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-750 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border border-white/5 transition-colors"
                              >
                                <Upload size={14} />
                                Simulate Client File Upload (e.g. sound certification degree)
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Interactive human clearing checkboxes */}
                        <div className="space-y-4 p-4 bg-black/20 border border-white/5 rounded-2xl">
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Manual Compliance clearance</span>
                          
                          {selectedLead.stage === 'Confirmed' ? (
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-3">
                              <ShieldCheck size={22} className="shrink-0" />
                              <div>
                                <strong>Manual Review Completed!</strong> This deal has been fully audited and authorized. Escrow funds disburse status: <span className="font-mono text-white">SUCCESSFULLY_SETTLED</span>.
                              </div>
                            </div>
                          ) : selectedLead.stage === 'Disqualified' ? (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-3">
                              <AlertTriangle size={22} className="shrink-0 text-red-400 animate-pulse" />
                              <div>
                                <strong>Booking Cancelled &amp; Hold Lifted!</strong> This lead was disqualified during compliance reviews. Escrow disburse status: <span className="font-mono text-white">CANCELLED_BY_ADMIN</span>.
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              
                              {/* Checkbox 1 */}
                              <div 
                                onClick={() => setCheckEvidenceAuthentic(!checkEvidenceAuthentic)}
                                className="flex items-start gap-3 cursor-pointer select-none group"
                              >
                                <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                  checkEvidenceAuthentic ? 'bg-zinc-700 border-transparent text-white' : 'border-white/20 group-hover:border-emerald-450'
                                }`}>
                                  {checkEvidenceAuthentic && <Check size={14} />}
                                </div>
                                <div className="text-xs">
                                  <strong className="text-zinc-200 block text-[11px]">Verify Certification authenticity</strong>
                                  <span className="text-zinc-500 text-[10px] leading-relaxed">I certify that the submitted technical document is genuine and issued by accredited bodies.</span>
                                </div>
                              </div>

                              {/* Checkbox 2 */}
                              <div 
                                onClick={() => setCheckLiabilityCompliant(!checkLiabilityCompliant)}
                                className="flex items-start gap-3 cursor-pointer select-none group"
                              >
                                <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                  checkLiabilityCompliant ? 'bg-zinc-700 border-transparent text-white' : 'border-white/20 group-hover:border-emerald-450'
                                }`}>
                                  {checkLiabilityCompliant && <Check size={14} />}
                                </div>
                                <div className="text-xs">
                                  <strong className="text-zinc-200 block text-[11px]">Liability clause check</strong>
                                  <span className="text-zinc-500 text-[10px] leading-relaxed">I certify that the booking value of ${selectedLead.budget.toLocaleString()} matches SonicStream liability insurance clauses.</span>
                                </div>
                              </div>

                              {/* Checkbox 3 */}
                              <div 
                                onClick={() => setCheckSanctionsScreened(!checkSanctionsScreened)}
                                className="flex items-start gap-3 cursor-pointer select-none group"
                              >
                                <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                  checkSanctionsScreened ? 'bg-zinc-700 border-transparent text-white' : 'border-white/20 group-hover:border-emerald-450'
                                }`}>
                                  {checkSanctionsScreened && <Check size={14} />}
                                </div>
                                <div className="text-xs">
                                  <strong className="text-zinc-200 block text-[11px]">Sanctions &amp; AML Screening</strong>
                                  <span className="text-zinc-500 text-[10px] leading-relaxed">I verify the promoting firm is screened against standard financial databases.</span>
                                </div>
                              </div>

                            </div>
                          )}
                        </div>

                        {/* Action Triggers */}
                        {selectedLead.stage !== 'Confirmed' && selectedLead.stage !== 'Disqualified' && (
                          <div className="pt-4 border-t border-white/5 space-y-2">
                            {/* Finalize Action Button */}
                            <button
                              onClick={() => handleConfirmBooking(selectedLead.id)}
                              disabled={!selectedLead.evidenceSubmitted || !checkEvidenceAuthentic || !checkLiabilityCompliant || !checkSanctionsScreened}
                              className={`w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                                selectedLead.evidenceSubmitted && checkEvidenceAuthentic && checkLiabilityCompliant && checkSanctionsScreened
                                  ? 'bg-zinc-700 hover:bg-zinc-600 text-white shadow-lg shadow-black/10'
                                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
                              }`}
                            >
                              <ShieldCheck size={16} />
                              Finalize Booking &amp; Release Funds (${selectedLead.budget.toLocaleString()})
                            </button>

                            {/* Rejection Trigger Button */}
                            <button
                              onClick={() => handleRejectBooking(selectedLead.id)}
                              className="w-full py-2.5 bg-red-950/20 hover:bg-red-900/35 border border-red-500/20 hover:border-red-550/45 text-red-400 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                            >
                              Reject &amp; Disqualify Booking Slot
                            </button>

                            <span className="text-[9px] text-zinc-500 text-center block mt-2 font-mono">
                              * Requires verifiable credentials uploaded and all 3 compliance clearances checked.
                            </span>
                          </div>
                        )}

                        {/* Notes tracker */}
                        <div className="space-y-1.5 pt-3 border-t border-white/5">
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Audit History &amp; Logs</span>
                          <p className="text-zinc-300 text-xs leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                            {selectedLead.notes}
                          </p>
                        </div>

                      </div>
                    ) : (
                      <div className="text-center py-12 text-zinc-500 text-sm">
                        Please choose a scheduled slot or lead on the calendar to perform a clearance audit.
                      </div>
                    )}
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* TAB 5: DATA VISUALIZATION RECHARTS DASHBOARD */}
          {activeTab === 'analytics' && (
            <div className="space-y-8">
              
              {/* Top numbers block */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: "Overall Active Audience Scoped", val: "480 Leads", sub: "+12% this week", icon: Users, color: "text-emerald-400" },
                  { label: "Nurturing Interaction rate", val: "68.4%", sub: "Avg Touchpoint 8.2", icon: Zap, color: "text-yellow-400" },
                  { label: "Programmatic Autobooks", val: "24 Contracts", sub: "Pending audit", icon: Award, color: "text-indigo-400" },
                  { label: "Manually Cleared Escrow", val: `$${leads.filter(l => l.stage === 'Confirmed').reduce((acc, lead) => acc + lead.budget, 0).toLocaleString()}`, sub: "0 protocol failures", icon: DollarSign, color: "text-emerald-500" }
                ].map((stat, i) => (
                  <div key={i} className="bg-zinc-900 border border-white/5 rounded-2xl p-6 space-y-2">
                    <div className="flex justify-between items-center text-zinc-500">
                      <span className="text-[10px] uppercase font-black tracking-wider">{stat.label}</span>
                      <stat.icon size={16} className={stat.color} />
                    </div>
                    <div className="text-2xl font-black font-mono">{stat.val}</div>
                    <div className="text-[10px] text-zinc-400">{stat.sub}</div>
                  </div>
                ))}
              </div>

              {/* Conversion Funnel Charts rendering */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* 14 touchpoint conversion funnel */}
                <div className="lg:col-span-7 bg-zinc-900 border border-white/5 p-8 rounded-[32px] space-y-6">
                  <div className="space-y-1.5 border-b border-white/5 pb-4">
                    <span className="text-xs text-emerald-450 text-emerald-400 font-bold uppercase tracking-wider block">Conversion Funnel</span>
                    <h3 className="text-xl font-bold">14-Touchpoint Drop-off Breakdown</h3>
                    <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                      This bar chart represents the programmatically tracked volume of clients moving through our continuous outreach channels.
                    </p>
                  </div>

                  <div className="h-[300px] w-full font-mono text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={funnelData}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" horizontal={true} vertical={false} />
                        <XAxis type="number" stroke="#71717a" fontSize={11} hide={true} />
                        <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={10} width={150} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff' }}
                          labelClassName="font-mono text-xs text-zinc-400 font-bold"
                        />
                        <Bar dataKey="value" fill="#c81e3a" radius={[0, 8, 8, 0]} barSize={20}>
                          {funnelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Score improvement curve */}
                <div className="lg:col-span-5 bg-zinc-900 border border-white/5 p-8 rounded-[32px] space-y-6">
                  <div className="space-y-1.5 border-b border-white/5 pb-4">
                    <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider block">Predictive Modeling</span>
                    <h3 className="text-xl font-bold">Fidelity Score vs Outbound Level</h3>
                    <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                      Confidence value (%) increases as additional touchpoints execute successfully.
                    </p>
                  </div>

                  <div className="h-[300px] w-full font-mono text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={trustFidelityData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                        <XAxis dataKey="level" stroke="#71717a" fontSize={9} />
                        <YAxis stroke="#71717a" domain={[50, 100]} fontSize={10} />
                        <Tooltip 
                          contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
                        />
                        <Area type="monotone" dataKey="score" stroke="#818cf8" fillOpacity={1} fill="url(#colorScore)" strokeWidth={2.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 6: AI LEAD WORKER MANAGEMENT */}
          {activeTab === 'workers' && (
            <div className="bg-zinc-900 border border-white/5 rounded-[40px] p-8 lg:p-12 space-y-8">
              
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-white/5 pb-6">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Zap size={22} />
                    <span className="text-xs font-black uppercase tracking-widest text-[#a78bfa]">Scraper Workers Pool</span>
                  </div>
                  <h3 className="text-3xl font-black uppercase tracking-tight">AI Lead Management &amp; Scrape Engines</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl">
                    Exposes actual running job definitions and cron-queues. Integrate with our background `ai_jobs` SQLite schema databases to review automated scans.
                  </p>
                </div>

                <button 
                  onClick={handleTriggerScraperScan}
                  disabled={isLoadingApiJobs}
                  className="px-6 py-4 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                >
                  {isLoadingApiJobs ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Invoking Scraper Job...
                    </>
                  ) : (
                    <>
                      <Play size={16} />
                      Run SoundScraper Scan Job
                    </>
                  )}
                </button>
              </div>

              {/* Grid lists of Autonomous Bots / Cron scripts */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { name: "Acoustic Scraper Bot", status: "Active Queue", desc: "Scans state level directories, festival listings & promoter job-boards to pick up licensing leads.", type: "Cron: Hourly" },
                  { name: "Lookalike Match Maker", status: "Active Queue", desc: "Checks Meta Graph pixels and LinkedIn corporate rosters for matching sound engineer filters.", type: "Real-time Pixels" },
                  { name: "Compliance Pre-Scrubber", status: "Active Queue", desc: "Automatically queries verified records databases to cross-check business sanctions & licenses.", type: "Audit Scan" },
                  { name: "Email Nurture Engine", status: "Sleeping State", desc: "Scheduled timer dispatching touchpoints 1-13 native technical documents cleanly.", type: "Outbound Trigger" }
                ].map((bot, idx) => (
                  <div key={idx} className="p-6 bg-black/25 border border-white/5 rounded-2xl space-y-3 relative group">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        {bot.status}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {bot.type}
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-white group-hover:text-emerald-450 transition-colors">{bot.name}</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans">{bot.desc}</p>
                  </div>
                ))}
              </div>

              {/* Backend Database ledger connection */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-md font-bold uppercase tracking-wider text-zinc-300">Synchronized Database Audit Jobs</h4>
                  <button 
                    onClick={fetchBackendJobs}
                    className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 font-mono"
                  >
                    <RotateCcw size={12} />
                    Sync database row counts
                  </button>
                </div>

                <div className="bg-black/30 border border-white/5 rounded-2xl p-6">
                  {isLoadingApiJobs ? (
                    <div className="flex items-center justify-center py-8 text-zinc-500 text-xs gap-2">
                      <Loader2 size={16} className="animate-spin text-indigo-400" />
                      Querying SQLite client connections...
                    </div>
                  ) : jobsFromDb.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500 text-xs">
                      No matching direct backend jobs registered. Click &quot;Run SoundScraper Scan Job&quot; above to initiate a database sync run!
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[300px] overflow-y-auto">
                      {jobsFromDb.map(job => (
                        <div key={job.id} className="p-4 bg-zinc-950/60 border border-white/5 rounded-xl flex items-center justify-between font-mono text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-white">{job.id}</span>
                              <span className="text-zinc-500 bg-zinc-900 px-2.5 py-0.5 rounded text-[10px]">{job.jobType}</span>
                            </div>
                            <div className="text-zinc-500 text-[10px]">Source Input: {job.inputUrl || "Scraper Cache file"}</div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="text-[10px] text-zinc-400">Fee contribution: {job.profitFeeRatePercent}%</span>
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[10px] uppercase font-bold">
                              {job.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* MODAL: Inject Custom Lead */}
      <AnimatePresence>
        {showAddLead && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-white/5 rounded-[32px] p-8 max-w-lg w-full space-y-6 text-white"
            >
              <div className="space-y-1">
                <h3 className="text-2xl font-black uppercase tracking-tight">Inject Client Prospect</h3>
                <p className="text-zinc-500 text-sm">Add a client firm manually into the passive AI targeting pool.</p>
              </div>
              
              <form onSubmit={handleCreateLead} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase transition-colors">Client Rep Name *</label>
                    <input 
                      type="text" 
                      placeholder="Jane Doe"
                      value={newLeadName}
                      onChange={(e) => setNewLeadName(e.target.value)}
                      required
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 text-sm text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase">Email Address *</label>
                    <input 
                      type="email" 
                      placeholder="jane@eventsfirm.com"
                      value={newLeadEmail}
                      onChange={(e) => setNewLeadEmail(e.target.value)}
                      required
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 text-sm text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase">Company/Festival Title</label>
                    <input 
                      type="text" 
                      placeholder="Electric Forest LLC"
                      value={newLeadCompany}
                      onChange={(e) => setNewLeadCompany(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 text-sm text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase">Service Needed</label>
                    <input 
                      type="text" 
                      placeholder="Club Acoustic Tuning"
                      value={newLeadService}
                      onChange={(e) => setNewLeadService(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 text-sm text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase">Estimated Budget ($)</label>
                  <input 
                    type="number" 
                    value={newLeadBudget}
                    onChange={(e) => setNewLeadBudget(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 text-sm text-white font-mono"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddLead(false)}
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-black text-xs uppercase tracking-widest text-center transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-zinc-700 hover:bg-zinc-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest text-center transition-colors"
                  >
                    Initiate Target Loop
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
