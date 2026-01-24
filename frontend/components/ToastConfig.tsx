import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BaseToastProps } from 'react-native-toast-message';

const MAX_SHORT_MESSAGE_LENGTH = 30;

const SuccessToast = ({ text1, text2 }: BaseToastProps) => {
  const isLongMessage = (text2?.length || 0) > MAX_SHORT_MESSAGE_LENGTH;

  return (
    <View style={[styles.container, styles.successContainer]}>
      {text1 && <Text style={styles.title}>{text1}</Text>}
      {text2 && (
        <Text style={[styles.message, isLongMessage && styles.messageLong]}>
          {text2}
        </Text>
      )}
    </View>
  );
};

const ErrorToast = ({ text1, text2 }: BaseToastProps) => {
  const isLongMessage = (text2?.length || 0) > MAX_SHORT_MESSAGE_LENGTH;

  return (
    <View style={[styles.container, styles.errorContainer]}>
      {text1 && <Text style={styles.title}>{text1}</Text>}
      {text2 && (
        <Text style={[styles.message, isLongMessage && styles.messageLong]}>
          {text2}
        </Text>
      )}
    </View>
  );
};

const InfoToast = ({ text1, text2 }: BaseToastProps) => {
  const isLongMessage = (text2?.length || 0) > MAX_SHORT_MESSAGE_LENGTH;

  return (
    <View style={[styles.container, styles.infoContainer]}>
      {text1 && <Text style={styles.title}>{text1}</Text>}
      {text2 && (
        <Text style={[styles.message, isLongMessage && styles.messageLong]}>
          {text2}
        </Text>
      )}
    </View>
  );
};

export const toastConfig = {
  success: (props: BaseToastProps) => <SuccessToast {...props} />,
  error: (props: BaseToastProps) => <ErrorToast {...props} />,
  info: (props: BaseToastProps) => <InfoToast {...props} />,
};

const styles = StyleSheet.create({
  container: {
    width: '90%',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  successContainer: {
    backgroundColor: '#16a34a',
  },
  errorContainer: {
    backgroundColor: '#dc2626',
  },
  infoContainer: {
    backgroundColor: '#2563eb',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'ZenKaku-Bold',
    marginBottom: 4,
  },
  message: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
    fontFamily: 'ZenKaku-Medium',
  },
  messageLong: {
    fontSize: 15,
  },
});
