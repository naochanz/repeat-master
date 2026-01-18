import Toast from 'react-native-toast-message';

export const showSuccessToast = (message: string, title?: string) => {
  Toast.show({
    type: 'success',
    text1: title || '成功',
    text2: message,
    visibilityTime: 3000,
  });
};

export const showErrorToast = (message: string, title?: string) => {
  Toast.show({
    type: 'error',
    text1: title || 'エラー',
    text2: message,
    visibilityTime: 4000,
  });
};

export const showInfoToast = (message: string, title?: string) => {
  Toast.show({
    type: 'info',
    text1: title || 'お知らせ',
    text2: message,
    visibilityTime: 3000,
  });
};
