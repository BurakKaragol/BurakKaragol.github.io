personal_website = "https://burakkaragol.github.io/"
linkedin = "https://www.linkedin.com/in/burak-karagol-3451b91b0/"
github = "https://github.com/BurakKaragol"
itch = "https://mrlulez.itch.io/"
instagram = "https://www.instagram.com/brkkaragol/?hl=tr"
twitch = "https://www.twitch.tv/mrlulez"
youtube = "https://www.youtube.com/channel/UCMqP-wqi9hXqKfkzfmoqa-w"
twitter = "https://twitter.com/buraKaragol"

function open_link(website) {
    switch (website) {
        case 'personal_website':
            open_url(personal_website, false);
            break;
        case 'linkedin':
            open_url(linkedin);
            break;
        case 'github':
            open_url(github);
            break;
        case 'itch':
            open_url(itch);
            break;
        case 'instagram':
            open_url(instagram);
            break;
        case 'twitch':
            open_url(twitch);
            break;
        case 'youtube':
            open_url(youtube);
            break;
        case 'twitter':
            open_url(twitter);
            break;
    }
}

function open_url(url, new_window = true) {
    if (new_window) {
        window.open(url, '_blank');
    } else {
        window.location.href = url;
    }
}