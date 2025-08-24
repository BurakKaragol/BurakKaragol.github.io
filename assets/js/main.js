/*=============== SHOW MENU ===============*/
const navMenu = document.getElementById('nav-menu'),
      navToggle = document.getElementById('nav-toggle'),
      navClose = document.getElementById('nav-close')

/*===== MENU SHOW =====*/
/* Validate if constant exists */
if(navToggle){
    navToggle.addEventListener('click', () =>{
        navMenu.classList.add('show-menu')
    })
}

/*===== MENU HIDDEN =====*/
/* Validate if constant exists */
if(navClose){
    navClose.addEventListener('click', () =>{
        navMenu.classList.remove('show-menu')
    })
}

document.addEventListener('DOMContentLoaded', () => {
    // 1) Safer external links
    document.querySelectorAll('a[target="_blank"]').forEach(a => {
    if (!a.rel.includes('noopener')) a.rel += (a.rel ? ' ' : '') + 'noopener';
    if (!a.rel.includes('noreferrer')) a.rel += ' noreferrer';
    });

    // 2) Sync aria-expanded on menu toggle
    const toggle = document.getElementById('nav-toggle');
    const closeBtn = document.getElementById('nav-close');
    const setExpanded = (open) => toggle && toggle.setAttribute('aria-expanded', String(open));
    toggle && toggle.addEventListener('click', () => setExpanded(true));
    closeBtn && closeBtn.addEventListener('click', () => setExpanded(false));

    // 3) Make "View Web Projects" keyboard accessible
    const webBtn = document.querySelector('.web_projects_button[data-url]');
    if (webBtn) {
    const go = () => location.href = webBtn.getAttribute('data-url');
    webBtn.addEventListener('click', go);
    webBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });
    }
});

document.addEventListener("DOMContentLoaded", () => {
const birthYear = 1998;
const today = new Date();
let age = today.getFullYear() - birthYear;

// If birthday hasn't happened yet this year, subtract 1
const birthMonth = 1;  // Change if you want exact month (0 = Jan, 11 = Dec)
const birthDay = 1;    // Change if you want exact day
const hasBirthdayPassed =
    today.getMonth() > birthMonth ||
    (today.getMonth() === birthMonth && today.getDate() >= birthDay);

if (!hasBirthdayPassed) {
    age--;
}

const ageEl = document.getElementById("age");
if (ageEl) ageEl.textContent = age;
});

(function () {
"use strict";

function parseYMD(s) {
    // s: 'YYYY-MM-DD'
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
}

function fullYearsSince(startDate, today = new Date()) {
    let years = today.getFullYear() - startDate.getFullYear();
    const m = today.getMonth() - startDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < startDate.getDate())) years--;
    return years;
}

function pad(num, size) {
    const s = String(num);
    return s.length >= size ? s : ("0".repeat(size - s.length) + s);
}

function setAge() {
    const el = document.getElementById("age");
    if (!el) return;
    const attr = el.getAttribute("data-birthdate") || "1998-01-01";
    const dob = parseYMD(attr);
    const age = fullYearsSince(dob);
    el.textContent = age;
}

function setExperience() {
    const el = document.getElementById("years-exp");
    if (!el) return;
    const startAttr = el.getAttribute("data-exp-start") || "2019-01-01";
    const padLen = parseInt(el.getAttribute("data-pad") || "2", 10);

    const start = parseYMD(startAttr);
    const years = fullYearsSince(start);
    el.textContent = pad(years, padLen);
}

// Run on DOM ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { setAge(); setExperience(); });
} else {
    setAge(); setExperience();
}
})();

/*=============== REMOVE MENU MOBILE ===============*/
const navLink = document.querySelectorAll('.nav__link')

const linkAction = () =>{
    const navMenu = document.getElementById('nav-menu')
    // When we click on each nav__link, we remove the show-menu class
    navMenu.classList.remove('show-menu')
}
navLink.forEach(n => n.addEventListener('click', linkAction))

/*=============== SWIPER PROJECTS ===============*/
let swiperProjects = new Swiper(".projects__container", {
    loop: true,
    spaceBetween: 24,
    
    navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
    },
    pagination: {
        el: ".swiper-pagination",
    },
    breakpoints: {
        1200: {
            slidesPerView: 2,
            spaceBetween: -56,
        },
    },
});

document.addEventListener("DOMContentLoaded", function () {
    const projects = document.querySelectorAll(".web_projects_button");

    projects.forEach(project => {
        project.addEventListener("click", function () {
            const url = project.getAttribute("data-url");
            if (url) {
                window.location.href = url; // Open project page
            }
        });

        // Add hover effect to indicate clickability
        project.style.cursor = "pointer";
    });
});

