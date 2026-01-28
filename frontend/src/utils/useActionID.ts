import { useRef, useCallback, useEffect } from 'react';
import { ActionIDConfig, BiometricSessionOptions, IronvestInstance } from '../types/index.js';

const ACTIONID_CONFIG: ActionIDConfig = {
  cid: 'ivengprod',
  baseURL: 'https://aa-api.a2.ironvest.com',
  debug: import.meta.env.DEV,
};

export function useActionID() {
  const instanceRef = useRef<IronvestInstance | null>(null);
  const csidRef = useRef<string>('');
  const uidRef = useRef<string>('');

  // Cleanup on unmount - CRITICAL!
  useEffect(() => {
    return () => {
      if (instanceRef.current) {
        try {
          // Stop biometric session first
          if (typeof instanceRef.current.stopBiometric === 'function') {
            instanceRef.current.stopBiometric();
          }
          // Destroy instance if method exists
          if (typeof instanceRef.current.destroy === 'function') {
            instanceRef.current.destroy();
          }
        } catch (error) {
          console.error('Error cleaning up ActionID SDK:', error);
        }
        instanceRef.current = null;
      }
    };
  }, []);

  const initialize = useCallback((uid: string): void => {
    // Prevent multiple initializations
    if (instanceRef.current) {
      console.warn('ActionID SDK already initialized. Skipping re-initialization.');
      return;
    }

    if (!window.Ironvest) {
      throw new Error(
        'ActionID SDK not loaded. Make sure ironvest-authentic-action-sdk.js is included in index.html'
      );
    }

    // Destroy any existing instance first
    try {
      if (instanceRef.current) {
        instanceRef.current.stopBiometric();
        instanceRef.current.destroy();
      }
    } catch (error) {
      console.error('Error destroying existing instance:', error);
    }

    csidRef.current = crypto.randomUUID();
    uidRef.current = uid;

    try {
      instanceRef.current = new window.Ironvest({
        cid: ACTIONID_CONFIG.cid,
        csid: csidRef.current,
        uid: uid,
        baseURL: ACTIONID_CONFIG.baseURL,
        debug: ACTIONID_CONFIG.debug,
      });

      // REQUIRED: Must call these before startBiometricSession
      instanceRef.current.setCsid(csidRef.current);
      instanceRef.current.setUid(uid);
    } catch (error) {
      console.error('Error initializing ActionID SDK:', error);
      instanceRef.current = null;
      throw error;
    }
  }, []);

  const startBiometric = useCallback(
    (containerId: string, options: BiometricSessionOptions = {}): void => {
      if (!instanceRef.current) {
        throw new Error('ActionID SDK not initialized. Call initialize() first.');
      }

      instanceRef.current.startBiometricSession(containerId, {
        size: 'fill', // IMPORTANT for proper capture
        opacity: options.opacity ?? 1,
        useVirtualAvatar: options.useVirtualAvatar ?? false,
        frequency: options.frequency ?? 2000,
        actionID: options.actionID || 'default',
      });
    },
    []
  );

  const stop = useCallback((): void => {
    if (instanceRef.current) {
      try {
        // Stop biometric session first
        if (typeof instanceRef.current.stopBiometric === 'function') {
          instanceRef.current.stopBiometric();
        }
        // Destroy instance if method exists
        if (typeof instanceRef.current.destroy === 'function') {
          instanceRef.current.destroy();
        }
        instanceRef.current = null;
      } catch (error) {
        console.error('Error stopping ActionID SDK:', error);
        // Clear reference even if cleanup fails
        instanceRef.current = null;
      }
    }
  }, []);

  return {
    initialize,
    startBiometric,
    stop,
    getCsid: (): string => csidRef.current,
    getUid: (): string => uidRef.current,
  };
}
