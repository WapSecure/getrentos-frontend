import { useState } from 'react';
import { Pressable, Text as RNText, View } from 'react-native';
import { fireEvent, screen } from '@testing-library/react-native';
import { Heart, Plus } from '@sureground/icons/native';
import {
  Button,
  Checkbox,
  Chip,
  IconButton,
  LinkButton,
  PressableScale,
  PropertyCard,
  RadioGroup,
  SegmentedControl,
  SwitchRow,
  Text,
  TextField,
} from '@sureground/ui-native';
import {
  MIN_TOUCH_TARGET,
  auditPressables,
  expectAccessiblePressables,
  expectLabelledTextInputs,
  renderWithTheme,
  touchTarget,
  type HostElement,
} from './helpers/a11y';

const noop = () => undefined;
const root = () => screen.container as HostElement;

function expectTarget(element: HostElement) {
  const { height, width } = touchTarget(element);
  expect(height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
  if (width !== undefined) expect(width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
}

describe('the audit helper', () => {
  it('fails an icon-only pressable with no label', async () => {
    await renderWithTheme(
      <Pressable onPress={noop} accessibilityRole="button" style={{ width: 44, height: 44 }}>
        <Heart size={18} color="black" />
      </Pressable>
    );
    expect(() => expectAccessiblePressables(root())).toThrow(/no accessible name/);
  });

  it('fails a pressable with no role, even when it has text', async () => {
    await renderWithTheme(
      <Pressable onPress={noop} style={{ minHeight: 44 }}>
        <RNText>Open</RNText>
      </Pressable>
    );
    const issues = auditPressables(root());
    expect(issues.map((i) => i.problem)).toEqual(['has no accessibilityRole']);
    expect(issues[0].name).toBe('Open');
  });

  it('fails a button a screen reader cannot reach inside an accessible container', async () => {
    await renderWithTheme(
      <View accessible accessibilityLabel="Balance">
        <IconButton
          accessibilityLabel="Hide"
          icon={<Heart size={18} color="black" />}
          onPress={noop}
        />
      </View>
    );
    expect(() => expectAccessiblePressables(root())).toThrow(/inside an accessible container/);
  });

  it('fails a fixed-size target under 44pt, counting hitSlop', async () => {
    await renderWithTheme(
      <View>
        <Pressable onPress={noop} accessibilityRole="button" style={{ height: 30 }}>
          <RNText>Too small</RNText>
        </Pressable>
        <Pressable onPress={noop} accessibilityRole="button" hitSlop={7} style={{ height: 30 }}>
          <RNText>Grown by hitSlop</RNText>
        </Pressable>
      </View>
    );
    const issues = auditPressables(root());
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      name: 'Too small',
      problem: expect.stringMatching(/30pt tall/),
    });
  });

  it('ignores views that cannot be pressed and pressables hidden from screen readers', async () => {
    await renderWithTheme(
      <View>
        <Chip label="Read-only chip" />
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Pressable onPress={noop}>
            <RNText>Decorative</RNText>
          </Pressable>
        </View>
      </View>
    );
    expect(expectAccessiblePressables(root())).toHaveLength(0);
  });
});

describe('Button', () => {
  it('is a named button with a 44pt target at every size', async () => {
    await renderWithTheme(
      <View>
        <Button label="Small" size="sm" onPress={noop} />
        <Button label="Medium" onPress={noop} />
        <Button label="Large" size="lg" onPress={noop} />
      </View>
    );
    const buttons = expectAccessiblePressables(root());
    expect(buttons).toHaveLength(3);
    buttons.forEach(expectTarget);
    expect(screen.getByRole('button', { name: 'Small' })).toBeTruthy();
  });

  it('exposes disabled and loading states', async () => {
    await renderWithTheme(
      <View>
        <Button label="Pay rent" disabled onPress={noop} />
        <Button label="Save" loading loadingLabel="Saving" onPress={noop} />
      </View>
    );
    expectAccessiblePressables(root());
    expect(screen.getByRole('button', { name: 'Pay rent' })).toBeDisabled();
    const saving = screen.getByRole('button', { name: 'Saving' });
    expect(saving).toBeDisabled();
    expect(saving).toBeBusy();
  });

  it('keeps its own state when the caller adds one', async () => {
    await renderWithTheme(
      <Button label="Details" disabled accessibilityState={{ expanded: true }} onPress={noop} />
    );
    const button = screen.getByRole('button', { name: 'Details' });
    expect(button).toBeDisabled();
    expect(button).toBeExpanded();
  });
});

describe('IconButton', () => {
  it('needs a label: the icon alone has no name', async () => {
    await renderWithTheme(
      <IconButton accessibilityLabel="" icon={<Plus size={20} color="black" />} onPress={noop} />
    );
    expect(() => expectAccessiblePressables(root())).toThrow(/no accessible name/);
  });

  it('speaks its label and unread count, with a 44pt target', async () => {
    await renderWithTheme(
      <IconButton
        accessibilityLabel="Notifications"
        badge={3}
        icon={<Plus size={20} color="black" />}
        onPress={noop}
      />
    );
    const [button] = expectAccessiblePressables(root());
    expect(screen.getByRole('button', { name: 'Notifications, 3 unread' })).toBe(button);
    expectTarget(button);
  });

  it('exposes disabled, and merges a caller state instead of replacing its own', async () => {
    await renderWithTheme(
      <IconButton
        accessibilityLabel="Show monetary values"
        accessibilityState={{ expanded: false }}
        disabled
        icon={<Plus size={20} color="black" />}
        onPress={noop}
      />
    );
    expectAccessiblePressables(root());
    const button = screen.getByRole('button', { name: 'Show monetary values' });
    expect(button).toBeDisabled();
    expect(button).toBeCollapsed();
  });
});

