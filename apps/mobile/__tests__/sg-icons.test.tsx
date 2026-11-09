import { render } from '@testing-library/react-native';
import { ArrowRight, Heart, ShieldCheck, type SgIcon } from '@sureground/icons/native';

describe('Sureground native icons', () => {
  it('draws strokes in the given colour and the body as a tint', async () => {
    const { toJSON } = await render(<ShieldCheck color="#0057d9" size={20} />);
    const tree = JSON.stringify(toJSON());
    // react-native-svg encodes colours as ARGB integers: 0xFF0057D9.
    expect(tree).toContain(String(0xff0057d9));
    expect(tree).toContain('"strokeWidth":1.75');
    expect(tree).toContain('"fillOpacity":0.16');
  });

  it('paints the body solid when given a fill colour', async () => {
    const { toJSON } = await render(<Heart color="#c81e1e" fill="#c81e1e" />);
    expect(JSON.stringify(toJSON())).not.toContain('"fillOpacity":0.16');
  });

  it('is usable wherever a component type is expected', async () => {
    const Icon: SgIcon = ArrowRight;
    expect(Icon.displayName).toBe('ArrowRight');
    await expect(render(<Icon size={16} color="black" />)).resolves.toBeDefined();
  });
});
