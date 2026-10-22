import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const imageBase = new URL('images/', document.querySelector<HTMLLinkElement>('link[rel="icon"]')!.href).pathname;
const official = 'https://www.sixsenses.com/en/hotels-resorts/europe/spain/ibiza/';
const header = document.querySelector<HTMLElement>('.site-header');
let ticking = false;
const updateHeader = () => { header?.classList.toggle('is-scrolled', !document.querySelector('.hero-story') || window.scrollY > window.innerHeight * .20); ticking = false; };
window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(updateHeader); ticking = true; } }, {passive:true});
updateHeader();

// Native modal navigation keeps keyboard focus inside and restores its opener.
const menu = document.querySelector<HTMLDialogElement>('#mobile-menu');
const menuToggle = document.querySelector<HTMLButtonElement>('.menu-toggle');
let menuOverflow = '';
const closeMenu = () => {
  if (!menu?.open) return;
  menu.close();
  document.body.style.overflow = menuOverflow;
  menuToggle?.setAttribute('aria-expanded','false');
  menuToggle?.focus({preventScroll:true});
};
menuToggle?.addEventListener('click', () => {
  if (!menu) return;
  menuOverflow = document.body.style.overflow;
  menu.showModal();
  document.body.style.overflow = 'hidden';
  menuToggle.setAttribute('aria-expanded','true');
  if (!reducedMotion.matches) gsap.fromTo(menu.querySelectorAll('nav a'),{y:20,opacity:0},{y:0,opacity:1,duration:.6,stagger:.045,ease:'power2.out'});
});
menu?.querySelector('.menu-close')?.addEventListener('click',closeMenu);
menu?.addEventListener('cancel',(event) => { event.preventDefault(); closeMenu(); });
menu?.querySelectorAll('a').forEach(link => link.addEventListener('click',closeMenu));
window.matchMedia('(min-width: 961px)').addEventListener('change',event => {if (event.matches) closeMenu();});

// The photograph becomes a magazine spread. One scrubbed timeline owns its geometry,
// so forward and reverse scrolling travel through precisely the same composition.
const media = gsap.matchMedia();
ScrollTrigger.config({ignoreMobileResize:true});
if (document.querySelector('.hero-story')) media.add({ desktop:'(min-width: 701px)', mobile:'(max-width: 700px)', reduce:'(prefers-reduced-motion: reduce)' }, context => {
  const {desktop,reduce} = context.conditions!;
  const stage=document.querySelector('.hero-stage');
  if (reduce) {
    stage?.classList.add('is-static');
    return () => stage?.classList.remove('is-static');
  }
  const intro=gsap.timeline({defaults:{ease:'power3.out'}});
  if (window.scrollY < 50) {
    intro.from('.hero-photo-frame',{opacity:.3,duration:1.35},0)
      .from('.site-header',{opacity:0,y:-10,duration:.8},.1)
      .from('.hero-kicker',{opacity:0,y:14,duration:.8},.15)
      .from('.hero-line',{opacity:0,y:45,duration:1.1,stagger:.11},.25)
      .from('.hero-bottom',{opacity:0,y:12,duration:1},.6);
  }
  const cinematic=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{
    trigger:'.hero-story',start:'top top',end:() => `+=${window.innerHeight * (desktop?1.85:1.2)}`,
    pin:'.hero-stage',pinSpacing:true,scrub:desktop?.65:.25,anticipatePin:1,invalidateOnRefresh:true,
  }});
  cinematic.to('.hero-content',{autoAlpha:0,y:desktop?-60:-25,duration:.25},0)
    .to('.hero-foot,.hero-photo-note',{autoAlpha:0,duration:.18},0)
    .to('.hero-photo-frame',{left:'6%',top:'10%',width:'88%',height:'80%',duration:.4,ease:'power1.inOut'},.08)
    .to('.hero-shade',{opacity:0,duration:.4},.08)
    .to('.hero-photo-frame',{left:desktop?'47%':'6%',top:desktop?'20%':'44%',width:desktop?'47%':'88%',height:desktop?'68%':'49%',duration:.55,ease:'power2.inOut'},.42)
    .fromTo('.transition-copy',{autoAlpha:0,y:24},{autoAlpha:1,y:0,duration:.4,ease:'power2.out'},.58)
    .fromTo('.frame-secondary',{autoAlpha:0,clipPath:'inset(100% 0% 0% 0%)',y:20},{autoAlpha:1,clipPath:'inset(0% 0% 0% 0%)',y:0,duration:.5,ease:'power2.inOut'},.6)
    .to({}, {duration:.14});
  gsap.utils.toArray<HTMLElement>('.reveal').forEach(element => {
    gsap.from(element,{y:desktop?35:20,opacity:0,duration:1,ease:'power2.out',scrollTrigger:{trigger:element,start:'top 92%',once:true}});
  });
  gsap.utils.toArray<HTMLElement>('.reveal-image').forEach(element => {
    gsap.from(element,{clipPath:'inset(6% 0% 0% 0%)',y:18,duration:1.2,ease:'power3.out',scrollTrigger:{trigger:element,start:'top 93%',once:true}});
  });
  gsap.fromTo('.living-frame',{clipPath:desktop?'inset(0% 9% 0% 9%)':'inset(0% 4% 0% 4%)'},{clipPath:'inset(0% 0% 0% 0%)',ease:'none',scrollTrigger:{trigger:'.living-story',start:'top 85%',end:'top 8%',scrub:.5}});
  if (desktop) {
    gsap.fromTo('.sanctuary-visual img',{scale:1.1,yPercent:-2},{scale:1.04,yPercent:2,ease:'none',scrollTrigger:{trigger:'.sanctuary-visual',start:'top bottom',end:'bottom top',scrub:1}});
    gsap.fromTo('.wellness-breathe svg',{rotation:-10,scale:.92},{rotation:12,scale:1.04,ease:'none',scrollTrigger:{trigger:'.wellness',start:'top bottom',end:'bottom top',scrub:1.5}});
    gsap.fromTo('.nature-image img',{objectPosition:'40% 35%'},{objectPosition:'40% 60%',ease:'none',scrollTrigger:{trigger:'.nature-image',start:'top bottom',end:'bottom top',scrub:1.2}});
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
const galleryImages = [
  {image:'hero',caption:'The water, the light · Ibiza destination photography'},
  {image:'suite',caption:'Softness in the details · Tunisia, illustrative interior'},
  {image:'coast',caption:'Along the quiet coast · Ibiza, illustrative resort'},
  {image:'spa',caption:'A moment, entirely yours · Illustrative wellness interior'},
  {image:'dining',caption:'An invitation to linger · Spain, illustrative dining'},
  {image:'sunset',caption:'Nothing more to do · Es Vedrà, Ibiza'},
];
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
