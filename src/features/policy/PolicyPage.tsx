import { Shield, Printer, Zap, DollarSign, Sparkles, Users, AlertCircle } from 'lucide-react';

export const PolicyPage = () => (
  <div className="max-w-4xl mx-auto space-y-12">
    <header className="text-center space-y-4">
      <h2 className="text-4xl font-bold tracking-tight">Policies & DMCA</h2>
      <p className="text-zinc-400">Our commitment to copyright protection and fair distribution.</p>
    </header>
    <div className="space-y-8">
      <section className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-4">
        <h3 className="text-xl font-bold text-emerald-400">DMCA / Copyright Policy</h3>
        <p className="text-zinc-400 text-sm leading-relaxed">
          SonicStream respects the intellectual property rights of others. If you believe that your work has been copied in a way that constitutes copyright infringement, please provide our Copyright Agent with the following information:
        </p>
        <ul className="list-disc list-inside text-zinc-500 text-xs space-y-2 ml-4">
          <li>A physical or electronic signature of a person authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.</li>
          <li>Identification of the copyrighted work claimed to have been infringed.</li>
          <li>Identification of the material that is claimed to be infringing or to be the subject of infringing activity.</li>
          <li>Information reasonably sufficient to permit us to contact you, such as an address, telephone number, and email address.</li>
        </ul>
      </section>
      <section className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-4">
        <h3 className="text-xl font-bold text-emerald-400">Takedown Process</h3>
        <p className="text-zinc-400 text-sm leading-relaxed">
          To file a takedown notice, please email <span className="text-white">copyright@sonicstream.com</span> with the subject line "DMCA Takedown Request". Our team will review and process valid requests within 48-72 hours.
        </p>
      </section>
      <section className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
            <Shield className="text-red-500" size={20} />
          </div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tight">SonicStream Violation Policy</h3>
        </div>
        <p className="text-zinc-400 text-sm leading-relaxed">
          SonicStream maintains a zero-tolerance policy for activities that compromise the integrity of our platform or the rights of our users. Violations may result in immediate account suspension or termination.
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-widest">1. Misrepresentation</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Users must not impersonate other artists, labels, or entities. All profile information, including names, bios, and affiliations, must be accurate and verifiable.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-widest">2. Trademark Infringement</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Unauthorized use of trademarks, logos, or brand identities that may cause confusion or dilute the value of established brands is strictly prohibited.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-widest">3. Regulatory Compliance</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Content and activities must comply with all local and international regulations, including financial laws, data privacy (GDPR/CCPA), and age-restricted content guidelines.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-widest">4. User Responsibility</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Account holders are solely responsible for the content they upload and the activities conducted through their account. Ignorance of these guidelines is not a valid defense.
            </p>
          </div>
        </div>
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
          <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">Reporting Violations</p>
          <p className="text-xs text-zinc-400 mt-1">If you encounter a violation of these policies, please report it immediately to <span className="text-white font-bold">compliance@sonicstream.com</span>.</p>
        </div>
      </section>

      <section className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
            <Printer className="text-emerald-500" size={20} />
          </div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tight">Printing Services Policy</h3>
        </div>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Our printing services policy includes a formal set of guidelines designed to manage organizational print costs, reduce waste, and improve security. These policies enhance efficiency and sustainability across the SonicStream platform.
        </p>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
              <Zap size={14} /> Usage Guidelines
            </h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              To save resources, color printing is limited and the default setting for all print jobs is duplex (double-sided) and black-and-white. Employees and users are encouraged to print only when necessary.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
              <DollarSign size={14} /> Cost Control
            </h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Approval workflows are established for large print jobs. We prioritize utilizing internal print shops over external vendors to maintain cost efficiency and quality control.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
              <Shield size={14} /> Security & Confidentiality
            </h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Procedures are in place for handling, storing, and disposing of sensitive or protected documents, ensuring full HIPAA and GDPR compliance for all printed materials.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={14} /> Sustainability
            </h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              SonicStream mandates the use of recycled content paper and eco-friendly toner cartridges. We are committed to reducing our environmental footprint through sustainable printing practices.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
              <Users size={14} /> Personal Printing
            </h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Strict rules apply to the use of company equipment for personal documents. Personal printing is generally prohibited unless explicitly authorized by management.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
              <AlertCircle size={14} /> Modification & Rush Fees
            </h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Revisions to print jobs, especially major changes or rush requests, may incur additional fees. Please review all proofs carefully before final submission.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-6">
        <h3 className="text-xl font-bold text-emerald-400">Appeals Process</h3>
        <p className="text-zinc-400 text-sm leading-relaxed">
          If your content has been removed or your account has been suspended due to a policy violation, you have the right to submit an appeal. We review every appeal carefully to ensure fair treatment for all creators.
        </p>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center font-bold text-emerald-400 shrink-0">1</div>
            <div className="space-y-1">
              <p className="font-bold text-sm">Review the Notice</p>
              <p className="text-xs text-zinc-500">Carefully read the notification email to understand the specific policy violated.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center font-bold text-emerald-400 shrink-0">2</div>
            <div className="space-y-1">
              <p className="font-bold text-sm">Gather Evidence</p>
              <p className="text-xs text-zinc-500">Collect any documentation, licenses, or proof of ownership that supports your case.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center font-bold text-emerald-400 shrink-0">3</div>
            <div className="space-y-1">
              <p className="font-bold text-sm">Submit Appeal</p>
              <p className="text-xs text-zinc-500">Email <span className="text-white">appeals@sonicstream.com</span> with your account details and supporting evidence.</p>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-zinc-500 italic">
          Note: Appeals must be submitted within 30 days of the initial action. Repeated violations may result in a permanent ban without the possibility of appeal.
        </p>
      </section>
    </div>
  </div>
);
