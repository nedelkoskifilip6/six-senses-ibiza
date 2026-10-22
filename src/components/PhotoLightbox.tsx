import { useEffect, useId, useRef, useState, type KeyboardEvent, type TouchEvent } from 'react';
import { photoDimensions, photoSrcSet } from '../data/photography';

interface Photo {
  image: string;
  caption: string;
}

interface OpenPhotoDetail {
  images: Photo[];
  index?: number;
}

interface PhotoLightboxProps {
  imageBase: string;
}

export default function PhotoLightbox({ imageBase }: PhotoLightboxProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [active, setActive] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const captionId = useId();
  const photo = photos[active];

  useEffect(() => {
    const openPhoto = (event: Event) => {
      const detail = (event as CustomEvent<OpenPhotoDetail>).detail;
      if (!detail || !Array.isArray(detail.images)) return;
      const images = detail.images.filter((item) => item && typeof item.image === 'string' && typeof item.caption === 'string');
      if (!images.length) return;
      if (!dialogRef.current?.open) openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setPhotos(images);
      const requestedIndex = Number.isInteger(detail.index) ? Number(detail.index) : 0;
      setActive(Math.max(0, Math.min(images.length - 1, requestedIndex)));
      setIsOpen(true);
    };
    window.addEventListener('open-photo', openPhoto);
    return () => window.removeEventListener('open-photo', openPhoto);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (!dialog.open) dialog.showModal();
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus({ preventScroll: true }));
    return () => {
      window.cancelAnimationFrame(frame);
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      if (openerRef.current?.isConnected) openerRef.current.focus({ preventScroll: true });
    };
  }, [isOpen]);

  // Load the adjacent large images only while the exhibition is open.
  useEffect(() => {
    if (!isOpen || photos.length < 2) return;
    const adjacent = [(active + 1) % photos.length, (active + photos.length - 1) % photos.length];
    adjacent.forEach((index) => {
      const next = new Image();
      next.src = `${imageBase}${photos[index].image}-1600.webp`;
    });
  }, [isOpen, active, photos, imageBase]);

  const move = (direction: number) => setActive((index) => (index + direction + photos.length) % photos.length);
  const close = () => setIsOpen(false);

  const onKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || photos.length < 2) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    else if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
    else if (event.key === 'Home') { event.preventDefault(); setActive(0); }
    else if (event.key === 'End') { event.preventDefault(); setActive(photos.length - 1); }
  };

  const onTouchStart = (event: TouchEvent) => {
    const point = event.touches[0];
    touchStart.current = point && event.touches.length === 1 ? { x: point.clientX, y: point.clientY } : null;
  };

  const onTouchEnd = (event: TouchEvent) => {
    const point = event.changedTouches[0];
    const start = touchStart.current;
    touchStart.current = null;
    if (!point || !start || photos.length < 2) return;
    const dx = point.clientX - start.x;
    const dy = point.clientY - start.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) move(dx < 0 ? 1 : -1);
  };

  return (
    <dialog
      ref={dialogRef}
      className="lightbox"
      aria-label="Photography exhibition"
      aria-describedby={photo ? captionId : undefined}
      onCancel={(event) => { event.preventDefault(); close(); }}
      onClose={close}
      onClick={(event) => { if (event.target === event.currentTarget) close(); }}
      onKeyDown={onKeyDown}
    >
      <div className="lightbox-header">
        <span className="lightbox-label">The art of being here</span>
        <button ref={closeRef} className="lightbox-close" type="button" onClick={close} aria-label="Close photo viewer">
          <span>Close</span><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" width="24" height="24"><path d="m5 5 14 14M19 5 5 19" stroke="currentColor" strokeWidth="1.2" /></svg>
        </button>
      </div>
      {photo && (
        <>
          <figure className="lightbox-figure" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onTouchCancel={() => { touchStart.current = null; }}>
            <img
              key={photo.image}
              className="lightbox-image"
              src={`${imageBase}${photo.image}-1600.webp`}
              srcSet={photoSrcSet(photo.image, imageBase)}
              sizes="100vw"
              alt={photo.caption}
              width={photoDimensions(photo.image)[0]}
              height={photoDimensions(photo.image)[1]}
              decoding="async"
              draggable={false}
            />
            <figcaption className="lightbox-caption" id={captionId} aria-live="polite" aria-atomic="true">{photo.caption}</figcaption>
          </figure>
          <div className="lightbox-controls">
            <button className="lightbox-prev" type="button" onClick={() => move(-1)} disabled={photos.length < 2} aria-label="Previous photo">
              <span>Previous</span>
            </button>
            <span className="lightbox-counter" aria-label={`Photo ${active + 1} of ${photos.length}`}><span>{String(active + 1).padStart(2, '0')}</span> / {String(photos.length).padStart(2, '0')}</span>
            <button className="lightbox-next" type="button" onClick={() => move(1)} disabled={photos.length < 2} aria-label="Next photo">
              <span>Next</span>
            </button>
          </div>
        </>
      )}
    </dialog>
  );
}
