import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../design-system/tokens/colors';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';

export interface MoodOption {
  id: number;
  value: string;
  emoji: string;
  label: string;
  color: string;
  scripture: string;
  encouragement: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  {
    id: 1,
    value: 'peaceful',
    emoji: '🕊️',
    label: 'Peaceful',
    color: '#4A7C59',
    scripture: '“Peace I leave with you, my peace I give unto you.” — John 14:27',
    encouragement: 'Rest in His presence today and let His peace guard your mind.',
  },
  {
    id: 2,
    value: 'grateful',
    emoji: '🌿',
    label: 'Grateful',
    color: '#8A6D3B',
    scripture: '“In every thing give thanks: for this is the will of God.” — 1 Thess 5:18',
    encouragement: 'Praise unlocks heaven’s joy. What is one blessing on your heart?',
  },
  {
    id: 3,
    value: 'seeking',
    emoji: '🧭',
    label: 'Seeking',
    color: '#3B6E8C',
    scripture: '“Ask, and it shall be given you; seek, and ye shall find.” — Matthew 7:7',
    encouragement: 'God is near to all who call on Him with an open and humble heart.',
  },
  {
    id: 4,
    value: 'joyful',
    emoji: '✨',
    label: 'Joyful',
    color: '#D4AF37',
    scripture: '“The joy of the LORD is your strength.” — Nehemiah 8:10',
    encouragement: 'Celebrate His goodness today! Let your light shine before others.',
  },
  {
    id: 5,
    value: 'anxious',
    emoji: '🌧️',
    label: 'Anxious',
    color: '#706B82',
    scripture: '“Casting all your care upon him; for he careth for you.” — 1 Peter 5:7',
    encouragement: 'You do not have to carry this alone. Lay your worries at Jesus’ feet.',
  },
  {
    id: 6,
    value: 'heavy',
    emoji: '🍂',
    label: 'Heavy',
    color: '#8C5A4B',
    scripture: '“Come unto me, all ye that labour and are heavy laden.” — Matthew 11:28',
    encouragement: 'His yoke is easy and His burden is light. Take time to breathe and be held.',
  },
];

export interface HeartCheckInProps {
  onJournalWithMood: (mood: MoodOption) => void;
}

export function HeartCheckIn({ onJournalWithMood }: HeartCheckInProps) {
  const [selectedMood, setSelectedMood] = useState<MoodOption | null>(null);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="heart" size={13} color="#4A7C59" />
          </View>
          <Text style={styles.title}>How is your heart today?</Text>
        </View>

        <Text style={styles.subtitle}>
          Pause and bring your authentic heart before the Lord.
        </Text>

        {/* 3-Column Modern Mood Cloud */}
        <View style={styles.chipGrid}>
          {MOOD_OPTIONS.map((mood) => {
            const isSelected = selectedMood?.id === mood.id;
            return (
              <Pressable
                key={mood.id}
                style={[
                  styles.chip,
                  isSelected && {
                    backgroundColor: mood.color + '1A',
                    borderColor: mood.color,
                    borderWidth: 1.5,
                  },
                ]}
                onPress={() => setSelectedMood(isSelected ? null : mood)}
                hitSlop={4}
              >
                <Text style={styles.chipEmoji}>{mood.emoji}</Text>
                <Text
                  style={[
                    styles.chipLabel,
                    isSelected && { color: COLORS.inkPrimary, fontWeight: '700' },
                  ]}
                >
                  {mood.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Dynamic Encouragement & Prayer Drawer */}
        {selectedMood ? (
          <View style={[styles.responseBox, { borderLeftColor: selectedMood.color }]}>
            <Text style={styles.scriptureText}>{selectedMood.scripture}</Text>
            <Text style={styles.encouragementText}>{selectedMood.encouragement}</Text>

            <Pressable
              style={[styles.journalBtn, { backgroundColor: selectedMood.color }]}
              onPress={() => onJournalWithMood(selectedMood)}
              hitSlop={6}
            >
              <Ionicons name="pencil" size={13} color="#FFFFFF" />
              <Text style={styles.journalBtnText}>
                Journal with this prayer focus
              </Text>
            </Pressable>
          </View>
        ) : null}
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderColor: '#EFEAE2',
    borderWidth: 1,
    padding: SPACING.base,
    ...SHADOWS.subtle,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EAF4EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 14,
    color: COLORS.inkPrimary,
    fontWeight: '700',
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.inkMuted,
    marginBottom: SPACING.sm + 2,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FAF7F2',
    borderColor: '#EBE3D7',
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: RADIUS.pill,
  },
  chipEmoji: {
    fontSize: 13,
  },
  chipLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.inkSecondary,
  },
  responseBox: {
    marginTop: SPACING.md,
    backgroundColor: '#FAF7F2',
    padding: SPACING.sm + 4,
    borderRadius: 14,
    borderLeftWidth: 3.5,
  },
  scriptureText: {
    fontFamily: FONTS.scriptureItalic,
    fontSize: 12,
    color: COLORS.inkPrimary,
    lineHeight: 17,
    marginBottom: 4,
  },
  encouragementText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.inkSecondary,
    lineHeight: 16,
    marginBottom: SPACING.sm,
  },
  journalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
    ...SHADOWS.subtle,
  },
  journalBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
