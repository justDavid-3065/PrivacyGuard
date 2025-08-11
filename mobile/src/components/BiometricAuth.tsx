
import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import ReactNativeBiometrics from 'react-native-biometrics';

interface BiometricAuthProps {
  onSuccess: () => void;
  onError: (error: string) => void;
  promptMessage?: string;
}

const BiometricAuth: React.FC<BiometricAuthProps> = ({
  onSuccess,
  onError,
  promptMessage = 'Authenticate to access Privacy Guard'
}) => {
  const [biometricType, setBiometricType] = useState<string | null>(null);

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      const { available, biometryType } = await ReactNativeBiometrics.isSensorAvailable();
      
      if (available) {
        setBiometricType(biometryType);
      }
    } catch (error) {
      console.error('Biometric check failed:', error);
    }
  };

  const authenticateWithBiometrics = async () => {
    try {
      if (!biometricType) {
        onError('Biometric authentication not available');
        return;
      }

      const { success, error } = await ReactNativeBiometrics.simplePrompt({
        promptMessage,
        cancelButtonText: 'Cancel'
      });

      if (success) {
        onSuccess();
      } else {
        onError(error || 'Biometric authentication failed');
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      onError('Biometric authentication error');
    }
  };

  const promptForBiometric = () => {
    if (!biometricType) {
      onError('Biometric authentication not available');
      return;
    }

    Alert.alert(
      'Biometric Authentication',
      `Use ${biometricType} to authenticate?`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => onError('Authentication cancelled') },
        { text: 'Authenticate', onPress: authenticateWithBiometrics }
      ]
    );
  };

  return null; // This is a utility component, no UI
};

export const useBiometricAuth = () => {
  const authenticate = (
    onSuccess: () => void,
    onError: (error: string) => void,
    promptMessage?: string
  ) => {
    return new Promise<void>((resolve, reject) => {
      const handleSuccess = () => {
        onSuccess();
        resolve();
      };

      const handleError = (error: string) => {
        onError(error);
        reject(new Error(error));
      };

      // Since this is a functional approach, we'll call the biometric directly
      ReactNativeBiometrics.isSensorAvailable()
        .then(({ available, biometryType }) => {
          if (!available) {
            handleError('Biometric authentication not available');
            return;
          }

          return ReactNativeBiometrics.simplePrompt({
            promptMessage: promptMessage || 'Authenticate to access Privacy Guard',
            cancelButtonText: 'Cancel'
          });
        })
        .then((result) => {
          if (result?.success) {
            handleSuccess();
          } else {
            handleError(result?.error || 'Biometric authentication failed');
          }
        })
        .catch((error) => {
          console.error('Biometric authentication error:', error);
          handleError('Biometric authentication error');
        });
    });
  };

  return { authenticate };
};

export default BiometricAuth;
