import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, toast, promptModal } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';
import {
  getOfferings,
  purchaseSelahGrace,
  restorePurchases,
  StoreProductInfo,
  isExpoGo,
} from '../revenueCatService';
import { useEntitlementStore } from '../entitlementStore';
import { useSelahGrace } from '../entitlementHooks';

export interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  triggerFeature?: string;
}

const SELAH_GRACE_PERKS = [
  {
    icon: 'infinite-outline',
    title: 'Unlimited Devotional Entries',
    desc: 'Never run out of room for prayer and daily reflection. Write freely without page limits.',
  },
  {
    icon: 'book-outline',
    title: 'Premium Notebook Designs & Materials',
    desc: 'Handcrafted leather grains, archival parchment, and elegant notebook styling.',
  },
  {
    icon: 'sparkles-outline',
    title: 'Sacred Cover Emblems',
    desc: 'Adorn your journal with gold-foil stamped crosses, doves, and sacred scripture seals.',
  },
  {
    icon: 'color-palette-outline',
    title: 'Themes & Personalization',
    desc: 'Access curated typography pairings and tranquil devotional color themes.',
  },
  {
    icon: 'leaf-outline',
    title: 'Future Selah Grace Features',
    desc: 'All upcoming craft improvements and grace additions are included forever.',
  },
];

