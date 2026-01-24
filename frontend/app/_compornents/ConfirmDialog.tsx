import { useAppTheme } from '@/hooks/useAppTheme';
import { AlertTriangle } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { ActivityIndicator, Modal, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <SafeAreaView style={styles.overlay}>
        <View style={styles.overlayContent}>
          <View style={styles.dialog}>
            <View style={styles.iconContainer}>
              <AlertTriangle
                size={48}
                style={{ color: theme.colors.error[600] }}
              />
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}
                disabled={isLoading}
              >
                <Text style={[styles.cancelButtonText, isLoading && { opacity: 0.5 }]}>キャンセル</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={onConfirm}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={theme.colors.neutral.white} />
                ) : (
                  <Text style={styles.confirmButtonText}>削除</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
    fontFamily: 'ZenKaku-Bold',
  },
  message: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.secondary[600],
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'ZenKaku-Regular',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.secondary[100],
  },
  cancelButtonText: {
    color: theme.colors.secondary[700],
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as any,
    fontFamily: 'ZenKaku-Medium',
  },
  confirmButton: {
    backgroundColor: theme.colors.error[600],
  },
  confirmButtonText: {
    color: theme.colors.neutral.white,
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as any,
    fontFamily: 'ZenKaku-Medium',
  },
});

export default ConfirmDialog;
