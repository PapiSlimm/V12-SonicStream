export const SoundwaveAnimation = () => {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-20 opacity-60 bg-gradient-to-t from-emerald-500/30 to-transparent pointer-events-none">
      <div className="flex h-full px-4 py-2 items-end gap-0.5 justify-center">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="w-1 bg-gradient-to-t from-emerald-400 to-blue-400 rounded-full animate-wave"
            style={{
              animationDelay: `${i * 0.05}s`,
              animationDuration: `${0.8 + Math.random() * 0.4}s`,
              height: `${10 + Math.sin(i * 0.5) * 30}%`
            }}
          />
        ))}
      </div>
    </div>
  );
};
