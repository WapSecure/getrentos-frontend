import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { ScanLine } from 'lucide-react-native';
import { Button, Text, useTheme } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { haptics } from '@/lib/haptics';

/**
 * A visitor's QR payload is the raw 6-digit PIN — the API builds it with
 * `QRCode.toDataURL(pin)` — so a scan is the very same secret the keypad would
 * have collected. This is convenience only, not a second credential.
 *
 * Digits are extracted rather than read verbatim so a wrapped payload (a URL or
 * JSON carrying the PIN) still resolves, and it matches what the web console
 * already does with the codes its users upload.
 */
export function pinFromScanData(data: string): string | null {
  const digits = data.replace(/\D/g, '');
  return digits.length >= 6 ? digits.slice(0, 6) : null;
}

export interface QrScannerSheetProps {
  open: boolean;
  onClose: () => void;
  onScan: (pin: string) => void;
}

/**
 * Full-screen-ish QR scanner for the gate. Mount it with a changing `key` (as
 * the check-in screen does) so every open starts with a fresh camera and a
 * cleared latch — `react-hooks/set-state-in-effect` forbids resetting that in an
 * effect here.
 */
export function QrScannerSheet({ open, onClose, onScan }: QrScannerSheetProps) {
  const { colors, spacing } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [error, setError] = useState<string | null>(null);
  // `onBarcodeScanned` fires every frame while a code is in view. Latching keeps
  // one QR from being submitted repeatedly, and unsetting the handler stops the
  // decoder rather than letting it spin behind the result.
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
                ? "GetRentos needs the camera to read a visitor's QR code. You can still check them in with their 6-digit PIN."
                : 'Turn camera access on for GetRentos in Settings, or check the visitor in with their 6-digit PIN instead.'}
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
              <ScanLine size={34} color="#fff" />
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
