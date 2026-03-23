import { useAppTheme } from '@/hooks/useAppTheme';
import { useQuizBookStore } from '@/stores/quizBookStore';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MemoEditScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { chapterId, sectionId, questionNumber, initialMemo } = useLocalSearchParams<{
    chapterId: string; sectionId?: string; questionNumber: string; initialMemo?: string;
  }>();

  const saveMemo = useQuizBookStore(state => state.saveMemo);
  const [text, setText] = useState(initialMemo || '');
  const [isSaving, setIsSaving] = useState(false);

  const resolvedSectionId = sectionId && sectionId.length > 0 ? sectionId : null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveMemo(chapterId, resolvedSectionId, Number(questionNumber), text);
    } catch (e) {
      console.error('Failed to save memo:', e);
    }
    setIsSaving(false);
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Text style={styles.title}>メモを編集</Text>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <X size={24} color={theme.colors.secondary[500]} />
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="メモを入力..."
          placeholderTextColor={theme.colors.secondary[400]}
          multiline
          autoFocus
          textAlignVertical="top"
        />
        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving} activeOpacity={0.7}>
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveBtnText}>保存</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', color: theme.colors.secondary[900], fontFamily: 'ZenKaku-Bold' },
  input: {
    flex: 1,
    marginHorizontal: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.secondary[200],
    padding: 16,
    fontSize: 15,
    fontFamily: 'ZenKaku-Regular',
    color: theme.colors.secondary[900],
    lineHeight: 24,
  },
  footer: { padding: 20, paddingBottom: 32 },
  saveBtn: { height: 54, borderRadius: 14, backgroundColor: theme.colors.primary[600], justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', fontFamily: 'ZenKaku-Bold' },
});
