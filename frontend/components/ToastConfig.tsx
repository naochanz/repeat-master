import { BaseToast, ErrorToast, BaseToastProps } from 'react-native-toast-message';

export const toastConfig = {
  success: (props: BaseToastProps) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#16a34a',
        backgroundColor: '#16a34a',
        borderLeftWidth: 0,
        borderRadius: 12,
        width: '90%',
        minHeight: 70,
      }}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        fontFamily: 'ZenKaku-Bold',
      }}
      text2Style={{
        fontSize: 17,
        fontWeight: '500',
        color: '#fff',
        fontFamily: 'ZenKaku-Medium',
      }}
      text2NumberOfLines={3}
    />
  ),
  error: (props: BaseToastProps) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: '#dc2626',
        backgroundColor: '#dc2626',
        borderLeftWidth: 0,
        borderRadius: 12,
        width: '90%',
        minHeight: 70,
      }}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        fontFamily: 'ZenKaku-Bold',
      }}
      text2Style={{
        fontSize: 17,
        fontWeight: '500',
        color: '#fff',
        fontFamily: 'ZenKaku-Medium',
      }}
      text2NumberOfLines={3}
    />
  ),
  info: (props: BaseToastProps) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#2563eb',
        backgroundColor: '#2563eb',
        borderLeftWidth: 0,
        borderRadius: 12,
        width: '90%',
        minHeight: 70,
      }}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        fontFamily: 'ZenKaku-Bold',
      }}
      text2Style={{
        fontSize: 17,
        fontWeight: '500',
        color: '#fff',
        fontFamily: 'ZenKaku-Medium',
      }}
      text2NumberOfLines={3}
    />
  ),
};
