// Scroll animations
function revealAllFadeIns() {
    document.querySelectorAll('.fade-in').forEach(function(element) {
        element.classList.add('visible');
    });
}

function handleScrollAnimations() {
    if (document.body.classList.contains('home')) {
        revealAllFadeIns();
        return;
    }

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
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
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

function setNavCollapsed(collapsed) {
    const header = document.querySelector('.projects-header');
    const navToggle = document.getElementById('navToggle');
    if (!header) return;

    header.classList.toggle('nav-collapsed', collapsed);
    if (navToggle) navToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
}

function isHomePage() {
    return document.body.classList.contains('home');
}

const mobileNavQuery = window.matchMedia('(max-width: 768px)');

function isMobileNav() {
    return mobileNavQuery.matches;
}

function initNavState() {
    const header = document.querySelector('.projects-header');
    if (!header) return;

    // On mobile the links live in a tap-to-open dropdown, so the pill
    // starts collapsed regardless of page or scroll position.
    if (isMobileNav()) {
        setNavCollapsed(true);
    } else if (!isHomePage() && window.scrollY > 60) {
        setNavCollapsed(true);
    } else {
        setNavCollapsed(false);
    }
}

function setupNavScrollCollapse() {
    if (isHomePage()) return;

    const threshold = 60;
    let ticking = false;

    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function() {
            // Mobile open/close is driven by the toggle, not scroll.
            if (!isMobileNav()) {
                if (window.scrollY > threshold) {
                    setNavCollapsed(true);
                } else {
                    setNavCollapsed(false);
                }
            }
            ticking = false;
        });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
}

function setupNavToggle() {
    const navToggle = document.getElementById('navToggle');
    const header = document.querySelector('.projects-header');

    initNavState();

    // Enable nav transitions only after the initial state has painted, so the
    // menu doesn't animate open->closed on load (a flash on every mobile page).
    if (header) {
        const enableNavTransitions = function() { header.classList.add('nav-ready'); };
        requestAnimationFrame(function() {
            requestAnimationFrame(enableNavTransitions);
        });
        // Fallback in case rAF is throttled (e.g. loaded in a background tab).
        setTimeout(enableNavTransitions, 120);
    }

    if (navToggle && header) {
        navToggle.addEventListener('click', function(event) {
            event.stopPropagation();
            setNavCollapsed(!header.classList.contains('nav-collapsed'));
        });

        // Tap outside the pill to dismiss the open mobile dropdown.
        document.addEventListener('click', function(event) {
            if (!isMobileNav()) return;
            if (header.classList.contains('nav-collapsed')) return;
            if (header.contains(event.target)) return;
            setNavCollapsed(true);
        });
    }

    // Only re-evaluate when the breakpoint actually changes. Listening to
    // resize would fire on mobile URL-bar show/hide and slam the menu shut.
    function onBreakpointChange() {
        initNavState();
    }
    if (mobileNavQuery.addEventListener) {
        mobileNavQuery.addEventListener('change', onBreakpointChange);
    } else if (mobileNavQuery.addListener) {
        mobileNavQuery.addListener(onBreakpointChange);
    }

    setupNavScrollCollapse();
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
            return tags.some(function(t) { return ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'Next.js', 'React', 'Tailwind CSS'].includes(t); });
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
            const filter = pill.dataset.filter;

            if (pill.classList.contains('active')) {
                pill.classList.remove('active');
                activeFilter = 'all';
                if (filter !== 'all') {
                    const allPill = document.querySelector('.filter-pill[data-filter="all"]');
                    if (allPill) allPill.classList.add('active');
                }
                renderProjects();
                return;
            }

            filterPills.forEach(function(p) { p.classList.remove('active'); });
            pill.classList.add('active');
            activeFilter = filter;
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
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    updateThemeIcon(currentTheme);
    setupThemeToggle();
    setupNavToggle();
});