/*=============== SETTING SUBJECT ===============*/
function setSubject(subject) {
    let subjectInput = document.getElementById('contact-message');
    subjectInput.innerText = "Hi, i want to get more info about your '" + subject + "' project.";
}

function setSubjectTr(subject) {
    let subjectInputTr = document.getElementById('contact-message');
    subjectInputTr.innerText = "Merhaba, '" + subject + "' projeniz hakkında daha fazla bilgi almak istiyorum.";
}

/*=============== EMAIL JS ===============*/
const contactForm = document.getElementById('contact-form'),
    contactName = document.getElementById('contact-name'),
    contactEmail = document.getElementById('contact-email'),
    contactMessage = document.getElementById('contact-message'),
    contactMsg = document.getElementById('contact-msg')

const sendEmail = (e) =>{
    e.preventDefault()
    console.log('girdi')
    if(contactName.value === '' || contactEmail === '' || contactMessage === ''){
        contactMessage.classList.remove('color-blue')
        contactMessage.classList.add('color-red')

        contactMessage.textContent = 'Please fill all the input fields 📩'
    }
    else{
        emailjs.sendForm('service_sohc712', 'template_dtve7zq', '#contact-form', '3Xlz6Ok2ZRJTuktB2')
            .then(() =>{
                contactMsg.classList.add('color-blue')
                contactMsg.textContent = 'Message sent ✅'
                
                setTimeout(() => {
                    contactMessage.textContent = ''
                }, 5000)
            }, (error) =>{
                console.error(error)
                alert('Something went wrong 😢')
            })

        contactName.value = ''
        contactEmail.value = ''
        contactMessage.value = ''
    }
}
contactForm.addEventListener('submit', sendEmail)

/*=============== SCROLL SECTIONS ACTIVE LINK ===============*/
const sections = document.querySelectorAll('section[id]')
    
const scrollActive = () =>{
  	const scrollY = window.pageYOffset

	sections.forEach(current =>{
		const sectionHeight = current.offsetHeight,
			  sectionTop = current.offsetTop - 58,
			  sectionId = current.getAttribute('id'),
			  sectionsClass = document.querySelector('.nav__menu a[href*=' + sectionId + ']')

		if(scrollY > sectionTop && scrollY <= sectionTop + sectionHeight){
			sectionsClass.classList.add('active-link')
		}else{
			sectionsClass.classList.remove('active-link')
		}                                                    
	})
}
window.addEventListener('scroll', scrollActive)

/*=============== SHOW SCROLL UP ===============*/ 
const scrollUp = () =>{
	const scrollUp = document.getElementById('scroll-up')
    // When the scroll is higher than 350 viewport height, add the show-scroll class to the a tag with the scrollup class
	this.scrollY >= 350 ? scrollUp.classList.add('show-scroll')
						: scrollUp.classList.remove('show-scroll')
}
window.addEventListener('scroll', scrollUp)

/*=============== DARK LIGHT THEME ===============*/ 
const themeButton = document.getElementById('theme-button')
const darkTheme = 'dark-theme'
const IconMoon = 'ri-moon-line'
const IconSun = 'ri-sun-line'

// We obtain the current theme that the interface has by validating the dark-theme class
const getCurrentTheme = () => document.body.classList.contains(darkTheme) ? 'dark' : 'light'

// Activate / deactivate the theme manually with the button
themeButton.addEventListener('click', () => {
    // Add or remove the dark / icon theme
    document.body.classList.toggle(darkTheme)
    themeButton.classList.toggle(IconMoon)
    themeButton.classList.toggle(IconSun)
})

/*=============== CHANGE BACKGROUND HEADER ===============*/
const scrollHeader = () =>{
    const header = document.getElementById('header')
    // When the scroll is greater than 50 viewport height, add the scroll-header class to the header tag
    this.scrollY >= 50 ? header.classList.add('bg-header') 
                       : header.classList.remove('bg-header')
}
window.addEventListener('scroll', scrollHeader)

/*=============== SCROLL REVEAL ANIMATION ===============*/
const sr = ScrollReveal({
    origin: 'top',
    distance: '60px',
    duration: 2500,
    delay: 400,
    reset: true
});

sr.reveal('.home__data, .projects__container, .footer__container')
sr.reveal('.home__info div', {delay: 600, origin: 'bottom', interval: 100})
sr.reveal('.skills__content:nth-child(1), .skills__content:nth-child(3), .contact__content:nth-child(1)', {origin: 'left'})
sr.reveal('.skills__content:nth-child(2), .skills__content:nth-child(4), .contact__content:nth-child(2)', {origin: 'right'})
sr.reveal('.qualification__content, .services__card', {interval: 100})
