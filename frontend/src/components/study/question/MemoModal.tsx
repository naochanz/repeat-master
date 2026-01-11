import React, { useMemo } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';

type MemoModalProps = {
    visible: boolean;
    questionNumber: number | null;
    memoText: string;
    onClose: () => void;
    onSave: (text: string) => void;
    onChangeText: (text: string) => void;
    readOnly?: boolean;
};

const MemoModal: React.FC<MemoModalProps> = ({
    visible,
    questionNumber,
    memoText,
    onClose,
    onSave,
    onChangeText,
    readOnly = false,
}) => {
    const theme = useAppTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const handleCancel = () => {
        onChangeText('');
        onClose();
    };

    const handleSave = () => {
        onSave(memoText);
        onClose();
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>問題 {questionNumber} のメモ</Text>
                        <TouchableOpacity 
                            onPress={onClose}
                            style={styles.closeIcon}
                        >
                            <Text style={styles.closeIconText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <TextInput
                        style={[styles.memoInput, readOnly && styles.memoInputReadOnly]}
                        multiline
                        placeholder={readOnly ? '' : 'メモを入力してください...'}
                        value={memoText}
                        onChangeText={onChangeText}
                        textAlignVertical="top"
                        editable={!readOnly}
                    />

                    {!readOnly ? (
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={handleCancel}
                            >
                                <Text style={styles.cancelButtonText}>キャンセル</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleSave}
                            >
                                <Text style={styles.saveButtonText}>保存</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.closeButton]}
                                onPress={onClose}
                            >
                                <Text style={styles.closeButtonText}>閉じる</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '90%',
        height: '70%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    closeIcon: {
        padding: 4,
    },
    closeIconText: {
        fontSize: 24,
        color: '#666',
        fontWeight: 'bold',
    },
    memoInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        flex: 1,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
        marginBottom: 20,
        textAlignVertical: 'top',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: theme.colors.primary[600],
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    closeButton: {
        backgroundColor: theme.colors.secondary[200],
    },
    closeButtonText: {
        color: theme.colors.secondary[700],
        fontSize: 16,
        fontWeight: '600',
    },
    memoInputReadOnly: {
        backgroundColor: '#f0f0f0',
        color: '#333',
    },
});

export default MemoModal;