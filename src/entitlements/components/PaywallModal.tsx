import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, toast, promptModal } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';
import { SubscriptionTier } from '../types';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  PaywallPackage,
} from '../revenueCatService';
import { useEntitlementStore } from '../store';

export interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  triggerFeature?: string;
}

interface TierDisplayOption {
  tier: SubscriptionTier;
  badge?: string;
  title: string;
  priceDisplay: string;
  subtext: string;
  rcPackage?: PaywallPackage;
}

const FALLBACK_TIERS: TierDisplayOption[] = [
  {
    tier: 'grace_annual',
    badge: 'MOST POPULAR • SAVE 44%',
    title: 'Annual Pass',
    priceDisplay: '$19.99 / year',
    subtext: 'Includes 7-day free trial ($1.66/mo)',
  },
  {
    tier: 'grace_monthly',
    title: 'Monthly Pass',
    priceDisplay: '$2.99 / month',
    subtext: 'Billed monthly, cancel anytime',
  },
  {
    tier: 'patron_lifetime',
    badge: 'LIFETIME OWNERSHIP',
    title: 'Founding Patron',
    priceDisplay: '$49.99',
    subtext: 'One-time payment, forever yours',
  },
];

const PREMIUM_PERKS = [
  {
    icon: 'infinite',
    title: 'Unlimited Devotional Pages',
    desc: 'Write without limits. Archive, bind, and fill endless volumes of prayer.',
  },
  {
    icon: 'shield-checkmark',
    title: 'Encrypted Cloud Vault & Sync',
    desc: 'Zero-knowledge encrypted cloud backup. Real-time multi-device restore.',
  },
  {
    icon: 'book',
    title: 'Luxury Leather & Vintage Covers',
    desc: 'Bespoke hand-bound aesthetics, foil embossing & parchment bindings.',
  },
  {
    icon: 'image',
    title: 'Watermark-Free HD Share Cards',
    desc: 'Ultra-high-resolution scripture cards ready for social media & ministry.',
  },
  {
    icon: 'musical-notes',
    title: 'Sanctuary Soundscapes',
    desc: 'Gentle prayer ambiance and cathedral rain (Coming soon).',
  },
];

