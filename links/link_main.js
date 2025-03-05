
const links = [
    { name: "My Website", url: "https://burakkaragol.github.io/", icon: "fa-solid fa-rocket" },
    { name: "LinkedIn", url: "https://www.linkedin.com/in/burakkaragol/", icon: "fa-brands fa-linkedin" },
    { name: "GitHub", url: "https://github.com/burakkaragol", icon: "fa-brands fa-github" },
    { name: "Itch.io", url: "https://burakkaragol.itch.io/", icon: "fa-brands fa-itch-io" },
    { name: "Instagram", url: "https://www.instagram.com/burakkaragol/", icon: "fa-brands fa-instagram" },
    { name: "Twitch", url: "https://www.twitch.tv/burakkaragol", icon: "fa-brands fa-twitch" },
    { name: "YouTube", url: "https://www.youtube.com/@burakkaragol", icon: "fa-brands fa-youtube" },
    { name: "Twitter", url: "https://twitter.com/burakkaragol", icon: "fa-brands fa-x-twitter" }
];

const container = document.getElementById('linksContainer');

links.forEach(link => {
    const linkElement = document.createElement('a');
    linkElement.classList.add('link-item');
    linkElement.href = link.url;
    linkElement.target = '_blank';

    const icon = document.createElement('i');
    icon.className = link.icon;

    const text = document.createElement('span');
    text.textContent = link.name;

    linkElement.appendChild(icon);
    linkElement.appendChild(text);
    container.appendChild(linkElement);
});
