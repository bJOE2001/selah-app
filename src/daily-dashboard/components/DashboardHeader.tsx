import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';

export interface DashboardHeaderProps {
  streakDays?: number;
  totalEntries?: number;
}

export function DashboardHeader({}: DashboardHeaderProps) {
  const { colors, isDark } = useTheme();
  const now = new Date();
  const currentHour = now.getHours();

  // Dynamic Time-of-Day config
  let greetingTime = 'Good morning';
  let greetingIcon = 'sunny-outline';
  let greetingColor = '#E6A23C';

  if (currentHour >= 12 && currentHour < 17) {
    greetingTime = 'Good afternoon';
    greetingIcon = 'sunny';
    greetingColor = '#F59E0B';
  } else if (currentHour >= 17) {
    greetingTime = 'Good evening';
    greetingIcon = 'moon-outline';
    greetingColor = '#818CF8';
  }

  return (
    <View style={styles.container}>
      {/* Hero Welcome Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.cardBg,
            borderColor: colors.paperLine,
          },
        ]}
      >
        <View style={styles.contentRow}>
          {/* Left Column: Greeting, Headline, Scripture Whisper */}
          <View style={styles.textColumn}>
            {/* Greeting Pill */}
            <View
              style={[
                styles.greetingPill,
                {
                  backgroundColor: isDark ? '#2A2520' : '#F9F6F0',
                  borderColor: isDark ? '#3D362F' : '#EBE3D7',
                },
              ]}
            >
              <Ionicons name={greetingIcon as any} size={12} color={greetingColor} />
              <Text style={[styles.greetingTimeText, { color: colors.inkPrimary }]}>{greetingTime}</Text>
            </View>

            {/* Main Headline */}
            <Text style={[styles.headline, { color: colors.inkPrimary }]}>Time with God</Text>

            {/* Inspiring Scripture Whisper */}
            <Text style={[styles.scriptureWhisper, { color: colors.inkSecondary }]} numberOfLines={3}>
              “Thy word is a lamp unto my feet, and a light unto my path.”
            </Text>
            <Text style={[styles.scriptureRef, { color: colors.tapeRhema }]}>— Psalm 119:105</Text>
          </View>

          {/* Right Column: Large Mascot with Ambient Halo */}
          <View style={styles.mascotArea}>
            <View style={[styles.mascotHalo, { backgroundColor: isDark ? '#2A2520' : '#F2F7F2' }]} />
            <Image
              source={require('../../../assets/images/mascot_waving_transparent.webp')}
              style={styles.mascotImage}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: SPACING.base + 2,
    position: 'relative',
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textColumn: {
    flex: 1,
    paddingRight: SPACING.xs,
    justifyContent: 'center',
  },
  greetingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 0.8,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  greetingTimeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '700',
  },
  headline: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  scriptureWhisper: {
    fontFamily: FONTS.scriptureItalic,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 3,
  },
  scriptureRef: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '700',
  },
  mascotArea: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginLeft: 4,
  },
  mascotHalo: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    top: 5,
  },
  mascotImage: {
    width: '100%',
    height: '100%',
  },
});
