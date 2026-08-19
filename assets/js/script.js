// 1. SELECT DOM ELEMENTS
const body = document.body;
const langToggle = document.getElementById('langToggle');
const themeToggle = document.getElementById('themeToggle');
const modeSwitch = document.getElementById('modeSwitch');

// Mobile Elements
const mobileBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const mobLangToggle = document.getElementById('mobLangToggle');
const mobThemeToggle = document.getElementById('mobThemeToggle');
const mobileLinks = document.querySelectorAll('.mobile-link');

// Discord Logic
const discordCard = document.getElementById('discordCard');
const discordUser = document.getElementById('discordUser');
const tooltip = document.getElementById('copyTooltip');

// Back to Top
const backToTopBtn = document.getElementById('backToTop');

// Email Form
const contactForm = document.getElementById('contactForm');
const submitBtn = document.getElementById('btnSubmit');

// 2. STATE MANAGEMENT (SMART DETECT WITH URL PARAMS)
function getInitialState() {
    // A. CHECK URL PARAMETERS (Highest Priority)
    // Allows custom links like: website.com?mode=personal&lang=tr&theme=dark
    const params = new URLSearchParams(window.location.search);
    const urlMode = params.get('mode');   // 'professional' or 'personal'
    const urlLang = params.get('lang');   // 'en' or 'tr'
    const urlTheme = params.get('theme'); // 'dark' or 'light'

    const saved = localStorage.getItem('burakSiteState');
    const parsedSaved = saved ? JSON.parse(saved) : {};
    const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const userLang = navigator.language || navigator.userLanguage;
    const systemLang = userLang && userLang.startsWith('tr') ? 'tr' : 'en';

    // 1. Resolve Mode
    let finalMode = parsedSaved.mode || 'professional';
    if (urlMode === 'personal' || urlMode === 'professional') {
        finalMode = urlMode;
    }

    // 2. Resolve Language
    let finalLang = parsedSaved.lang || systemLang;
    if (urlLang === 'tr' || urlLang === 'en') {
        finalLang = urlLang;
    }

    // 3. Resolve Theme
    let finalDark = parsedSaved.hasOwnProperty('isDark') ? parsedSaved.isDark : systemDark;
    if (urlTheme === 'dark') {
        finalDark = true;
    } else if (urlTheme === 'light') {
        finalDark = false;
    }

    return {
        isDark: finalDark,
        lang: finalLang,
        mode: finalMode
    };
}

// Initialize State
let state = getInitialState();

// 3. MAIN REFRESH FUNCTION
function refreshView() {
    // Apply to DOM
    body.setAttribute('data-mode', state.mode);
    body.setAttribute('data-lang', state.lang);
    body.setAttribute('data-theme', state.isDark ? 'dark' : 'light');

    // Update Text Content
    if (typeof updateTextContent === "function") {
        updateTextContent(state.lang, state.mode);
    }

    // Update Gallery Toggle Text
    if (typeof updateGalleryToggleText === "function") {
        updateGalleryToggleText();
    }

    // Update Button Text
    const langLabel = state.lang === 'en' ? 'TR' : 'EN';
    const themeLabel = state.isDark ? '☀' : '☾';
    
    // Desktop Toggles
    if(langToggle) langToggle.innerText = langLabel;
    if(themeToggle) themeToggle.innerText = themeLabel;
    
    // Mobile Toggles
    if(mobLangToggle) mobLangToggle.innerText = langLabel;
    if(mobThemeToggle) mobThemeToggle.innerText = state.isDark ? 'Light Mode' : 'Dark Mode';

    // SAVE STATE TO BROWSER MEMORY
    localStorage.setItem('burakSiteState', JSON.stringify(state));
}

// 4. EVENT LISTENERS

// Theme Toggles
const toggleTheme = () => {
    state.isDark = !state.isDark;
    refreshView();
};
if(themeToggle) themeToggle.addEventListener('click', toggleTheme);
if(mobThemeToggle) mobThemeToggle.addEventListener('click', toggleTheme);

// Language Toggles
const toggleLang = () => {
    state.lang = state.lang === 'en' ? 'tr' : 'en';
    refreshView();
};
if(langToggle) langToggle.addEventListener('click', toggleLang);
if(mobLangToggle) mobLangToggle.addEventListener('click', toggleLang);

