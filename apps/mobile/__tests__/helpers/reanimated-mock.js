// A plain-React stand-in for react-native-reanimated (and react-native-worklets), registered in
// jest.setup.js. The real packages need native runtimes that Jest does not have. Animations
// resolve to their end value at once; layout animations (FadeIn.duration(120)…) are dropped.
const React = require('react');
const RN = require('react-native');

const ANIMATION_PROPS = ['entering', 'exiting', 'layout', 'animatedProps', 'sharedTransitionTag'];

function createAnimatedComponent(Component) {
  const Animated = React.forwardRef(function Animated(props, ref) {
    const rest = { ...props };
    for (const key of ANIMATION_PROPS) delete rest[key];
    return React.createElement(Component, { ...rest, ref });
  });
  Animated.displayName = `Animated(${Component.displayName || Component.name || 'Component'})`;
  return Animated;
}

// FadeIn, FadeIn.duration(120).delay(60), new Keyframe({...}): every call returns the builder again.
function builder() {
  const target = function animationBuilder() {};
  const proxy = new Proxy(target, {
    get: (_t, key) => (typeof key === 'symbol' || key === 'then' ? undefined : () => proxy),
    apply: () => proxy,
    construct: () => proxy,
  });
  return proxy;
}

function makeShared(initial) {
  const shared = {
    value: initial,
    get: () => shared.value,
    set: (next) => {
      shared.value = typeof next === 'function' ? next(shared.value) : next;
    },
    modify: (fn) => {
      shared.value = fn(shared.value);
    },
    addListener: () => undefined,
    removeListener: () => undefined,
  };
  return shared;
}

function interpolate(x, input, output) {
  if (x <= input[0]) return output[0];
  for (let i = 1; i < input.length; i++) {
    if (x <= input[i]) {
      const t = (x - input[i - 1]) / (input[i] - input[i - 1] || 1);
      return output[i - 1] + t * (output[i] - output[i - 1]);
    }
  }
  return output[output.length - 1];
}

const safely = (fn, fallback) => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

const Animated = {
  View: createAnimatedComponent(RN.View),
  Text: createAnimatedComponent(RN.Text),
  Image: createAnimatedComponent(RN.Image),
  ScrollView: createAnimatedComponent(RN.ScrollView),
  FlatList: createAnimatedComponent(RN.FlatList),
  createAnimatedComponent,
};

const explicit = {
  __esModule: true,
  default: Animated,
  ...Animated,
  useSharedValue: (initial) => React.useRef(makeShared(initial)).current,
  useDerivedValue: (fn) => makeShared(safely(fn, undefined)),
  useAnimatedStyle: (fn) => safely(fn, {}),
  useAnimatedProps: (fn) => safely(fn, {}),
  useAnimatedRef: () => React.useRef(null),
  useAnimatedReaction: () => undefined,
  useAnimatedScrollHandler: () => () => undefined,
  useScrollViewOffset: () => makeShared(0),
  useAnimatedKeyboard: () => ({ height: makeShared(0), state: makeShared(0) }),
  useFrameCallback: () => ({ setActive: () => undefined, isActive: false }),
  useReducedMotion: () => false,
  withSpring: (to) => to,
  withTiming: (to) => to,
  withDecay: () => 0,
  withDelay: (_ms, animation) => animation,
  withRepeat: (animation) => animation,
  withSequence: (...animations) => animations[animations.length - 1],
  cancelAnimation: () => undefined,
  interpolate,
  interpolateColor: (_x, _input, output) => output[0],
  Extrapolation: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
  Extrapolate: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
  ReduceMotion: { System: 'system', Always: 'always', Never: 'never' },
  Easing: builder(),
  runOnJS: (fn) => fn,
  runOnUI: (fn) => fn,
  measure: () => null,
  scrollTo: () => undefined,
  makeMutable: makeShared,
  isSharedValue: (value) => !!value && typeof value.get === 'function',
};

// Anything else: capitalised names are layout-animation builders, hooks return an empty object.
const reanimated = new Proxy(explicit, {
  get(target, key) {
    if (key in target) return target[key];
    if (typeof key !== 'string') return undefined;
    if (/^[A-Z]/.test(key)) return builder();
    if (key.startsWith('use')) return () => ({});
    return () => undefined;
  },
});

const worklets = new Proxy(
  {
    __esModule: true,
    scheduleOnRN: (fn, ...args) => fn(...args),
    scheduleOnUI: (fn, ...args) => fn(...args),
    runOnJS:
      (fn) =>
      (...args) =>
        fn(...args),
    runOnUI:
      (fn) =>
      (...args) =>
        fn(...args),
  },
  {
    get(target, key) {
      if (key in target) return target[key];
      if (typeof key !== 'string') return undefined;
      return () => undefined;
    },
  }
);

module.exports = { reanimated, worklets };
