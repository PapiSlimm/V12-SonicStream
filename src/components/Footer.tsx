import React from 'react';
import { Instagram, Twitter, Linkedin, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="bg-v12-gray-900 border-t-4 border-v12-red pt-32 pb-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-32">
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <Logo size="md" className="items-start" />
            </div>
            <p className="text-v12-gray-400 text-lg font-bold uppercase leading-tight">
              Accelerating authentic brands through high-impact multimedia production and product expansion.
            </p>
            <div className="flex items-center gap-6">
              {[Instagram, Twitter, Linkedin, Youtube].map((Icon, i) => (
                <motion.a 
                  key={i} 
                  href="#" 
                  whileHover={{ scale: 1.2, rotate: 15, y: -4 }}
                  className="text-white hover:text-v12-red transition-colors"
                >
                  <Icon size={24} />
                </motion.a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-black mb-8 uppercase tracking-widest text-xs text-v12-red">Services</h4>
            <ul className="space-y-4 text-sm font-black uppercase tracking-tighter text-v12-gray-400">
              <li><a href="#photography" className="hover:text-white transition-colors">Photography Services</a></li>
              <li><a href="#design" className="hover:text-white transition-colors">Graphic Design Service</a></li>
              <li><a href="#video" className="hover:text-white transition-colors">Video Editing</a></li>
              <li><a href="#research" className="hover:text-white transition-colors">Marketing Research</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black mb-8 uppercase tracking-widest text-xs text-v12-red">Company</h4>
            <ul className="space-y-4 text-sm font-black uppercase tracking-tighter text-v12-gray-400">
              <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#portfolio" className="hover:text-white transition-colors">Our Portfolio</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing & Rates</a></li>
              <li><a href="#documentation" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black mb-8 uppercase tracking-widest text-xs text-v12-red">Contact</h4>
            <ul className="space-y-6 text-sm font-black uppercase tracking-tighter text-v12-gray-400">
              <li className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/5 flex items-center justify-center">
                  <Mail size={20} className="text-v12-red" />
                </div>
                <span>hello@v12multimedia.com</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/5 flex items-center justify-center">
                  <Phone size={20} className="text-v12-red" />
                </div>
                <span>+1 (555) V12-PROD</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/5 flex items-center justify-center">
                  <MapPin size={20} className="text-v12-red" />
                </div>
                <span>Creative District, NY 10001</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t-4 border-white/10 pt-16 flex flex-col md:flex-row justify-between items-center gap-8 text-xs uppercase tracking-[0.3em] text-v12-gray-500 font-black">
          <div>© 2026 V12 MULTIMEDIA. ALL RIGHTS RESERVED.</div>
          <div className="flex gap-12">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
