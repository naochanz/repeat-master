import { useAppTheme } from '@/hooks/useAppTheme';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

let BannerAd: any = null;
let BannerAdSize: any = null;
let adUnitId: string = '';

try {
  const ads = require('react-native-google-mobile-ads');
  BannerAd = ads.BannerAd;
  BannerAdSize = ads.BannerAdSize;
  const TestIds = ads.TestIds;

  const AD_UNIT_ID_IOS = process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS || TestIds.ADAPTIVE_BANNER;
  const AD_UNIT_ID_ANDROID = process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID || TestIds.ADAPTIVE_BANNER;
  adUnitId = Platform.select({
    ios: AD_UNIT_ID_IOS,
    android: AD_UNIT_ID_ANDROID,
  }) || TestIds.ADAPTIVE_BANNER;
} catch {
  // ネイティブモジュールが利用できない環境（Expo Goなど）
}

export default function AdBanner() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isPremium = useSubscriptionStore(state => state.isPremium);

  if (isPremium || !BannerAd) return null;

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
