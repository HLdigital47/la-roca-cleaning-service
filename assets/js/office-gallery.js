document.querySelectorAll('.of-work-gallery').forEach(gallery => {
  const track = gallery.querySelector('.of-photo-track');
  const move = direction => {
    const photo = track.querySelector('img');
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    track.scrollBy({left: direction * (photo.getBoundingClientRect().width + gap), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  };
  gallery.querySelector('[data-office-photo-prev]').addEventListener('click', () => move(-1));
  gallery.querySelector('[data-office-photo-next]').addEventListener('click', () => move(1));
});
