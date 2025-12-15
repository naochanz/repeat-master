import { theme } from '@/constants/theme';
import React from 'react';
import { Platform, StatusBar, StyleSheet, Text, View } from 'react-native';

const Header = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.appTitle} numberOfLines={1}>RepeatMaster</Text>
        </View>
      </View>
    </View>
  )
};

const styles = StyleSheet.create({
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