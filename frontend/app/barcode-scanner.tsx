import { theme } from '@/constants/theme';
import { googleBooksApi, BookInfo } from '@/services/googleBooksApi';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, Stack } from 'expo-router';
import { ArrowLeft, Camera, X } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ScrollView,
} from 'react-native';

export default function BarcodeScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [bookInfo, setBookInfo] = useState<BookInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBarcodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned || loading) return;

    // ISBN-13 or ISBN-10 check (EAN-13 barcodes for books start with 978 or 979)
    if (!data.startsWith('978') && !data.startsWith('979') && data.length !== 10) {
      return;
    }

    setScanned(true);
    setScanning(false);
    setLoading(true);
    setError(null);

    try {
      const info = await googleBooksApi.getBookByISBN(data);
      if (info) {
        setBookInfo(info);
      } else {
        setError('本の情報が見つかりませんでした');
      }
    } catch (err) {
      setError('本の情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleRescan = () => {
    setScanned(false);
    setScanning(true);
    setBookInfo(null);
    setError(null);
  };

  const handleConfirm = () => {
    if (bookInfo) {
      // Navigate back with book info
      router.back();
      // Use setTimeout to ensure navigation completes before setting params
      setTimeout(() => {
        router.setParams({ bookTitle: bookInfo.title });
      }, 100);
    }
  };

  const handleSelectBook = () => {
    if (bookInfo) {
      router.navigate({
        pathname: '/(tabs)/library',
        params: {
          scannedBookTitle: bookInfo.title,
          scannedBookIsbn: bookInfo.isbn,
          scannedBookThumbnail: bookInfo.thumbnail || '',
          openCategoryModal: 'true'
        }
      });
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary[600]} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <>
        <Stack.Screen
          options={{
            headerTitle: 'バーコードスキャン',
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
                <ArrowLeft size={24} color={theme.colors.secondary[900]} />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.permissionContainer}>
          <Camera size={64} color={theme.colors.secondary[400]} />
          <Text style={styles.permissionTitle}>カメラへのアクセスが必要です</Text>
          <Text style={styles.permissionText}>
            本のバーコードをスキャンするために{'\n'}カメラへのアクセスを許可してください
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>カメラを許可する</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: 'バーコードスキャン',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
              <ArrowLeft size={24} color={theme.colors.secondary[900]} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.container}>
        {scanning ? (
          <>
            <CameraView
              style={styles.camera}
              barcodeScannerSettings={{
                barcodeTypes: ['ean13', 'ean8'],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            >
              <View style={styles.overlay}>
                <View style={styles.scanArea}>
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                </View>
              </View>
            </CameraView>
            <View style={styles.instructionContainer}>
              <Text style={styles.instructionText}>
                本の裏表紙にあるバーコードを{'\n'}枠内に合わせてください
              </Text>
            </View>
          </>
        ) : (
          <ScrollView style={styles.resultContainer} contentContainerStyle={styles.resultContent}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary[600]} />
                <Text style={styles.loadingText}>本の情報を取得中...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <X size={48} color={theme.colors.error[500]} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.rescanButton} onPress={handleRescan}>
                  <Text style={styles.rescanButtonText}>もう一度スキャン</Text>
                </TouchableOpacity>
              </View>
            ) : bookInfo ? (
              <View style={styles.bookInfoContainer}>
                {bookInfo.thumbnail && (
                  <Image source={{ uri: bookInfo.thumbnail }} style={styles.bookThumbnail} />
                )}
                <Text style={styles.bookTitle}>{bookInfo.title}</Text>
                {bookInfo.authors && (
                  <Text style={styles.bookAuthors}>{bookInfo.authors.join(', ')}</Text>
                )}
                {bookInfo.publisher && (
                  <Text style={styles.bookPublisher}>{bookInfo.publisher}</Text>
                )}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rescanActionButton]}
                    onPress={handleRescan}
                  >
                    <Text style={styles.rescanActionButtonText}>やり直す</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.confirmButton]}
                    onPress={handleSelectBook}
                  >
                    <Text style={styles.confirmButtonText}>この本で登録</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </ScrollView>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[900],
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  permissionTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Bold',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  permissionText: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.secondary[600],
    fontFamily: 'ZenKaku-Regular',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  permissionButton: {
    backgroundColor: theme.colors.primary[600],
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
  },
  permissionButtonText: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.neutral.white,
    fontFamily: 'ZenKaku-Bold',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 280,
    height: 160,
    borderRadius: 8,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: theme.colors.primary[400],
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  instructionContainer: {
    backgroundColor: theme.colors.neutral[50],
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.xl * 2,
  },
  instructionText: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.secondary[800],
    fontFamily: 'ZenKaku-Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  resultContainer: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  resultContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.secondary[600],
    fontFamily: 'ZenKaku-Regular',
    marginTop: theme.spacing.md,
  },
  errorContainer: {
    alignItems: 'center',
  },
  errorText: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.secondary[700],
    fontFamily: 'ZenKaku-Regular',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  rescanButton: {
    backgroundColor: theme.colors.secondary[200],
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
  },
  rescanButtonText: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[700],
    fontFamily: 'ZenKaku-Bold',
  },
  bookInfoContainer: {
    alignItems: 'center',
  },
  bookThumbnail: {
    width: 128,
    height: 180,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  bookTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Bold',
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  bookAuthors: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.secondary[700],
    fontFamily: 'ZenKaku-Regular',
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  bookPublisher: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.secondary[500],
    fontFamily: 'ZenKaku-Regular',
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  actionButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  rescanActionButton: {
    backgroundColor: theme.colors.secondary[200],
  },
  rescanActionButtonText: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[700],
    fontFamily: 'ZenKaku-Bold',
  },
  confirmButton: {
    backgroundColor: theme.colors.primary[600],
  },
  confirmButtonText: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.neutral.white,
    fontFamily: 'ZenKaku-Bold',
  },
});
