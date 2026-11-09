import { Pressable, View } from 'react-native';
import { Building2, Check, MapPin } from 'lucide-react-native';
import { Button, Card, Text, useTheme } from '@sureground/ui-native';
import { Sheet } from '@/components/Sheet';
import { useGatemanPost } from '@/lib/gateman/GatemanPostProvider';

const describeGateCount = (count: number) => (count === 1 ? '1 gate' : `${count} gates`);

export function PostSwitcherSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { colors, spacing } = useTheme();
  const { estates, estate, gates, gate, selectEstate, selectGate } = useGatemanPost();

  return (
    <Sheet open={open} onClose={onClose} title="Your post" snapPoints={['70%']}>
      <View style={{ gap: spacing.lg }}>
        <View style={{ gap: spacing.sm }}>
          <Text variant="bodyStrong">Estate</Text>
          {estates.length === 1 ? (
            <Card>
              <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
                <Building2 size={18} color={colors.mutedForeground} />
                <Text variant="caption" color="mutedForeground">
                  {estate?.name}: the only estate you are posted to.
                </Text>
              </View>
            </Card>
          ) : (
            estates.map((option) => {
              const selected = option.id === estate?.id;
              return (
                <Card key={option.id} elevated={selected} padding="none">
                  <Pressable
                    disabled={selected}
                    onPress={() => selectEstate(option.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.md,
                      padding: spacing.md,
                    }}
                  >
                    <Building2 size={18} color={colors.mutedForeground} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="bodyStrong">{option.name}</Text>
                      <Text variant="caption" color="mutedForeground">
                        {/* Only the loaded estate's count is real: the stored gateCount is a planning number that drifts from the gates actually named. */}
                        {selected && gates.length > 0
                          ? `${option.city} · ${describeGateCount(gates.length)}`
                          : option.city}
                      </Text>
                    </View>
                    {selected ? (
                      // A tick, not a disabled "Current" button, which would read as "you may not go here".
                      <Check size={18} color={colors.primary} />
                    ) : (
                      <Text variant="caption" color="primary">
                        Switch
                      </Text>
                    )}
                  </Pressable>
                </Card>
              );
            })
          )}
        </View>

        <View style={{ gap: spacing.sm }}>
          <Text variant="bodyStrong">Gate</Text>
          {gates.length === 0 ? (
            <Card>
              <Text variant="caption" color="mutedForeground">
                This estate has not named its gates yet, so entries will not be attributed to one.
                Ask the estate office to add them.
              </Text>
            </Card>
          ) : gates.length === 1 ? (
            <Card>
              <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
                <MapPin size={18} color={colors.mutedForeground} />
                <Text variant="caption" color="mutedForeground">
                  {gates[0].name}: the only gate here, so every entry is recorded against it.
                </Text>
              </View>
            </Card>
          ) : (
            <>
              <Text variant="caption" color="mutedForeground">
                Entries are recorded against the gate you pick, so that an estate can answer which
                barrier a visitor came through. Nothing is recorded against a gate you have not
                chosen.
              </Text>
              {gates.map((option) => {
                const selected = option.id === gate?.id;
                return (
                  <Card key={option.id} elevated={selected}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: spacing.md,
                      }}
                    >
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text variant="bodyStrong">{option.name}</Text>
                        {option.location ? (
                          <Text variant="caption" color="mutedForeground">
                            {option.location}
                          </Text>
                        ) : null}
                      </View>
                      <Button
                        label={selected ? 'Here' : 'I am here'}
                        variant={selected ? 'outline' : 'primary'}
                        size="sm"
                        fullWidth={false}
                        disabled={selected}
                        onPress={() => selectGate(option.id)}
                      />
                    </View>
                  </Card>
                );
              })}
            </>
          )}
        </View>
      </View>
    </Sheet>
  );
}