export function PaywallModal({ visible, onClose, triggerFeature }: PaywallModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('grace_annual');
  const [packages, setPackages] = useState<PaywallPackage[]>([]);
  const [isLoadingOfferings, setIsLoadingOfferings] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const isPremium = useEntitlementStore((s) => s.isPremium());

  useEffect(() => {
    if (visible) {
      loadOfferings();
    }
  }, [visible]);

  const loadOfferings = async () => {
    setIsLoadingOfferings(true);
    try {
      const fetchedPackages = await getOfferings();
      if (fetchedPackages.length > 0) {
        setPackages(fetchedPackages);
      }
    } catch (e) {
      console.warn('Paywall offering load notice:', e);
    } finally {
      setIsLoadingOfferings(false);
    }
  };

  // Combine fetched RevenueCat packages with fallback metadata
  const displayedTiers: TierDisplayOption[] = FALLBACK_TIERS.map((fallback) => {
    const matchedPkg = packages.find((p) => p.tier === fallback.tier);
    if (matchedPkg && matchedPkg.priceString) {
      return {
        ...fallback,
        priceDisplay:
          fallback.tier === 'grace_annual'
            ? `${matchedPkg.priceString} / year`
            : fallback.tier === 'grace_monthly'
            ? `${matchedPkg.priceString} / month`
            : matchedPkg.priceString,
        rcPackage: matchedPkg,
      };
    }
    return fallback;
  });

  const handlePurchase = async () => {
    setIsProcessing(true);
    try {
      const selectedOption = displayedTiers.find((t) => t.tier === selectedTier);

      if (selectedOption?.rcPackage) {
        // Live RevenueCat purchase flow
        const success = await purchasePackage(selectedOption.rcPackage);
        if (success) {
          toast.success('Welcome to Selah Grace!', 'Your premium features are now active.');
          onClose();
        }
      } else {
        // Fallback sandbox / dev notice if RevenueCat offerings are not configured yet
        if (__DEV__) {
          useEntitlementStore.getState().setEntitlement({
            isPremium: true,
            tier: selectedTier,
            source: 'devOverride',
            expiresAt: null,
            willRenew: true,
          });
          toast.success('[DEV] Premium Activated', 'Mock subscription activated for testing.');
          onClose();
        } else {
          toast.info('Connecting to Store', 'Store billing is initializing. Please try again in a moment.');
        }
      }
    } catch (err: any) {
      if (!err?.userCancelled) {
        promptModal.error('Purchase Failed', err?.message || 'Unable to complete transaction. Please check your payment method.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    setIsProcessing(true);
    try {
      const restored = await restorePurchases();
      if (restored) {
        toast.success('Purchases Restored', 'Your previous subscription has been restored.');
        onClose();
      } else {
        promptModal.info('No Active Subscription', 'We could not find any active Selah subscriptions for your store account.');
      }
    } catch (err: any) {
      promptModal.error('Restore Error', err?.message || 'Unable to restore purchases at this time.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!visible) return null;

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
        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <Pressable
            onPress={onClose}
            style={[
              styles.closeButton,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
            ]}
            hitSlop={12}
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
          {/* Header Title Section */}
          <View style={styles.heroHeader}>
            <View style={[styles.iconBadge, { backgroundColor: isDark ? '#2D2314' : '#F5E6CC' }]}>
              <Ionicons name="ribbon-outline" size={32} color="#C59B27" />
            </View>
            <Text style={[styles.heroTitle, { color: colors.inkPrimary }]}>
              Selah Grace
            </Text>
            <Text style={[styles.heroSubtitle, { color: colors.inkSecondary }]}>
              Deepen your spiritual walk with luxury notebook craftsmanship, Scripture reflections, and secure cloud backups.
            </Text>
            {triggerFeature && (
              <View style={[styles.triggerBadge, { backgroundColor: isDark ? 'rgba(197, 155, 39, 0.15)' : 'rgba(197, 155, 39, 0.12)' }]}>
                <Ionicons name="lock-closed" size={14} color="#C59B27" style={{ marginRight: 6 }} />
                <Text style={styles.triggerText}>
                  Unlock {triggerFeature} & all premium features
                </Text>
              </View>
            )}
          </View>

          {/* Pricing Options Cards */}
          <View style={styles.tiersContainer}>
            {displayedTiers.map((tier) => {
              const isSelected = selectedTier === tier.tier;
              return (
                <Pressable
                  key={tier.tier}
                  onPress={() => setSelectedTier(tier.tier)}
                  style={[
                    styles.tierCard,
                    {
                      backgroundColor: isDark ? '#1C1914' : '#FFFFFF',
                      borderColor: isSelected ? '#C59B27' : isDark ? '#2E2820' : '#EAE3D5',
                      borderWidth: isSelected ? 2 : 1,
                    },
                    isSelected && styles.tierCardSelected,
                  ]}
                >
                  {tier.badge && (
                    <View
                      style={[
                        styles.badgeContainer,
                        {
                          backgroundColor:
                            tier.tier === 'grace_annual' ? '#C59B27' : isDark ? '#3D3425' : '#4A3B2C',
                        },
                      ]}
                    >
                      <Text style={styles.badgeText}>{tier.badge}</Text>
                    </View>
                  )}

                  <View style={styles.tierRow}>
                    <View style={styles.tierInfo}>
                      <Text style={[styles.tierTitle, { color: colors.inkPrimary }]}>
                        {tier.title}
                      </Text>
                      <Text style={[styles.tierSubtext, { color: colors.inkSecondary }]}>
                        {tier.subtext}
                      </Text>
                    </View>
                    <View style={styles.tierPriceCol}>
                      <Text style={[styles.tierPrice, { color: colors.inkPrimary }]}>
                        {tier.priceDisplay}
                      </Text>
                      <View
                        style={[
                          styles.radioCircle,
                          {
                            borderColor: isSelected ? '#C59B27' : isDark ? '#554C3F' : '#CCC2B0',
                            backgroundColor: isSelected ? '#C59B27' : 'transparent',
                          },
                        ]}
                      >
                        {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Feature List */}
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
              Included in Selah Grace:
            </Text>

            {PREMIUM_PERKS.map((perk, idx) => (
              <View key={idx} style={styles.perkRow}>
                <View style={[styles.perkIconWrap, { backgroundColor: isDark ? '#292218' : '#ECE2CF' }]}>
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

          {/* Testimonial / Quiet Time Note */}
          <View style={styles.scriptureFooter}>
            <Text style={[styles.scriptureQuote, { color: colors.inkSecondary }]}>
              “Thy word is a lamp unto my feet, and a light unto my path.”
            </Text>
            <Text style={[styles.scriptureRef, { color: colors.inkMuted }]}>
              — Psalm 119:105
            </Text>
          </View>
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
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.ctaButtonText}>
                {selectedTier === 'grace_annual'
                  ? 'Start 7-Day Free Trial'
                  : selectedTier === 'patron_lifetime'
                  ? 'Get Lifetime Access'
                  : 'Subscribe Monthly'}
              </Text>
            )}
          </Pressable>

          <Text style={[styles.legalText, { color: colors.inkMuted }]}>
            Cancel anytime in Google Play / App Store Settings. Payment charged upon purchase.
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
    fontSize: 26,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  heroSubtitle: {
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
  tiersContainer: {
    gap: 12,
    marginBottom: SPACING.xl,
  },
  tierCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    position: 'relative',
    ...SHADOWS.subtle,
  },
  tierCardSelected: {
    ...SHADOWS.card,
  },
  badgeContainer: {
    position: 'absolute',
    top: -10,
    right: 16,
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
  tierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierInfo: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  tierTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 17,
    marginBottom: 2,
  },
  tierSubtext: {
    fontFamily: FONTS.body,
    fontSize: 12,
  },
  tierPriceCol: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 10,
  },
  tierPrice: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
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
  legalText: {
    fontFamily: FONTS.body,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 14,
  },
});
