const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

navToggle?.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

document.querySelectorAll('.nav-links a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle?.setAttribute('aria-expanded', 'false');
  });
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.14 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

const heartsLayer = document.querySelector('.floating-hearts');
const heartSymbols = ['♥', '♡', '❤'];

function createHeart() {
  if (!heartsLayer) return;
  const heart = document.createElement('span');
  heart.textContent = heartSymbols[Math.floor(Math.random() * heartSymbols.length)];
  heart.style.left = `${Math.random() * 100}vw`;
  heart.style.fontSize = `${14 + Math.random() * 18}px`;
  heart.style.animationDuration = `${7 + Math.random() * 5}s`;
  heart.style.animationDelay = `${Math.random()}s`;
  heartsLayer.appendChild(heart);
  window.setTimeout(() => heart.remove(), 13000);
}

window.setInterval(createHeart, 1250);

const videoButtons = document.querySelectorAll('.video-card button');
videoButtons.forEach((button) => {
  button.addEventListener('click', () => {
    button.textContent = '♡';
    button.setAttribute('aria-label', 'Placeholder video wish selected');
  });
});
