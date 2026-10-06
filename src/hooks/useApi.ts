import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { toast } from '../components/ui/Toast';
import { Venue } from '../types';

export const useArtists = () => {
  return useQuery({
    queryKey: ['artists'],
    queryFn: () => api.artist.getArtists(),
  });
};

export const useUser = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: () => api.user.getProfile(),
  });
};

export const useTracks = () => {
  return useQuery({
    queryKey: ['tracks'],
    queryFn: () => api.tracks.getAll(),
  });
};

export const useStats = () => {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => api.stats.get(),
  });
};

export const useNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.notifications.getNotifications(),
    refetchInterval: 30000,
  });
};

export const useBookings = () => {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: () => api.bookings.getAll(),
  });
};

export const useArtistBookings = () => {
  return useQuery({
    queryKey: ['artist-bookings'],
    queryFn: () => api.bookings.getArtistBookings(),
  });
};

export const useEvents = () => {
  return useQuery({
    queryKey: ['events'],
    queryFn: () => api.events.getAll(),
  });
};

export const useMyEvents = () => {
  return useQuery({
    queryKey: ['my-events'],
    queryFn: () => api.events.getMyEvents(),
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventData: any) => api.events.create(eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['my-events'] });
      toast.success('Event listed successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to list event');
    }
  });
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => api.events.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['my-events'] });
      toast.success('Event updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update event');
    }
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.events.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['my-events'] });
      toast.success('Event deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete event');
    }
  });
};

export const useEmailLogs = () => {
  return useQuery({
    queryKey: ['emailLogs'],
    queryFn: () => api.emailLogs.getAll(),
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingData: any) => api.bookings.create(bookingData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking confirmed successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create booking');
    }
  });
};

export const useMarkNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.notifications.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
};

export const useVenues = () => {
  return useQuery({
    queryKey: ['venues'],
    queryFn: () => api.venues.getAll(),
  });
};

export const useMyVenues = () => {
  return useQuery({
    queryKey: ['my-venues'],
    queryFn: () => api.venues.getMyVenues(),
  });
};

export const useCreateVenue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Venue>) => api.venues.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      queryClient.invalidateQueries({ queryKey: ['my-venues'] });
      toast.success('Venue created successfully!');
    },
  });
};

export const useUpdateVenue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Venue> }) => api.venues.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      queryClient.invalidateQueries({ queryKey: ['my-venues'] });
      toast.success('Venue updated successfully!');
    },
  });
};
