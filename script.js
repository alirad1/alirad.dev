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

// Initialize everything
function init() {
    handleScrollAnimations();
    setTimeout(() => {
        handleScrollAnimations();
    }, 100);
}

// Event listeners
function setupEventListeners() {
    window.addEventListener('scroll', function() {
        handleScrollAnimations();
    });
}

// theme
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

// Page transitions
function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function setupPageTransitions() {
    const transitionDuration = 250;

    document.body.classList.add('page-loading');
    requestAnimationFrame(function() {
        document.body.classList.remove('page-loading');
        document.body.classList.add('page-loaded');
    });

    document.addEventListener('click', function(e) {
        const link = e.target.closest('a[href]');
        if (!link || link.target === '_blank' || link.hasAttribute('download')) return;

        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

        let url;
        try {
            url = new URL(href, window.location.href);
        } catch (err) {
            return;
        }

        if (url.origin !== window.location.origin) return;

        const path = url.pathname;
        const isInternalPage = path.endsWith('.html') || path === '/' || path.endsWith('/');
        if (!isInternalPage) return;

        e.preventDefault();

        if (prefersReducedMotion()) {
            window.location.href = url.href;
            return;
        }

        document.body.classList.add('page-exiting');
        setTimeout(function() {
            window.location.href = url.href;
        }, transitionDuration);
    });
}

// Project filters
function setupProjectFilters() {
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll('.project-card'));
    const filterPills = document.querySelectorAll('.filter-pill');
    const emptyState = document.getElementById('projectsEmpty');

    const FILTER_MATCHERS = {
        live: function(card) {
            return card.dataset.live === 'true';
        },
        webdev: function(card, tags) {
            return tags.some(function(t) { return ['HTML', 'CSS', 'JavaScript'].includes(t); });
        },
        aws: function(card, tags) {
            return tags.includes('AWS');
        },
        python: function(card, tags) {
            return tags.some(function(t) { return ['Python', 'Flask', 'Streamlit', 'REST API'].includes(t); });
        },
        java: function(card, tags) {
            return tags.some(function(t) { return ['Java', 'LWJGL', 'ImGui'].includes(t); });
        },
        award: function(card, tags) {
            return tags.includes('Award Winner');
        },
        sql: function(card, tags) {
            return tags.some(function(t) { return ['MySQL', 'PostgreSQL'].includes(t); });
        }
    };

    let activeFilter = 'all';

    function cardMatches(card) {
        if (activeFilter === 'all') return true;
        const tags = (card.dataset.tags || '').split(',').map(function(t) { return t.trim(); });
        const matcher = FILTER_MATCHERS[activeFilter];
        return matcher ? matcher(card, tags) : false;
    }

    function renderProjects() {
        let visibleCount = 0;

        cards.forEach(function(card) {
            const visible = cardMatches(card);
            card.classList.toggle('project-card-hidden', !visible);
            if (visible) visibleCount++;
        });

        if (emptyState) {
            emptyState.hidden = visibleCount > 0;
        }

        handleScrollAnimations();
    }

    filterPills.forEach(function(pill) {
        pill.addEventListener('click', function() {
            filterPills.forEach(function(p) { p.classList.remove('active'); });
            pill.classList.add('active');
            activeFilter = pill.dataset.filter;
            renderProjects();
        });
    });

    renderProjects();
}

// on load
document.addEventListener('DOMContentLoaded', function() {
    init();
    setupEventListeners();
    setupPageTransitions();
    setupProjectFilters();
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    updateThemeIcon(currentTheme);
    setupThemeToggle();
    setupNavToggle();
});
