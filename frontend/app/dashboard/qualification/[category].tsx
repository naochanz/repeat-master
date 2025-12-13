import ConfirmDialog from '@/app/compornents/ConfirmDialog';
import CustomTabBar from '@/components/CustomTabBar';
import { theme } from '@/constants/theme';
import { useQuizBookStore } from '@/stores/quizBookStore';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { AlertTriangle, ArrowLeft, ChevronRight, Edit, MoreVertical, Trash2, TrendingUp } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - (theme.spacing.lg * 4);
const CHART_HEIGHT = 200;

export default function QualificationDetailScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const quizBooks = useQuizBookStore(state => state.quizBooks);
  const deleteQuizBook = useQuizBookStore(state => state.deleteQuizBook);
  const updateQuizBook = useQuizBookStore(state => state.updateQuizBook);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedCategoryName, setEditedCategoryName] = useState(category || '');

  const categoryBooks = useMemo(() => {
    return quizBooks
      .filter(book => book.category === category)
      .sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  }, [quizBooks, category]);

  const stats = useMemo(() => {
    const totalBooks = categoryBooks.length;
    const avgCorrectRate = categoryBooks.length > 0
      ? Math.round(categoryBooks.reduce((sum, book) => sum + (book.correctRate || 0), 0) / categoryBooks.length)
      : 0;
    const totalRounds = categoryBooks.reduce((sum, book) => sum + (book.currentRound || 0), 0);
    const weakBooks = categoryBooks.filter(book => (book.correctRate || 0) < 60);

    return {
      totalBooks,
      avgCorrectRate,
      totalRounds,
      weakBooks,
    };
  }, [categoryBooks]);

  const handleBack = () => {
    router.back();
  };

  const handleWeaknessAnalysis = () => {
    router.push({
      pathname: '/dashboard/qualification/weakness/[category]',
      params: { category },
    });
  };

  const handleMenuPress = () => {
    setShowCategoryMenu(true);
  };

  const handleEditCategory = () => {
    setShowCategoryMenu(false);
    setEditedCategoryName(category || '');
    setShowEditModal(true);
  };

  const handleDeleteCategory = () => {
    setShowCategoryMenu(false);
    setDeleteDialogVisible(true);
  };

  const confirmEditCategory = async () => {
    if (editedCategoryName.trim() === '' || editedCategoryName === category) {
      setShowEditModal(false);
      return;
    }

    for (const book of categoryBooks) {
      await updateQuizBook(book.id, { category: editedCategoryName.trim() });
    }
    setShowEditModal(false);
    router.back();
  };

  const confirmDeleteCategory = async () => {
    for (const book of categoryBooks) {
      await deleteQuizBook(book.id);
    }
    setDeleteDialogVisible(false);
    router.back();
  };

  const renderLineChart = () => {
    if (categoryBooks.length === 0) return null;

    const maxRound = Math.max(...categoryBooks.map(b => b.currentRound || 1), 5);
    const pointSpacing = CHART_WIDTH / Math.max(maxRound, 1);

    return (
      <View style={styles.lineChartContainer}>
        <View style={styles.chartHeader}>
          <TrendingUp size={20} color={theme.colors.primary[600]} />
          <Text style={styles.chartTitle}>問題集ごとの正答率推移</Text>
        </View>

        <View style={styles.lineChart}>
          <View style={styles.yAxis}>
            {[100, 75, 50, 25, 0].map((val) => (
              <Text key={val} style={styles.yAxisLabel}>{val}%</Text>
            ))}
          </View>

          <View style={styles.chartArea}>
            {[0, 25, 50, 75, 100].reverse().map((val) => (
              <View key={val} style={styles.gridLine} />
            ))}

            {categoryBooks.map((book, bookIndex) => {
              const correctRate = book.correctRate || 0;
              const currentRound = book.currentRound || 1;

              const points: { x: number; y: number; round: number }[] = [];

              for (let round = 1; round <= currentRound; round++) {
                const simulatedRate = Math.max(
                  0,
                  Math.min(100, correctRate - (currentRound - round) * 10 + Math.random() * 10)
                );
                points.push({
                  x: (round - 1) * pointSpacing,
                  y: CHART_HEIGHT - (simulatedRate / 100) * CHART_HEIGHT,
                  round,
                });
              }

              const lineColor = getBookColor(bookIndex);

              return (
                <View key={book.id} style={StyleSheet.absoluteFill}>
                  {points.map((point, index) => {
                    if (index === 0) return null;
                    const prevPoint = points[index - 1];

                    const angle = Math.atan2(point.y - prevPoint.y, point.x - prevPoint.x);
                    const length = Math.sqrt(
                      Math.pow(point.x - prevPoint.x, 2) + Math.pow(point.y - prevPoint.y, 2)
                    );

                    return (
                      <View
                        key={index}
                        style={[
                          styles.line,
                          {
                            left: prevPoint.x,
                            top: prevPoint.y,
                            width: length,
                            backgroundColor: lineColor,
                            transform: [{ rotate: `${angle}rad` }],
                          }
                        ]}
                      />
                    );
                  })}

                  {points.map((point, index) => (
                    <View
                      key={index}
                      style={[
                        styles.point,
                        {
                          left: point.x - 4,
                          top: point.y - 4,
                          backgroundColor: lineColor,
                        }
                      ]}
                    />
                  ))}
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.legend}>
          {categoryBooks.map((book, index) => (
            <View key={book.id} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: getBookColor(index) }]} />
              <Text style={styles.legendText} numberOfLines={1}>
                {book.title || `問題集${index + 1}`}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const getBookColor = (index: number) => {
    const colors = [
      theme.colors.primary[600],
      theme.colors.primary[400],
      theme.colors.warning[600],
      theme.colors.success[600],
      theme.colors.error[600],
      theme.colors.secondary[600],
    ];
    return colors[index % colors.length];
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={theme.colors.secondary[900]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{category}</Text>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={handleMenuPress}
            activeOpacity={0.7}
          >
            <MoreVertical size={24} color={theme.colors.secondary[900]} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>問題集数</Text>
                <Text style={styles.summaryValue}>{stats.totalBooks}</Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>総周回数</Text>
                <Text style={styles.summaryValue}>{stats.totalRounds}</Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>弱点</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.error[600] }]}>
                  {stats.weakBooks.length}
                </Text>
              </View>
            </View>
          </View>

          {renderLineChart()}

          {stats.weakBooks.length > 0 && (
            <TouchableOpacity
              style={styles.weaknessButton}
              onPress={handleWeaknessAnalysis}
              activeOpacity={0.7}
            >
              <View style={styles.weaknessButtonContent}>
                <AlertTriangle size={20} color={theme.colors.neutral.white} />
                <Text style={styles.weaknessButtonText}>
                  弱点を確認する ({stats.weakBooks.length}件)
                </Text>
              </View>
              <ChevronRight size={20} color={theme.colors.neutral.white} />
            </TouchableOpacity>
          )}
        </ScrollView>

        <Modal
          visible={showCategoryMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCategoryMenu(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowCategoryMenu(false)}>
            <View style={styles.menuContent}>
              <TouchableOpacity style={styles.menuItem} onPress={handleEditCategory}>
                <Edit size={20} color={theme.colors.primary[600]} />
                <Text style={styles.menuText}>編集</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity style={styles.menuItem} onPress={handleDeleteCategory}>
                <Trash2 size={20} color={theme.colors.error[600]} />
                <Text style={[styles.menuText, { color: theme.colors.error[600] }]}>削除</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>

        <Modal
          visible={showEditModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowEditModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.editModalContent}>
              <Text style={styles.editModalTitle}>資格名を編集</Text>
              <TextInput
                style={styles.editInput}
                value={editedCategoryName}
                onChangeText={setEditedCategoryName}
                placeholder="資格名を入力"
                placeholderTextColor={theme.colors.secondary[400]}
              />
              <View style={styles.editModalActions}>
                <TouchableOpacity
                  style={[styles.editModalButton, styles.cancelButton]}
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={styles.cancelButtonText}>キャンセル</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editModalButton, styles.confirmButton]}
                  onPress={confirmEditCategory}
                >
                  <Text style={styles.confirmButtonText}>保存</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <ConfirmDialog
          visible={deleteDialogVisible}
          title="資格グループを削除"
          message={`「${category}」の資格グループとその中の全ての問題集を削除してもよろしいですか？この操作は取り消せません。`}
          onConfirm={confirmDeleteCategory}
          onCancel={() => setDeleteDialogVisible(false)}
        />

        <CustomTabBar />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.primary[50],
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary[200],
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Bold',
    flex: 1,
    textAlign: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  summaryCard: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary[200],
    ...theme.shadows.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.secondary[600],
    fontFamily: 'ZenKaku-Regular',
    marginBottom: theme.spacing.sm,
  },
  summaryValue: {
    fontSize: theme.typography.fontSizes['2xl'],
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Bold',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.secondary[200],
    marginHorizontal: theme.spacing.sm,
  },
  lineChartContainer: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary[200],
    ...theme.shadows.md,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  chartTitle: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Bold',
  },
  lineChart: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  yAxis: {
    justifyContent: 'space-between',
    height: CHART_HEIGHT,
    marginRight: theme.spacing.sm,
  },
  yAxisLabel: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.secondary[600],
    fontFamily: 'ZenKaku-Regular',
  },
  chartArea: {
    flex: 1,
    height: CHART_HEIGHT,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: theme.colors.secondary[200],
  },
  line: {
    position: 'absolute',
    height: 3,
    transformOrigin: 'left center',
  },
  point: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.neutral.white,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    maxWidth: '48%',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.secondary[700],
    fontFamily: 'ZenKaku-Regular',
    flex: 1,
  },
  weaknessButton: {
    backgroundColor: theme.colors.error[600],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
  },
  weaknessButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  weaknessButtonText: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.neutral.white,
    fontFamily: 'ZenKaku-Bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  menuContent: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.lg,
    minWidth: 200,
    ...theme.shadows.xl,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  menuDivider: {
    height: 1,
    backgroundColor: theme.colors.secondary[200],
    marginHorizontal: theme.spacing.md,
  },
  menuText: {
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Medium',
    color: theme.colors.secondary[900],
  },
  editModalContent: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    minWidth: 300,
    ...theme.shadows.xl,
  },
  editModalTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as any,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.secondary[900],
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  editInput: {
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Regular',
    color: theme.colors.secondary[900],
    borderWidth: 1,
    borderColor: theme.colors.secondary[300],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.neutral.white,
    marginBottom: theme.spacing.lg,
  },
  editModalActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  editModalButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.secondary[100],
  },
  cancelButtonText: {
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.secondary[700],
  },
  confirmButton: {
    backgroundColor: theme.colors.primary[600],
  },
  confirmButtonText: {
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.neutral.white,
  },
});
