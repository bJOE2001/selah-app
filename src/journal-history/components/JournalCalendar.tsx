import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { DevotionalSummary } from '../../devotional-core/types';
import { useTheme } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';

export interface JournalCalendarProps {
  entries: DevotionalSummary[];
  selectedDate: string;
  onSelectDate: (dateString: string) => void;
}

export function JournalCalendar({
  entries,
  selectedDate,
  onSelectDate,
}: JournalCalendarProps) {
  const { colors, isDark } = useTheme();

  const calendarTheme = useMemo(() => ({
    backgroundColor: colors.cardBg,
    calendarBackground: colors.cardBg,
    textSectionTitleColor: colors.inkSecondary,
    selectedDayBackgroundColor: colors.brandGreen,
    selectedDayTextColor: '#FFFFFF',
    todayTextColor: colors.tapeRhema,
    dayTextColor: colors.inkPrimary,
    textDisabledColor: colors.inkPlaceholder,
    dotColor: colors.tapeRhema,
    selectedDotColor: '#FFFFFF',
    arrowColor: colors.brandGreen,
    monthTextColor: colors.inkPrimary,
    indicatorColor: colors.brandGreen,
    textDayFontFamily: FONTS.body,
    textMonthFontFamily: FONTS.sectionHeader,
    textDayHeaderFontFamily: FONTS.bodyBold,
    textDayFontSize: 14,
    textMonthFontSize: 16,
    textDayHeaderFontSize: 12,
  }), [colors]);

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    for (const entry of entries) {
      const dateKey = entry.createdAt ? entry.createdAt.split('T')[0] : '';
      if (dateKey) {
        marks[dateKey] = {
          marked: true,
          dotColor: colors.tapeRhema,
        };
      }
    }

    if (selectedDate) {
      marks[selectedDate] = {
        ...(marks[selectedDate] || {}),
        selected: true,
        selectedColor: colors.brandGreen,
      };
    }

    return marks;
  }, [entries, selectedDate, colors]);

  return (
    <View style={styles.container}>
      <Calendar
        markedDates={markedDates}
        onDayPress={(day: any) => onSelectDate(day?.dateString || '')}
        theme={calendarTheme}
        style={[
          styles.calendar,
          {
            borderColor: colors.paperLine,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.base,
  },
  calendar: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    ...SHADOWS.subtle,
    overflow: 'hidden',
  },
});
