import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type TouchEvent } from 'react';
import gsap from 'gsap';
import '../styles/stay-gallery.css';

export interface Accommodation {
  id: string;
  name: string;
  shortName: string;
  description: string;
  size: string;
  guests: string;
  features: string[];
  image: string;
  source: string;
}

interface StayGalleryProps { rooms: Accommodation[]; imageBase: string; }

function Arrow({ direction = 'right' }: { direction?: 'left' | 'right' }) {
  return <svg aria-hidden="true" viewBox="0 0 32 16" fill="none" width="32" height="16"><path d={direction === 'left' ? 'M30 8H2m0 0 7-7M2 8l7 7' : 'M2 8h28m0 0-7-7m7 7-7 7'} stroke="currentColor" strokeWidth="1.2" /></svg>;
}

const number = (value: number) => String(value + 1).padStart(2, '0');

export default function StayGallery({ rooms, imageBase }: StayGalleryProps) {
  const [active, setActive] = useState(0);
  const [previous, setPrevious] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal'>('vertical');
  const instanceId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLImageElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeRef = useRef(0);
  const readyImageRef = useRef(0);
  const directionRef = useRef(1);
  const initializedRef = useRef(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const room = rooms[active];
  const previousRoom = rooms[previous];
  const nextRoom = rooms[(active + 1) % rooms.length];

  useEffect(() => {
    const media = window.matchMedia('(max-width: 850px)');
    const update = () => setOrientation(media.matches ? 'horizontal' : 'vertical');
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (rooms.length < 2) return;
    const width = window.innerWidth < 700 ? 800 : 1600;
    const adjacent = new Set([(active + 1) % rooms.length, (active + rooms.length - 1) % rooms.length]);
    for (const index of adjacent) {
      const image = new Image();
      image.src = `${imageBase}${rooms[index].image}-${width}.webp`;
    }
  }, [active, imageBase, rooms]);

  useLayoutEffect(() => {
    if (!initializedRef.current) { initializedRef.current = true; return; }
    const image = photoRef.current;
    const copy = storyRef.current?.querySelectorAll('[data-stay-reveal]');
    if (!image || !copy?.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let imageTween: gsap.core.Tween | undefined;
    let disposed = false;
    const fromRight = directionRef.current > 0;
    gsap.set(image, { clipPath: fromRight ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)', scale: 1.045 });
    const textTween = gsap.fromTo(copy, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: .62, stagger: .045, ease: 'power2.out', overwrite: true, clearProps: 'transform,opacity' });
    const reveal = () => {
      if (disposed) return;
      readyImageRef.current = active;
      imageTween = gsap.to(image, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: .95, ease: 'power3.inOut', overwrite: true });
    };
    if (image.complete && image.naturalWidth) reveal();
    else image.addEventListener('load', reveal, { once: true });
    return () => {
      disposed = true;
      image.removeEventListener('load', reveal);
      imageTween?.kill();
      textTween.kill();
      gsap.set(copy, { clearProps: 'transform,opacity' });
    };
  }, [active]);

  if (!room || !previousRoom || !nextRoom) return null;

  const selectRoom = (index: number, focusTab = false) => {
    const next = ((index % rooms.length) + rooms.length) % rooms.length;
    if (next !== activeRef.current) {
      directionRef.current = index >= activeRef.current ? 1 : -1;
      setPrevious(readyImageRef.current);
      activeRef.current = next;
      setActive(next);
      setDetailsOpen(false);
    }
    if (focusTab) {
      tabRefs.current[next]?.focus({ preventScroll: true });
      if (orientation === 'horizontal') tabRefs.current[next]?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
    }
  };

  const openCollection = () => {
    const images = rooms.filter((item, index, all) => all.findIndex((candidate) => candidate.image === item.image) === index);
    window.dispatchEvent(new CustomEvent('open-photo', {
      detail: {
        images: images.map((item) => ({ image: item.image, caption: `${item.name} · Illustrative design reference, not the actual accommodation` })),
        index: Math.max(0, images.findIndex((item) => item.image === room.image)),
      },
    }));
  };

  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    let next: number;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = index + 1;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = index - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = rooms.length - 1;
    else return;
    event.preventDefault(); event.stopPropagation(); selectRoom(next, true);
  };

  const onGalleryKey = (event: KeyboardEvent<HTMLElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    const target = event.target as HTMLElement;
    if (target.matches('input, select, textarea, [contenteditable="true"]')) return;
    event.preventDefault();
    if (target.closest('.stay-detail-fold')) panelRef.current?.focus({ preventScroll: true });
    selectRoom(activeRef.current + (event.key === 'ArrowLeft' ? -1 : 1));
  };

  const onTouchStart = (event: TouchEvent) => {
    const point = event.touches[0];
    touchStart.current = point && event.touches.length === 1 ? { x: point.clientX, y: point.clientY } : null;
  };
  const onTouchEnd = (event: TouchEvent) => {
    const point = event.changedTouches[0]; const start = touchStart.current; touchStart.current = null;
    if (!point || !start) return;
    const dx = point.clientX - start.x; const dy = point.clientY - start.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) selectRoom(activeRef.current + (dx < 0 ? 1 : -1));
  };

  const titleStart = room.name.startsWith('Sea View ') ? 'Sea View' : room.name.split(' ')[0];
  const titleEnd = room.name.slice(titleStart.length).trim();

  return (
    <section className="stay-explorer" aria-label="The accommodation collection" aria-roledescription="carousel" onKeyDown={onGalleryKey}>
      <div className="stay-atlas">
        <aside className="stay-rail">
          <div className="stay-directory-heading"><span className="stay-micro">THE COLLECTION</span><p>Not simply a room.<br /><span>A way of being.</span></p></div>
          <div className="stay-directory" role="tablist" aria-label="Choose your accommodation" aria-orientation={orientation}>
            {rooms.map((item, index) => <button
              key={item.id} type="button" role="tab" className={`stay-category${active === index ? ' stay-category-active' : ''}`}
              id={`${instanceId}-tab-${index}`} aria-controls={`${instanceId}-panel`} aria-selected={active === index} tabIndex={active === index ? 0 : -1}
              ref={(node) => { tabRefs.current[index] = node; }} onClick={() => selectRoom(index)} onKeyDown={(event) => onTabKey(event, index)}
            ><span className="stay-category-number">{number(index)}</span><span className="stay-category-name">{item.shortName}</span><span className="stay-category-mark" aria-hidden="true">↗</span></button>)}
          </div>
          <button type="button" className="stay-next-preview" onClick={() => selectRoom(activeRef.current + 1)} aria-label={`Explore next: ${nextRoom.name}`}>
            <span className="stay-next-image"><img src={`${imageBase}${nextRoom.image}-800.webp`} alt="" width="800" height="600" loading="lazy" decoding="async" /></span>
            <span className="stay-next-caption"><span>NEXT IN THE COLLECTION</span><span aria-hidden="true">↗</span></span>
            <span className="stay-next-name">{nextRoom.shortName}</span>
          </button>
        </aside>

        <div ref={panelRef} className="stay-suite" role="tabpanel" id={`${instanceId}-panel`} aria-labelledby={`${instanceId}-tab-${active}`} tabIndex={0}>
          <div className="stay-photo-stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onTouchCancel={() => { touchStart.current = null; }}>
            <img className="stay-photo-underlay" src={`${imageBase}${previousRoom.image}-1600.webp`} alt="" aria-hidden="true" width="1600" height="1100" loading="lazy" decoding="async" />
            <img ref={photoRef} key={room.id} className="stay-photo-current" src={`${imageBase}${room.image}-1600.webp`} srcSet={`${imageBase}${room.image}-800.webp 800w, ${imageBase}${room.image}-1600.webp 1600w, ${imageBase}${room.image}-2400.webp 2400w`} sizes="(max-width: 850px) 90vw, 65vw" alt={`Illustrative architectural reference for ${room.name}; not the actual Six Senses accommodation`} width="1600" height="1100" loading="lazy" decoding="async" onLoad={() => { readyImageRef.current = active; }} />
            <span className="stay-photo-index" aria-hidden="true"><span>N°</span>{number(active)}</span>
            <button type="button" className="stay-open-collection" onClick={openCollection} aria-label="Open the illustrative accommodation photo collection full screen"><svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" stroke="currentColor" strokeWidth="1.2" /></svg><span>VIEW THE COLLECTION</span></button>
          </div>
          <div className="stay-photo-ledger"><span>SPACES FOR SLOWER DAYS</span><span>ILLUSTRATIVE PHOTOGRAPHY</span><div className="stay-step-controls"><button type="button" aria-label="Previous accommodation" onClick={() => selectRoom(activeRef.current - 1)}><Arrow direction="left" /></button><span aria-hidden="true">{number(active)} <span className="stay-ledger-divider">/</span> {String(rooms.length).padStart(2, '0')}</span><button type="button" aria-label="Next accommodation" onClick={() => selectRoom(activeRef.current + 1)}><Arrow /></button></div></div>
          <div ref={storyRef} className="stay-editorial">
            <div className="stay-title-block" data-stay-reveal><span className="stay-micro">YOUR OWN PIECE OF THE ISLAND</span><h3 className="stay-suite-title" aria-label={room.name}><span>{titleStart}</span><span className="stay-title-line">{titleEnd}</span></h3></div>
            <div className="stay-suite-copy">
              <p className="stay-suite-description" data-stay-reveal>{room.description}</p>
              <dl className="stay-room-facts" data-stay-reveal><div><dt>SPACE</dt><dd>{room.size}</dd></div><div><dt>GUESTS</dt><dd>{room.guests}</dd></div></dl>
              <button type="button" className="stay-disclosure" aria-expanded={detailsOpen} aria-controls={`${instanceId}-details`} onClick={() => setDetailsOpen((open) => !open)}><span>{detailsOpen ? 'A closer look, complete' : 'A closer look'}</span><span className="stay-disclosure-symbol" aria-hidden="true">{detailsOpen ? '−' : '+'}</span></button>
            </div>
          </div>
          <div className="stay-detail-fold" data-open={detailsOpen} aria-hidden={!detailsOpen} inert={!detailsOpen} id={`${instanceId}-details`}>
            <div className="stay-detail-clip"><div className="stay-detail-content"><div><span className="stay-micro">THE CONSIDERED DETAILS</span><p>Made for<br /><span>unhurried living.</span></p></div><div><ul className="stay-room-features">{room.features.map((feature) => <li key={feature}><span aria-hidden="true">—</span>{feature}</li>)}</ul><a className="stay-official-source" href={room.source} target="_blank" rel="noopener noreferrer">Explore this space on Six Senses <span aria-hidden="true">↗</span><span className="stay-accessible-only"> (opens in a new tab)</span></a></div></div></div>
          </div>
          <p className="stay-factual-note">The photographs express a Mediterranean mood and do not depict the listed accommodations. Room details are sourced from Six Senses.</p>
        </div>
      </div>
      <p className="stay-accessible-only" aria-live="polite" aria-atomic="true">Accommodation {active + 1} of {rooms.length}: {room.name}.</p>
    </section>
  );
}
