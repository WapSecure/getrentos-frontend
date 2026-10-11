import { embeddedVideo, tourSource, videoSource } from '@getrentos/shared';

describe('video and tour links', () => {
  it.each([
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
    'https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=30s',
    'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
  ])('plays %s as an embedded YouTube player', (url) => {
    expect(embeddedVideo(url)).toEqual({
      kind: 'youtube',
      id: 'dQw4w9WgXcQ',
      embedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&playsinline=1',
    });
  });

  it('plays a Vimeo link as an embedded Vimeo player', () => {
    expect(embeddedVideo('https://vimeo.com/76979871')).toMatchObject({
      kind: 'vimeo',
      embedUrl: 'https://player.vimeo.com/video/76979871?dnt=1',
    });
  });

  it('plays an uploaded file as a file', () => {
    expect(videoSource('https://storage.getrentos.test/landlord/x/tour.mp4?sig=1')).toEqual({
      kind: 'file',
      url: 'https://storage.getrentos.test/landlord/x/tour.mp4?sig=1',
    });
  });

  it('refuses a link that is not https', () => {
    expect(embeddedVideo('http://youtube.com/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(videoSource('javascript:alert(1)')).toBeNull();
  });

  it('frames only known 360° tour providers', () => {
    expect(tourSource('https://my.matterport.com/show/?m=abc123')).toMatchObject({
      host: 'matterport.com',
    });
    expect(tourSource('https://kuula.co/share/collection/7abc')).toMatchObject({ host: 'kuula.co' });
    expect(tourSource('https://evil.example/tour')).toBeNull();
    expect(tourSource('https://matterport.com.evil.example/x')).toBeNull();
  });
});
