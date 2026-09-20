import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, RotateCcw, ShieldCheck, Smartphone, WifiOff } from 'lucide-react-native';
import { Badge, Card, ErrorState, Skeleton, Text, useTheme } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { ussdApi } from '@/lib/api/ussd';

const BENEFITS = [
  {
    icon: WifiOff,
    title: 'Works with zero data',
    description: 'USSD runs over your carrier signal — no internet connection needed, ever.',
  },
  {
    icon: Smartphone,
    title: 'Any phone, not just smartphones',
    description: 'Check your rent, pay, and verify your identity from any feature phone.',
  },
  {
    icon: ShieldCheck,
    title: 'Same secure GetRentos account',
    description: 'Sessions are tied to your verified number — no separate signup needed.',
  },
];

export default function Ussd() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();

  const query = useQuery({ queryKey: qk.renter.ussdMenu, queryFn: ussdApi.getMenu });
  const [screenId, setScreenId] = useState('root');

  const menu = query.data;
  const screen = menu?.screens[screenId];
  const options = Object.entries(screen?.options ?? {});

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingTop: insets.top + 8,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={10}
        >
          <ChevronLeft size={26} color={colors.foreground} />
        </Pressable>
        <Text variant="title" style={{ flex: 1 }}>
          Dial-in access
        </Text>
        <Badge label="Coming soon" tone="info" />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
      >
        {query.isLoading ? (
          [0, 1].map((i) => <Skeleton key={i} height={160} radius={radius.lg} />)
        ) : query.isError ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : (
          <>
            <Text variant="body" color="mutedForeground">
              We&apos;re building dial-in access on <Text variant="bodyStrong">{menu?.code}</Text>{' '}
              so you can check your balance, pay rent, see your trust score or report an issue from
              any phone — no app, no data. Here&apos;s how it will work.
            </Text>

            {/* Simulated handset. Deliberately not a tel: link — the code is not live yet. */}
            <Card padding="none" elevated>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                  padding: spacing.lg,
                  borderTopLeftRadius: radius.lg,
                  borderTopRightRadius: radius.lg,
                  backgroundColor: colors.secondary,
                }}
              >
                <Smartphone size={16} color={colors.mutedForeground} />
                <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
                  Preview — nothing is sent
                </Text>
                {screenId === 'root' ? null : (
                  <Pressable
                    onPress={() => setScreenId('root')}
                    accessibilityRole="button"
                    accessibilityLabel="Start over"
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
                  >
                    <RotateCcw size={13} color={colors.primary} />
                    <Text variant="caption" color="primary" style={{ fontWeight: '600' }}>
                      Restart
                    </Text>
                  </Pressable>
                )}
              </View>

              <View style={{ padding: spacing.lg, gap: spacing.md }}>
                <Text variant="body" style={{ fontFamily: 'monospace', lineHeight: 22 }}>
                  {screen?.text ?? 'No screen.'}
                </Text>

                {options.length > 0 ? (
                  <View style={{ gap: spacing.sm }}>
                    {options.map(([digit, target]) => (
                      <Pressable
                        key={digit}
                        onPress={() => setScreenId(target)}
                        accessibilityRole="button"
                        accessibilityLabel={`Option ${digit}`}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: spacing.md,
                          padding: spacing.md,
                          borderRadius: radius.md,
                          borderWidth: 1,
                          borderColor: colors.border,
                        }}
                      >
                        <View
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: colors.primary + '1f',
                          }}
                        >
                          <Text variant="caption" color="primary" style={{ fontWeight: '700' }}>
                            {digit}
                          </Text>
                        </View>
                        <Text variant="callout" style={{ flex: 1 }}>
                          Reply {digit}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <Text variant="caption" color="mutedForeground">
                    End of session.
                  </Text>
                )}
              </View>
            </Card>

            <View style={{ gap: spacing.md }}>
              {BENEFITS.map((b) => {
                const Icon = b.icon;
                return (
                  <View key={b.title} style={{ flexDirection: 'row', gap: spacing.md }}>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: radius.md,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.secondary,
                      }}
                    >
                      <Icon size={17} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong">{b.title}</Text>
                      <Text variant="caption" color="mutedForeground">
                        {b.description}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