export function PaywallModal({ visible, onClose, triggerFeature }: PaywallModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [productInfo, setProductInfo] = useState<StoreProductInfo | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const isGraceUnlocked = useSelahGrace();

  useEffect(() => {
    if (visible) {
      loadProduct();
    }
  }, [visible]);

  const loadProduct = async () => {
    setIsLoadingProduct(true);
    try {
      const info = await getOfferings();
      if (info) {
        setProductInfo(info);
      }
    } catch (e) {
      if (__DEV__) {
        console.warn('Offering load notice:', e);
      }
    } finally {
      setIsLoadingProduct(false);
    }
  };

  const handlePurchase = async () => {
    setIsProcessing(true);
    try {
      const result = await purchaseSelahGrace();
      if (result.success) {
        toast.success('Welcome to Selah Grace', 'Your lifetime access is now active.');
        onClose();
      } else if (result.userCancelled) {
        // User cancelled in store dialog — no intrusive alert needed
      } else if (result.error) {
        if (__DEV__ && isExpoGo) {
          // In Expo Go sandbox, provide dev activation
          useEntitlementStore.getState().setDevOverride(true);
          toast.success('[DEV] Selah Grace Active', 'Activated via developer override in Expo Go.');
          onClose();
        } else {
          promptModal.error('Purchase Could Not Complete', result.error);
        }
      }
    } catch (err: any) {
      promptModal.error('Purchase Failed', err?.message || 'Unable to complete transaction.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    setIsProcessing(true);
    try {
      const result = await restorePurchases();
      if (result.success) {
        toast.success('Purchases Restored', 'Your Selah Grace lifetime access has been restored.');
        onClose();
      } else if (result.error) {
        promptModal.info('Restore Status', result.error);
      } else {
        promptModal.info(
          'No Prior Purchase Found',
          'We could not find an active Selah Grace purchase for your App Store / Google Play account.'
        );
      }
    } catch (err: any) {
      promptModal.error('Restore Error', err?.message || 'Unable to restore purchases at this time.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!visible) return null;

  const priceLabel = productInfo?.priceString ? productInfo.priceString : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? '#14120E' : '#FAF7F2',
            paddingTop: insets.top,
            paddingBottom: Math.max(insets.bottom, SPACING.md),
          },
        ]}
      >
        {/* Top Navigation Bar */}
        <View style={styles.topBar}>
          <Pressable
            onPress={onClose}
            style={[
              styles.closeButton,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
            ]}
            hitSlop={12}
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={22} color={colors.inkPrimary} />
          </Pressable>
          <Pressable onPress={handleRestore} disabled={isProcessing} hitSlop={12}>
            <Text style={[styles.restoreText, { color: colors.brandGreen }]}>
              Restore
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.heroHeader}>
            <View style={[styles.iconBadge, { backgroundColor: isDark ? '#2D2314' : '#F5E6CC' }]}>
              <Ionicons name="ribbon-outline" size={32} color="#C59B27" />
            </View>
            <Text style={[styles.heroTitle, { color: colors.inkPrimary }]}>
              Selah Grace
            </Text>
            <Text style={[styles.heroSubtitle, { color: colors.inkSecondary }]}>
              A little more room for what matters.
            </Text>
            <Text style={[styles.heroBody, { color: colors.inkMuted }]}>
              Unlock the complete Selah journaling experience.
            </Text>

            {triggerFeature && (
              <View
                style={[
                  styles.triggerBadge,
                  {
                    backgroundColor: isDark
                      ? 'rgba(197, 155, 39, 0.15)'
                      : 'rgba(197, 155, 39, 0.12)',
                  },
                ]}
              >
                <Ionicons name="lock-closed" size={13} color="#C59B27" style={{ marginRight: 6 }} />
                <Text style={styles.triggerText}>
                  Unlock {triggerFeature} & all Selah Grace features
                </Text>
              </View>
            )}
          </View>

          {/* Single Lifetime Offer Card */}
          <View
            style={[
              styles.offerCard,
              {
                backgroundColor: isDark ? '#1C1914' : '#FFFFFF',
                borderColor: '#C59B27',
              },
            ]}
          >
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>LIFETIME ACCESS • ONE-TIME PURCHASE</Text>
            </View>

            <View style={styles.offerRow}>
              <View style={styles.offerInfo}>
                <Text style={[styles.offerTitle, { color: colors.inkPrimary }]}>
                  Selah Grace
                </Text>
                <Text style={[styles.offerSubtext, { color: colors.inkSecondary }]}>
                  Pay once, keep forever. No subscriptions.
                </Text>
              </View>

              <View style={styles.offerPriceCol}>
                {isLoadingProduct ? (
                  <ActivityIndicator size="small" color="#C59B27" />
                ) : priceLabel ? (
                  <Text style={[styles.offerPrice, { color: colors.inkPrimary }]}>
                    {priceLabel}
                  </Text>
                ) : (
                  <Text style={[styles.offerPriceFallback, { color: colors.inkPrimary }]}>
                    Lifetime
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Included Features */}
          <View
            style={[
              styles.featuresBox,
              {
                backgroundColor: isDark ? '#1A1713' : '#F5EFE6',
                borderColor: isDark ? '#2B241C' : '#E8DEC8',
              },
            ]}
          >
            <Text style={[styles.featuresHeader, { color: colors.inkPrimary }]}>
              Included with Selah Grace:
            </Text>

            {SELAH_GRACE_PERKS.map((perk, idx) => (
              <View key={idx} style={styles.perkRow}>
                <View
                  style={[
                    styles.perkIconWrap,
                    { backgroundColor: isDark ? '#292218' : '#ECE2CF' },
                  ]}
                >
                  <Ionicons name={perk.icon as any} size={18} color="#C59B27" />
                </View>
                <View style={styles.perkTextWrap}>
                  <Text style={[styles.perkTitle, { color: colors.inkPrimary }]}>
                    {perk.title}
                  </Text>
                  <Text style={[styles.perkDesc, { color: colors.inkSecondary }]}>
                    {perk.desc}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Ad-Free Sanctuary Commitment */}
          <View
            style={[
              styles.missionCard,
              {
                backgroundColor: isDark ? 'rgba(139, 58, 43, 0.12)' : '#FDF6F0',
                borderColor: isDark ? 'rgba(139, 58, 43, 0.3)' : '#F5DCD0',
              },
            ]}
          >
            <View style={styles.missionHeader}>
              <View
                style={[
                  styles.missionIconCircle,
                  { backgroundColor: isDark ? 'rgba(139, 58, 43, 0.25)' : '#F8E7DF' },
                ]}
              >
                <Ionicons name="heart" size={13} color="#8B3A2B" />
              </View>
              <Text style={[styles.missionTitle, { color: colors.inkPrimary }]}>
                An Independent, Ad-Free Sanctuary
              </Text>
            </View>
            <Text style={[styles.missionBody, { color: colors.inkSecondary }]}>
              Selah is crafted independently with no advertisements, trackers, or commercial noise. Your one-time contribution directly sustains this sacred, distraction-free space for quiet communion with God.
            </Text>
          </View>

          {/* Scripture Footer */}
          <View style={styles.scriptureFooter}>
            <Text style={[styles.scriptureQuote, { color: colors.inkSecondary }]}>
              “Thy word is a lamp unto my feet, and a light unto my path.”
            </Text>
            <Text style={[styles.scriptureRef, { color: colors.inkMuted }]}>
              — Psalm 119:105
            </Text>
          </View>

          {/* Dev Mode Override Toggle */}
          {__DEV__ && (
            <View style={styles.devSection}>
              <Pressable
                onPress={() => {
                  const store = useEntitlementStore.getState();
                  const isCurrentlyUnlocked = store.isSelahGrace();
                  if (isCurrentlyUnlocked) {
                    store.setDevOverride(false);
                    store.clearEntitlement();
                    toast.info('[DEV] Mode', 'Returned to Free Tier (30-entry limit active)');
                  } else {
                    store.setDevOverride(true);
                    toast.info('[DEV] Mode', 'Unlocked Selah Grace (Unlimited entries active)');
                  }
                }}
                style={styles.devButton}
              >
                <Text style={styles.devButtonText}>
                  [DEV] Toggle Selah Grace ({isGraceUnlocked ? 'ON (Tap for Free)' : 'OFF (Tap for Grace)'})
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>

        {/* Bottom CTA Action Area */}
        <View
          style={[
            styles.bottomActionArea,
            {
              backgroundColor: isDark ? '#14120E' : '#FAF7F2',
              borderTopColor: isDark ? '#262018' : '#EAE3D5',
            },
          ]}
        >
          <Pressable
            onPress={handlePurchase}
            disabled={isProcessing}
            style={[styles.ctaButton, { backgroundColor: '#8B3A2B' }]}
            accessibilityRole="button"
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.ctaButtonText}>
                {priceLabel ? `Unlock Selah Grace • ${priceLabel}` : 'Unlock Selah Grace'}
              </Text>
            )}
          </Pressable>

          <Pressable onPress={onClose} style={styles.dismissButton} hitSlop={8}>
            <Text style={[styles.dismissText, { color: colors.inkMuted }]}>
              Maybe later
            </Text>
          </Pressable>

          <Text style={[styles.legalText, { color: colors.inkMuted }]}>
            One-time purchase • Lifetime access • No subscriptions
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  heroHeader: {
    alignItems: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  iconBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  heroTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 28,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  heroSubtitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 4,
  },
  heroBody: {
    fontFamily: FONTS.body,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: SPACING.md,
  },
  triggerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.pill,
  },
  triggerText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: '#C59B27',
  },
  offerCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 2,
    marginBottom: SPACING.lg,
    position: 'relative',
    ...SHADOWS.card,
  },
  badgeContainer: {
    position: 'absolute',
    top: -10,
    left: 16,
    backgroundColor: '#C59B27',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  badgeText: {
    color: '#FFFFFF',
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  offerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
  },
  offerInfo: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  offerTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 18,
    marginBottom: 2,
  },
  offerSubtext: {
    fontFamily: FONTS.body,
    fontSize: 12,
  },
  offerPriceCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 70,
  },
  offerPrice: {
    fontFamily: FONTS.bodyBold,
    fontSize: 20,
  },
  offerPriceFallback: {
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
  },
  featuresBox: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  featuresHeader: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 15,
    marginBottom: SPACING.md,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  perkIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  perkTextWrap: {
    flex: 1,
  },
  perkTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    marginBottom: 2,
  },
  perkDesc: {
    fontFamily: FONTS.body,
    fontSize: 12,
    lineHeight: 16,
  },
  missionCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  missionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  missionIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 13,
    fontWeight: '700',
  },
  missionBody: {
    fontFamily: FONTS.body,
    fontSize: 12,
    lineHeight: 18,
  },
  scriptureFooter: {
    alignItems: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  scriptureQuote: {
    fontFamily: FONTS.scriptureItalic,
    fontSize: 13,
    textAlign: 'center',
  },
  scriptureRef: {
    fontFamily: FONTS.body,
    fontSize: 11,
    marginTop: 4,
  },
  devSection: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
    alignItems: 'center',
  },
  devButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: RADIUS.sm,
  },
  devButtonText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: '#888',
  },
  bottomActionArea: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
  },
  ctaButton: {
    height: 52,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
    letterSpacing: 0.3,
  },
  dismissButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 4,
  },
  dismissText: {
    fontFamily: FONTS.body,
    fontSize: 13,
  },
  legalText: {
    fontFamily: FONTS.body,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 14,
  },
});
