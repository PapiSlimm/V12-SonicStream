import React from 'react';
import { ShieldCheck, Lock, Eye, Server, FileCheck, AlertTriangle } from 'lucide-react';

const complianceItems = [
  {
    title: 'Data Encryption',
    description: 'All client media and project data are encrypted at rest (AES-256) and in transit (TLS 1.3).',
    icon: <Lock size={20} />,
  },
  {
    title: 'Access Control',
    description: 'Strict RBAC (Role-Based Access Control) ensures only authorized team members access your briefs.',
    icon: <ShieldCheck size={20} />,
  },
  {
    title: 'Secure Delivery',
    description: 'Final assets are delivered via expiring, password-protected V12 SonicStream links.',
    icon: <Server size={20} />,
  },
  {
    title: 'Privacy Compliance',
    description: 'Fully GDPR and CCPA compliant data handling procedures for all global clients.',
    icon: <Eye size={20} />,
  },
  {
    title: 'Audit Logging',
    description: 'Complete activity logs for every file interaction within the V12 ecosystem.',
    icon: <FileCheck size={20} />,
  },
  {
    title: 'Vulnerability Scanning',
    description: 'Weekly automated security audits and penetration testing on all V12 platforms.',
    icon: <AlertTriangle size={20} />,
  },
];

export function SecurityChecklist() {
  return (
    <section className="py-24 px-6 bg-v12-blue/30 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-12 items-start">
          <div className="md:w-1/3 sticky top-32">
            <h2 className="text-v12-orange font-bold uppercase tracking-widest text-sm mb-4">Security First</h2>
            <h3 className="text-4xl font-extrabold tracking-tighter mb-6">
              V12 MULTIMEDIA <br /> COMPLIANCE
            </h3>
            <p className="text-v12-silver mb-8">
              We take the security of your intellectual property seriously. Our infrastructure is built to meet the highest industry standards for media safety.
            </p>
            <div className="p-6 glass-card border-v12-orange/20">
              <div className="text-v12-orange font-bold mb-2">SOC 2 Type II</div>
              <p className="text-xs text-v12-silver">Currently in audit process. Expected completion Q3 2026.</p>
            </div>
          </div>

          <div className="md:w-2/3 grid sm:grid-cols-2 gap-6">
            {complianceItems.map((item) => (
              <div key={item.title} className="glass-card p-8 hover:border-v12-orange/30 transition-colors">
                <div className="text-v12-orange mb-4">{item.icon}</div>
                <h4 className="text-lg font-bold mb-2">{item.title}</h4>
                <p className="text-v12-silver text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
