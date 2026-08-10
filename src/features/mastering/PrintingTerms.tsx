import React from 'react';
import { ShieldCheck, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

export const PrintingTerms: React.FC = () => {
  return (
    <div className="space-y-8 text-zinc-300 text-sm leading-relaxed">
      <section className="space-y-4">
        <div className="flex items-center gap-3 text-white">
          <ShieldCheck className="text-emerald-400" size={20} />
          <h3 className="font-black uppercase tracking-tight text-lg">Printing Terms & Conditions</h3>
        </div>
        <p>
          At V12 SonicStream, we are committed to responsible printing practices and compliance with all applicable laws. 
          The following printing guidelines are for users before submitting materials for duplication, printing, or scanning.
        </p>
        <p className="p-4 bg-zinc-800/50 rounded-2xl border border-white/5 italic">
          V12 SonicStream reserves the right to refuse to reproduce any materials that do not conform to applicable laws or the guidelines below.
        </p>
      </section>

      <section className="space-y-4">
        <h4 className="font-bold text-white uppercase tracking-widest text-xs">Acceptance of Terms & Conditions</h4>
        <p>
          By accepting these terms and conditions, you warrant and certify to V12 SonicStream that you either OWN all copyright, trademark, and other proprietary rights in and to the materials you are uploading, or that you have the requisite AUTHORITY from the owner to upload and reproduce these materials. You agree to indemnify, defend, and hold harmless V12 SonicStream from any copyright infringement claims arising out of the use and/or reproduction of the materials you upload.
        </p>
      </section>

      <section className="space-y-6">
        <h4 className="font-bold text-white uppercase tracking-widest text-xs">Guidelines for Duplicating Content</h4>
        
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
              <AlertTriangle size={16} />
            </div>
            <div className="space-y-2">
              <p className="font-bold text-white">1. Prohibited Content</p>
              <p className="text-xs opacity-80">V12 SonicStream will NOT duplicate, print, or scan materials that fall into any of the following categories:</p>
              <ul className="list-disc list-inside space-y-1 text-xs opacity-70 ml-2">
                <li>Threatening or Harmful Content: Materials that threaten imminent harm or incite violence.</li>
                <li>Pornographic Material: Any content of a pornographic nature.</li>
                <li>Certain Government-Issued Documents: License plates, military or government employment identification cards, or similar official documents.</li>
                <li>Currency: Paper money.</li>
                <li>Other Prohibited Items: Any material that is illegal or otherwise restricted by law.</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
              <FileText size={16} />
            </div>
            <div className="space-y-2">
              <p className="font-bold text-white">2. Copyrighted Content</p>
              <p className="text-xs opacity-80">V12 SonicStream will NOT reproduce any copyrighted, trademarked, or other proprietary materials without certification from the customer that they have the lawful right and authority to make such reproductions. V12 SonicStream may also require:</p>
              <ul className="list-disc list-inside space-y-1 text-xs opacity-70 ml-2">
                <li>Written Permission: Documentation from the copyright owner granting permission.</li>
                <li>Proof of Ownership: Evidence that the customer owns the rights to the material.</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <CheckCircle2 size={16} />
            </div>
            <div className="space-y-2">
              <p className="font-bold text-white">3. Restricted Content</p>
              <p className="text-xs opacity-80">Some materials may be duplicated, printed, or scanned, but only under specific restrictions, such as:</p>
              <ul className="list-disc list-inside space-y-1 text-xs opacity-70 ml-2">
                <li>Stamps</li>
                <li>Federal Reserve Notes</li>
                <li>Birth Certificates, State Driver’s Licenses or Passports.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
