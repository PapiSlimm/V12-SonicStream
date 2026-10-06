import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float, Stars } from '@react-three/drei';
import * as THREE from 'three';

interface VisualizerProps {
  analyser?: AnalyserNode | null;
  isActive?: boolean;
}

const AudioReactiveSphere = ({ analyser, isActive }: VisualizerProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);
  
  const dataArray = useMemo(() => new Uint8Array(analyser?.frequencyBinCount || 0), [analyser]);

  useFrame(() => {
    if (!isActive || !analyser || !meshRef.current) return;

    analyser.getByteFrequencyData(dataArray);
    
    // Calculate average frequency
    const avg = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
    const normalizedAvg = avg / 255;

    // React to bass (first few bins)
    const bass = dataArray[0] / 255;
    
    // Update scale
    const targetScale = 1 + normalizedAvg * 1.5;
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

    // Update distortion
    if (materialRef.current) {
      materialRef.current.distort = 0.3 + normalizedAvg * 0.5;
      materialRef.current.speed = 2 + bass * 5;
    }

    // Rotate
    meshRef.current.rotation.x += 0.01;
    meshRef.current.rotation.y += 0.01;
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <Sphere ref={meshRef} args={[1, 64, 64]}>
        <MeshDistortMaterial
          ref={materialRef}
          color="#c81e3a"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
};

const FrequencyBars = ({ analyser, isActive }: VisualizerProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const count = 64;
  const dataArray = useMemo(() => new Uint8Array(analyser?.frequencyBinCount || 0), [analyser]);

  useFrame(() => {
    if (!isActive || !analyser || !groupRef.current) return;

    analyser.getByteFrequencyData(dataArray);

    groupRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      const val = dataArray[i * Math.floor(dataArray.length / count)] || 0;
      const scale = 0.1 + (val / 255) * 5;
      mesh.scale.y = THREE.MathUtils.lerp(mesh.scale.y, scale, 0.2);
      
      // Color shift based on frequency
      const color = new THREE.Color();
      color.setHSL(0.4 + (val / 255) * 0.2, 0.8, 0.5);
      (mesh.material as THREE.MeshStandardMaterial).color = color;
    });
  });

  return (
    <group ref={groupRef} rotation={[0, 0, 0]}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} position={[(i - count / 2) * 0.15, -2, 0]}>
          <boxGeometry args={[0.1, 1, 0.1]} />
          <meshStandardMaterial color="#c81e3a" emissive="#c81e3a" emissiveIntensity={0.5} />
        </mesh>
      ))}
    </group>
  );
};

export const SonicVisualizer = ({ mediaElement, isActive = true }: { mediaElement?: HTMLMediaElement | null, isActive?: boolean }) => {
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  React.useEffect(() => {
    if (!mediaElement || !isActive) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyserRef.current = analyser;

    try {
      const source = audioContext.createMediaElementSource(mediaElement);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
    } catch (err) {
      console.warn('Audio source connection failed:', err);
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [mediaElement, isActive]);

  return (
    <div className="w-full h-full bg-black/20 backdrop-blur-sm rounded-3xl overflow-hidden">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <AudioReactiveSphere analyser={analyserRef.current} isActive={isActive} />
        <FrequencyBars analyser={analyserRef.current} isActive={isActive} />
        
        <fog attach="fog" args={['#000', 5, 15]} />
      </Canvas>
    </div>
  );
};
