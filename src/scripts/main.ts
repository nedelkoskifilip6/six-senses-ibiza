import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { visualJournal } from '../data/photography';
gsap.registerPlugin(ScrollTrigger);

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const imageBase = new URL('images/', document.querySelector<HTMLLinkElement>('link[rel="icon"]')!.href).pathname;
const official = 'https://www.sixsenses.com/en/hotels-resorts/europe/spain/ibiza/';
const header = document.querySelector<HTMLElement>('.site-header');
let ticking = false;
const updateHeader = () => { header?.classList.toggle('is-scrolled', !document.querySelector('.hero-story') || window.scrollY > window.innerHeight * .20); ticking = false; };
window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(updateHeader); ticking = true; } }, {passive:true});
updateHeader();

// The same quiet editorial menu is available on every viewport. Native dialog
// semantics keep focus contained; closing restores the original scroll lock.
const menu = document.querySelector<HTMLDialogElement>('#mobile-menu');
const menuToggle = document.querySelector<HTMLButtonElement>('.menu-toggle');
let menuOverflow = '';
let menuEntrance:gsap.core.Tween | undefined;
let menuNeedsRestore = false;
let menuFocusDestination:HTMLElement | null = null;
const restoreMenu = () => {
  if (!menuNeedsRestore) return;
  menuNeedsRestore = false;
  menuEntrance?.kill();
  if (menu) gsap.set(menu.querySelectorAll('nav a'),{clearProps:'transform,opacity'});
  document.body.style.overflow = menuOverflow;
  menuToggle?.setAttribute('aria-expanded','false');
  const destination = menuFocusDestination;
  menuFocusDestination = null;
  if (destination) {
    const focusTarget = destination.querySelector<HTMLElement>('h1,h2') || destination;
    if (!focusTarget.hasAttribute('tabindex')) {
      focusTarget.setAttribute('tabindex','-1');
      focusTarget.addEventListener('blur',() => focusTarget.removeAttribute('tabindex'),{once:true});
    }
    focusTarget.focus({preventScroll:true});
  } else menuToggle?.focus({preventScroll:true});
};
const closeMenu = () => {
  if (!menu?.open) return;
  menu.close();
  // Restore the scroll container before a link can begin its fragment navigation.
  restoreMenu();
};
menuToggle?.addEventListener('click', () => {
  if (!menu || menu.open) return;
  menuOverflow = document.body.style.overflow;
  menu.showModal();
  menuNeedsRestore = true;
  menuFocusDestination = null;
  document.body.style.overflow = 'hidden';
  menuToggle.setAttribute('aria-expanded','true');
  if (!reducedMotion.matches) {
    menuEntrance = gsap.fromTo(menu.querySelectorAll('nav a'),
      {y:8,opacity:0},
      {y:0,opacity:1,duration:.48,stagger:.035,ease:'power2.out',clearProps:'transform,opacity'});
  }
});
menu?.querySelector('.menu-close')?.addEventListener('click',closeMenu);
menu?.addEventListener('cancel',event => { event.preventDefault(); closeMenu(); });
menu?.addEventListener('close',() => { if (!menu.open) restoreMenu(); });
menu?.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(link => {
  link.addEventListener('click',event => {
    const url = new URL(link.href);
    const samePage = url.origin === location.origin && url.pathname === location.pathname && url.search === location.search;
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank' || !samePage || !url.hash) {
      closeMenu();
      return;
    }
    const destination = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!destination) { closeMenu(); return; }
    event.preventDefault();
    menuFocusDestination = destination;
    closeMenu();
    // Push the fragment without starting a second browser-managed smooth scroll.
    if (location.hash !== url.hash) history.pushState(null,'',url.href);
    // Let the dialog close event and restored scrollbar settle before scrolling.
    // Refreshing ScrollTrigger here would restore an earlier scroll position while
    // the browser is still carrying out its smooth scroll.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      destination.scrollIntoView({block:'start',behavior:'instant'});
    }));
  });
});

