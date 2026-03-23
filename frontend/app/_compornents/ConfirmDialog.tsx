import { useAppTheme } from '@/hooks/useAppTheme';
import BottomSheet from '@/components/BottomSheet';
import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ visible, title, message, onConfirm, onCancel, isLoading = false }) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <BottomSheet visible={visible} onClose={onCancel}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm} disabled={isLoading} activeOpacity={0.7}>
          {isLoading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.confirmText}>削除する</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={isLoading} activeOpacity={0.7}>
          <Text style={styles.cancelText}>キャンセル</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  content: { gap: 16 },
  title: { fontSize: 18, fontWeight: '700', color: theme.colors.secondary[900], fontFamily: 'ZenKaku-Bold' },
  message: { fontSize: 14, color: theme.colors.secondary[500], fontFamily: 'ZenKaku-Regular', lineHeight: 22 },
  confirmBtn: { height: 50, borderRadius: 14, backgroundColor: theme.colors.error[500], justifyContent: 'center', alignItems: 'center' },
  confirmText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', fontFamily: 'ZenKaku-Bold' },
  cancelBtn: { height: 50, borderRadius: 14, backgroundColor: theme.colors.secondary[100], justifyContent: 'center', alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600', color: theme.colors.secondary[500], fontFamily: 'ZenKaku-Bold' },
});

export default ConfirmDialog;
