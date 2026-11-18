import { embedFamily, embedNavigation } from '@/lib/embedNavigation';

describe('video and tour embeds', () => {
  it('only frames a known player', () => {
    expect(embedFamily('https://www.youtube-nocookie.com/embed/abcdefghijk')).toContain(
      'youtube.com'
    );
    expect(embedFamily('https://my.matterport.com/show/?m=x')).toEqual(['matterport.com']);
    expect(embedFamily('https://evil.example/kuula.co')).toBeNull();
    expect(embedFamily('http://kuula.co/share/x')).toBeNull();
  });

  it('keeps navigation on the provider and sends other pages to the browser', () => {
    const family = embedFamily('https://kuula.co/share/x')!;
    expect(embedNavigation(family, 'https://kuula.co/post/y')).toBe('allow');
    expect(embedNavigation(family, 'https://login.example/sureground')).toBe('external');
    expect(embedNavigation(family, 'https://kuula.co.evil.example/')).toBe('external');
  });

  it('never hands another scheme to the OS', () => {
    const family = embedFamily('https://player.vimeo.com/video/123456')!;
    expect(embedNavigation(family, 'sureground://magic-link?token=t')).toBe('block');
    expect(embedNavigation(family, 'intent://x#Intent;end')).toBe('block');
    expect(embedNavigation(family, 'http://vimeo.com/')).toBe('block');
  });

  it("lets a player's own frames load from its CDNs", () => {
    const family = embedFamily('https://player.vimeo.com/video/123456')!;
    expect(embedNavigation(family, 'https://f.vimeocdn.com/p/x', false)).toBe('allow');
  });
});