// Mode Switch (Professional <-> Personal)
if(modeSwitch) {
    modeSwitch.addEventListener('click', () => {
        state.mode = state.mode === 'professional' ? 'personal' : 'professional';
        refreshView();
    });
}

// Mobile Menu Logic
if(mobileBtn) {
    mobileBtn.addEventListener('click', () => {
        mobileBtn.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        
        // Lock Scroll when menu is open
        if (mobileMenu.classList.contains('active')) {
            body.style.overflow = 'hidden';
        } else {
            body.style.overflow = 'auto';
        }
    });
}

// Close mobile menu when clicking a link
mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileBtn.classList.remove('active');
        mobileMenu.classList.remove('active');
        body.style.overflow = 'auto';
    });
});

// 5. DISCORD COPY LOGIC
if (discordCard) {
    discordCard.addEventListener('click', () => {
        if(navigator.clipboard) {
            navigator.clipboard.writeText(discordUser.innerText).then(() => {
                const originalText = tooltip.innerText;
                tooltip.innerText = "Copied!";
                discordCard.style.background = "#43b581"; 
                
                setTimeout(() => {
                    tooltip.innerText = originalText;
                    discordCard.style.background = ""; 
                }, 2000);
            });
        }
    });
}

// 6. BACK TO TOP LOGIC
window.addEventListener('scroll', () => {
    const btn = typeof backToTopBtn !== 'undefined' ? backToTopBtn : (typeof document !== 'undefined' && document.getElementById ? document.getElementById('backToTop') : null);
    if (!btn) return;
    if (window.scrollY > 300) {
        btn.classList.add('show');
    } else {
        btn.classList.remove('show');
    }
});

if(backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// 7. EMAILJS INTEGRATION
// Initialize (Replace with your actual Public Key)
(function() {
    if(typeof emailjs !== "undefined") {
        emailjs.init("3Xlz6Ok2ZRJTuktB2");
    } else {
        console.warn("EmailJS not loaded");
    }
})();

if (contactForm) {
    contactForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const originalBtnText = submitBtn.innerText;
        submitBtn.innerText = "Sending...";
        submitBtn.disabled = true;
        
        emailjs.sendForm('service_sohc712', 'template_dtve7zq', this)
            .then(function() {
                alert('Message Sent Successfully! ✅');
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
                contactForm.reset();
            }, function(error) {
                console.error('EmailJS Error:', error);
                alert('Failed to send message. Please try again later.');
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
            });
    });
}

/* =========================================
   HELPER: DETECT DEVICE & SCREEN
   ========================================= */
function getDeviceDetails() {
    const ua = navigator.userAgent;
    const width = window.innerWidth;
    let device = "Desktop (Generic)";
    let os = "Unknown OS";

    // --- STEP 1: RESOLUTION CHECK (The Truth Serum) ---
    // Even if UA says "Mac", a 390px width means it's a phone.
    let formFactor = "Desktop";
    if (width < 768) {
        formFactor = "Phone";
    } else if (width >= 768 && width < 1024) {
        formFactor = "Tablet";
    }

    // --- STEP 2: OS DETECTION ---
    if (/iPhone/.test(ua)) {
        device = "iPhone";
        os = "iOS";
    } else if (/iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
        // This specific check catches iPads that pretend to be Macs
        device = "iPad";
        os = "iOS";
        formFactor = "Tablet";
    } else if (/Android/.test(ua)) {
        const match = ua.match(/Android\s([0-9.]+);.*;\s([a-zA-Z0-9\s-]+)\sBuild/);
        device = match && match[2] ? `Android (${match[2]})` : "Android Device";
        os = match && match[1] ? `Android ${match[1]}` : "Android";
        if (formFactor === "Desktop") formFactor = "Phone"; // Correction for Androids
    } else if (/Windows/.test(ua)) {
        device = "PC / Laptop";
        os = "Windows";
    } else if (/Mac/.test(ua)) {
        device = "Mac / MacBook";
        os = "macOS";
    } else if (/Linux/.test(ua)) {
        device = "Linux Machine";
        os = "Linux";
    }

    // Combine them: "iPhone (Phone)" or "iPad (Tablet)"
    return { 
        full_name: `${device} [${formFactor}]`, 
        os: os,
        width: width 
    };
}

/* =========================================
   SILENT VISITOR NOTIFICATION (Final Version)
   ========================================= */
