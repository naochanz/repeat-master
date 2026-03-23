import { useAppTheme } from '@/hooks/useAppTheme';
import BottomSheet from '@/components/BottomSheet';
import { Trash2, CheckCircle, RotateCcw } from 'lucide-react-native';
import React, { useState, useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface EditDeleteModalProps {
  visible: boolean;
  onClose: () => void;
  onSave?: (value: string) => void;
  onDelete: () => void;
  title?: string;
  editLabel?: string;
  editValue?: string;
  editPlaceholder?: string;
  showEditField?: boolean;
  isLoading?: boolean;
  isCompleted?: boolean;
  onComplete?: () => void;
  onReactivate?: () => void;
  children?: React.ReactNode;
}

const EditDeleteModal = ({
  visible, onClose, onSave, onDelete, title, editLabel = '名前', editValue = '', editPlaceholder = '入力してください',
  showEditField = true, isLoading = false, isCompleted = false, onComplete, onReactivate, children,
}: EditDeleteModalProps) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [inputValue, setInputValue] = useState(editValue);

  useEffect(() => { setInputValue(editValue); }, [editValue, visible]);

  const handleSave = () => { if (onSave) onSave(inputValue); onClose(); };
  const handleDelete = () => { onDelete(); onClose(); };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.content}>
        {title && <Text style={styles.title}>{title}</Text>}
        {showEditField && (
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>{editLabel}</Text>
            <TextInput style={styles.input} value={inputValue} onChangeText={setInputValue} placeholder={editPlaceholder} placeholderTextColor={theme.colors.secondary[400]} />
          </View>
        )}
        {children}
        <View style={styles.buttons}>
          {showEditField && onSave && (
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isLoading} activeOpacity={0.7}>
              {isLoading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.saveBtnText}>保存</Text>}
            </TouchableOpacity>
          )}
          {isCompleted && onReactivate && (
            <TouchableOpacity style={styles.completeBtn} onPress={() => { onReactivate(); onClose(); }} disabled={isLoading} activeOpacity={0.7}>
              <RotateCcw size={18} color="#FFFFFF" /><Text style={styles.completeBtnText}>再開する</Text>
            </TouchableOpacity>
          )}
          {!isCompleted && onComplete && (
            <TouchableOpacity style={styles.completeBtn} onPress={() => { onComplete(); onClose(); }} disabled={isLoading} activeOpacity={0.7}>
              <CheckCircle size={18} color="#FFFFFF" /><Text style={styles.completeBtnText}>完了にする</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={isLoading} activeOpacity={0.7}>
            <Trash2 size={18} color="#FFFFFF" /><Text style={styles.deleteBtnText}>削除</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isLoading} activeOpacity={0.7}>
            <Text style={styles.cancelBtnText}>キャンセル</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  content: { gap: 16 },
  title: { fontSize: 18, fontWeight: '700', color: theme.colors.secondary[900], fontFamily: 'ZenKaku-Bold' },
  inputSection: { gap: 8 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.secondary[700], fontFamily: 'ZenKaku-Bold' },
  input: { height: 52, borderRadius: 14, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.secondary[200], paddingHorizontal: 16, fontSize: 15, fontFamily: 'ZenKaku-Regular', color: theme.colors.secondary[900] },
  buttons: { gap: 10 },
  saveBtn: { height: 50, borderRadius: 14, backgroundColor: theme.colors.primary[600], justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', fontFamily: 'ZenKaku-Bold' },
  completeBtn: { height: 50, borderRadius: 14, backgroundColor: theme.colors.success[500], flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center' },
  completeBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', fontFamily: 'ZenKaku-Bold' },
  deleteBtn: { height: 50, borderRadius: 14, backgroundColor: theme.colors.error[500], flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center' },
  deleteBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', fontFamily: 'ZenKaku-Bold' },
  cancelBtn: { height: 50, borderRadius: 14, backgroundColor: theme.colors.secondary[100], justifyContent: 'center', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: theme.colors.secondary[500], fontFamily: 'ZenKaku-Bold' },
});

export default EditDeleteModal;
