import React, { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { bannerUnitId } from '@/lib/ads';

type BannerProps = {
  unitId: string;
  size: string;
};

export function AdBanner() {
  const unitId = bannerUnitId();
  const [Banner, setBanner] = useState<React.ComponentType<BannerProps> | null>(
    null,
  );
  const [size, setSize] = useState<string | null>(null);

  useEffect(() => {
    if (!unitId || Platform.OS === 'web') return;
    try {
      const ads = require('react-native-google-mobile-ads') as {
        BannerAd: React.ComponentType<BannerProps>;
        BannerAdSize: { BANNER: string };
        default: () => { initialize: () => Promise<unknown> };
      };
      void ads.default().initialize();
      setBanner(() => ads.BannerAd);
      setSize(ads.BannerAdSize.BANNER);
    } catch {
      setBanner(null);
    }
  }, [unitId]);

  if (!unitId || !Banner || !size) return null;
  return (
    <View style={{ alignItems: 'center', paddingVertical: 8 }}>
      <Banner unitId={unitId} size={size} />
    </View>
  );
}