async function notifyVisit() {
    if (sessionStorage.getItem('notified_owner')) return; 

    // 1. Get Device Logic
    const devInfo = getDeviceDetails();

    // 2. Init Location
    let geoInfo = { ip: "Unknown", location: "Unknown", isp: "Unknown" };

    // 3. Fetch Location
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data.ip) {
            geoInfo = {
                ip: data.ip,
                location: `${data.city}, ${data.country_name}`, 
                isp: data.org 
            };
        }
    } catch (e) { console.warn('Geo fetch failed'); }

    // 4. Compile Data
    const visitData = {
        time: new Date().toLocaleString(),
        
        // DEVICE SPECIFICS (Refined)
        device_type: devInfo.full_name, // e.g., "iPhone [Phone]" or "Mac [Desktop]"
        os_system: devInfo.os,
        screen_width: devInfo.width + "px", // Explicit width e.g., "390px"

        // LOCATION
        ip_address: geoInfo.ip,
        geo_location: geoInfo.location,
        isp_provider: geoInfo.isp,

        // SOURCE
        referrer: document.referrer || "Direct / Bookmark", 
        landing_page: window.location.href
    };

    // 5. Send
    if (typeof emailjs !== "undefined") {
        emailjs.send('service_sohc712', 'template_039ws4f', visitData)
            .then(() => {
                console.log('Visitor Logged');
                sessionStorage.setItem('notified_owner', 'true');
            });
    }
}

/* =========================================
   PRIVACY OVERLAY LOGIC
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Select Elements
    const privacyLink = document.querySelector('a[href="#privacy"]'); // Ensure your footer link matches this
    const overlay = document.getElementById('privacy-overlay');
    const closeBtn = document.getElementById('close-privacy-btn');

    // 2. Open Function
    if (privacyLink) {
        privacyLink.addEventListener('click', (e) => {
            e.preventDefault(); // Stop it from jumping to top of page
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Disable background scrolling
        });
    }

    // 3. Close Function (X Button)
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            overlay.classList.remove('active');
            document.body.style.overflow = 'auto'; // Re-enable scrolling
        });
    }

    // 4. Close Function (Click Outside Box)
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    }
});

/* =========================================
   9. LAB GALLERY COLLAPSIBLE TOGGLE LOGIC
   ========================================= */
const btnToggleLabGallery = document.getElementById('btnToggleLabGallery');
const labGalleryContainer = document.getElementById('labGalleryContainer');
const lblToggleLabGallery = document.getElementById('lblToggleLabGallery');
const icnToggleLabGallery = document.getElementById('icnToggleLabGallery');

function updateGalleryToggleText() {
    if (!lblToggleLabGallery) return;
    const isExpanded = labGalleryContainer && labGalleryContainer.classList.contains('expanded');
    const currentTrans = (typeof translations !== 'undefined' && translations[state.lang]) ? translations[state.lang].personal : null;
    
    if (isExpanded) {
        lblToggleLabGallery.innerText = (currentTrans && currentTrans.btnShowLess) ? currentTrans.btnShowLess : 'Show Less';
        if (icnToggleLabGallery) icnToggleLabGallery.className = 'fi fi-rr-angle-small-up';
    } else {
        lblToggleLabGallery.innerText = (currentTrans && currentTrans.btnShowMore) ? currentTrans.btnShowMore : 'Show More';
        if (icnToggleLabGallery) icnToggleLabGallery.className = 'fi fi-rr-angle-small-down';
    }
}

if (btnToggleLabGallery && labGalleryContainer) {
    btnToggleLabGallery.addEventListener('click', () => {
        const isExpanded = labGalleryContainer.classList.contains('expanded');
        if (isExpanded) {
            labGalleryContainer.classList.remove('expanded');
            labGalleryContainer.classList.add('collapsed');
            updateGalleryToggleText();
            const sectionHeader = document.getElementById('projTitlePers');
            if (sectionHeader) {
                const rect = sectionHeader.getBoundingClientRect();
                if (rect.top < 0) {
                    sectionHeader.scrollIntoView({ behavior: 'smooth' });
                }
            }
        } else {
            labGalleryContainer.classList.remove('collapsed');
            labGalleryContainer.classList.add('expanded');
            updateGalleryToggleText();
        }
    });
}

// Run
notifyVisit();

// 8. INITIALIZE VIEW
refreshView();