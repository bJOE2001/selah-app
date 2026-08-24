import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../design-system';
import { SHADOWS, RADIUS } from '../../design-system/tokens/spacing';

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
  stitchColor,
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
            backgroundColor: stackedLayer2Bg || (isDark ? '#1C1815' : '#E8DFD1'),
            borderColor: canvasBorderColor || colors.paperLine,
          },
        ]}
      />

      {/* Underlying Stacked Page Layer 1 (Middle Page Depth) */}
      <View
        style={[
          styles.stackedPageLayer1,
          {
            backgroundColor: stackedLayer1Bg || (isDark ? '#1F1B17' : '#F2EADB'),
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
        {/* Left Book Spine & Binding Margin */}
        {showSpine ? (
          <View
            style={[
              styles.spineContainer,
              {
                backgroundColor: spineBgColor || (isDark ? '#161311' : '#F5EFE6'),
                borderRightColor: canvasBorderColor || colors.paperLine,
              },
            ]}
          >
            {/* Leftmost leather bound stripe */}
            <View
              style={[
                styles.spineStripe,
                { backgroundColor: spineStripeColor || colors.bindingAccent },
              ]}
            />

            {/* Stitching dots along the spine */}
            <View style={styles.stitchesCol}>
              {Array.from({ length: 8 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.stitchHole,
                    {
                      backgroundColor: stitchColor || (isDark ? '#3D342B' : '#C4B7A6'),
                      borderColor: isDark ? '#0F0D0C' : '#E8DEC8',
                    },
                  ]}
                />
              ))}
            </View>
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
            {/* Ribbon Tail V-cut */}
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
    borderRadius: 14,
    borderWidth: 1,
    opacity: 0.6,
  },
  stackedPageLayer1: {
    position: 'absolute',
    left: 7,
    right: 5,
    top: 4,
    bottom: 3,
    borderRadius: 15,
    borderWidth: 1,
    opacity: 0.8,
  },
  activePageCanvas: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.2,
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
  },
  spineContainer: {
    width: 22,
    height: '100%',
    borderRightWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  spineStripe: {
    width: 4,
    height: '100%',
  },
  stitchesCol: {
    flex: 1,
    height: '88%',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  stitchHole: {
    width: 4,
    height: 4,
    borderRadius: 2,
    borderWidth: 0.5,
  },
  ribbonBookmark: {
    position: 'absolute',
    top: -2,
    left: 32,
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
