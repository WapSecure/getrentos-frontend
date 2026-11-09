import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { ScanLine } from '@sureground/icons/native';
import { Button, Text, useTheme } from '@sureground/ui-native';
import { Sheet } from '@/components/Sheet';
import { haptics } from '@/lib/haptics';

// The QR payload is the raw 6-digit PIN, the same secret the keypad takes; digits are extracted so a wrapped payload (a URL or JSON) still resolves, as on the web console.
export function pinFromScanData(data: string): string | null {
  const digits = data.replace(/\D/g, '');
  return digits.length >= 6 ? digits.slice(0, 6) : null;
}

export interface QrScannerSheetProps {
  open: boolean;
  onClose: () => void;
  onScan: (pin: string) => void;
}

// Mount with a changing key so every open gets a fresh camera and a cleared latch: react-hooks/set-state-in-effect forbids resetting them in an effect.
export function QrScannerSheet({ open, onClose, onScan }: QrScannerSheetProps) {
  const { colors, spacing } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [error, setError] = useState<string | null>(null);
  // onBarcodeScanned fires every frame while a code is in view: the latch submits one QR once.
  const [latched, setLatched] = useState(false);

  const handleScan = (result: BarcodeScanningResult) => {
    if (latched) return;
    setLatched(true);
    const pin = pinFromScanData(result.data);
    if (!pin) {
      setError("That code isn't a visitor pass. Check it's the guest's QR, or type the PIN.");
      return;
    }
    void haptics.success();
    onScan(pin);
  };

  const scanAgain = () => {
    setLatched(false);
    setError(null);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Scan visitor pass" snapPoints={['85%']}>
      <View style={{ flex: 1, gap: spacing.lg }}>
        {!permission ? (
          <View style={styles.centre}>
            <Text variant="caption" color="mutedForeground">
              Preparing the camera…
            </Text>
          </View>
        ) : !permission.granted ? (
          <View style={[styles.centre, { gap: spacing.md }]}>
            <Text variant="bodyStrong" center>
              {permission.canAskAgain ? 'Camera access needed' : 'Camera access is off'}
            </Text>
            <Text variant="caption" color="mutedForeground" center>
              {permission.canAskAgain
                ? "Sureground needs the camera to read a visitor's QR code. You can still check them in with their 6-digit PIN."
                : 'Turn camera access on for Sureground in Settings, or check the visitor in with their 6-digit PIN instead.'}
            </Text>
            <Button
              label={permission.canAskAgain ? 'Allow camera' : 'Open settings'}
              onPress={() => {
                if (permission.canAskAgain) void requestPermission();
                else void Linking.openSettings();
              }}
              fullWidth={false}
            />
          </View>
        ) : (
          <View style={styles.cameraWrap}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              // Dropping the handler while latched stops the decoder running.
              onBarcodeScanned={latched ? undefined : handleScan}
            />
            <View pointerEvents="none" style={styles.reticle}>
              <ScanLine size={34} color={colors.primaryForeground} />
            </View>
          </View>
        )}

        {error ? (
          <View style={{ gap: spacing.sm }}>
            <Text variant="caption" center style={{ color: colors.destructive }}>
              {error}
            </Text>
            <Button label="Scan again" variant="outline" onPress={scanAgain} fullWidth />
          </View>
        ) : (
          <Text variant="caption" color="mutedForeground" center>
            Point the camera at the visitor&apos;s QR code.
          </Text>
        )}

        <Button label="Enter PIN instead" variant="ghost" onPress={onClose} fullWidth />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  centre: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 320,
    alignSelf: 'center',
  },
  cameraWrap: {
    flex: 1,
    minHeight: 260,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  reticle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
