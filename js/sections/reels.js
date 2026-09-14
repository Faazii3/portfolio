// REELS — a horizontal strip of reels under Selected Work.
//
// Every card autoplays its clip (the card's href, built by tools/make-reels.ps1) muted and looped
// as soon as it is on screen, whether the page scrolls it in or the strip does, and pauses it when
// it leaves. The card's <img> poster stays on top until the loop is really playing, so a blocked
// autoplay still shows a frame. Tapping plays the same clip with sound in the player dialog, which
// reuses what the card already buffered. The toggle in the bar pauses/resumes all loops;
// data-saver visitors, and browsers that refuse muted autoplay, start with it paused.
import { env, lockScroll } from '../core/env.js';

const { gsap } = window;

export function initReels() {
  const root = document.querySelector('.reels');
  const modal = document.querySelector('.reel-modal');
  if (!root || !modal) return;

  const track = root.querySelector('.reels__track');
  const cards = [...root.querySelectorAll('.reel__card')];
  const [prev, next] = root.querySelectorAll('.reels__btn[data-dir]');
  const toggle = root.querySelector('.reels__toggle');
  const bar = root.querySelector('.reels__progress i');

  // ---- card loops
  const clips = new Map();     // card -> <video> (null once its file failed)
  const onScreen = new Set();  // cards at least 35% visible
  let paused = Boolean(navigator.connection?.saveData);

  const clipFor = (card) => {
    if (clips.has(card)) return clips.get(card);
    const video = document.createElement('video');
    video.className = 'reel__video';
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.disablePictureInPicture = true;
    video.setAttribute('muted', '');       // iOS and in-app browsers read the attributes
    video.setAttribute('playsinline', '');
    video.setAttribute('aria-hidden', 'true');
    video.preload = 'auto';
    video.addEventListener('playing', () => card.classList.add('is-playing'), { once: true });
    video.addEventListener('error', () => {
      video.remove();
      clips.set(card, null); // the poster stays, and tapping still opens the player
    }, { once: true });

    // Loop window: a clip that opens or closes on black loops only the part in between
    // (data-loop-start/-end, measured by make-reels.ps1), so the card never blinks to black.
    const start = Number(card.dataset.loopStart) || 0;
    const end = Number(card.dataset.loopEnd) || 0;
    const line = card.querySelector('.reel__time');
    video.loop = !start && !end;
    let src = card.getAttribute('href');
    const rewind = () => { if (!video.seeking) video.currentTime = start; };
    if (!video.loop) {
      if (start) src += `#t=${start}`; // first play begins past the black
      video.addEventListener('ended', () => { rewind(); play(card); });
    }
    // Per shown frame: move the playback line through the loop window, and jump back on the last
    // real frame before a black tail, so that frame (not black) is what shows while seeking.
    const onFrame = (time, lead) => {
      const span = (end || video.duration) - start;
      if (line && span > 0) line.style.setProperty('--t', Math.min(1, Math.max(0, (time - start) / span)).toFixed(4));
      if (end && time >= end - lead) rewind();
    };
    if ('requestVideoFrameCallback' in video) {
      const watch = (now, frame) => {
        onFrame(frame.mediaTime, 0.05);
        video.requestVideoFrameCallback(watch);
      };
      video.requestVideoFrameCallback(watch);
    } else {
      video.addEventListener('timeupdate', () => onFrame(video.currentTime, 0.3));
    }
    video.src = src;
    card.querySelector('.reel__poster').after(video);
    clips.set(card, video);
    return video;
  };

  const play = (card) => {
    if (paused || modal.open || document.hidden || !onScreen.has(card)) return;
    const video = clipFor(card);
    video?.play().catch((err) => {
      // Refused outright (iOS Low Power Mode, strict in-app browsers): keep the posters and
      // flip the toggle to "play", so one real tap starts the loops.
      if (err?.name === 'NotAllowedError') setPaused(true);
    });
  };
  const pauseAll = () => clips.forEach((video) => video?.pause());
  const resume = () => onScreen.forEach(play);

  const setPaused = (value) => {
    paused = value;
    toggle.setAttribute('aria-pressed', String(paused));
    if (paused) pauseAll(); else resume();
  };
  setPaused(paused);
  toggle.addEventListener('click', () => setPaused(!paused));

  const io = new IntersectionObserver((entries) => {
    entries.forEach(({ target: card, isIntersecting }) => {
      if (isIntersecting) {
        onScreen.add(card);
        play(card);
      } else {
        onScreen.delete(card);
        clips.get(card)?.pause();
      }
    });
  }, { threshold: 0.35 });
  cards.forEach((card) => io.observe(card));

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseAll(); else resume();
  });

  // ---- overflow state, arrows, progress thumb
  const sync = () => {
    const max = track.scrollWidth - track.clientWidth;
    const atStart = track.scrollLeft <= 2;
    const atEnd = track.scrollLeft >= max - 2;
    root.classList.toggle('is-static', max <= 2);
    // move focus off an arrow before disabling it, so keyboard users keep their place.
    // The other arrow may still be disabled (one jump from end to end), and it may be
    // scrolled out of view, which must not drag the page back to it.
    const handOff = (from, to) => {
      if (document.activeElement !== from) return;
      to.disabled = false;
      to.focus({ preventScroll: true });
    };
    if (atEnd && !atStart) handOff(next, prev);
    if (atStart && !atEnd) handOff(prev, next);
    prev.disabled = atStart;
    next.disabled = atEnd;
    bar.style.setProperty('--w', `${(track.clientWidth / Math.max(track.scrollWidth, 1)) * 100}%`);
    bar.style.setProperty('--p', max > 0 ? String(track.scrollLeft / max) : '0');
  };
  track.addEventListener('scroll', sync, { passive: true });
  new ResizeObserver(sync).observe(track);
  sync();

  const step = () => {
    const item = cards[0]?.parentElement;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 16;
    return (item ? item.getBoundingClientRect().width : 260) + gap;
  };
  [prev, next].forEach((btn) => btn.addEventListener('click', () => {
    track.scrollBy({ left: Number(btn.dataset.dir) * step(), behavior: env.reduced ? 'auto' : 'smooth' });
  }));

  // ---- mouse drag (touch keeps native scrolling)
  let drag = null;
  let suppressClick = false;
  const endDrag = () => {
    if (!drag) return;
    if (drag.moved > 6) suppressClick = true;
    drag = null;
    track.classList.remove('is-dragging');
  };
  track.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag = { id: e.pointerId, x: e.clientX, left: track.scrollLeft, moved: 0 };
    suppressClick = false;
  });
  track.addEventListener('pointermove', (e) => {
    if (!drag) return;
    // the button was released somewhere we didn't hear about — stop dragging
    if (!(e.buttons & 1)) { endDrag(); suppressClick = false; return; }
    const dx = e.clientX - drag.x;
    drag.moved = Math.max(drag.moved, Math.abs(dx));
    if (drag.moved > 6 && !track.classList.contains('is-dragging')) {
      track.classList.add('is-dragging');
      try { track.setPointerCapture(drag.id); } catch { /* pointer already gone */ }
    }
    if (track.classList.contains('is-dragging')) track.scrollLeft = drag.left - dx;
  });
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('lostpointercapture', endDrag);
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  track.addEventListener('dragstart', (e) => e.preventDefault());
  // a drag that ends over a card must not also open it
  track.addEventListener('click', (e) => {
    if (!suppressClick) return;
    suppressClick = false;
    e.preventDefault();
    e.stopPropagation();
  }, true);

  // ---- player dialog
  const frameHost = modal.querySelector('.reel-modal__frame');
  const indexEl = modal.querySelector('[data-reel-index]');
  const nameEl = modal.querySelector('[data-reel-name]');
  const closeBtn = modal.querySelector('.reel-modal__close');
  let player = null;
  let backdropPress = false;

  const unloadPlayer = () => {
    if (!player) return;
    player.pause();
    player.removeAttribute('src');
    player.load(); // drops the buffered stream and frees the decoder, which in-app browsers ration
    player.remove();
    player = null;
  };

  const open = (card) => {
    unloadPlayer();
    player = document.createElement('video');
    player.controls = true;
    player.playsInline = true;
    player.loop = true;
    player.preload = 'auto';
    player.setAttribute('playsinline', '');
    const poster = card.querySelector('.reel__poster');
    if (poster) player.poster = poster.currentSrc || poster.src; // lazy posters may not have loaded yet
    player.src = card.getAttribute('href');
    frameHost.replaceChildren(player);
    modal.classList.toggle('is-landscape', card.dataset.orientation === 'landscape');
    indexEl.textContent = card.querySelector('.reel__index')?.textContent || '';
    nameEl.textContent = card.dataset.name || 'Reel';
    pauseAll();
    backdropPress = false;
    modal.showModal();
    closeBtn.focus({ preventScroll: true });
    lockScroll('reel', true);
    player.play().catch(() => {}); // still inside the tap, so sound is allowed; otherwise the controls are there
  };

  modal.addEventListener('close', () => {
    unloadPlayer();
    lockScroll('reel', false);
    resume();
  });
  closeBtn.addEventListener('click', () => modal.close());

  // backdrop: close only on a click that starts and ends outside the player. Drags that
  // leave the player, and the second click of the double-click that opened it, don't count.
  modal.addEventListener('pointerdown', (e) => { backdropPress = e.target === modal; });
  modal.addEventListener('pointerup', (e) => { if (e.target !== modal) backdropPress = false; });
  modal.addEventListener('click', (e) => {
    const close = backdropPress && e.target === modal && e.detail < 2;
    backdropPress = false;
    if (close) modal.close();
  });

  cards.forEach((card) => {
    card.setAttribute('aria-haspopup', 'dialog');
    card.addEventListener('click', (e) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // let new-tab gestures through
      e.preventDefault();
      open(card);
    });
  });

  gsap.from(root.querySelectorAll('.reel'), {
    y: 60, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08,
    scrollTrigger: { trigger: root, start: 'top 85%', once: true },
  });
}
