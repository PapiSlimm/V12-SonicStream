import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ToastProvider } from './components/ui/Toast'
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { ErrorBoundary } from './components/ErrorBoundary';

let stripePromise: any;
try {
  const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51P4B2vH6oJuJzK7Fp8oK9L7mNs8vR9tX1yZ3xW5vU7tS9rQ7pB6aC5dE4fG3hI2jK1lM0nO9pP8qQ7rR6sS5tT4uU3vV2wW1xX0yP';
  stripePromise = loadStripe(stripePublishableKey);
} catch (e) {
  console.error("Stripe initialization failed (non-blocking):", e);
  stripePromise = Promise.resolve(null);
}

// Register Service Worker for Offline Availability in Production
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
} else if ('serviceWorker' in navigator && import.meta.env.DEV) {
  // Automatically clear any cached/active service workers in development to prevent stale caches
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      registration.unregister().then(() => {
        console.log('Cleaned up stale dev Service Worker registration.');
      });
    }
  });
}

// Safe Initialization logic wrapper to execute rendering only after DOM elements are fully ready.
const mountReactApplication = () => {
  console.log("%c[Main Entry] DOMContentLoaded event parsed. Mounting React application...", "color: #3b82f6; font-weight: bold;");
  
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error("%c[Main Entry] Fatal: Target container #root not found inside the index.html document!", "color: #ef4444; font-weight: bold;");
    return;
  }

  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <ErrorBoundary>
          <ToastProvider>
            <Elements stripe={stripePromise}>
              <App />
            </Elements>
          </ToastProvider>
        </ErrorBoundary>
      </React.StrictMode>
    );
    console.log("%c[Main Entry] React.createRoot of #root successfully initiated and rendered without throw-exceptions.", "color: #c81e3a; font-weight: bold;");
  } catch (error) {
    console.error("%c[Main Entry] Failed during synchronous execution of ReactDOM.createRoot mount:", "color: #f59e0b;", error);
  }
};

// Register globel re-mount trigger for diagnostic recovery
(window as any).__reMountReactApp = () => {
  console.log("%c[Recovery] Executing programmatic React re-mount...", "color: #a78bfa; font-weight: bold;");
  mountReactApplication();
};

// Check ready state - if interactive or complete, we can mount immediately
if (document.readyState === 'loading') {
  console.log("%c[Main Entry] Document readyState is 'loading'. Waiting for DOMContentLoaded event...", "color: #a1a1aa;");
  document.addEventListener('DOMContentLoaded', mountReactApplication);
} else {
  console.log(`%c[Main Entry] Document readyState is already '${document.readyState}'. Bootstrapping immediately.`, "color: #a1a1aa;");
  mountReactApplication();
}

