import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';

export interface QuickEntryProps {
  onStartDevotion: () => void;
  onOpenBible: () => void;
}

export function QuickEntry({ onStartDevotion, onOpenBible }: QuickEntryProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      {/* Bento Grid: 2 Elegant Side-by-Side Action Hubs */}
      <View style={styles.gridRow}>
        {/* 1. Write Devotion Action Card */}
        <Pressable
          style={[styles.primaryActionCard, { backgroundColor: colors.tapeRhema }]}
          onPress={onStartDevotion}
          hitSlop={4}
        >
          <View style={styles.cardHeaderRow}>
            <View style={styles.primaryIconBox}>
              <Ionicons name="sparkles" size={16} color="#FFFFFF" />
            </View>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ opacity: 0.8 }} />
          </View>

          <Text style={styles.primaryTitle}>Begin Devotion</Text>
          <Text style={styles.primarySubtitle}>Guided prayer & reflection</Text>
        </Pressable>

        {/* 2. Open Bible Reader Action Card */}
        <Pressable
          style={[
            styles.secondaryActionCard,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.paperLine,
            },
          ]}
          onPress={onOpenBible}
          hitSlop={4}
        >
          <View style={styles.cardHeaderRow}>
            <View style={[styles.secondaryIconBox, { backgroundColor: colors.brandGreenLight }]}>
              <Ionicons name="book" size={16} color={colors.brandGreen} />
            </View>
            <Ionicons name="arrow-forward" size={16} color={colors.inkMuted} />
          </View>

          <Text style={[styles.secondaryTitle, { color: colors.inkPrimary }]}>Holy Scripture</Text>
          <Text style={[styles.secondarySubtitle, { color: colors.inkSecondary }]}>Read offline across 66 books</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
  },
  gridRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  primaryActionCard: {
    flex: 1,
    borderRadius: 20,
    padding: SPACING.base,
    justifyContent: 'space-between',
    minHeight: 115,
    ...SHADOWS.subtle,
  },
  secondaryActionCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    padding: SPACING.base,
    justifyContent: 'space-between',
    minHeight: 115,
    ...SHADOWS.subtle,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  primaryIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 2,
  },
  primarySubtitle: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 14,
  },
  secondaryTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  secondarySubtitle: {
    fontFamily: FONTS.body,
    fontSize: 10,
    lineHeight: 14,
  },
});
