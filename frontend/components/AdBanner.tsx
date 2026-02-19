import { useAppTheme } from '@/hooks/useAppTheme';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const AD_UNIT_ID_IOS = process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS || TestIds.ADAPTIVE_BANNER;
const AD_UNIT_ID_ANDROID = process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID || TestIds.ADAPTIVE_BANNER;

import { Platform } from 'react-native';
const adUnitId = Platform.select({
  ios: AD_UNIT_ID_IOS,
  android: AD_UNIT_ID_ANDROID,
}) || TestIds.ADAPTIVE_BANNER;

export default function AdBanner() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isPremium = useSubscriptionStore(state => state.isPremium);

  if (isPremium) return null;

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
      />
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[50],
  },
});
