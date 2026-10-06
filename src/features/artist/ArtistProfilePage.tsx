import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PublicArtistProfile } from './PublicArtistProfile';
import { Artist, Track } from '../../types';
import { api } from '../../api';
import { useTrack } from '../../context/TrackContext';

export const ArtistProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { playTrack } = useTrack();

  useEffect(() => {
    const fetchArtistData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const artistData = await api.artist.getProfile(id);
        if (artistData) {
          setArtist(artistData);
          
          // In a real app, we'd have a specific endpoint for artist tracks
          // For now, we fetch all and filter or assume the profile might include them
          const allTracks = await api.tracks.getAll();
          if (allTracks && Array.isArray(allTracks)) {
            setTracks(allTracks.filter(t => t.primaryArtistId === artistData.id));
          }
        }
      } catch (error) {
        console.error('Failed to fetch artist data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArtistData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Artist not found</h2>
          <p className="text-zinc-400">The artist you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <PublicArtistProfile 
      artist={artist} 
      tracks={tracks} 
      onPlay={playTrack} 
      onBook={() => {}} 
    />
  );
};