// A single reversible timeline turns the arrival photograph into an architectural
// spread. Geometry belongs to this timeline alone, including on a viewport change.
const media = gsap.matchMedia();
ScrollTrigger.config({ignoreMobileResize:true});
if (document.querySelector('.hero-story')) media.add({
  desktop:'(min-width: 701px)',
  mobile:'(max-width: 700px)',
  reduce:'(prefers-reduced-motion: reduce)',
}, context => {
  const {desktop,reduce} = context.conditions!;
  const stage=document.querySelector<HTMLElement>('.hero-stage');
  if (reduce) {
    stage?.classList.add('is-static');
    return () => stage?.classList.remove('is-static');
  }

  gsap.set('.hero-photo-frame',{left:0,top:0,width:'100%',height:'100%'});
  const intro=gsap.timeline({defaults:{ease:'power2.out'}});
  if (window.scrollY < 50) {
    intro.from('.hero-photo',{opacity:.65,scale:1.025,duration:1.05},0)
      .from('.site-header',{opacity:0,y:-6,duration:.65},.08)
      .from('.hero-kicker',{opacity:0,y:8,duration:.65},.12)
      .from('.hero-line',{opacity:0,y:18,duration:.85,stagger:.09},.2)
      .from('.hero-bottom',{opacity:0,y:10,duration:.75},.46);
  }

  const cinematic=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{
    trigger:'.hero-story',start:'top top',
    end:() => `+=${window.innerHeight * (desktop?1.55:.95)}`,
    pin:'.hero-stage',pinSpacing:true,scrub:desktop?.55:.2,
    anticipatePin:1,invalidateOnRefresh:true,
  }});
  cinematic.to('.hero-content',{autoAlpha:0,y:desktop?-20:-12,duration:.28},0)
    .to('.hero-foot,.hero-photo-note',{autoAlpha:0,duration:.2},0)
    .to('.hero-photo-frame',{
      left:desktop?'24%':'6%',top:desktop?'10%':'7%',
      width:desktop?'70%':'88%',height:desktop?'78%':'76%',
      duration:.44,ease:'power1.inOut',
    },.06)
    .to('.hero-shade',{opacity:0,duration:.45},.06)
    .to('.hero-photo-frame',{
      left:desktop?'38%':'6%',top:desktop?'12%':'8%',
      width:desktop?'56%':'88%',height:desktop?'68%':'50%',
      duration:.58,ease:'power1.inOut',
    },.5)
    .fromTo('.transition-copy',
      {autoAlpha:0,y:12},
      {autoAlpha:1,y:0,duration:.42,ease:'power2.out'},.63);
  if (desktop) cinematic.fromTo('.frame-secondary',
    {autoAlpha:0,y:10},
    {autoAlpha:1,y:0,duration:.44,ease:'power2.out'},.7);
  cinematic.to({}, {duration:.12});

  gsap.utils.toArray<HTMLElement>('.reveal').forEach(element => {
    gsap.from(element,{y:desktop?14:10,opacity:0,duration:.72,ease:'power2.out',
      scrollTrigger:{trigger:element,start:'top 94%',once:true}});
  });
  gsap.utils.toArray<HTMLElement>('.reveal-image').forEach(element => {
    gsap.from(element,{y:12,opacity:0,duration:.85,ease:'power2.out',
      scrollTrigger:{trigger:element,start:'top 95%',once:true}});
  });
  if (desktop) {
    const architecturalImages = [
      {image:'.sanctuary-visual img',trigger:'.sanctuary-visual'},
      {image:'.living-frame > img',trigger:'.living-frame'},
    ];
    architecturalImages.forEach(({image,trigger}) => {
      if (!document.querySelector(image)) return;
      gsap.fromTo(image,{scale:1.035,yPercent:-1},{scale:1.035,yPercent:1,ease:'none',
        scrollTrigger:{trigger,start:'top bottom',end:'bottom top',scrub:1.2}});
    });
  }
  return () => intro.kill();
});
document.fonts.ready.then(() => ScrollTrigger.refresh());
window.addEventListener('load', () => ScrollTrigger.refresh(),{once:true});
// Suite details can change the length of the page after hydration.
const staySection=document.querySelector('#stay');
if (staySection) {
  let refreshTimer:ReturnType<typeof setTimeout>;
  let lastHeight=0;
  new ResizeObserver(entries => {
    const height=entries[0]?.contentRect.height || 0;
    if (Math.abs(height-lastHeight)<1) return;
    lastHeight=height;
    clearTimeout(refreshTimer);
    refreshTimer=setTimeout(()=>ScrollTrigger.refresh(),180);
  }).observe(staySection);
}

