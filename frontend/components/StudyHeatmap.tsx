import { useAppTheme } from '@/hooks/useAppTheme';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export interface ActivityData {
  date: string; // 'YYYY-MM-DD'
  count: number;
}

interface StudyHeatmapProps {
  data: ActivityData[];
  weeks?: number;
}

const CELL_SIZE = 14;
const CELL_GAP = 3;
const DAY_LABELS = ['', '月', '', '水', '', '金', ''];

export default function StudyHeatmap({ data, weeks = 15 }: StudyHeatmapProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { grid, monthLabels, totalCount } = useMemo(() => {
    const activityMap = new Map<string, number>();
    data.forEach(d => activityMap.set(d.date, d.count));

    // 今日を基準に過去n週分の日付を計算
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ...
    // 今週の土曜日を最終日にする
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + (6 - dayOfWeek));

    const totalDays = weeks * 7;
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - totalDays + 1);

    // グリッドを週ごとに構築
    const weekColumns: { date: string; count: number; dayOfWeek: number }[][] = [];
    const months: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    let total = 0;
    let currentWeek: { date: string; count: number; dayOfWeek: number }[] = [];

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);

      const dateStr = d.toISOString().split('T')[0];
      const count = activityMap.get(dateStr) || 0;
      total += count;

      const dow = d.getDay();

      if (dow === 0 && currentWeek.length > 0) {
        weekColumns.push(currentWeek);
        currentWeek = [];
      }

      currentWeek.push({ date: dateStr, count, dayOfWeek: dow });

      // 月ラベル
      const month = d.getMonth();
      if (month !== lastMonth) {
        months.push({ label: `${month + 1}月`, weekIndex: weekColumns.length });
        lastMonth = month;
      }
    }
    if (currentWeek.length > 0) {
      weekColumns.push(currentWeek);
    }

    return { grid: weekColumns, monthLabels: months, totalCount: total };
  }, [data, weeks]);

  const getColor = (count: number): string => {
    if (count === 0) return theme.colors.secondary[100];
    if (count <= 5) return theme.colors.primary[200];
    if (count <= 15) return theme.colors.primary[400];
    if (count <= 30) return theme.colors.primary[600];
    return theme.colors.primary[800];
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>学習アクティビティ</Text>
        <Text style={styles.totalCount}>{totalCount}問</Text>
      </View>

      <View style={styles.heatmapContainer}>
        {/* 曜日ラベル */}
        <View style={styles.dayLabels}>
          {DAY_LABELS.map((label, i) => (
            <Text key={i} style={styles.dayLabel}>{label}</Text>
          ))}
        </View>

        {/* グリッド */}
        <View style={styles.gridContainer}>
          {/* 月ラベル */}
          <View style={styles.monthLabelsRow}>
            {monthLabels.map((m, i) => (
              <Text
                key={i}
                style={[
                  styles.monthLabel,
                  { left: m.weekIndex * (CELL_SIZE + CELL_GAP) },
                ]}
              >
                {m.label}
              </Text>
            ))}
          </View>

          {/* セル */}
          <View style={styles.grid}>
            {grid.map((week, wi) => (
              <View key={wi} style={styles.weekColumn}>
                {week.map((day, di) => (
                  <View
                    key={`${wi}-${di}`}
                    style={[
                      styles.cell,
                      { backgroundColor: getColor(day.count) },
                    ]}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* 凡例 */}
      <View style={styles.legend}>
        <Text style={styles.legendText}>少ない</Text>
        {[0, 3, 10, 20, 35].map((count, i) => (
          <View
            key={i}
            style={[styles.legendCell, { backgroundColor: getColor(count) }]}
          />
        ))}
        <Text style={styles.legendText}>多い</Text>
      </View>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.primary[200],
    ...theme.shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold as any,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.secondary[900],
  },
  totalCount: {
    fontSize: theme.typography.fontSizes.sm,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.primary[600],
  },
  heatmapContainer: {
    flexDirection: 'row',
  },
  dayLabels: {
    marginRight: CELL_GAP,
    paddingTop: 18, // offset for month labels
  },
  dayLabel: {
    height: CELL_SIZE + CELL_GAP,
    fontSize: 9,
    fontFamily: 'ZenKaku-Regular',
    color: theme.colors.secondary[500],
    lineHeight: CELL_SIZE + CELL_GAP,
    textAlign: 'right',
    width: 14,
  },
  gridContainer: {
    flex: 1,
  },
  monthLabelsRow: {
    height: 16,
    position: 'relative',
    marginBottom: 2,
  },
  monthLabel: {
    position: 'absolute',
    fontSize: 9,
    fontFamily: 'ZenKaku-Regular',
    color: theme.colors.secondary[500],
  },
  grid: {
    flexDirection: 'row',
    gap: CELL_GAP,
  },
  weekColumn: {
    gap: CELL_GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 3,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    marginTop: theme.spacing.sm,
  },
  legendText: {
    fontSize: 9,
    fontFamily: 'ZenKaku-Regular',
    color: theme.colors.secondary[500],
    marginHorizontal: 2,
  },
  legendCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});
