import React from 'react';
import { Camera, Palette, Video, Music, Share2, Megaphone, ArrowRight, Sparkles } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';

const services = [
  {
    title: 'Graphic Design Service',
    description: 'High-impact visual identities, digital assets, and brand storytelling.',
    icon: <Palette className="text-v12-red" size={24} />,
    href: '#design',
  },
  {
    title: 'Marketing Research Services',
    description: 'Data-driven strategies to amplify your reach and engage your audience.',
    icon: <Megaphone className="text-v12-red" size={24} />,
    href: '#research',
  },
  {
    title: 'Photography Services',
    description: 'Professional studio and location shoots capturing authentic brand moments.',
    icon: <Camera className="text-v12-red" size={24} />,
    href: '#photography',
  },
  {
    title: 'Promotional Packages',
    description: 'Custom bundles designed to accelerate your brand across all digital channels.',
    icon: <Sparkles className="text-v12-red" size={24} />,
    href: '#promotional',
  },
  {
    title: 'Video Editing',
    description: 'Cinematic post-production, visual effects, and dynamic motion graphics.',
    icon: <Video className="text-v12-red" size={24} />,
    href: '#video',
  },
];

export function ServicesGrid() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);

  return (
    <section id="services" className="py-24 px-6 bg-v12-gray-900 relative overflow-hidden">
      {/* Tech Grid Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:20px_20px]" />
      </div>
      
      {/* Background Glow */}
      <motion.div 
        style={{ y: y1 }}
        className="absolute top-0 right-0 w-[500px] h-[500px] bg-v12-red/5 rounded-full blur-[120px] -z-10" 
      />
      
      <div className="max-w-7xl mx-auto">
        <div className="mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-v12-red/10 border border-v12-red/20 text-v12-red text-[10px] font-bold uppercase tracking-widest mb-6"
          >
            <span className="w-1 h-1 rounded-full bg-v12-red animate-pulse" />
            Capabilities
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Engineered for <span className="text-v12-gray-400">Multimedia Excellence.</span>
          </h2>
          <p className="text-v12-gray-400 max-w-2xl text-lg">
            We provide a comprehensive suite of services designed to accelerate your brand's digital presence through technical precision and creative innovation.
          </p>
        </div>

        <motion.div 
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {services.map((service) => (
            <motion.div
              key={service.title}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
              className="glass-card p-8 group cursor-pointer"
            >
              <motion.div 
                animate={{ 
                  scale: [1, 1.05, 1],
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-12 h-12 rounded-xl bg-v12-gray-900 border border-white/10 flex items-center justify-center mb-6 group-hover:border-v12-red/50 transition-colors"
              >
                <motion.div
                  whileHover={{ rotate: 12, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {service.icon}
                </motion.div>
              </motion.div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-v12-red transition-colors">{service.title}</h3>
              <p className="text-v12-gray-400 text-sm leading-relaxed mb-6">
                {service.description}
              </p>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-v12-gray-400 group-hover:text-white transition-colors">
                Learn More
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
