import { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export const MusicVideoPreview = ({ audioFile }: any) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [effect, setEffect] = useState('particles');
  
  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount || !audioFile) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    
    const camera = new THREE.PerspectiveCamera(75, 16/9, 0.1, 1000);
    camera.position.z = 5;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    currentMount.appendChild(renderer.domElement);
    
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    
    const audio = new Audio(URL.createObjectURL(audioFile));
    const source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    audio.loop = true;
    audio.play();

    // Effect systems
    let particles: THREE.Points | null = null;
    
    if (effect === 'particles') {
      const particleCount = 5000;
      const positions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const material = new THREE.PointsMaterial({ size: 0.05, color: 0x00ffff, transparent: true, opacity: 0.8 });
      particles = new THREE.Points(geometry, material);
      scene.add(particles);
    }

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      analyser.getByteFrequencyData(dataArray);
      const bass = dataArray[0] / 255;
      
      if (particles) {
        particles.rotation.y += 0.001;
        particles.scale.setScalar(1 + bass * 0.5);
      }
      
      renderer.render(scene, camera);
    };
    animate();
    
    return () => {
      audio.pause();
      currentMount.removeChild(renderer.domElement);
      audioContext.close();
    };
  }, [audioFile, effect]);

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        {['particles', 'geometry', 'shader'].map(e => (
          <button
            key={e}
            onClick={() => setEffect(e)}
            className={cn(
              "px-6 py-2 rounded-xl font-bold transition-all",
              effect === e ? "bg-zinc-700 text-white" : "bg-white/5 text-white hover:bg-white/10"
            )}
          >
            {e.charAt(0).toUpperCase() + e.slice(1)}
          </button>
        ))}
      </div>
      <div ref={mountRef} className="w-full aspect-video rounded-3xl overflow-hidden border border-white/10 bg-black shadow-2xl" />
    </div>
  );
};

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
