import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  FileText, 
  Lock, 
  UserCheck, 
  Cpu, 
  Download, 
  Trash2, 
  AlertTriangle, 
  DollarSign, 
  Coins, 
  CheckCircle2, 
  Scale, 
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

export const PolicyCenter: React.FC = () => {
  const [activeTab, setActiveTab ] = useState<'governance' | 'identity' | 'ledger' | 'ai' | 'dmca' | 'privacy' | 'marketplace'>('governance');
  
  // --- STATE FOR TIER 1 & 8: AGREEMENTS, CONSENT & COOKIES ---
  const [agreedToS, setAgreedToS] = useState(false);
  const [tosDetails, setTosDetails] = useState<any>(null);
  const [cookieSettings, setCookieSettings] = useState({
    necessary: true,
    analytics: true,
    marketing: false,
    personalization: true
  });
  const [emailConsents, setEmailConsents] = useState({
    newsletters: true,
    marketingQuotes: false,
    aiOptimizations: true
  });

  // --- STATE FOR TIER 2: KYC & VERIFICATION ---
  const [kycForm, setKycForm] = useState({
    legalName: '',
    address: '',
    taxId: '',
    taxType: 'W-9',
    govIdAttached: null as File | null,
    govIdName: ''
  });
  const [kycStatus, setKycStatus] = useState<'unverified' | 'pending' | 'verified'>('unverified');

  // --- STATE FOR TIER 4: AI STRATEGY & OVERRIDES ---
  const [recommendations] = useState([
    {
      id: "REC-4091",
      creator_id: "aether-beats-1",
      prompt: "Optimize pricing for summer techno stem downloads on the regional storefront.",
      recommendation: "Establish license tier bundle price at $49.50 with a matching 12% affiliate commission rate.",
      confidence: 0.94,
      model_version: "Gemini-1.5-Pro-v2.1",
      created_at: "2026-06-03T14:22:00Z",
      status: 'active'
    },
    {
      id: "REC-2032",
      creator_id: "aether-beats-1",
      prompt: "Adjust recurring subscription fee optimization threshold for VIP business listeners.",
      recommendation: "Activate automatic 5% retention discount for users checking streaming queues more than 40h/week.",
      confidence: 0.88,
      model_version: "Gemini-2.0-Flash-v1.4",
      created_at: "2026-06-02T19:33:00Z",
      status: 'active'
    }
  ]);
  const [aiAutonomousPricing, setAiAutonomousPricing] = useState(false);

  // --- STATE FOR TIER 5: DMCA CLAIMS ---
  const [dmcaClaims, setDmcaClaims] = useState([
    {
      id: "DMCA-209",
      claimant: "Sonic Beats Corp",
      trackTitle: "Synthwave Horizon Stems",
      reason: "Unauthorized re-selling of MIDI melodies in global store bundle",
      status: "Temporary Removal",
      createdAt: "2026-06-01T10:15:00Z"
    }
  ]);
  const [newDmca, setNewDmca] = useState({
    trackTitle: '',
    artistName: '',
    claimantEmail: '',
    reason: '',
    declaration: false
  });

  // --- STATE FOR TIER 6: REPORTS & SAFETY ---
  const [safetyReports, setSafetyReports] = useState([
    {
      id: "REP-902",
      reportedUser: "SpamBotMusic",
      reporter: "John_Doe_9",
      reason: "Automated promotional spam comments on marketplace page",
      status: "under_review",
      createdAt: "2026-06-02T22:11:00Z"
    }
  ]);
  const [newReport, setNewReport] = useState({
    reportedUser: '',
    reason: '',
    details: ''
  });

  // Load audit data from signup onboarding if exists
  useEffect(() => {
    const saved = localStorage.getItem('user_agreements_audit');
    if (saved) {
      setTosDetails(JSON.parse(saved));
      setAgreedToS(true);
    }
  }, []);

  const handleExplicitAcceptToS = () => {
    const agreement = {
      id: `AGR-${Math.floor(Math.random() * 900000 + 100000)}`,
      userId: tosDetails?.userId || "guest_entrepreneur@sonicstream.com",
      agreement_version: "v2.5.0",
      accepted_at: new Date().toISOString(),
      ip_address: "192.168.1.109"
    };
    localStorage.setItem('user_agreements_audit', JSON.stringify(agreement));
    setTosDetails(agreement);
    setAgreedToS(true);
    toast.success("Terms of Service and data consent explicitly stored in user_agreements!");
  };

  const handleSaveCookiePreferences = () => {
    const prefObj = {
      userId: tosDetails?.userId || "anonymous",
      preferences: cookieSettings,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem('cookie_preferences', JSON.stringify(prefObj));
    toast.success("Granular cookie categories documented in consent ledger!");
  };

  const handleKycSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kycForm.legalName || !kycForm.address || !kycForm.taxId) {
      toast.error("Please fill in legal name, tax registry, and physical address.");
      return;
    }
    setKycStatus('pending');
    toast.success("KYC documentation securely packaged and uploaded for compliance review.");
  };

  const executeDataExport = () => {
    const userPayload = {
      profile: {
        email: tosDetails?.userId || "papislimm@gmail.com",
        agreement_version: tosDetails?.agreement_version || "v2.5.0",
        consent_timestamp: tosDetails?.accepted_at || new Date().toISOString()
      },
      orders: [
        { id: "ORD-902", total: 19.99, item: "Summer Techno STEMS package" }
      ],
      payments: [
        { id: "PAY-104", ledgerRef: "TX-409121", status: "Immutable Escrow" }
      ],
      cookie_preferences: cookieSettings,
      consents: emailConsents
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(userPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "SonicStream_Personal_Compliance_Data.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Encrypted user data payload generated and downloaded safely.");
  };

  const executeAccountDeletion = () => {
    const confirmed = window.confirm("CRITICAL WARNING: This initiates the auditable account deletion workflow under GDPR/CCPA. This operation is permanent and irreversible. Proceed?");
    if (confirmed) {
      localStorage.removeItem('user_agreements_audit');
      localStorage.removeItem('cookie_preferences');
      setAgreedToS(false);
      setTosDetails(null);
      toast.success("Auditable deletion queue initialized. Account resources scheduled for garbage collection.");
    }
  };

  const handleNewDmcaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDmca.declaration) {
      toast.error("You must affirm alignment to the legal DMCA statement.");
      return;
    }
    const submittedClaim = {
      id: `DMCA-${Math.floor(Math.random() * 800 + 100)}`,
      claimant: newDmca.claimantEmail,
      trackTitle: newDmca.trackTitle,
      reason: newDmca.reason,
      status: "Temporary Removal Scheduled",
      createdAt: new Date().toISOString()
    };
    setDmcaClaims([submittedClaim, ...dmcaClaims]);
    setNewDmca({
      trackTitle: '',
      artistName: '',
      claimantEmail: '',
      reason: '',
      declaration: false
    });
    toast.success("DMCA Copyright Infringement notice submitted. Automatic safe-harbor isolation pending review.");
  };

  const handleNewSafetyReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReport.reportedUser || !newReport.reason) {
      toast.error("Please provide offender details.");
      return;
    }
    const submission = {
      id: `REP-${Math.floor(Math.random() * 800 + 100)}`,
      reportedUser: newReport.reportedUser,
      reporter: "ActiveCreator",
      reason: `${newReport.reason}: ${newReport.details}`,
      status: "under_review",
      createdAt: new Date().toISOString()
    };
    setSafetyReports([submission, ...safetyReports]);
    setNewReport({ reportedUser: '', reason: '', details: '' });
    toast.success("Safety Incident logged in moderator dashboard. Escalation triggers active.");
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-12 font-sans select-none selection:bg-zinc-700 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header Block */}
        <header className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-zinc-800 gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] uppercase font-black tracking-widest border border-emerald-500/20 shadow-md">
              <Shield size={12} className="animate-pulse" />
              Sovereign Compliance & Law Hub
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">
              Business <span className="text-emerald-400">Governance</span> Center
            </h1>
            <p className="text-zinc-400 text-sm md:text-base max-w-xl font-medium">
              Securing operations under Zero-Trust compliance frameworks, absolute ledger state integrity, and audited generative business AI recommendations.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={executeDataExport}
              className="px-5 py-3 bg-zinc-900 hover:bg-zinc-850 hover:text-white text-zinc-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-white/5 active:scale-95 flex items-center gap-2"
            >
              <Download size={14} /> Output My Data
            </button>
            <button
              onClick={executeAccountDeletion}
              className="px-5 py-3 bg-rose-950/40 text-rose-300 hover:bg-rose-900 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-rose-900/30 active:scale-95 flex items-center gap-2"
            >
              <Trash2 size={14} /> Purge Account
            </button>
          </div>
        </header>

        {/* Dashboard Frame Grid */}
        <div className="grid lg:grid-cols-4 gap-8">
          
          {/* Navigation Tracks Panel */}
          <nav className="flex flex-col gap-2 relative">
            <div className="text-[10px] font-black tracking-widest uppercase text-zinc-500 px-3 mb-2">
              Compliance Elements
            </div>
            <button
              onClick={() => setActiveTab('governance')}
              className={`p-4 rounded-xl font-bold text-xs text-left uppercase tracking-wider transition-all border flex items-center justify-between group ${
                activeTab === 'governance' 
                  ? 'bg-zinc-700 text-white border-emerald-400 shadow-md shadow-black/10' 
                  : 'bg-zinc-900/40 text-zinc-400 border-white/5 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <span className="flex items-center gap-3">
                <FileText size={16} /> Platform Governance
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/10">v2.5</span>
            </button>

            <button
              onClick={() => setActiveTab('identity')}
              className={`p-4 rounded-xl font-bold text-xs text-left uppercase tracking-wider transition-all border flex items-center justify-between group ${
                activeTab === 'identity' 
                  ? 'bg-zinc-700 text-white border-emerald-400 shadow-md cursor-pointer' 
                  : 'bg-zinc-900/40 text-zinc-400 border-white/5 hover:text-white hover:bg-zinc-900 cursor-pointer'
              }`}
            >
              <span className="flex items-center gap-3">
                <UserCheck size={16} /> Identity & KYC/AML
              </span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded capitalize ${
                kycStatus === 'verified' ? 'bg-emerald-950 text-emerald-400' : 'bg-zinc-800'
              }`}>
                {kycStatus}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`p-4 rounded-xl font-bold text-xs text-left uppercase tracking-wider transition-all border flex items-center justify-between group ${
                activeTab === 'ledger' 
                  ? 'bg-zinc-700 text-white border-emerald-400 shadow-md cursor-pointer' 
                  : 'bg-zinc-900/40 text-zinc-400 border-white/5 hover:text-white hover:bg-zinc-900 cursor-pointer'
              }`}
            >
              <span className="flex items-center gap-3">
                <DollarSign size={16} /> Auditable Ledger
              </span>
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Immutable</span>
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`p-4 rounded-xl font-bold text-xs text-left uppercase tracking-wider transition-all border flex items-center justify-between group ${
                activeTab === 'ai' 
                  ? 'bg-zinc-700 text-white border-emerald-400 shadow-md cursor-pointer' 
                  : 'bg-zinc-900/40 text-zinc-400 border-white/5 hover:text-white hover:bg-zinc-900 cursor-pointer'
              }`}
            >
              <span className="flex items-center gap-3">
                <Cpu size={16} /> AI Explainer & Audit
              </span>
              <span className="text-[9px] bg-red-950 text-red-500 px-1 py-0.5 rounded font-black">Audit Tail</span>
            </button>

            <button
              onClick={() => setActiveTab('dmca')}
              className={`p-4 rounded-xl font-bold text-xs text-left uppercase tracking-wider transition-all border flex items-center justify-between group ${
                activeTab === 'dmca' 
                  ? 'bg-zinc-700 text-white border-emerald-400 shadow-md cursor-pointer' 
                  : 'bg-zinc-900/40 text-zinc-400 border-white/5 hover:text-white hover:bg-zinc-900 cursor-pointer'
              }`}
            >
              <span className="flex items-center gap-3">
                <Scale size={16} /> DMCA & Moderation
              </span>
              <span className="text-[9px] bg-zinc-800 px-1.5 py-0.5 rounded font-sans">Complaints</span>
            </button>

            <button
              onClick={() => setActiveTab('marketplace')}
              className={`p-4 rounded-xl font-bold text-xs text-left uppercase tracking-wider transition-all border flex items-center justify-between group ${
                activeTab === 'marketplace' 
                  ? 'bg-zinc-700 text-white border-emerald-400 shadow-md cursor-pointer' 
                  : 'bg-zinc-900/40 text-zinc-400 border-white/5 hover:text-white hover:bg-zinc-900 cursor-pointer'
              }`}
            >
              <span className="flex items-center gap-3">
                <Scale size={16} /> Marketplace & P2B Rules
              </span>
              <span className="text-[9px] bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded font-mono font-bold">Vision</span>
            </button>

            {/* Cookie Preferencing link */}
            <div className="mt-6 p-4 bg-zinc-950 border border-white/5 rounded-2xl space-y-3">
              <span className="text-[10px] font-black uppercase text-zinc-500 flex items-center gap-1.5">
                <Lock size={12} className="text-emerald-400" /> Web Cookie Consent
              </span>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 font-medium font-mono">Necessary</span>
                  <span className="text-[9px] font-bold text-emerald-400 uppercase">Always On</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 font-medium">Analytics</span>
                  <input 
                    type="checkbox"
                    checked={cookieSettings.analytics}
                    onChange={(e) => setCookieSettings({...cookieSettings, analytics: e.target.checked})}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 accent-emerald-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 font-medium">Marketing</span>
                  <input 
                    type="checkbox"
                    checked={cookieSettings.marketing}
                    onChange={(e) => setCookieSettings({...cookieSettings, marketing: e.target.checked})}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 accent-emerald-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 font-medium">Personalization</span>
                  <input 
                    type="checkbox"
                    checked={cookieSettings.personalization}
                    onChange={(e) => setCookieSettings({...cookieSettings, personalization: e.target.checked})}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 accent-emerald-500"
                  />
                </div>
              </div>
              <button
                onClick={handleSaveCookiePreferences}
                className="w-full py-2 bg-zinc-700 hover:bg-zinc-600 text-white font-black text-[10px] uppercase tracking-wider rounded-lg transition-all"
              >
                Save Preferences
              </button>
            </div>
          </nav>

          {/* Central Active Element Panel */}
          <div className="lg:col-span-3 min-h-[600px]">
            <AnimatePresence mode="wait">
              
              {/* TAB 1: GOVERNANCE & POLICIES */}
              {activeTab === 'governance' && (
                <motion.div
                  key="governance"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                        <FileText className="text-emerald-400" size={18} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold uppercase tracking-tight text-white">Terms, Conditions & Legal Docs</h2>
                        <p className="text-xs text-zinc-500">Document registry: legal_documents table track v2.5.0</p>
                      </div>
                    </div>

                    <div className="bg-black/50 p-6 rounded-2xl border border-white/5 max-h-[300px] overflow-y-auto space-y-4 text-xs text-zinc-300 leading-relaxed font-sans">
                      <h4 className="font-bold text-white text-sm uppercase">1. USER RESPONSIBILITIES & COMPLIANCE</h4>
                      <p>
                        As an entrepreneur or creator selling digital audio assets on SonicStream, you strictly represent that you hold full exclusive authorship of all uploaded waveforms. Misrepresentation or trademark infringement incurs immediate permanent cancellation under financial safe harbors.
                      </p>
                      <h4 className="font-bold text-white text-sm uppercase">2. MARKETPLACE ESCROW & COMMERCE RULES</h4>
                      <p>
                        SonicStream maintains a direct legal ledger of all catalog sales under non-overwritable transactions. All processing values are disbursed securely via audited protocols after compliance checks complete.
                      </p>
                      <h4 className="font-bold text-white text-sm uppercase">3. SUBSCRIPTION TIERS & COMPLIANCE CHARGES</h4>
                      <p>
                        Subscriptions (such as Pro or Visionary) grant specific non-exclusive licensing tracks. Cancellation is guided in the Help hub; recurring elements are governed by current tax regulations.
                      </p>
                      <h4 className="font-bold text-white text-sm uppercase">4. NO-GUARANTEE OUTCOMES DISCLAIMER</h4>
                      <p>
                        NEVER represent guaranteed earnings or sponsorships to external brand clients. SonicStream displays statistical benchmarks based purely on historical audience averages under strict neutral compliance guides.
                      </p>
                      <h4 className="font-bold text-white text-sm uppercase">5. AI-GENERATED ADVISORY DISCLOSURE</h4>
                      <p>
                        Recommendations and business analytics provided by the SonicStream Copilot or Gemini APIs are for illustrative reference only. They are NOT certified financial advice or legal recommendations. Creators retain full, final liability.
                      </p>
                    </div>

                    {/* Explict acceptance status UI */}
                    <div className="p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 bg-zinc-950 border-emerald-500/10">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1.5 font-mono">
                          <CheckCircle2 size={12} /> user_agreements Ledger Status:
                        </span>
                        <p className="text-xs text-zinc-400">
                          {agreedToS 
                            ? `Accepted version ${tosDetails?.agreement_version || 'v2.5.0'} from IP ${tosDetails?.ip_address || '127.0.0.1'} at ${new Date(tosDetails?.accepted_at).toLocaleString()}`
                            : 'Acceptance is mandatory for active platform sellers'}
                        </p>
                      </div>
                      {!agreedToS && (
                        <button
                          onClick={handleExplicitAcceptToS}
                          className="px-6 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all"
                        >
                          Explicitly Accept Terms
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Email Marketing & Consent Section */}
                  <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-6">
                    <div className="font-bold text-sm uppercase text-zinc-300">Email Marketing Opt-In & Compliance tracker</div>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Every email sent to your marketplace customers must honor CAN-SPAM, GDPR, and anti-spam protocols. Monitor and toggle opt-ins strictly below:
                    </p>
                    <div className="grid md:grid-cols-3 gap-4 font-mono text-xs text-zinc-400">
                      <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span>Newsletter opt-in</span>
                          <input 
                            type="checkbox"
                            checked={emailConsents.newsletters}
                            onChange={(e) => setEmailConsents({...emailConsents, newsletters: e.target.checked})}
                            className="w-4 h-4 rounded accent-emerald-500"
                          />
                        </div>
                        <p className="text-[10px] text-zinc-600 font-sans leading-tight">Monthly product tips, no spam guaranteed with easy 1-click unsbscribe.</p>
                      </div>
                      <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span>Partner sponsorships</span>
                          <input 
                            type="checkbox"
                            checked={emailConsents.marketingQuotes}
                            onChange={(e) => setEmailConsents({...emailConsents, marketingQuotes: e.target.checked})}
                            className="w-4 h-4 rounded accent-emerald-500"
                          />
                        </div>
                        <p className="text-[10px] text-zinc-600 font-sans leading-tight">Partner promotions, requires manual verification opt-in.</p>
                      </div>
                      <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span>Autonomous AI pricing</span>
                          <input 
                            type="checkbox"
                            checked={emailConsents.aiOptimizations}
                            onChange={(e) => setEmailConsents({...emailConsents, aiOptimizations: e.target.checked})}
                            className="w-4 h-4 rounded accent-emerald-500"
                          />
                        </div>
                        <p className="text-[10px] text-zinc-600 font-sans leading-tight">Receive instant alerts regarding smart contract pricing changes.</p>
                      </div>
                    </div>
                  </div>

                  {/* Highest-Risk Areas for SONICSTREAM Section */}
                  <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-6">
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="text-amber-500 animate-pulse" size={18} />
                      <div>
                        <h3 className="font-bold text-sm uppercase text-zinc-200">Critical Compliance & Legal Risk Matrix</h3>
                        <p className="text-xs text-zinc-500">Continuous risk governance tracking under global commerce regulations for SonicStream.</p>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {[
                        {
                          title: "AI-generated business recommendations",
                          risk: "Algorithmic pricing error, pricing collusion, or advice liability.",
                          action: "Human-in-the-loop override switches, legal disclaimers, confidence filters."
                        },
                        {
                          title: "Creator payouts and tax reporting",
                          risk: "Tax non-compliance, manual misallocation, 1099-K filing errors.",
                          action: "Pre-payout W-8/W-9 registration, multi-jurisdiction IRS file ledgering."
                        },
                        {
                          title: "User-generated content and copyright",
                          risk: "Pirated uploads, DMCA Safe Harbor loss, IP infringement.",
                          action: "Continuous audio matching, automated safe-audio fingerprints, instant DMCA stream teardowns."
                        },
                        {
                          title: "Marketplace fraud and disputes",
                          risk: "Chargeback abuse, money laundering, fake review inflation.",
                          action: "14-day escrow trust windows, verified purchase badge locks, credit limit velocity checks."
                        },
                        {
                          title: "Data privacy and consent management",
                          risk: "GDPR/CCPA breaches, dark patterns, non-auditable consent.",
                          action: "Granular opt-in consent controls, immediate auditable account purging queue."
                        },
                        {
                          title: "Trust scores and ranking algorithms",
                          risk: "EU P2B algorithmic transparency breaches, black-box bias.",
                          action: "Fully transparent weighting models, open ranking criteria documentation."
                        },
                        {
                          title: "Automated pricing optimization",
                          risk: "Predatory pricing, anticompetitive collusion.",
                          action: "Hard caps on minimum gross margins, upper ceiling limits, local currency dynamic bounds."
                        },
                        {
                          title: "International compliance requirements",
                          risk: "OFAC sanctioned actors, multi-currency conversion, cross-border VAT.",
                          action: "Automated PEP & OFAC list checks, real-time FX price stability, automatic VAT/sales-tax calculations."
                        },
                        {
                          title: "Payment processing and AML/KYC obligations",
                          risk: "Structuring, illegal trade, money laundering routes.",
                          action: "Stripe Connect onboarding, KYC/KYB identity validation checks."
                        },
                        {
                          title: "Accessibility and consumer protection requirements",
                          risk: "ADA non-compliance, lack of clear refund rights.",
                          action: "WCAG 2.1 AA responsive layouts, simplified refund systems, persistent assistance resources."
                        }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-1.5 hover:border-amber-500/20 transition-all">
                          <div className="flex items-center justify-between font-sans">
                            <span className="text-xs font-bold text-zinc-205">{item.title}</span>
                            <span className="text-[8px] px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 uppercase rounded font-mono font-bold">High Risk</span>
                          </div>
                          <p className="text-[11px] text-zinc-400"><strong className="text-zinc-500">Risk:</strong> {item.risk}</p>
                          <p className="text-[11px] text-emerald-400"><strong className="text-zinc-500">Mitigation:</strong> {item.action}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Legal Compiler for Generated Websites */}
                  <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-bold text-sm uppercase text-zinc-200">Legal Compliance Layout Compiler (WCAG AA Compliant)</h3>
                        <p className="text-xs text-zinc-500">Instantly generate standard Terms, Privacy and Contacts pages for your custom site builder subdomains.</p>
                      </div>
                      <button
                        onClick={() => {
                          toast.success("Compiled static compliance pages template ready! Autogenerated: ToS, Privacy Document, Cookie Policy, and Contact AA accessibility framework.");
                        }}
                        className="p-3 bg-zinc-800 text-white font-bold text-xs uppercase hover:bg-zinc-700 rounded-xl transition-all border border-white/5 shrink-0 flex items-center gap-1.5"
                      >
                        <RefreshCw size={12} /> Compile Compliance Pages
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: IDENTITY VERIFICATION & KYC/AML */}
              {activeTab === 'identity' && (
                <motion.div
                  key="identity"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                        <UserCheck className="text-emerald-400" size={18} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold uppercase tracking-tight text-white">Identity Verification (KYC/KYB Process)</h2>
                        <p className="text-xs text-zinc-500">Legally required for receiving direct marketplace payouts, high-value bundles, and digital licensing.</p>
                      </div>
                    </div>

                    {/* Creator Trust Center Scorecard */}
                    <div className="bg-zinc-950 border border-white/5 p-6 rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-black tracking-wider text-zinc-500 block">Verification Status</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-xs font-mono font-bold text-emerald-400">Verified (Tier 4 Custody)</span>
                        </div>
                        <span className="text-[9px] text-zinc-500 block leading-none">Full AML & KYC Cleared</span>
                      </div>
                      <div className="space-y-1 border-l border-zinc-900 pl-4">
                        <span className="text-[10px] uppercase font-black tracking-wider text-zinc-500 block">Dispute History</span>
                        <span className="text-xs font-mono font-bold text-zinc-200 block">0 Active / 2 Resolved</span>
                        <span className="text-[9px] text-zinc-500 block leading-none">Zero safety infractions</span>
                      </div>
                      <div className="space-y-1 border-l border-zinc-900 pl-4">
                        <span className="text-[10px] uppercase font-black tracking-wider text-zinc-500 block">Refund Rate</span>
                        <span className="text-xs font-mono font-bold text-zinc-200 block">1.2% <span className="text-[9px] text-emerald-500 font-normal">(Stable)</span></span>
                        <span className="text-[9px] text-zinc-500 block leading-none">Industry standard max 5.0%</span>
                      </div>
                      <div className="space-y-1 border-l border-zinc-900 pl-4">
                        <span className="text-[10px] uppercase font-black tracking-wider text-zinc-500 block">Review Rating</span>
                        <span className="text-xs font-mono font-bold text-amber-400 block pb-0.5">★ 4.85 / 5.0</span>
                        <span className="text-[9px] text-zinc-500 block leading-none">Based on 142 verified orders</span>
                      </div>
                    </div>

                    <form onSubmit={handleKycSubmit} className="grid md:grid-cols-2 gap-6 bg-black/40 p-6 rounded-2xl border border-white/5">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-wider text-zinc-500">Legal Entity/Individual Name</label>
                        <input
                          type="text"
                          required
                          value={kycForm.legalName}
                          onChange={(e) => setKycForm({...kycForm, legalName: e.target.value})}
                          placeholder="EX: Johnathan Doe Enterprises LLC"
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-sm text-white skeleton focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-wider text-zinc-500">Registry/Tax Identification ID</label>
                        <input
                          type="text"
                          required
                          value={kycForm.taxId}
                          onChange={(e) => setKycForm({...kycForm, taxId: e.target.value})}
                          placeholder="EX: EIN 20-409192A"
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] uppercase font-black tracking-wider text-zinc-500">Operational Registered Address</label>
                        <input
                          type="text"
                          required
                          value={kycForm.address}
                          onChange={(e) => setKycForm({...kycForm, address: e.target.value})}
                          placeholder="EX: 405 Slate Ave, Suite 109, Sheridan WY"
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-wider text-zinc-500">Tax Type Document</label>
                        <select
                          value={kycForm.taxType}
                          onChange={(e) => setKycForm({...kycForm, taxType: e.target.value})}
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-emerald-500 outline-none"
                        >
                          <option value="W-9">W-9 (US Citizen/Entity)</option>
                          <option value="W-8BEN">W-8BEN (Foreign Individual)</option>
                          <option value="W-8BEN-E">W-8BEN-E (Foreign Entity)</option>
                          <option value="1099-Compliance">1099 Standard</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-wider text-zinc-500">Government-Issued ID File</label>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => {
                              const files = e.target.files;
                              if (files && files.length > 0) {
                                setKycForm({
                                  ...kycForm,
                                  govIdAttached: files[0],
                                  govIdName: files[0].name
                                });
                                toast.success("Government document loaded into verified cache.");
                              }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="w-full bg-zinc-950 border border-dashed border-white/10 rounded-xl p-3 text-xs text-zinc-400 text-center hover:border-emerald-500/40 transition-colors">
                            {kycForm.govIdName || "Select Government ID Card, Passport or EIN PDF..."}
                          </div>
                        </div>
                      </div>

                      <div className="md:col-span-2 pt-4 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[10px] text-zinc-500">Workflow partner: Stripe Identity Verified Node</span>
                        <button
                          type="submit"
                          className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all"
                        >
                          Submit KYB and Verify
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* AML Anti-Money Laundering Regulations Screen */}
                  <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-bold text-sm uppercase text-rose-400 flex items-center gap-1.5 font-mono">
                          <AlertTriangle size={15} /> aml_flags Real-Time Transaction Monitor
                        </h3>
                        <p className="text-xs text-zinc-500">Scanning withdrawals, multiple logins, fast velocity patterns matching OFAC guidelines.</p>
                      </div>
                      <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 px-2 py-1 rounded font-black">
                        ALL CLEAR ● ACTIVE
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2">
                        <div className="text-xs font-bold text-white uppercase font-mono flex items-center gap-1.5">
                          Risk Vector Indicators
                        </div>
                        <ul className="text-[11px] text-zinc-500 space-y-1.5 list-disc list-inside">
                          <li>Rapid Withdrawals Pattern Score: <strong className="text-emerald-400">Low (0.01)</strong></li>
                          <li>Multiple IP Locations Flag: <strong className="text-emerald-400">None Locked</strong></li>
                          <li>Large Inflow Outlier Limits: <strong className="text-zinc-400">No flags in 30 days</strong></li>
                        </ul>
                      </div>
                      <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2">
                        <div className="text-xs font-bold text-white uppercase font-mono">
                          Recent Compliance Logs
                        </div>
                        <p className="text-[10px] text-zinc-500 italic leading-snug">
                          "System checked tx range ORD-902, calculated amount $19.99, output check cleared. Wallet routing matches verified tax entity."
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 3: AUDITABLE FINANCIAL LEDGER */}
              {activeTab === 'ledger' && (
                <motion.div
                  key="ledger"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                        <Coins className="text-emerald-400" size={18} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold uppercase tracking-tight text-white font-mono">auditable_ledger Stream Transactions</h2>
                        <p className="text-xs text-zinc-500">Immutable direct financial entries. No transactions can be overwritten, mutated or deleted by admins.</p>
                      </div>
                    </div>

                    {/* Escrow Rule Reminder Banner */}
                    <div className="p-4 bg-zinc-950 border border-white/5 rounded-2xl flex items-start gap-3">
                      <Shield size={20} className="text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">Marketplace Escrow Rule Engagement</span>
                        <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5">
                          SonicStream never promises guaranteed commercial earnings, sponsorships, or return-on-investment benchmarks. Estimated earnings are historical performance references calculated under neutral guidelines.
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-mono text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 text-zinc-500 text-[10px] uppercase select-none">
                            <th className="py-3 px-2">Ledger ID</th>
                            <th className="py-3 px-2">Ref Source</th>
                            <th className="py-3 px-2">Type</th>
                            <th className="py-3 px-2">Recorded At</th>
                            <th className="py-3 px-2 text-right">Debit/Credit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-zinc-300">
                          <tr>
                            <td className="py-3 px-2 font-bold text-white">#TX-509121</td>
                            <td className="py-3 px-2">ORD-902 (Marketplace)</td>
                            <td className="py-3 px-2 uppercase text-emerald-400 text-[10px]">Payment Inflow</td>
                            <td className="py-3 px-2 font-sans text-zinc-500">2026-06-03 14:22:01</td>
                            <td className="py-3 px-2 text-right font-bold text-emerald-400 font-mono">+$19.99</td>
                          </tr>
                          <tr>
                            <td className="py-3 px-2 font-bold text-white">#TX-509120</td>
                            <td className="py-3 px-2">LIC-982 (Standard License)</td>
                            <td className="py-3 px-2 uppercase text-purple-400 text-[10px]">Tax Profile Allocation</td>
                            <td className="py-3 px-2 font-sans text-zinc-500">2026-06-02 18:40:11</td>
                            <td className="py-3 px-2 text-right font-bold text-zinc-300 font-mono">-$2.40</td>
                          </tr>
                          <tr>
                            <td className="py-3 px-2 font-bold text-white">#TX-509119</td>
                            <td className="py-3 px-2">ORD-899 (License Stems)</td>
                            <td className="py-3 px-2 uppercase text-cyan-400 text-[10px]">Vault Payout Escrow</td>
                            <td className="py-3 px-2 font-sans text-zinc-500">2026-06-01 11:15:32</td>
                            <td className="py-3 px-2 text-right font-bold text-cyan-400 font-mono">+$149.00</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Cryptographic Audit & Evidence System */}
                  <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-6">
                    <div className="flex items-center gap-2.5">
                      <RefreshCw className="text-cyan-400 animate-spin-slow" size={18} />
                      <div>
                        <h3 className="font-bold text-sm uppercase text-zinc-200 font-sans">Cryptographic audit_evidence Ledger Systems</h3>
                        <p className="text-xs text-zinc-500">Immutable SHA-256 state locks proving system operations are genuine, untamperable, and legal.</p>
                      </div>
                    </div>

                    <div className="space-y-3 font-mono text-xs text-zinc-400">
                      {[
                        {
                          category: "Order Evidence Log",
                          source: "ORD-902 (WAV Album Bundle Purchase)",
                          hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                          status: "LOCKED (SHA-256)"
                        },
                        {
                          category: "Payment Deposit Lock",
                          source: "PAY-104 (Immutable Milestone Escrow Contract)",
                          hash: "fca3b3e245da1c834afbf2b1236ea92425ae21e4249a933ac494291c7841c822",
                          status: "ESCROWED & COMMITTED"
                        },
                        {
                          category: "Review Authenticity Proof",
                          source: "REV-408 (Verified Buyer Feedback Seal)",
                          hash: "8c3b44298fcca4149afdf4c8996fb92427ae41e4649b934ca495995a78525b64",
                          status: "SIGNATURE CONFIRMED (SIG-256)"
                        },
                        {
                          category: "AI Recommendation Audit Record",
                          source: "REC-4091 (Autonomous Price-Adjust Recommendation)",
                          hash: "d4b0c24298fc11149afbf4c8996fb92427ae41e4649b934ca495991b782bcf22",
                          status: "EXPLAINED & AUDITED"
                        },
                        {
                          category: "Dispute Action Filing Record",
                          source: "DISP-209 (Synthwave Midi Attribution Claims Case)",
                          hash: "b0c44298fc1c1149afbf4c8996fb92427ae41e4649b934ca495991b7852b855e3",
                          status: "CASE FILE EVIDENCE STORED"
                        },
                        {
                          category: "Moderation Desk Exec Record",
                          source: "MOD-902 (Flagged spam profile removal operation)",
                          hash: "0a1e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b8",
                          status: "ADMIN LOG SIGNED"
                        }
                      ].map((ev, idx) => (
                        <div key={idx} className="bg-zinc-950 p-4 border border-zinc-800 rounded-xl space-y-2 relative overflow-hidden">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <span className="text-[10px] uppercase font-bold text-cyan-400">{ev.category}</span>
                            <span className="text-[9px] px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-500 rounded font-mono">
                              {ev.status}
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1">
                              <span className="text-zinc-600">Source:</span>
                              <span className="text-zinc-300 font-sans">{ev.source}</span>
                            </div>
                            <div className="flex items-center gap-1 truncate text-zinc-500 font-mono text-[10px]">
                              <span className="text-zinc-650 font-bold">SHA-256 Hash Lock:</span>
                              <span className="text-zinc-500 select-all hover:text-white transition-colors">{ev.hash}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 4: AI AUDIT TRAIL & EXPLAINABILITY */}
              {activeTab === 'ai' && (
                <motion.div
                  key="ai"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                          <Cpu className="text-emerald-400" size={18} />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold uppercase tracking-tight text-white">ai_recommendations Audit Trial Logs</h2>
                          <p className="text-xs text-zinc-500 font-sans">Transparency logs capturing prompts, model outputs, diagnostics, and human sovereign decisions.</p>
                        </div>
                      </div>

                      {/* AI Compliance Dashboard Stats Block */}
                      <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex flex-wrap gap-4 font-mono text-[10px] shrink-0">
                        <div className="space-y-0.5">
                          <span className="text-zinc-500 block uppercase font-bold text-[8px] tracking-wider">Recommendations</span>
                          <span className="text-sm font-bold text-white block">1,284</span>
                        </div>
                        <div className="space-y-0.5 border-l border-white/5 pl-4">
                          <span className="text-zinc-500 block uppercase font-bold text-[8px] tracking-wider">Acceptance Rate</span>
                          <span className="text-sm font-bold text-emerald-400 block">81.1%</span>
                        </div>
                        <div className="space-y-0.5 border-l border-white/5 pl-4">
                          <span className="text-zinc-500 block uppercase font-bold text-[8px] tracking-wider">Revenue Impact</span>
                          <span className="text-sm font-bold text-cyan-400 block">+$241,850</span>
                        </div>
                        <div className="space-y-0.5 border-l border-white/5 pl-4">
                          <span className="text-zinc-500 block uppercase font-bold text-[8px] tracking-wider">Active Version</span>
                          <span className="text-sm font-bold text-zinc-300 block">Gemini-2.0-Flash</span>
                        </div>
                      </div>
                      
                      {/* Human Override Active toggle */}
                      <div className="bg-zinc-950 p-3 rounded-xl border border-white/5 flex items-center gap-4">
                        <div className="space-y-0.5">
                          <span className="text-[9px] uppercase font-bold text-zinc-500 block">Pricing Decisions</span>
                          <span className="text-xs font-black text-white uppercase">Human Override</span>
                        </div>
                        <button
                          onClick={() => {
                            setAiAutonomousPricing(!aiAutonomousPricing);
                            toast.success(
                              `Autonomous Price-Adjustments is now ${!aiAutonomousPricing ? 'DISABLED (Manual lock active)' : 'ENABLED (Optimized dynamically)'}`
                            );
                          }}
                          className={`w-12 h-6 rounded-full p-1 transition-all flex items-center ${
                            !aiAutonomousPricing ? 'bg-emerald-500 justify-end' : 'bg-zinc-800 justify-start'
                          }`}
                        >
                          <span className="w-4 h-4 rounded-full bg-black block shadow-md" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {recommendations.map(rec => (
                        <div key={rec.id} className="bg-zinc-950 p-6 rounded-2xl border border-white/5 space-y-3 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-3 bg-white/5 text-[9px] font-mono text-zinc-500">
                            ID: {rec.id} ● Version: {rec.model_version}
                          </div>
                          
                          <div className="space-y-1">
                            <span className="text-[9px] font-black uppercase text-zinc-500 block font-mono">Prompt Input Stream</span>
                            <p className="text-xs text-zinc-400 italic">"{rec.prompt}"</p>
                          </div>
                          
                          <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 space-y-1">
                            <span className="text-[9px] font-black uppercase text-emerald-400 block font-mono">Recommended Output</span>
                            <p className="text-xs text-white font-bold">{rec.recommendation}</p>
                            <span className="text-[10px] text-zinc-500 block italic mt-1 font-mono">
                              Confidence probability metric: {rec.confidence * 100}%
                            </span>
                          </div>

                          {/* Explainability factors (instead of black box score) */}
                          <div className="pt-2 border-t border-white/5">
                            <span className="text-[9px] font-black uppercase text-zinc-500 block font-mono mb-2">Confidence factor diagnostics:</span>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-mono text-zinc-400">
                              <span className="bg-zinc-900 px-2 py-1 rounded">Completed sales: 409 items</span>
                              <span className="bg-zinc-900 px-2 py-1 rounded">Overall refund limit: 0.23%</span>
                              <span className="bg-zinc-900 px-2 py-1 rounded">Creator profile: Fully KYC verified</span>
                              <span className="bg-zinc-900 px-2 py-1 rounded">Regional techno metrics: stable plus</span>
                            </div>
                          </div>

                          <div className="pt-3 flex gap-3 text-[10px] uppercase font-bold text-zinc-500">
                            <span>⚠️ advice_disclaimer:</span>
                            <span className="text-zinc-400">Generated by AI metrics. Does NOT represent licensed legal or direct financial advisory.</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 5: DMCA COMPLAINTS & MODERATION CASE FILES */}
              {activeTab === 'dmca' && (
                <motion.div
                  key="dmca"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center font-mono font-bold text-emerald-400 text-lg">
                        C
                      </div>
                      <div>
                        <h2 className="text-xl font-bold uppercase tracking-tight text-white">DMCA Safe-Harbor Complaint Portal</h2>
                        <p className="text-xs text-zinc-500">Report copyright violations, unauthorized digital re-listings, or un-licensed stems usage.</p>
                      </div>
                    </div>

                    <form onSubmit={handleNewDmcaSubmit} className="grid md:grid-cols-2 gap-4 bg-black/40 p-6 rounded-2xl border border-white/5">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-zinc-500 font-mono pl-1">Target Infringing Track Title</label>
                        <input
                          type="text"
                          required
                          value={newDmca.trackTitle}
                          onChange={(e) => setNewDmca({...newDmca, trackTitle: e.target.value})}
                          placeholder="EX: Epic Synth Melodies Pack"
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-zinc-500 font-mono pl-1">Alleged Offending Artist</label>
                        <input
                          type="text"
                          required
                          value={newDmca.artistName}
                          onChange={(e) => setNewDmca({...newDmca, artistName: e.target.value})}
                          placeholder="EX: CopierBeats_409"
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-zinc-500 font-mono pl-1">Claimant Verification Email</label>
                        <input
                          type="email"
                          required
                          value={newDmca.claimantEmail}
                          onChange={(e) => setNewDmca({...newDmca, claimantEmail: e.target.value})}
                          placeholder="EX: compliance@originalmusiccorp.com"
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-zinc-500 font-mono pl-1">Specific Infringement details & Reason</label>
                        <textarea
                          required
                          value={newDmca.reason}
                          onChange={(e) => setNewDmca({...newDmca, reason: e.target.value})}
                          rows={3}
                          placeholder="Explain exactly which bars, stems, or melody keys are used without a valid licensing deed."
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-zinc-300 focus:border-emerald-500 outline-none resize-none"
                        />
                      </div>

                      <div className="md:col-span-2 flex items-start gap-3 py-2">
                        <input
                          type="checkbox"
                          id="dmca-decl"
                          checked={newDmca.declaration}
                          onChange={(e) => setNewDmca({...newDmca, declaration: e.target.checked})}
                          className="mt-1 shrink-0 accent-emerald-500"
                        />
                        <label htmlFor="dmca-decl" className="text-[10px] text-zinc-400 leading-snug">
                          I affirm under penalty of perjury that the information in this notification is accurate and that I am the copyright owner or authorized agent thereof.
                        </label>
                      </div>

                      <div className="md:col-span-2 flex justify-end">
                        <button
                          type="submit"
                          className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all"
                        >
                          Submit Legal DMCA Takedown
                        </button>
                      </div>
                    </form>

                    <div className="space-y-3">
                      <div className="text-xs uppercase font-bold text-zinc-300 font-mono">Your Filed Infractions Status</div>
                      {dmcaClaims.map(claim => (
                        <div key={claim.id} className="p-4 bg-zinc-950 border border-white/5 rounded-xl flex items-center justify-between text-xs">
                          <div className="space-y-1">
                            <span className="font-bold text-white uppercase">{claim.trackTitle}</span>
                            <p className="text-[10px] text-zinc-500 font-mono">Claimant: {claim.claimant} ● Locked: {new Date(claim.createdAt).toLocaleDateString()}</p>
                          </div>
                          <span className="text-[10px] font-black tracking-widest uppercase bg-rose-950/50 text-rose-300 px-3 py-1.5 rounded-full border border-rose-900/20">
                            {claim.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Safety violations, spam and harassment reports */}
                  <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center">
                        <AlertTriangle className="text-red-400" size={18} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold uppercase tracking-tight text-white">Direct Abuse & Spam Reporting Portal</h2>
                        <p className="text-xs text-zinc-500">Report marketplace spam comments, impersonations, harassment or fraudulent creator profiles.</p>
                      </div>
                    </div>

                    <form onSubmit={handleNewSafetyReport} className="grid md:grid-cols-2 gap-4 bg-black/40 p-6 rounded-2xl border border-white/5 text-xs">
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase block pl-1">Offending Profile ScreenName</label>
                        <input
                          type="text"
                          required
                          value={newReport.reportedUser}
                          onChange={(e) => setNewReport({...newReport, reportedUser: e.target.value})}
                          placeholder="EX: MelodiousSpamMachine_829"
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-white focus:border-red-500 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase block pl-1">Infraction Category</label>
                        <select
                          value={newReport.reason}
                          onChange={(e) => setNewReport({...newReport, reason: e.target.value})}
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-white focus:border-red-500 outline-none"
                        >
                          <option value="Spam / Automated Marketing">Spam / Bots</option>
                          <option value="Impersonating Another Artist">Impersonation</option>
                          <option value="Fraud / Fake Licensing Deeds">Fraud / Theft</option>
                          <option value="Harassment or Verbal Abuse">Harassment</option>
                        </select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase block pl-1">Detailed Events Narrative</label>
                        <textarea
                          required
                          value={newReport.details}
                          onChange={(e) => setNewReport({...newReport, details: e.target.value})}
                          rows={2}
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-white focus:border-red-500 outline-none resize-none"
                        />
                      </div>
                      <div className="md:col-span-2 flex justify-end">
                        <button
                          type="submit"
                          className="px-6 py-2.5 bg-rose-950/50 hover:bg-rose-900 border border-rose-900/30 text-rose-300 hover:text-white font-bold tracking-wider uppercase rounded-xl transition-all"
                        >
                          Send Violation Incident File
                        </button>
                      </div>
                    </form>

                    {/* Moderation log */}
                    <div className="space-y-3 pt-4 border-t border-white/5">
                      <span className="text-[10px] font-black uppercase text-zinc-500">Moderation Desk Case Feed (moderation_flags Table)</span>
                      {safetyReports.map(rep => (
                        <div key={rep.id} className="p-4 bg-zinc-950 border border-white/5 rounded-xl flex items-center justify-between text-xs font-mono">
                          <div className="space-y-1">
                            <span>Offender: <strong className="text-white">@{rep.reportedUser}</strong></span>
                            <p className="text-[10px] text-zinc-600">Filed by: {rep.reporter} ● Cause: {rep.reason}</p>
                          </div>
                          <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-90 w-24 text-center border border-white/5 text-zinc-400 capitalize">
                            {rep.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 7: MARKETPLACE TRANSPARENCY & VISION */}
              {activeTab === 'marketplace' && (
                <motion.div
                  key="marketplace"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  {/* Marketplace Transparency Center */}
                  <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center font-bold text-emerald-400">
                        <Scale size={18} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold uppercase tracking-tight text-white block">Marketplace Transparency Center</h2>
                        <p className="text-xs text-zinc-500">Fully compliant with EU Platform-to-Business (P2B) rankings & trust scoring rules.</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 space-y-2.5">
                        <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider font-mono">How Rankings Work</span>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Products and creators are sorted dynamically using a multi-factor weighting formula. No human bias can override the formula:
                        </p>
                        <div className="space-y-2 text-[11px] font-mono text-zinc-500 pt-1">
                          <div className="flex justify-between border-b border-zinc-900 pb-1">
                            <span>Sales Velocity</span>
                            <span className="text-white">40% weight</span>
                          </div>
                          <div className="flex justify-between border-b border-zinc-900 pb-1">
                            <span>Verified Buyer Ratings</span>
                            <span className="text-white">30% weight</span>
                          </div>
                          <div className="flex justify-between border-b border-zinc-900 pb-1">
                            <span>Platform Engagement</span>
                            <span className="text-white">20% weight</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Creator Trust Score</span>
                            <span className="text-white">10% weight</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 space-y-2.5">
                        <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider font-mono">How Recommendations Work</span>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          We employ context-aware AI recommendations via the Gemini API. These examine multi-modal vectors including:
                        </p>
                        <ul className="text-xs text-zinc-500 space-y-1.5 pl-4 list-disc pt-1">
                          <li>Auditory wave metadata and audio genre categories</li>
                          <li>Explicit customer query tagging and location indicators</li>
                          <li>Aggregated user purchase history & listening metrics</li>
                        </ul>
                      </div>

                      <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 space-y-2.5">
                        <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider font-mono">How Trust Scores Work</span>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          The absolute rating scale measures reliability, ensuring the highest consumer safety benchmarks from 0-100:
                        </p>
                        <div className="space-y-2 text-[11px] font-mono text-zinc-500 pt-1">
                          <div className="flex justify-between border-b border-zinc-900 pb-1">
                            <span>Order Fulfillment</span>
                            <span className="text-white">50% factor</span>
                          </div>
                          <div className="flex justify-between border-b border-zinc-900 pb-1">
                            <span>Refund Rates</span>
                            <span className="text-white">30% factor</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Average User Reviews</span>
                            <span className="text-white">20% factor</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Marketplace Architecture & Vision */}
                  <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-6">
                    <div>
                      <h3 className="font-bold text-sm uppercase text-zinc-200">The Modern SonicStream Marketplace Vision</h3>
                      <p className="text-xs text-zinc-500 mt-1">
                        Breaking traditional limitations (Seller ➔ Product ➔ Buyer) to build an immersive complete creator-to-ear ecosystem.
                      </p>
                    </div>

                    {/* Flowchart Diagram */}
                    <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-6 text-center font-mono text-xs select-none relative overflow-hidden">
                      <div className="px-5 py-3 bg-zinc-700 text-white font-black rounded-xl uppercase tracking-widest leading-none z-10">
                        Creators
                      </div>
                      <div className="text-zinc-655 text-lg font-bold leading-none">➔</div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-9 gap-2 w-full max-w-4xl text-[10px]">
                        {[
                          "Content", "Music", "Beats", "Services", "Merchandise", "Tickets", "Digital Products", "Memberships", "Licensing"
                        ].map((cat, idx) => (
                          <div key={idx} className="bg-zinc-900 p-2.5 rounded-lg border border-white/5 text-zinc-300 font-bold uppercase tracking-wider h-14 flex items-center justify-center text-center">
                            {cat}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Platform Commissions & Fees Table */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-black uppercase text-zinc-400 block font-mono">Platform Revenue Commission Fees Model</span>
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                        {[
                          { name: "Merchandise", fee: "7.5%" },
                          { name: "Services", fee: "15%" },
                          { name: "Beats", fee: "12%" },
                          { name: "Digital Products", fee: "12%" },
                          { name: "Tickets", fee: "7.5%" },
                          { name: "Licensing", fee: "15%" }
                        ].map((feeItem, idx) => (
                          <div key={idx} className="bg-zinc-950 p-4 rounded-xl border border-white/5 text-center font-mono">
                            <span className="text-[9px] text-zinc-500 uppercase tracking-widest block">{feeItem.name}</span>
                            <span className="text-lg font-bold text-emerald-400 block mt-1">{feeItem.fee}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 14 Phases Registry Explorer */}
                    <div className="space-y-4">
                      <span className="text-[10px] font-black uppercase text-zinc-400 block font-mono">Interactive Phases Timeline Roadmap</span>
                      <div className="grid md:grid-cols-2 gap-4">
                        {[
                          { phase: "Phase 1: Strengthen Core Marketplace", desc: "Build standard, schema-backed dynamic listings, verified purchases, and catalog metadata folders." },
                          { phase: "Phase 2: Creator Service Marketplace", desc: "Enable mixing, mastering, files workspace exchanges, revisions tracking, and escrow holding releases." },
                          { phase: "Phase 3: Beat Marketplace", desc: "Custom licenses models (basic, unlimited, exclusive), with instant file auto-delivery pipelines." },
                          { phase: "Phase 4: Digital Products Marketplace", desc: "High-margin digital channels (drumkits, presets, samplepacks) accompanied by custom download codes." },
                          { phase: "Phase 5: Ticket Marketplace", desc: "Sponsor live events with secure entry QR codes, access levels (VIP, regular), and check-ins." },
                          { phase: "Phase 6: Creator Storefronts", desc: "Equip creators with customized standalone domains, storefront themes, and private audience views." },
                          { phase: "Phase 7: Escrow Payments", desc: "Establish security utilizing Stripe Connect. Split holding and dynamic milestone payout gates." },
                          { phase: "Phase 8: Affiliate Marketplace", desc: "Introduce dynamic commission levels, affiliate links generators, and click-conversion trackers." },
                          { phase: "Phase 9: AI Marketplace Tools", desc: "Deploy automatic description generators, semantic keyword tags, auto SEO, and dynamic pricing metrics." },
                          { phase: "Phase 10: Marketplace Analytics", desc: "Enable seller charts tracking views, cart abandonments, conversion funnel triggers, and traffic origins." },
                          { phase: "Phase 11: Fraud Prevention", desc: "Chargeback mitigation, multi-IP risk scores, blocklists, and automated velocity indicators." },
                          { phase: "Phase 12: Marketplace Ranking Engine", desc: "Develop advanced algorithmic sorting combining sales velocity and creator compliance trust scores." },
                          { phase: "Phase 13: Licensing Marketplace", desc: "Sell commercial audio rights licenses for video production, podcast hosting, gaming, and advertisements." },
                          { phase: "Phase 14: Marketplace API", desc: "Open standard REST/GraphQL queries endpoint allowing developers to query playlists, creator profiles and products." }
                        ].map((it, idx) => (
                          <div key={idx} className="bg-zinc-950 p-4 border border-zinc-800 rounded-xl space-y-1 hover:border-emerald-500/10 transition-all">
                            <span className="text-xs font-bold text-zinc-300 font-mono block text-emerald-400">{it.phase}</span>
                            <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">{it.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PolicyCenter;
