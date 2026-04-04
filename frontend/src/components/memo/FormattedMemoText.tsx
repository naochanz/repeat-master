import { parseMemo } from '@/src/utils/memoFormat';
import React from 'react';
import { Text, type TextStyle } from 'react-native';

interface FormattedMemoTextProps {
  memo: string;
  style?: TextStyle;
  placeholderStyle?: TextStyle;
  placeholder?: string;
}

const FormattedMemoText = ({ memo, style, placeholderStyle, placeholder }: FormattedMemoTextProps) => {
  if (!memo) {
    return <Text style={placeholderStyle ?? style}>{placeholder ?? ''}</Text>;
  }

  const parsed = parseMemo(memo);

  if (parsed.type === 'plain') {
    return <Text style={style}>{parsed.text}</Text>;
  }

  return (
    <Text style={style}>
      {parsed.spans.map((span, i) => (
        <Text key={i} style={{ backgroundColor: span.bg, color: span.color }}>
          {span.text}
        </Text>
      ))}
    </Text>
  );
};

export default FormattedMemoText;
