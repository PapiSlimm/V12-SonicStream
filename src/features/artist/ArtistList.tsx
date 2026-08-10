import { Artist } from '../../types';

interface ArtistListProps {
  artists: Artist[];
  onBookArtist: (artist: Artist) => void;
  onViewProfile: (artist: Artist) => void;
}

export const ArtistList = ({ artists, onBookArtist, onViewProfile }: ArtistListProps) => {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold">Our Artists</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {artists.map((artist) => (
          <div key={artist.id} className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden group flex flex-col">
            <button 
              onClick={() => onViewProfile(artist)}
              className="aspect-square overflow-hidden block w-full"
            >
              <img 
                src={artist.imageUrl} 
                alt={artist.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                referrerPolicy="no-referrer" 
              />
            </button>
            <div className="p-6 space-y-4 flex-1 flex flex-col">
              <div className="space-y-1">
                <button 
                  onClick={() => onViewProfile(artist)}
                  className="hover:text-emerald-400 transition-colors text-left"
                >
                  <h3 className="text-xl font-bold">{artist.name}</h3>
                </button>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{artist.genres?.join(' • ') || 'Various'}</p>
              </div>
              <p className="text-zinc-400 text-sm line-clamp-3 leading-relaxed flex-1">{artist.bio}</p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button 
                  onClick={() => onViewProfile(artist)}
                  className="bg-white/5 text-white py-3 rounded-xl font-bold text-center hover:bg-white/10 transition-all text-sm"
                >
                  View Profile
                </button>
                <button 
                  onClick={() => onBookArtist(artist)}
                  className="bg-zinc-700/10 text-emerald-400 py-3 rounded-xl font-bold hover:bg-zinc-700 hover:text-white transition-all text-sm"
                >
                  Book Artist
                </button>
              </div>
            </div>
          </div>
        ))}
        {artists.length === 0 && (
          <div className="col-span-full py-20 text-center text-zinc-500 italic">
            No artists found in the catalog.
          </div>
        )}
      </div>
    </div>
  );
};