// Experiences: manual switching, roving keyboard focus, no motion autoplay.
const experiences = [
  {image:'kayak',position:'50% 4%',alt:'Paddleboarders on the Mediterranean at golden hour; illustrative coastal photography',category:'COASTAL EXPLORATION',description:'Explore hidden caves and sheltered bays on the resort’s guided kayak sunset tour. The northern coast, from a different perspective.',url:'experiences/watersport-tour/'},
  {image:'sunset',position:'50% 50%',alt:'The outline of Es Vedrà at sunset in Ibiza; illustrative destination photography',category:'SUNSET CEREMONY',description:'Watch the light soften and the horizon turn gold. The resort’s sunset ceremony offers a quiet moment to pause and mark the close of the day.',url:'experiences/sunset-ceremony/'},
  {image:'olive',position:'40% 50%',alt:'A sunlit olive branch, illustrative of the Mediterranean landscape',category:'CULTURE & CONSCIOUS LIVING',description:'Discover island traditions through Hierbas and Flaó at Can Tanca, or explore resourceful everyday living in a Zero Waste Workshop.',url:'experiences/'},
];
const experienceTabs = [...document.querySelectorAll<HTMLButtonElement>('[data-experience]')];
const experienceTablist = document.querySelector<HTMLElement>('.experience-tabs[role="tablist"]');
const experienceMobile = window.matchMedia('(max-width: 700px)');
const updateExperienceOrientation = () => experienceTablist?.setAttribute('aria-orientation',experienceMobile.matches?'horizontal':'vertical');
updateExperienceOrientation();
experienceMobile.addEventListener('change',updateExperienceOrientation);
let experienceIndex=0;
const setExperience = (index:number,focus=false) => {
  experienceIndex=(index+experiences.length)%experiences.length;
  const item=experiences[experienceIndex];
  experienceTabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===experienceIndex));tab.tabIndex=i===experienceIndex?0:-1;});
  document.querySelector('#experience-panel')?.setAttribute('aria-labelledby',`exp-tab-${experienceIndex}`);
  document.querySelector('#experience-category')!.textContent=item.category;
  document.querySelector('#experience-description')!.textContent=item.description;
  (document.querySelector('#experience-link') as HTMLAnchorElement).href=official+item.url;
  const img=document.querySelector<HTMLImageElement>('.experience-photo img')!;
  const largestWidth=['kayak','olive'].includes(item.image)?2000:2400;
  img.srcset=`${imageBase}${item.image}-800.webp 800w, ${imageBase}${item.image}-1600.webp 1600w, ${imageBase}${item.image}-2400.webp ${largestWidth}w`;
  img.src=`${imageBase}${item.image}-1600.webp`;
  img.alt=item.alt;
  img.style.objectPosition=item.position;
  document.querySelector('.experience-photo-count')!.textContent=`0${experienceIndex+1} / 03`;
  if (!reducedMotion.matches) gsap.fromTo(img,{opacity:.55,scale:1.025},{opacity:1,scale:1,duration:.7,overwrite:true,ease:'power2.out'});
  if (!reducedMotion.matches) gsap.fromTo('.experience-details',{opacity:.4,y:8},{opacity:1,y:0,duration:.5,overwrite:true});
  if (focus) experienceTabs[experienceIndex].focus({preventScroll:true});
};
experienceTabs.forEach((tab,i) => {
  tab.addEventListener('click',()=>setExperience(i));
  tab.addEventListener('keydown',event=>{
    if (!['ArrowRight','ArrowLeft','ArrowDown','ArrowUp','Home','End'].includes(event.key)) return;
    event.preventDefault();
    setExperience(event.key==='Home'?0:event.key==='End'?2:i+(['ArrowLeft','ArrowUp'].includes(event.key)?-1:1),true);
  });
});

