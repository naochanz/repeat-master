import { useAppTheme } from '@/hooks/useAppTheme';
import BottomSheet from '@/components/BottomSheet';
import { BookOpen, Layers } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AddItemModalProps {
  visible: boolean;
  onAddCategory: () => void;
  onAddQuizBook: () => void;
  onClose: () => void;
}

const AddItemModal = ({ visible, onAddCategory, onAddQuizBook, onClose }: AddItemModalProps) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.content}>
        <Text style={styles.title}>追加</Text>
        <TouchableOpacity style={styles.option} onPress={onAddQuizBook} activeOpacity={0.7}>
          <BookOpen size={22} color={theme.colors.primary[600]} />
          <Text style={styles.optionText}>問題集を追加</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={onAddCategory} activeOpacity={0.7}>
          <Layers size={22} color={theme.colors.primary[600]} />
          <Text style={styles.optionText}>資格グループを追加</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
          <Text style={styles.cancelText}>キャンセル</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  content: { gap: 8 },
  title: { fontSize: 18, fontWeight: '700', color: theme.colors.secondary[900], fontFamily: 'ZenKaku-Bold', marginBottom: 8 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, backgroundColor: theme.colors.background, borderRadius: 14 },
  optionText: { fontSize: 15, fontWeight: '500', color: theme.colors.secondary[900], fontFamily: 'ZenKaku-Medium' },
  cancelBtn: { height: 50, borderRadius: 14, backgroundColor: theme.colors.secondary[100], justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  cancelText: { fontSize: 15, fontWeight: '600', color: theme.colors.secondary[500], fontFamily: 'ZenKaku-Bold' },
});

export default AddItemModal;
