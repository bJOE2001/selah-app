import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../design-system';
import { SHADOWS } from '../../design-system/tokens/spacing';

export interface NotebookPageFrameProps {
  children: React.ReactNode;
  style?: ViewStyle;
  showSpine?: boolean;
  showRibbon?: boolean;
  ribbonColor?: string;
  canvasBgColor?: string;
  canvasBorderColor?: string;
  spineBgColor?: string;
  spineStripeColor?: string;
  stitchColor?: string;
  stackedLayer1Bg?: string;
  stackedLayer2Bg?: string;
}

export function NotebookPageFrame({
  children,
  style,
  showSpine = true,
  showRibbon = false,
  ribbonColor,
  canvasBgColor,
  canvasBorderColor,
  spineBgColor,
  spineStripeColor,
  stackedLayer1Bg,
  stackedLayer2Bg,
}: NotebookPageFrameProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.outerContainer, style]}>
      {/* Underlying Stacked Page Layer 2 (Bottom Page Depth) */}
      <View
        style={[
          styles.stackedPageLayer2,
          {
            backgroundColor: stackedLayer2Bg || (isDark ? '#191614' : '#E8DFD1'),
            borderColor: canvasBorderColor || colors.paperLine,
          },
        ]}
      />

      {/* Underlying Stacked Page Layer 1 (Middle Page Depth) */}
      <View
        style={[
          styles.stackedPageLayer1,
          {
            backgroundColor: stackedLayer1Bg || (isDark ? '#1D1A17' : '#F1E9DC'),
            borderColor: canvasBorderColor || colors.paperLine,
          },
        ]}
      />

      {/* Active Top Page Canvas */}
      <View
        style={[
          styles.activePageCanvas,
          {
            backgroundColor: canvasBgColor || colors.cardBg,
            borderColor: canvasBorderColor || colors.paperLine,
          },
          SHADOWS.card,
        ]}
      >
        {/* Subtle Minimal Spine Gutter Accent */}
        {showSpine ? (
          <View
            style={[
              styles.spineGutter,
              {
                backgroundColor: spineBgColor || (isDark ? '#171412' : '#F3ECE1'),
                borderRightColor: canvasBorderColor || colors.paperLine,
              },
            ]}
          >
            <View
              style={[
                styles.spineAccentStripe,
                { backgroundColor: spineStripeColor || colors.bindingAccent },
              ]}
            />
          </View>
        ) : null}

        {/* Hanging Silk Ribbon Bookmark from Spine */}
        {showRibbon ? (
          <View
            style={[
              styles.ribbonBookmark,
              {
                backgroundColor: ribbonColor || colors.tapeRhema,
              },
            ]}
          >
            <View style={styles.ribbonTailCut} />
          </View>
        ) : null}

        {/* Page Content Container */}
        <View style={styles.pageInnerContent}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    paddingHorizontal: 4,
    paddingTop: 2,
    paddingBottom: 4,
  },
  stackedPageLayer2: {
    position: 'absolute',
    left: 10,
    right: 3,
    top: 6,
    bottom: 2,
    borderRadius: 16,
    borderWidth: 1,
    opacity: 0.5,
  },
  stackedPageLayer1: {
    position: 'absolute',
    left: 7,
    right: 5,
    top: 4,
    bottom: 3,
    borderRadius: 17,
    borderWidth: 1,
    opacity: 0.75,
  },
  activePageCanvas: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
  },
  spineGutter: {
    width: 10,
    height: '100%',
    borderRightWidth: StyleSheet.hairlineWidth,
    zIndex: 10,
  },
  spineAccentStripe: {
    width: 3,
    height: '100%',
    opacity: 0.85,
  },
  ribbonBookmark: {
    position: 'absolute',
    top: -2,
    left: 20,
    width: 12,
    height: 32,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    zIndex: 25,
    ...SHADOWS.subtle,
  },
  ribbonTailCut: {
    position: 'absolute',
    bottom: -5,
    left: 0,
    right: 0,
    height: 5,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'inherit',
  },
  pageInnerContent: {
    flex: 1,
    height: '100%',
  },
});