// A photographic exhibition shared with the React accommodation viewer.
const galleryImages = visualJournal.map(({image, caption, location}) => ({ image, caption: `${caption} · ${location}` }));
document.querySelectorAll<HTMLButtonElement>('[data-gallery-index]').forEach(button=>{
  button.addEventListener('click',()=>window.dispatchEvent(new CustomEvent('open-photo',{detail:{images:galleryImages,index:Number(button.dataset.galleryIndex)}})));
});
document.querySelectorAll<HTMLButtonElement>('[data-gallery-scroll]').forEach(button => {
  button.addEventListener('click',()=>{
    const track=document.querySelector<HTMLElement>('.gallery-track')!;
    track.scrollBy({left:Number(button.dataset.galleryScroll)*track.clientWidth*.75,behavior:reducedMotion.matches?'instant':'smooth'});
  });
});

// Local planning only. No personal details leave the browser and no availability is implied.
const form=document.querySelector<HTMLFormElement>('#booking-form');
const checkin=document.querySelector<HTMLInputElement>('#checkin');
const checkout=document.querySelector<HTMLInputElement>('#checkout');
const localISO=(date:Date)=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
if (form && checkin && checkout) {
  form.querySelector<HTMLButtonElement>('.booking-submit')!.disabled=false;
  const guestSelect=document.querySelector<HTMLSelectElement>('#guests')!;
  const spaceSelect=document.querySelector<HTMLSelectElement>('#accommodation')!;
  const reconcileGuests=()=>{
    const maximum=Number(spaceSelect.selectedOptions[0].dataset.maxGuests)||10;
    [...guestSelect.options].forEach(option=>{option.disabled=Number(option.value)>maximum;});
    if (Number(guestSelect.value)>maximum) guestSelect.value=String(maximum);
    document.querySelector('#guest-capacity')!.textContent=maximum<10?`${spaceSelect.value}: up to ${maximum} guests. Larger groups can explore Private Residences.`:'';
  };
  spaceSelect.addEventListener('change',reconcileGuests);
  reconcileGuests();
  const today=new Date();
  checkin.min=localISO(today);
  const tomorrow=new Date(today);tomorrow.setDate(tomorrow.getDate()+1);
  checkout.min=localISO(tomorrow);
  const reconcileDates=()=>{
    if (!checkin.value) return;
    const minCheckout=new Date(`${checkin.value}T12:00:00`);minCheckout.setDate(minCheckout.getDate()+1);
    checkout.min=localISO(minCheckout);
    if (checkout.value && checkout.value<=checkin.value) checkout.value='';
    checkout.setCustomValidity('');
    document.querySelector<HTMLElement>('#booking-summary')!.hidden=true;
  };
  checkin.addEventListener('change',reconcileDates);
  reconcileDates();
  window.addEventListener('pageshow',()=>{reconcileGuests();reconcileDates();});
  form.querySelectorAll('input,select').forEach(control=>control.addEventListener('change',()=>{document.querySelector<HTMLElement>('#booking-summary')!.hidden=true;}));
  checkout.addEventListener('input',()=>checkout.setCustomValidity(''));
  form.addEventListener('submit',event=>{
    event.preventDefault();
    reconcileGuests();
    checkout.setCustomValidity(checkout.value<=checkin.value?'Please choose a check-out date after check-in.':'');
    if (!form.reportValidity()) return;
    const formatter=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric'});
    const arrive=new Date(`${checkin.value}T12:00:00`);const depart=new Date(`${checkout.value}T12:00:00`);
    const guests=document.querySelector<HTMLSelectElement>('#guests')!.value;
    const space=document.querySelector<HTMLSelectElement>('#accommodation')!.value;
    document.querySelector('#booking-plan')!.textContent=`${formatter.format(arrive)} — ${formatter.format(depart)} · ${guests} ${guests==='1'?'guest':'guests'} · ${space}.`;
    const summary=document.querySelector<HTMLElement>('#booking-summary')!;
    summary.hidden=false;summary.focus({preventScroll:true});summary.scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth',block:'nearest'});
  });
}

// Development-only accessibility audit, removed from the production bundle.
if (import.meta.env.DEV && new URLSearchParams(location.search).has('audit')) {
  import('axe-core').then(async ({default:axe}) => {
    await document.fonts.ready;
    await new Promise(resolve => setTimeout(resolve, 2000));
    const result=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});
    console.info('ACCESSIBILITY_AUDIT '+JSON.stringify({violations:result.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),passes:result.passes.length}));
  });
}
