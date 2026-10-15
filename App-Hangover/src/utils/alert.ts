import { Alert, Platform } from 'react-native';

/**
 * Helper multiplataforma para mostrar alertas modal de forma compatible en Android, iOS y Web.
 */
export function showAlert(title: string, message: string, onOk?: () => void) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(`${title}\n\n${message}`);
    } else {
      console.log(`[ALERT] ${title}: ${message}`);
    }
    if (onOk) {
      onOk();
    }
  } else {
    Alert.alert(
      title,
      message,
      [
        {
          text: 'OK',
          onPress: () => {
            if (onOk) onOk();
          },
        },
      ],
      { cancelable: true }
    );
  }
}
