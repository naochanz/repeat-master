import { useAppTheme } from '@/hooks/useAppTheme';
import React, { useMemo } from 'react';
import { Platform, StatusBar, StyleSheet, Text, View } from 'react-native';

const Header = () => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.appTitle} numberOfLines={1}>DORILOOP</Text>
        </View>
      </View>
    </View>
  )
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.neutral.white,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.neutral[50],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.secondary[200],
    color: theme.colors.secondary[900],
    //...theme.shadows.sm,
  },
  titleContainer: {
    alignItems: 'center',
  },
  appTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Bold',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});

export default Header