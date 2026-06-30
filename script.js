// ===== PARTICLES EFFECT =====
function initializeParticles() {
    const container = document.getElementById('particlesContainer');
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (Math.random() * 20 + 20) + 's';
        container.appendChild(particle);
    }
}

// ===== SMOOTH SCROLL NAVIGATION =====
document.querySelectorAll('nav a').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// ===== NAVIGATION HIGHLIGHT ON SCROLL =====
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('nav a');
    let currentSection = '';

    sections.forEach(section => {
        const top = section.offsetTop - 180;
        if (window.pageYOffset >= top) {
            currentSection = section.id;
        }
    });

    navLinks.forEach(link => {
        if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});

// ===== LAZY LOAD ANIMATIONS =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeInUp 0.8s ease-out forwards';
        }
    });
}, observerOptions);

document.querySelectorAll('.skill-card, .project-card, .timeline-item').forEach(el => {
    el.style.opacity = '0';
    observer.observe(el);
});

// ===== CONTACT FORM HANDLER =====
function setupContactForm() {
    const contactButtons = document.querySelectorAll('.btn');
    contactButtons.forEach(btn => {
        if (btn.textContent.includes('Get in Touch')) {
            btn.addEventListener('click', function() {
                const email = 'bikashananda40@mail.com';
                const subject = 'Let\'s Connect - Innovation & Tech Collaboration';
                window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
            });
        }
    });
}

// ===== SOCIAL LINKS =====
function setupSocialLinks() {
    const socialData = [
        { icon: '🐙', link: 'https://github.com/bikash-ananda', title: 'GitHub' },
        { icon: '💼', link: 'https://www.linkedin.com/in/bikash-ananda', title: 'LinkedIn' },
        { icon: '👤', link: 'https://www.facebook.com/bikash.bhattarai.33053', title: 'Facebook' },
        { icon: '📸', link: 'https://www.instagram.com/bikash_ananda', title: 'Instagram' },
        { icon: '▶️', link: 'https://youtube.com/@bikashananda292', title: 'YouTube' }
    ];
    
    return socialData;
}

// ===== HEADER ACTIVE STATE =====
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(10, 14, 39, 0.95)';
    } else {
        header.style.background = 'rgba(10, 14, 39, 0.8)';
    }
});

// ===== MOUSE GLOW EFFECT (Optional - uncomment to enable) =====
function setupMouseGlow() {
    const container = document.body;
    
    document.addEventListener('mousemove', (e) => {
        const x = e.clientX;
        const y = e.clientY;
        
        const glow = document.createElement('div');
        glow.style.position = 'fixed';
        glow.style.left = x + 'px';
        glow.style.top = y + 'px';
        glow.style.width = '20px';
        glow.style.height = '20px';
        glow.style.background = 'radial-gradient(circle, rgba(0, 217, 255, 0.3) 0%, transparent 70%)';
        glow.style.borderRadius = '50%';
        glow.style.pointerEvents = 'none';
        glow.style.zIndex = '99';
        glow.style.animation = 'fadeOut 0.5s ease-out forwards';
        
        container.appendChild(glow);
        
        setTimeout(() => glow.remove(), 500);
    });
}

// ===== FADE OUT ANIMATION =====
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: scale(1); }
        to { opacity: 0; transform: scale(0.5); }
    }
`;
document.head.appendChild(style);

// ===== INITIALIZE ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', () => {
    initializeParticles();
    setupContactForm();
    setupMouseGlow();
    
    // Scroll to top on page load
    window.scrollTo(0, 0);
    
    // Add loading animation
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.animation = 'fadeIn 0.8s ease-out forwards';
    }, 100);
});

// ===== FADE IN ANIMATION =====
if (!document.querySelector('style[data-custom="fadeIn"]')) {
    const fadeInStyle = document.createElement('style');
    fadeInStyle.setAttribute('data-custom', 'fadeIn');
    fadeInStyle.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;
    document.head.appendChild(fadeInStyle);
}

// ===== INTERSECTION OBSERVER FOR ANIMATIONS =====
function observeElements() {
    const elements = document.querySelectorAll('section, .skill-card, .project-card');
    
    elements.forEach(element => {
        observer.observe(element);
    });
}

// Initialize observer
observeElements();

// ===== CONSOLE MESSAGE =====
console.log('%cWelcome to Bikash Bhattarai\'s Portfolio', 'font-size: 20px; color: #00d9ff; font-weight: bold;');
console.log('%cAI & IoT Solutions for Nepal', 'font-size: 16px; color: #1e90ff;');
console.log('%cLet\'s build the future together! 🚀', 'font-size: 14px; color: #00d9ff;');
