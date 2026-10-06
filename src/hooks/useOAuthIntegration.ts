import { useState, useCallback } from 'react';

export const useOAuthIntegration = (service: string) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const connectService = useCallback(async () => {
    setIsConnecting(true);
    const authUrl = `/api/integrations/${service.toLowerCase()}/oauth`;
    
    // In our environment, we need to handle popups carefully
    const width = 600;
    const height = 800;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const newWindow = window.open(
      authUrl, 
      'oauth', 
      `width=${width},height=${height},left=${left},top=${top}`
    );
    
    return new Promise<boolean>((resolve) => {
      const checkAuth = () => {
        if (newWindow?.closed) {
          clearInterval(interval);
          setIsConnecting(false);
          const token = localStorage.getItem(`integration_${service.toLowerCase()}_token`);
          resolve(!!token);
        }
      };
      const interval = setInterval(checkAuth, 1000);
      
      // Also listen for postMessage from the callback page
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.service === service.toLowerCase()) {
          clearInterval(interval);
          newWindow?.close();
          setIsConnecting(false);
          resolve(true);
          window.removeEventListener('message', handleMessage);
        }
      };
      window.addEventListener('message', handleMessage);
    });
  }, [service]);

  const getStoredToken = useCallback(() => {
    return localStorage.getItem(`integration_${service.toLowerCase()}_token`);
  }, [service]);

  return { connectService, isConnecting, getStoredToken };
};
