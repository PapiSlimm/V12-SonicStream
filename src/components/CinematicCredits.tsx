import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const creditSections = [
  {
    title: "The Community",
    content: "SonicStream is built for a diverse yet interconnected community. Our primary target audiences include:"
  },
  {
    title: "Independent Artists & Bands",
    content: "Seeking tools for creation, distribution, and career management."
  },
  {
    title: "Music Producers & Sound Designers",
    content: "Utilizing AI tools for enhanced production and creative workflows."
  },
  {
    title: "Content Creators",
    content: "Leveraging multimedia features for video and audio projects."
  },
  {
    title: "Event Organizers & Venues",
    content: "Managing bookings, promotions, and analytics for their events."
  },
  {
    title: "Small to Mid-Sized Record Labels",
    content: "Looking for efficient distribution, artist management, and analytics solutions."
  },
  {
    title: "Dedicated Music Fans",
    content: "Desiring an immersive listening experience, direct artist engagement, and new music discovery."
  },
  {
    title: "Business Solutions",
    content: "SonicStream also serves as a robust platform for businesses and event organizers. Our comprehensive Booking Portal streamlines event scheduling and management."
  },
  {
    title: "Growth & Integration",
    content: "The Ads Manager system provides tools for effective promotion and audience targeting, while our transparent Payouts system ensures fair and timely compensation. We offer solutions for Site Builder and Integration Hub to help businesses manage their digital presence and workflows efficiently."
  }
];

export function CinematicCredits() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  return (
    <section 
      ref={containerRef}
      className="relative min-h-[200vh] bg-v12-gray-900 overflow-hidden py-24"
    >
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center perspective-1000">
        <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none" />
        
        <div className="relative w-full max-w-4xl px-6 text-center">
          {creditSections.map((section, index) => {
            const start = index / creditSections.length;
            const end = (index + 1) / creditSections.length;
            
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const opacity = useTransform(scrollYProgress, [start, start + 0.05, end - 0.05, end], [0, 1, 1, 0]);
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const y = useTransform(scrollYProgress, [start, end], [100, -100]);
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const rotateX = useTransform(scrollYProgress, [start, end], [20, -20]);
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const scale = useTransform(scrollYProgress, [start, start + 0.05, end - 0.05, end], [0.8, 1, 1, 0.8]);

            return (
              <motion.div
                key={index}
                style={{ 
                  opacity, 
                  y, 
                  rotateX,
                  scale,
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  transform: 'translateY(-50%)'
                }}
                className="flex flex-col items-center gap-6"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-[1px] bg-v12-red" />
                  <Sparkles className="text-v12-red" size={20} />
                  <div className="w-12 h-[1px] bg-v12-red" />
                </div>
                
                <h3 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white">
                  {section.title}
                </h3>
                
                <p className="text-xl md:text-2xl font-medium text-v12-gray-400 max-w-2xl leading-relaxed italic">
                  {section.content}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          style={{ opacity: useTransform(scrollYProgress, [0, 0.1], [1, 0]) }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
        >
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-v12-gray-400">Scroll to Explore Community</span>
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-[1px] h-12 bg-gradient-to-b from-v12-red to-transparent"
          />
        </motion.div>
      </div>
    </section>
  );
}
