import { Alert } from 'react-native';

export const toast = {
  success: (message: string) => {
    Alert.alert('Success', message);
  },
  error: (message: string) => {
    Alert.alert('Error', message);
  },
  info: (message: string) => {
    Alert.alert('Info', message);
  },
  warning: (message: string) => {
    Alert.alert('Warning', message);
  },
};

export default toast;
