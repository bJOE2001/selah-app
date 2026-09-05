import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';

export interface DevotionalTimePickerModalProps {
  visible: boolean;
  type: 'morning' | 'evening';
  initialTime: string; // e.g. "07:00 AM" or "09:00 PM"
  onClose: () => void;
  onSaveTime: (timeString: string) => void;
}

const MORNING_PRESETS = [
  '05:30 AM',
  '06:00 AM',
  '06:30 AM',
  '07:00 AM',
  '07:30 AM',
  '08:00 AM',
  '08:30 AM',
  '09:00 AM',
];

const EVENING_PRESETS = [
  '07:30 PM',
  '08:00 PM',
  '08:30 PM',
  '09:00 PM',
  '09:30 PM',
  '10:00 PM',
  '10:30 PM',
  '11:00 PM',
];

const MINUTE_STEPS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export function DevotionalTimePickerModal({
  visible,
  type,
  initialTime,
  onClose,
  onSaveTime,
}: DevotionalTimePickerModalProps) {
  const { colors, isDark } = useTheme();

  const parseTime = (timeStr: string) => {
    try {
      const [timePart, mer] = timeStr.trim().split(' ');
      const [hStr, mStr] = timePart.split(':');
      let h = parseInt(hStr, 10) || 7;
      let m = parseInt(mStr, 10) || 0;
      let ampm = (mer?.toUpperCase() === 'PM') ? 'PM' : 'AM';
      return { h, m, ampm };
    } catch {
      return { h: type === 'morning' ? 7 : 9, m: 0, ampm: type === 'morning' ? 'AM' : 'PM' };
    }
  };

  const [hour, setHour] = useState<number>(7);
  const [minute, setMinute] = useState<number>(0);
  const [meridiem, setMeridiem] = useState<'AM' | 'PM'>('AM');

  useEffect(() => {
    if (visible) {
      const parsed = parseTime(initialTime || (type === 'morning' ? '07:00 AM' : '09:00 PM'));
      setHour(parsed.h);
      setMinute(parsed.m);
      setMeridiem(parsed.ampm as 'AM' | 'PM');
    }
  }, [visible, initialTime, type]);

  const formatDisplayTime = (h: number, m: number, ampm: string) => {
    const formattedH = h.toString().padStart(2, '0');
    const formattedM = m.toString().padStart(2, '0');
    return `${formattedH}:${formattedM} ${ampm}`;
  };

  const handleApplyPreset = (preset: string) => {
    const parsed = parseTime(preset);
    setHour(parsed.h);
    setMinute(parsed.m);
    setMeridiem(parsed.ampm as 'AM' | 'PM');
  };

  const incrementHour = () => {
    setHour((prev) => (prev % 12) + 1);
  };

  const decrementHour = () => {
    setHour((prev) => (prev === 1 ? 12 : prev - 1));
  };

  const incrementMinute = () => {
    setMinute((prev) => (prev + 1) % 60);
  };

  const decrementMinute = () => {
    setMinute((prev) => (prev === 0 ? 59 : prev - 1));
  };

  const handleSave = () => {
    const result = formatDisplayTime(hour, minute, meridiem);
    onSaveTime(result);
    onClose();
  };

  const isMorning = type === 'morning';
  const presets = isMorning ? MORNING_PRESETS : EVENING_PRESETS;
  const currentTimeString = formatDisplayTime(hour, minute, meridiem);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />

        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.paperLine,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: isMorning
                      ? isDark ? '#332918' : '#FFF8ED'
                      : isDark ? '#232035' : '#F0EEFA',
                  },
                ]}
              >
                <Ionicons
                  name={isMorning ? 'sunny' : 'moon'}
                  size={18}
                  color={isMorning ? '#F59E0B' : '#818CF8'}
                />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: colors.inkPrimary }]}>
                  {isMorning ? 'Morning Devotion Time' : 'Evening Reflection Time'}
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.inkSecondary }]}>
                  Set your daily custom reminder schedule
                </Text>
              </View>
            </View>

            <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.inkMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Main Interactive Digital Clock Customizer */}
            <View
              style={[
                styles.clockContainer,
                {
                  backgroundColor: isDark ? '#1C1916' : '#FAF7F2',
                  borderColor: colors.paperLine,
                },
              ]}
            >
              {/* Hour Column */}
              <View style={styles.timeColumn}>
                <Pressable
                  onPress={incrementHour}
                  style={[styles.stepperBtn, { backgroundColor: colors.cardBg, borderColor: colors.paperLine }]}
                  hitSlop={6}
                >
                  <Ionicons name="chevron-up" size={18} color={colors.brandGreen} />
                </Pressable>

                <View style={[styles.timeDigitBox, { backgroundColor: colors.cardBg, borderColor: colors.paperLine }]}>
                  <Text style={[styles.timeDigitText, { color: colors.inkPrimary }]}>
                    {hour.toString().padStart(2, '0')}
                  </Text>
                  <Text style={[styles.digitLabel, { color: colors.inkMuted }]}>HOUR</Text>
                </View>

                <Pressable
                  onPress={decrementHour}
                  style={[styles.stepperBtn, { backgroundColor: colors.cardBg, borderColor: colors.paperLine }]}
                  hitSlop={6}
                >
                  <Ionicons name="chevron-down" size={18} color={colors.brandGreen} />
                </Pressable>
              </View>

              {/* Colon Separator */}
              <Text style={[styles.colonText, { color: colors.brandGreen }]}>:</Text>

              {/* Minute Column */}
              <View style={styles.timeColumn}>
                <Pressable
                  onPress={incrementMinute}
                  style={[styles.stepperBtn, { backgroundColor: colors.cardBg, borderColor: colors.paperLine }]}
                  hitSlop={6}
                >
                  <Ionicons name="chevron-up" size={18} color={colors.brandGreen} />
                </Pressable>

                <View style={[styles.timeDigitBox, { backgroundColor: colors.cardBg, borderColor: colors.paperLine }]}>
                  <Text style={[styles.timeDigitText, { color: colors.inkPrimary }]}>
                    {minute.toString().padStart(2, '0')}
                  </Text>
                  <Text style={[styles.digitLabel, { color: colors.inkMuted }]}>MIN</Text>
                </View>

                <Pressable
                  onPress={decrementMinute}
                  style={[styles.stepperBtn, { backgroundColor: colors.cardBg, borderColor: colors.paperLine }]}
                  hitSlop={6}
                >
                  <Ionicons name="chevron-down" size={18} color={colors.brandGreen} />
                </Pressable>
              </View>

              {/* AM / PM Selector */}
              <View style={styles.meridiemCol}>
                <Pressable
                  onPress={() => setMeridiem('AM')}
                  style={[
                    styles.meridiemPill,
                    meridiem === 'AM'
                      ? { backgroundColor: colors.brandGreen, borderColor: colors.brandGreen }
                      : { backgroundColor: colors.cardBg, borderColor: colors.paperLine },
                  ]}
                >
                  <Text
                    style={[
                      styles.meridiemText,
                      { color: meridiem === 'AM' ? '#FFFFFF' : colors.inkSecondary },
                    ]}
                  >
                    AM
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setMeridiem('PM')}
                  style={[
                    styles.meridiemPill,
                    meridiem === 'PM'
                      ? { backgroundColor: colors.brandGreen, borderColor: colors.brandGreen }
                      : { backgroundColor: colors.cardBg, borderColor: colors.paperLine },
                  ]}
                >
                  <Text
                    style={[
                      styles.meridiemText,
                      { color: meridiem === 'PM' ? '#FFFFFF' : colors.inkSecondary },
                    ]}
                  >
                    PM
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Quick Minute Jumps */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.blockLabel, { color: colors.inkMuted }]}>MINUTE JUMP</Text>
              <View style={styles.minuteGrid}>
                {MINUTE_STEPS.map((m) => {
                  const isSelected = minute === m;
                  return (
                    <Pressable
                      key={m}
                      onPress={() => setMinute(m)}
                      style={[
                        styles.minutePill,
                        {
                          backgroundColor: isSelected
                            ? colors.brandGreenLight
                            : colors.cardBg,
                          borderColor: isSelected
                            ? colors.brandGreen
                            : colors.paperLine,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.minutePillText,
                          { color: isSelected ? colors.brandGreen : colors.inkSecondary },
                        ]}
                      >
                        :{m.toString().padStart(2, '0')}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Quick Popular Presets */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.blockLabel, { color: colors.inkMuted }]}>POPULAR PRESETS</Text>
              <View style={styles.presetsGrid}>
                {presets.map((preset) => {
                  const isSelected = currentTimeString === preset;
                  return (
                    <Pressable
                      key={preset}
                      onPress={() => handleApplyPreset(preset)}
                      style={[
                        styles.presetPill,
                        {
                          backgroundColor: isSelected
                            ? colors.brandGreenLight
                            : colors.cardBg,
                          borderColor: isSelected
                            ? colors.brandGreen
                            : colors.paperLine,
                        },
                      ]}
                    >
                      <Ionicons
                        name={isMorning ? 'sunny-outline' : 'moon-outline'}
                        size={12}
                        color={isSelected ? colors.brandGreen : colors.inkMuted}
                      />
                      <Text
                        style={[
                          styles.presetPillText,
                          { color: isSelected ? colors.brandGreen : colors.inkPrimary },
                        ]}
                      >
                        {preset}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Modal Footer Confirmation Buttons */}
          <View style={[styles.modalFooter, { borderTopColor: colors.paperLine }]}>
            <Pressable
              onPress={onClose}
              style={[styles.cancelBtn, { borderColor: colors.paperLine }]}
            >
              <Text style={[styles.cancelBtnText, { color: colors.inkSecondary }]}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={handleSave}
              style={[styles.saveBtn, { backgroundColor: colors.brandGreen }]}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Set Reminder ({currentTimeString})</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  backdropPressable: {
    ...StyleSheet.absoluteFill,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '88%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 15,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 11,
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.sm,
    gap: SPACING.md,
  },

  /* ── Digital Clock Box ── */
  clockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  timeColumn: {
    alignItems: 'center',
    gap: 6,
  },
  stepperBtn: {
    width: 36,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeDigitBox: {
    width: 64,
    height: 60,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.subtle,
  },
  timeDigitText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 1,
  },
  digitLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 8,
    fontWeight: '800',
    marginTop: -2,
    letterSpacing: 0.5,
  },
  colonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  meridiemCol: {
    gap: 6,
    marginLeft: 6,
  },
  meridiemPill: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meridiemText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    fontWeight: '800',
  },

  /* ── Presets & Jump Blocks ── */
  sectionBlock: {
    gap: 6,
  },
  blockLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  minuteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  minutePill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  minutePillText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    fontWeight: '700',
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  presetPillText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    fontWeight: '600',
  },

  /* ── Modal Footer ── */
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
  },
  saveBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
