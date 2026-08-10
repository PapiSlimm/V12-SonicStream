import { CheckCircle2 } from 'lucide-react';

export const ServicesPage = () => (
  <div className="space-y-12">
    <header className="text-center space-y-4">
      <h2 className="text-4xl font-bold tracking-tight">Our Services</h2>
      <p className="text-zinc-400">Tailored entertainment solutions for every scale and style.</p>
    </header>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {[
        { 
          title: 'Corporate Galas', 
          price: 'Starting at $2,500',
          desc: 'Full-service entertainment including live bands, professional MCs, and state-of-the-art sound systems.',
          features: ['Custom Setlists', 'Sound Engineer Included', 'Wireless Mic Systems']
        },
        { 
          title: 'Private Festivals', 
          price: 'Starting at $5,000',
          desc: 'Multi-artist lineups, stage management, and immersive lighting design for large-scale private events.',
          features: ['Stage Management', 'Lighting Rig', 'Backstage Support']
        },
        { 
          title: 'Intimate Sessions', 
          price: 'Starting at $800',
          desc: 'Acoustic performers and solo artists perfect for cocktail hours, dinners, and boutique gatherings.',
          features: ['Minimal Footprint', 'Bose Sound System', 'Curated Atmosphere']
        },
        { 
          title: 'Club Takeovers', 
          price: 'Starting at $1,200',
          desc: 'High-energy DJ sets with live percussion or vocalists to transform any venue into a world-class club.',
          features: ['Live Percussion Option', 'Visual Projections', 'Extended Sets']
        }
      ].map((service, i) => (
        <div key={i} className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-6 hover:border-emerald-500/30 transition-all group">
          <div className="flex justify-between items-start">
            <h3 className="text-2xl font-bold group-hover:text-emerald-400 transition-colors">{service.title}</h3>
            <span className="text-sm font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full">{service.price}</span>
          </div>
          <p className="text-zinc-400 leading-relaxed">{service.desc}</p>
          <ul className="space-y-3">
            {service.features.map((f, j) => (
              <li key={j} className="flex items-center gap-2 text-sm text-zinc-500">
                <CheckCircle2 size={14} className="text-emerald-500" /> {f}
              </li>
            ))}
          </ul>
          <button className="w-full bg-white/5 hover:bg-zinc-700 hover:text-white py-3 rounded-xl font-bold transition-all">
            Inquire for Details
          </button>
        </div>
      ))}
    </div>
  </div>
);
