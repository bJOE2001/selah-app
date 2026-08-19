import { useEffect, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { usePrivacyAuthStore } from './store';

export function useBiometricAuth() {
  const { isUnlocked, isLockEnabled, unlock, lock } = usePrivacyAuthStore();

  const authenticate = useCallback(async (): Promise<boolean> => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        // If device has no biometric hardware/enrollment, unlock by default
        unlock();
        return true;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Rhema',
        fallbackLabel: 'Enter Passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        unlock();
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.warn('Biometric authentication failed:', error);
      return false;
    }
  }, [unlock]);

  return {
    isUnlocked,
    isLockEnabled,
    authenticate,
    lock,
    unlock,
  };
}
