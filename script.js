// Scroll animations
function handleScrollAnimations() {
    const elements = document.querySelectorAll('.fade-in');
    elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 100;
        
        if (elementTop < window.innerHeight - elementVisible) {
            element.classList.add('visible');
        }
    });
}

function init() {
    handleScrollAnimations();
    setTimeout(() => {
        handleScrollAnimations();
    }, 100);
}

function setupEventListeners() {
    window.addEventListener('scroll', function() {
        handleScrollAnimations();
    });
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');
    
    if (sunIcon && moonIcon) {
        if (theme === 'dark') {
            sunIcon.classList.add('active');
            moonIcon.classList.remove('active');
        } else {
            sunIcon.classList.remove('active');
            moonIcon.classList.add('active');
        }
    }
}

function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

function closeNavMenu() {
    const header = document.querySelector('.projects-header');
    const navToggle = document.getElementById('navToggle');
    if (header) header.classList.remove('nav-open');
    if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
}

function setupNavToggle() {
    const navToggle = document.getElementById('navToggle');
    const header = document.querySelector('.projects-header');
    const navLinks = document.querySelectorAll('.nav-menu .nav-link');

    if (navToggle && header) {
        navToggle.addEventListener('click', function() {
            header.classList.toggle('nav-open');
            const isOpen = header.classList.contains('nav-open');
            navToggle.setAttribute('aria-expanded', isOpen);
        });
    }

    navLinks.forEach(function(link) {
        link.addEventListener('click', closeNavMenu);
    });

    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            closeNavMenu();
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    init();
    setupEventListeners();
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    updateThemeIcon(currentTheme);
    setupThemeToggle();
    setupNavToggle();
});