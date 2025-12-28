/* =========================================
   MAIN.JS - COMPLETE LOGIC
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SELECT DOM ELEMENTS ---
    const body = document.body;
    
    // Header / Dock Controls
    const themeToggle = document.getElementById('themeToggle');
    const modeSwitchBtn = document.getElementById('modeSwitchBtn');
    const switchLabel = document.getElementById('switchLabel');
    const mobileToggle = document.getElementById('mobileToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    
    // Contact / Socials
    const contactForm = document.getElementById('contactForm'); // Ensure your <form> has id="contactForm"
    const submitBtn = document.getElementById('btnSubmit');
    const discordCard = document.querySelector('.social-card.discord'); // Selects the Discord card class
    
    // Back to Top
    const backToTop = document.getElementById('backToTop');


    // --- 2. INITIALIZE STATE (URL > LocalStorage > Default) ---
    const params = new URLSearchParams(window.location.search);
    
    // Priority: 1. URL Parameter, 2. LocalStorage, 3. Default
    let currentMode = params.get('mode') || localStorage.getItem('mode') || 'professional';
    let currentTheme = params.get('theme') || localStorage.getItem('theme') || 'light';
    let currentLang = localStorage.getItem('lang') || 'en'; // Default language

    // Security/Validation check
    if (!['professional', 'personal'].includes(currentMode)) currentMode = 'professional';
    if (!['light', 'dark'].includes(currentTheme)) currentTheme = 'light';


    // --- 3. UI UPDATE FUNCTION ---
    function updateUI() {
        // 1. Set Body Attributes (Triggers CSS)
        body.setAttribute('data-mode', currentMode);
        body.setAttribute('data-theme', currentTheme);

        // 2. Update Theme Icon
        if (themeToggle) {
            const themeIcon = themeToggle.querySelector('i');
            if (currentTheme === 'dark') {
                themeIcon.className = 'fi fi-rr-sun';
            } else {
                themeIcon.className = 'fi fi-rr-moon-stars';
            }
        }

        // 3. Update Mode Button (Label & Icon)
        if (modeSwitchBtn) {
            const switchIcon = modeSwitchBtn.querySelector('.switch-icon');
            if (currentMode === 'professional') {
                if(switchIcon) switchIcon.className = 'fi fi-rr-refresh switch-icon';
                // Fallback text if translation script is missing
                if(switchLabel) switchLabel.innerText = "See my creative side";
            } else {
                if(switchIcon) switchIcon.className = 'fi fi-rr-briefcase switch-icon';
                if(switchLabel) switchLabel.innerText = "Back to business";
            }
        }

        // 4. Trigger Text Translations (if translations.js is loaded)
        if (typeof updateTextContent === 'function') {
            updateTextContent(currentLang, currentMode);
        }
        
        // 5. Save State
        localStorage.setItem('mode', currentMode);
        localStorage.setItem('theme', currentTheme);
        localStorage.setItem('lang', currentLang);
    }

    // Apply immediately on load
    updateUI();


    // --- 4. EVENT LISTENERS ---

    // Toggle Theme
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            currentTheme = currentTheme === 'light' ? 'dark' : 'light';
            updateUI();
        });
    }

    // Toggle Mode (Professional <-> Personal)
    if (modeSwitchBtn) {
        modeSwitchBtn.addEventListener('click', () => {
            // Animation for icon
            const icon = modeSwitchBtn.querySelector('.switch-icon');
            if(icon) {
                icon.style.transform = 'rotate(360deg)';
                setTimeout(() => icon.style.transform = 'rotate(0deg)', 400);
            }

            // Switch Logic
            currentMode = currentMode === 'professional' ? 'personal' : 'professional';
            
            // Fade Transition
            body.style.opacity = '0';
            setTimeout(() => {
                updateUI();
                body.style.opacity = '1';
                window.scrollTo(0, 0);
            }, 300);
        });
    }

    // Mobile Menu Toggle
    if (mobileToggle && mobileMenu) {
        mobileToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            mobileToggle.classList.toggle('active');
            
            // Lock/Unlock Scroll
            body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : 'auto';
        });

        // Close menu on link click
        document.querySelectorAll('.mobile-link').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                mobileToggle.classList.remove('active');
                body.style.overflow = 'auto';
            });
        });
    }

    // Discord Copy Logic (Replaces inline onclick)
    if (discordCard) {
        discordCard.addEventListener('click', () => {
            const userId = document.getElementById('discordUser') ? document.getElementById('discordUser').innerText : 'burak#1234';
            
            navigator.clipboard.writeText(userId).then(() => {
                const originalBg = discordCard.style.background;
                const originalBorder = discordCard.style.borderColor;
                
                // Visual Feedback
                discordCard.style.background = "#43b581";
                discordCard.style.borderColor = "#43b581";
                
                // Optional: Show tooltip if you have one, or just alert/change text
                alert('Discord ID copied: ' + userId);

                // Reset after 1 second
                setTimeout(() => {
                    discordCard.style.background = originalBg;
                    discordCard.style.borderColor = originalBorder;
                }, 1000);
            });
        });
    }

    // Back to Top Button
    if (backToTop) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTop.classList.add('show');
            } else {
                backToTop.classList.remove('show');
            }
        });

        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- 5. EMAILJS INTEGRATION ---
    // Make sure to add <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script> in your HTML head
    if (typeof emailjs !== "undefined") {
        emailjs.init("3Xlz6Ok2ZRJTuktB2"); // Your Public Key
    }

    if (contactForm) {
        contactForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const originalBtnText = submitBtn.innerText;
            submitBtn.innerText = "Sending...";
            submitBtn.disabled = true;
            
            // Replace with your Service ID and Template ID
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

    // --- 6. CLEAN URL (Optional) ---
    // Removes ?mode=... from the URL bar so it looks clean after loading
    if (window.location.search) {
        window.history.replaceState({}, document.title, window.location.pathname);
    }

});