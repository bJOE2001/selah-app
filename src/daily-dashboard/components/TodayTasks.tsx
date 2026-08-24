import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ApplicationTask } from '../../devotional-core/types';
import { JournalCheckbox } from '../../design-system/primitives/JournalCheckbox';
import { useTheme } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';

export interface TodayTasksProps {
  tasks: ApplicationTask[];
  onToggleTask: (taskId: string) => void;
  onNavigateJournal: () => void;
}

export function TodayTasks({
  tasks,
  onToggleTask,
  onNavigateJournal,
}: TodayTasksProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.paperLine }]}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1F2937' : '#F0F5FA' }]}>
              <Ionicons name="checkbox-outline" size={13} color="#3B6E8C" />
            </View>
            <Text style={[styles.title, { color: colors.inkPrimary }]}>Today’s Action Steps</Text>
          </View>
          <Text style={[styles.taskCountBadge, { color: colors.inkMuted }]}>{tasks.length} pending</Text>
        </View>

        {tasks.length > 0 ? (
          <View style={styles.tasksList}>
            {tasks.map((task) => (
              <JournalCheckbox
                key={task.id}
                text={task.text}
                isChecked={task.isCompleted}
                onToggle={() => onToggleTask(task.id)}
                isEditable={false}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? '#1C291C' : '#F2F7F2' }]}>
              <Ionicons name="checkmark" size={16} color={colors.brandGreen} />
            </View>
            <Text style={[styles.emptyText, { color: colors.inkSecondary }]}>All caught up for today!</Text>
            <Pressable onPress={onNavigateJournal} hitSlop={4}>
              <Text style={[styles.emptyLink, { color: colors.brandGreen }]}>View Past Journal Entries →</Text>
            </Pressable>
          </View>
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F0F5FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 14,
    fontWeight: '700',
  },
  taskCountBadge: {
    fontFamily: FONTS.body,
    fontSize: 11,
  },
  tasksList: {
    paddingTop: SPACING.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: 4,
  },
  emptyIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 12,
  },
  emptyLink: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
});
