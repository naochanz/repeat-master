import { useAppTheme } from '@/hooks/useAppTheme';
import MemoToolbar, { type PendingFormat } from '@/src/components/memo/MemoToolbar';
import {
  type MemoSpan,
  applyFormat,
  memoToSpans,
  reconcileSpansWithText,
  serializeMemo,
  spansToPlainText,
} from '@/src/utils/memoFormat';
import { useQuizBookStore } from '@/stores/quizBookStore';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  type NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputSelectionChangeEventData,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MemoEditScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { chapterId, sectionId, questionNumber, initialMemo } = useLocalSearchParams<{
    chapterId: string;
    sectionId?: string;
    questionNumber: string;
    initialMemo?: string;
  }>();

  const saveMemoAction = useQuizBookStore((state) => state.saveMemo);
  const [spans, setSpans] = useState<MemoSpan[]>(() => memoToSpans(initialMemo || ''));
  const [rawText, setRawText] = useState(() => spansToPlainText(memoToSpans(initialMemo || '')));
  const [selection, setSelection] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [pendingFormat, setPendingFormat] = useState<PendingFormat | null>(null);
  const selectionRef = useRef(selection);
  selectionRef.current = selection;
  const pendingFormatRef = useRef(pendingFormat);
  pendingFormatRef.current = pendingFormat;

  const resolvedSectionId = sectionId && sectionId.length > 0 ? sectionId : null;
  const hasSelection = selection.start !== selection.end;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleTextChange = useCallback(
    (newText: string) => {
      const oldCursorEnd = selectionRef.current.end;
      const pf = pendingFormatRef.current;
      setSpans((prev) => {
        const oldText = spansToPlainText(prev);
        const diff = newText.length - oldText.length;
        const newCursor = oldCursorEnd + diff;
        let updated = reconcileSpansWithText(oldText, newText, prev, newCursor);
        if (diff > 0 && pf) {
          updated = applyFormat(updated, { start: oldCursorEnd, end: oldCursorEnd + diff }, {
            bg: pf.bg ?? undefined,
            color: pf.color ?? undefined,
          });
        }
        return updated;
      });
      setRawText(newText);
    },
    [],
  );

  const handleSelectionChange = useCallback(
    (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
      setSelection(e.nativeEvent.selection);
    },
    [],
  );

  const handleHighlightSelect = useCallback(
    (color: string | null) => {
      if (hasSelection) {
        setSpans((prev) => applyFormat(prev, selectionRef.current, { bg: color }));
        setPendingFormat(null);
      } else {
        setPendingFormat((prev) => {
          if (color === null) {
            if (!prev || !prev.color) return null;
            return { color: prev.color };
          }
          if (prev?.bg === color) {
            if (!prev.color) return null;
            return { color: prev.color };
          }
          return { ...prev, bg: color };
        });
      }
    },
    [hasSelection],
  );

  const handleTextColorSelect = useCallback(
    (color: string | null) => {
      if (hasSelection) {
        setSpans((prev) => applyFormat(prev, selectionRef.current, { color }));
        setPendingFormat(null);
      } else {
        setPendingFormat((prev) => {
          if (color === null) {
            if (!prev || !prev.bg) return null;
            return { bg: prev.bg };
          }
          if (prev?.color === color) {
            if (!prev.bg) return null;
            return { bg: prev.bg };
          }
          return { ...prev, color };
        });
      }
    },
    [hasSelection],
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const memo = serializeMemo(spans);
      await saveMemoAction(chapterId, resolvedSectionId, Number(questionNumber), memo);
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

        <View style={styles.editorContainer}>
          <ScrollView
            style={styles.editorScroll}
            contentContainerStyle={styles.editorScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.editorInner}>
              <Text style={styles.formattedOverlay} pointerEvents="none">
                {spans.length > 0
                  ? spans.map((span, i) => (
                      <Text
                        key={i}
                        style={{
                          backgroundColor: span.bg,
                          color: span.color || theme.colors.secondary[900],
                        }}
                      >
                        {span.text}
                      </Text>
                    ))
                  : null}
              </Text>
              <TextInput
                style={styles.input}
                value={rawText}
                onChangeText={handleTextChange}
                onSelectionChange={handleSelectionChange}
                placeholder="メモを入力..."
                placeholderTextColor={theme.colors.secondary[400]}
                multiline
                autoFocus
                scrollEnabled={false}
                textAlignVertical="top"
                selectionColor={theme.colors.primary[200] + '80'}
              />
            </View>
          </ScrollView>
        </View>

        <MemoToolbar
          pendingFormat={pendingFormat}
          onHighlightSelect={handleHighlightSelect}
          onTextColorSelect={handleTextColorSelect}
        />

        <View style={[styles.footer, keyboardHeight > 0 && { paddingBottom: keyboardHeight + 10 }]}>
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

const SHARED_TEXT_STYLE = {
  fontSize: 15,
  fontFamily: 'ZenKaku-Regular',
  lineHeight: 24,
  padding: 16,
} as const;

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingBottom: 12,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.secondary[900],
      fontFamily: 'ZenKaku-Bold',
    },
    editorContainer: {
      flex: 1,
      marginHorizontal: 20,
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.secondary[200],
      overflow: 'hidden',
    },
    editorScroll: { flex: 1 },
    editorScrollContent: { flexGrow: 1 },
    editorInner: { position: 'relative', minHeight: '100%' },
    formattedOverlay: {
      ...SHARED_TEXT_STYLE,
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      color: theme.colors.secondary[900],
    },
    input: {
      ...SHARED_TEXT_STYLE,
      minHeight: '100%',
      color: 'transparent',
      textAlignVertical: 'top',
      ...(Platform.OS === 'ios' ? { tintColor: theme.colors.secondary[900] } : { cursorColor: theme.colors.secondary[900] }),
    },
    footer: { padding: 20, paddingBottom: 32 },
    saveBtn: {
      height: 54,
      borderRadius: 14,
      backgroundColor: theme.colors.primary[600],
      justifyContent: 'center',
      alignItems: 'center',
    },
    saveBtnText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
      fontFamily: 'ZenKaku-Bold',
    },
  });
