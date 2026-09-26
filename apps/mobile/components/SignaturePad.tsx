import { useEffect, useMemo, useReducer } from 'react';
import { PanResponder, View, type GestureResponderEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Eraser } from 'lucide-react-native';
import { Button, Text, useTheme } from '@getrentos/ui-native';

export interface SignaturePadProps {
  width?: number;
  height?: number;
  /** Fires with a renderable `data:image/svg+xml,...` URI after every stroke, or `null` once cleared/empty. */
  onChange: (dataUri: string | null) => void;
}

interface SignatureState {
  strokes: string[];
  currentPath: string;
}

type SignatureAction =
  | { type: 'start'; x: number; y: number }
  | { type: 'move'; x: number; y: number }
  | { type: 'commit' }
  | { type: 'clear' };

function signatureReducer(state: SignatureState, action: SignatureAction): SignatureState {
  switch (action.type) {
    case 'start':
      return { ...state, currentPath: `M ${action.x.toFixed(1)} ${action.y.toFixed(1)}` };
    case 'move':
      if (!state.currentPath) return state;
      return {
        ...state,
        currentPath: `${state.currentPath} L ${action.x.toFixed(1)} ${action.y.toFixed(1)}`,
      };
    case 'commit':
      return state.currentPath
        ? { strokes: [...state.strokes, state.currentPath], currentPath: '' }
        : state;
    case 'clear':
      return { strokes: [], currentPath: '' };
  }
}

/**
 * Touch-drawn signature capture, built on `react-native-svg` (already a
 * dependency) + core RN `PanResponder` rather than a native gesture library
 * or a new signature-pad package — deliberately avoids the same class of
 * gesture-handler-on-web risk `@gorhom/bottom-sheet` has. Exports the stroke
 * as a standalone SVG document, URL-encoded (not base64) so it needs no
 * `btoa` polyfill.
 */
export function SignaturePad({ width = 320, height = 160, onChange }: SignaturePadProps) {
  const { colors, spacing, radius } = useTheme();
  const [{ strokes, currentPath }, dispatch] = useReducer(signatureReducer, {
    strokes: [],
    currentPath: '',
  });

  // Side effect (calling the parent's onChange, which is its own setState)
  // belongs here, not inside setStrokes's updater — calling one component's
  // setState from inside another's updater trips React's render-purity check.
  useEffect(() => {
    if (strokes.length === 0) {
      onChange(null);
      return;
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="white"/>${strokes
      .map(
        (d) =>
          `<path d="${d}" stroke="#1d1d1f" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
      )
      .join('')}</svg>`;
    onChange(`data:image/svg+xml,${encodeURIComponent(svg)}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e: GestureResponderEvent) => {
          const { locationX, locationY } = e.nativeEvent;
          dispatch({ type: 'start', x: locationX, y: locationY });
        },
        onPanResponderMove: (e: GestureResponderEvent) => {
          const { locationX, locationY } = e.nativeEvent;
          dispatch({ type: 'move', x: locationX, y: locationY });
        },
        onPanResponderRelease: () => {
          dispatch({ type: 'commit' });
        },
      }),
    []
  );

  const clear = () => {
    dispatch({ type: 'clear' });
  };

  return (
    <View style={{ gap: spacing.sm }}>
      <View
        {...panResponder.panHandlers}
        style={{
          width,
          height,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: '#fff',
          overflow: 'hidden',
        }}
      >
        <Svg width={width} height={height}>
          {strokes.map((d, i) => (
            <Path
              key={i}
              d={d}
              stroke="#1d1d1f"
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {currentPath ? (
            <Path
              d={currentPath}
              stroke="#1d1d1f"
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
        </Svg>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="caption" color="mutedForeground">
          Sign with your finger above
        </Text>
        <Button
          label="Clear"
          variant="ghost"
          size="sm"
          fullWidth={false}
          icon={<Eraser size={14} color={colors.primary} />}
          onPress={clear}
        />
      </View>
    </View>
  );
}
