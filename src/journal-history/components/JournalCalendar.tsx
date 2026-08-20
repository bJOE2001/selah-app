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
    textSectionTitleDisabledColor: colors.inkPlaceholder,
    selectedDayBackgroundColor: colors.brandGreen,
    selectedDayTextColor: '#FFFFFF',
    todayTextColor: colors.brandGreen,
    dayTextColor: colors.inkPrimary,
    textDisabledColor: colors.inkPlaceholder,
    dotColor: colors.tapeRhema,
    selectedDotColor: '#FFFFFF',
    arrowColor: colors.brandGreen,
    disabledArrowColor: colors.inkPlaceholder,
    monthTextColor: colors.inkPrimary,
    indicatorColor: colors.brandGreen,
    textDayFontFamily: FONTS.body,
    textMonthFontFamily: FONTS.sectionHeader,
    textDayHeaderFontFamily: FONTS.bodyBold,
    textDayFontSize: 14,
    textMonthFontSize: 16,
    textDayHeaderFontSize: 12,
    'stylesheet.calendar.main': {
      container: {
        paddingLeft: 5,
        paddingRight: 5,
        backgroundColor: colors.cardBg,
      },
      monthView: {
        backgroundColor: colors.cardBg,
      },
      week: {
        marginVertical: 4,
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: colors.cardBg,
      },
    },
    'stylesheet.calendar.header': {
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingLeft: 10,
        paddingRight: 10,
        marginTop: 6,
        alignItems: 'center',
        backgroundColor: colors.cardBg,
      },
      monthText: {
        fontSize: 16,
        fontFamily: FONTS.sectionHeader,
        fontWeight: '700',
        color: colors.inkPrimary,
        margin: 10,
      },
      arrow: {
        padding: 10,
      },
      dayHeader: {
        marginTop: 2,
        marginBottom: 7,
        width: 32,
        textAlign: 'center',
        fontSize: 12,
        fontFamily: FONTS.bodyBold,
        fontWeight: '600',
        color: colors.inkSecondary,
      },
    },
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
        key={isDark ? 'journal-cal-dark' : 'journal-cal-light'}
        markedDates={markedDates}
        onDayPress={(day: any) => onSelectDate(day?.dateString || '')}
        theme={calendarTheme}
        style={[
          styles.calendar,
          {
            backgroundColor: colors.cardBg,
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
