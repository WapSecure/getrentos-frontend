import { useEffect, useRef, useState } from 'react';
import { PanResponder, View, type GestureResponderEvent } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { LinkButton, Text, useTheme } from '@sureground/ui-native';

const PAD_HEIGHT = 180;

// Rasterized with react-native-svg's native toDataURL, so capture needs no extra native dependency.
export function SignaturePad({ onChange }: { onChange: (dataUri: string | null) => void }) {
  const { colors, spacing, radius } = useTheme();
  const svgRef = useRef<React.ComponentRef<typeof Svg>>(null);
  const [strokes, setStrokes] = useState<string[]>([]);
  const [activePath, setActivePath] = useState('');
  const [empty, setEmpty] = useState(true);

  const point = (e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    return `${locationX.toFixed(1)},${locationY.toFixed(1)}`;
  };

  const [panResponder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        setActivePath(`M${point(e)}`);
      },
      onPanResponderMove: (e) => {
        setActivePath((prev) => `${prev} L${point(e)}`);
      },
      onPanResponderRelease: () => {
        setActivePath((prev) => {
          if (prev) {
            setStrokes((s) => [...s, prev]);
            setEmpty(false);
          }
          return '';
        });
      },
    })
  );

  const clear = () => {
    setStrokes([]);
    setActivePath('');
    setEmpty(true);
    onChange(null);
  };

  // Capture only after the stroke commits: toDataURL on release would rasterize the previous frame.
  useEffect(() => {
    if (strokes.length === 0) return;
    svgRef.current?.toDataURL((base64: string) => {
      onChange(`data:image/png;base64,${base64}`);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes]);

  return (
    <View style={{ gap: spacing.sm }}>
      <View
        {...panResponder.panHandlers}
        style={{
          height: PAD_HEIGHT,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
        }}
      >
        <Svg ref={svgRef} width="100%" height={PAD_HEIGHT}>
          <Rect x={0} y={0} width="100%" height={PAD_HEIGHT} fill="#ffffff" />
          {strokes.map((d, i) => (
            <Path
              key={i}
              d={d}
              stroke="#161b22"
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {activePath ? (
            <Path
              d={activePath}
              stroke="#161b22"
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
        </Svg>
        {empty ? (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text variant="caption" color="mutedForeground">
              Sign here
            </Text>
          </View>
        ) : null}
      </View>
      {!empty ? (
        <LinkButton
          label="Clear"
          onPress={clear}
          accessibilityHint="Erases the signature"
          style={{ alignSelf: 'flex-end' }}
        />
      ) : null}
    </View>
  );
}
