import { useAppTheme } from '@/hooks/useAppTheme';
import { Check, Highlighter, Type, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const HIGHLIGHT_COLORS = [
  { label: '黄', value: '#FFF9C4' },
  { label: '緑', value: '#C8E6C9' },
  { label: '青', value: '#BBDEFB' },
  { label: 'ピンク', value: '#F8BBD0' },
];

const TEXT_COLORS = [
  { label: '赤', value: '#EF5350' },
  { label: '青', value: '#1E88E5' },
  { label: '緑', value: '#43A047' },
  { label: 'オレンジ', value: '#FB8C00' },
];

type ActivePicker = 'highlight' | 'textColor' | null;

export interface PendingFormat {
  bg?: string;
  color?: string;
}

interface MemoToolbarProps {
  pendingFormat: PendingFormat | null;
  onHighlightSelect: (color: string | null) => void;
  onTextColorSelect: (color: string | null) => void;
}

const MemoToolbar = ({ pendingFormat, onHighlightSelect, onTextColorSelect }: MemoToolbarProps) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);

  const togglePicker = (picker: ActivePicker) => {
    setActivePicker((prev) => (prev === picker ? null : picker));
  };

  const handleColorSelect = (color: string | null) => {
    if (activePicker === 'highlight') {
      onHighlightSelect(color);
    } else if (activePicker === 'textColor') {
      onTextColorSelect(color);
    }
    setActivePicker(null);
  };

  const activeColors = activePicker === 'highlight' ? HIGHLIGHT_COLORS : TEXT_COLORS;
  const pendingValue = activePicker === 'highlight' ? pendingFormat?.bg : pendingFormat?.color;
  const hasPendingHighlight = !!pendingFormat?.bg;
  const hasPendingTextColor = !!pendingFormat?.color;

  return (
    <View style={styles.container}>
      {activePicker && (
        <View style={styles.pickerRow}>
          {activeColors.map((c) => (
            <TouchableOpacity
              key={c.value}
              style={[styles.colorSwatch, { backgroundColor: c.value }, pendingValue === c.value && styles.colorSwatchSelected]}
              onPress={() => handleColorSelect(c.value)}
              activeOpacity={0.7}
            >
              {pendingValue === c.value && <Check size={16} color={theme.colors.secondary[700]} />}
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.clearBtn} onPress={() => handleColorSelect(null)} activeOpacity={0.7}>
            <X size={14} color={theme.colors.secondary[500]} />
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.toolBtn, (activePicker === 'highlight' || hasPendingHighlight) && styles.toolBtnActive]}
          onPress={() => togglePicker('highlight')}
          activeOpacity={0.7}
        >
          {hasPendingHighlight && <View style={[styles.pendingDot, { backgroundColor: pendingFormat!.bg }]} />}
          <Highlighter
            size={18}
            color={activePicker === 'highlight' || hasPendingHighlight ? theme.colors.primary[600] : theme.colors.secondary[700]}
          />
          <Text style={[styles.toolLabel, (activePicker === 'highlight' || hasPendingHighlight) && styles.toolLabelActive]}>
            ハイライト
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toolBtn, (activePicker === 'textColor' || hasPendingTextColor) && styles.toolBtnActive]}
          onPress={() => togglePicker('textColor')}
          activeOpacity={0.7}
        >
          {hasPendingTextColor && <View style={[styles.pendingDot, { backgroundColor: pendingFormat!.color }]} />}
          <Type
            size={18}
            color={activePicker === 'textColor' || hasPendingTextColor ? theme.colors.primary[600] : theme.colors.secondary[700]}
          />
          <Text style={[styles.toolLabel, (activePicker === 'textColor' || hasPendingTextColor) && styles.toolLabelActive]}>
            文字色
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: { paddingHorizontal: 20, gap: 8 },
    buttonRow: { flexDirection: 'row', gap: 12 },
    toolBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 10,
      backgroundColor: theme.colors.secondary[50],
      borderWidth: 1,
      borderColor: theme.colors.secondary[200],
    },
    toolBtnActive: {
      backgroundColor: theme.colors.primary[50],
      borderColor: theme.colors.primary[300],
    },
    toolLabel: { fontSize: 13, color: theme.colors.secondary[700], fontFamily: 'ZenKaku-Regular' },
    toolLabelActive: { color: theme.colors.primary[600], fontWeight: '600' },
    pendingDot: { width: 10, height: 10, borderRadius: 5 },
    pickerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    colorSwatch: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: theme.colors.secondary[300],
      justifyContent: 'center',
      alignItems: 'center',
    },
    colorSwatchSelected: {
      borderWidth: 2.5,
      borderColor: theme.colors.primary[600],
    },
    clearBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: theme.colors.secondary[300],
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

export default MemoToolbar;
