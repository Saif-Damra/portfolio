const header = document.getElementById('site-header');
const progress = document.getElementById('scroll-progress');
const menuToggle = document.getElementById('menu-toggle');
const navMenu = document.getElementById('nav-menu');
const navLinks = [...document.querySelectorAll('.nav-link')];
const sections = [...document.querySelectorAll('main section[id]')];
const heroMedia = document.querySelector('.hero-media');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function updateScrollState() {
    const scrollTop = window.scrollY;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const percentage = scrollable > 0 ? (scrollTop / scrollable) * 100 : 0;

    header.classList.toggle('scrolled', scrollTop > 24);
    progress.style.width = `${percentage}%`;

    let currentId = '';
    sections.forEach((section) => {
        if (scrollTop >= section.offsetTop - 180) currentId = section.id;
    });
    navLinks.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === `#${currentId}`);
    });
}

let scrollQueued = false;
window.addEventListener('scroll', () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => {
        updateScrollState();
        scrollQueued = false;
    });
}, { passive: true });

function closeMenu() {
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
    navMenu.classList.remove('is-open');
    document.body.classList.remove('menu-open');
}

menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
    navMenu.classList.toggle('is-open', !isOpen);
    document.body.classList.toggle('menu-open', !isOpen);
});

document.querySelectorAll('.nav-menu a').forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
});

const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
    });
}, { threshold: 0.12, rootMargin: '0px 0px -50px' });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

if (heroMedia && !reducedMotion.matches && window.matchMedia('(pointer: fine)').matches) {
    document.querySelector('.hero').addEventListener('pointermove', (event) => {
        const x = (event.clientX / window.innerWidth - 0.5) * 10;
        const y = (event.clientY / window.innerHeight - 0.5) * 8;
        heroMedia.style.transform = `scale(1.04) translate(${x}px, ${y}px)`;
    });
}

document.getElementById('year').textContent = new Date().getFullYear();
updateScrollState();