describe('TextField', () => {
  it('labels the input from its visible label and marks it required', async () => {
    await renderWithTheme(<TextField label="Email" required value="" onChangeText={noop} />);
    const [input] = expectLabelledTextInputs(root());
    expect(input.props.accessibilityLabel).toBe('Email, required');
  });

  it('falls back to the placeholder and exposes a read-only field as disabled', async () => {
    await renderWithTheme(<TextField placeholder="Search Lekki" editable={false} />);
    const [input] = expectLabelledTextInputs(root());
    expect(input.props.accessibilityLabel).toBe('Search Lekki');
    expect(input.props.accessibilityState).toEqual({ disabled: true });
  });

  it('gives the password reveal toggle a name, a role and a 44pt target', async () => {
    await renderWithTheme(<TextField label="Password" secure value="x" onChangeText={noop} />);
    const [toggle] = expectAccessiblePressables(root());
    expect(screen.getByRole('button', { name: 'Show password' })).toBe(toggle);
    expectTarget(toggle);
    await fireEvent.press(toggle);
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeTruthy();
  });
});

describe('Chip', () => {
  it('is a selectable button with its count in the name and a 44pt target', async () => {
    await renderWithTheme(
      <View>
        <Chip label="Lekki" count={4} selected size="sm" onPress={noop} />
        <Chip label="Ikoyi" disabled onPress={noop} />
      </View>
    );
    const chips = expectAccessiblePressables(root());
    expect(chips).toHaveLength(2);
    chips.forEach(expectTarget);
    expect(screen.getByRole('button', { name: 'Lekki, 4' })).toBeSelected();
    expect(screen.getByRole('button', { name: 'Ikoyi' })).toBeDisabled();
  });
});

describe('form controls', () => {
  it('checkbox, switch and radio expose role, name and checked state', async () => {
    function Form() {
      const [checked, setChecked] = useState(false);
      const [on, setOn] = useState(true);
      const [plan, setPlan] = useState<'monthly' | 'yearly'>('yearly');
      return (
        <View>
          <Checkbox checked={checked} onChange={setChecked} label="Remember me" />
          <SwitchRow label="Rent reminders" value={on} onValueChange={setOn} />
          <RadioGroup
            label="Billing"
            value={plan}
            onChange={setPlan}
            options={[
              { value: 'monthly', label: 'Monthly' },
              { value: 'yearly', label: 'Yearly', disabled: true },
            ]}
          />
        </View>
      );
    }
    await renderWithTheme(<Form />);
    expect(expectAccessiblePressables(root())).toHaveLength(4);
    expect(screen.getByRole('checkbox', { name: 'Remember me' })).not.toBeChecked();
    expect(screen.getByRole('switch', { name: 'Rent reminders' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Yearly' })).toBeDisabled();
  });

  it('an inline link drawn shorter than 44pt still has a 44pt hit area', async () => {
    await renderWithTheme(
      <LinkButton label="Terms" accessibilityRole="link" onPress={noop} style={{ minHeight: 32 }} />
    );
    const [link] = expectAccessiblePressables(root());
    expect(screen.getByRole('link', { name: 'Terms' })).toBe(link);
    expectTarget(link);
  });

  it('segmented control tabs are named, positioned and selected', async () => {
    await renderWithTheme(
      <SegmentedControl
        accessibilityLabel="Sign-in method"
        value="password"
        onChange={noop}
        options={[
          { value: 'password', label: 'Password' },
          { value: 'magic', label: 'Magic link' },
        ]}
      />
    );
    const tabs = expectAccessiblePressables(root());
    tabs.forEach(expectTarget);
    expect(screen.getByRole('tab', { name: 'Password, 1 of 2' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Magic link, 2 of 2' })).not.toBeSelected();
  });
});

describe('card pressables', () => {
  it('a pressable card reads as one named button', async () => {
    await renderWithTheme(
      <PressableScale onPress={noop} accessibilityRole="button" accessibilityLabel="Rent due">
        <Text>Rent due</Text>
        <Text>in 3 days</Text>
      </PressableScale>
    );
    const [card] = expectAccessiblePressables(root());
    expect(screen.getByRole('button', { name: 'Rent due' })).toBe(card);
  });

  it('the listing card, its save heart and compare toggle are all reachable and named', async () => {
    await renderWithTheme(
      <PropertyCard
        property={{
          id: 'p1',
          title: '2-Bed · Lekki Phase 1',
          location: 'Lekki, Lagos',
          price: 4_500_000,
          period: 'year',
          bedrooms: 2,
          verified: true,
        }}
        onPress={noop}
        onToggleSave={noop}
        onToggleCompare={noop}
        compareDisabled
      />
    );
    expect(expectAccessiblePressables(root())).toHaveLength(3);
    expect(
      screen.getByRole('button', {
        name: /^2-Bed · Lekki Phase 1, Lekki, Lagos, 4,500,000 naira per year/,
      })
    ).toBeTruthy();
    expectTarget(screen.getByRole('button', { name: 'Save 2-Bed · Lekki Phase 1' }));
    expect(screen.getByRole('button', { name: 'Compare 2-Bed · Lekki Phase 1' })).toBeDisabled();
  });

  it('a listing card without an onPress is not announced as a button', async () => {
    await renderWithTheme(
      <PropertyCard property={{ id: 'p2', title: 'Studio', location: 'Yaba', price: 900_000 }} />
    );
    expect(expectAccessiblePressables(root())).toHaveLength(0);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
