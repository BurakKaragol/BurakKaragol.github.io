//#region Variables
let themes = [
    "Bilim Kurgu",
    "Fantastik Bilim Kurgu",
    "Yarış",
    "Macera",
    "Zombi"
]

let moods = [
    "Enerjik",
    "Rahatlatıcı",
    "Heyecan Verici",
    "Stratejik"
]

let genres = [
    "Aksiyon",
    "Gizli Nesne Bulma",
    "Simülasyon",
    "Yapım",
    "RPG"
]

let characters = [
    "Süper Kahraman ile",
    "Gizemli Bir Yaratık İle",
    "Ajan Olarak"
]

let goals = [
    "Hazine Bulmaya çalışıyorsunuz",
    "Düşmanları Yok Etmeye çalışıyorsunuz",
    "Kaçımaya çalışıyorsunuz",
    "Rakipleri Geçmeye çalışıyorsunuz"
]

let settings = [
    "Ormanlık Alanda",
    "Uzay İstasyonunda",
    "Antik Tapınakta",
    "Büyülü Ormanda"
]

let jokers = [
    "Sadece Gece Oynanabilir",
    "Sadece Tek Elle Oynanabilir",
    "Sadece Ses ile Kontrol"
]
//#endregion

window.onload = function() {
    fill_all();
}

//#region Fill Functions
// fill the dropdowns according to the lists
function fill_all() {
    fill_theme();
    fill_mood();
    fill_genre();
    fill_character();
    fill_goal();
    fill_setting();
    fill_joker();
}

function fill_theme() {
    for (let index = 0; index < themes.length; index++) {
        var link = document.createElement('a');
        link.classList = "dropdown__option";
        link.onclick = function() {
            set_theme(index);
        };
        link.innerHTML = themes[index];
        var bodyToAdd = document.getElementById("theme-dropdown");
        bodyToAdd.appendChild(link);
    }
}

function fill_mood() {
    for (let index = 0; index < moods.length; index++) {
        var link = document.createElement('a');
        link.classList = "dropdown__option";
        link.onclick = function() {
            set_mood(index);
        };
        link.innerHTML = moods[index];
        var bodyToAdd = document.getElementById("mood-dropdown");
        bodyToAdd.appendChild(link);
    }
}

function fill_genre() {
    for (let index = 0; index < genres.length; index++) {
        var link = document.createElement('a');
        link.classList = "dropdown__option";
        link.onclick = function() {
            set_genre(index);
        };
        link.innerHTML = genres[index];
        var bodyToAdd = document.getElementById("genre-dropdown");
        bodyToAdd.appendChild(link);
    }
}

function fill_character() {
    for (let index = 0; index < characters.length; index++) {
        var link = document.createElement('a');
        link.classList = "dropdown__option";
        link.onclick = function() {
            set_character(index);
        };
        link.innerHTML = characters[index];
        var bodyToAdd = document.getElementById("character-dropdown");
        bodyToAdd.appendChild(link);
    }
}

function fill_goal() {
    for (let index = 0; index < goals.length; index++) {
        var link = document.createElement('a');
        link.classList = "dropdown__option";
        link.onclick = function() {
            set_goal(index);
        };
        link.innerHTML = goals[index];
        var bodyToAdd = document.getElementById("goal-dropdown");
        bodyToAdd.appendChild(link);
    }
}

function fill_setting() {
    for (let index = 0; index < settings.length; index++) {
        var link = document.createElement('a');
        link.classList = "dropdown__option";
        link.onclick = function() {
            set_setting(index);
        };
        link.innerHTML = settings[index];
        var bodyToAdd = document.getElementById("setting-dropdown");
        bodyToAdd.appendChild(link);
    }
}

function fill_joker() {
    for (let index = 0; index < jokers.length; index++) {
        var link = document.createElement('a');
        link.classList = "dropdown__option";
        link.onclick = function() {
            set_joker(index);
        };
        link.innerHTML = jokers[index];
        var bodyToAdd = document.getElementById("joker-dropdown");
        bodyToAdd.appendChild(link);
    }
}
//#endregion

//#region Set Functions
// select the clicked list item. If -1 is selected the variable will be rolled
let theme_index = -1;
let theme_random = true;
function set_theme(index) {
    theme_index = index;
    theme_random = theme_index == -1;
    var selected_theme = document.getElementById("selected-theme");
    selected_theme.innerHTML = theme_index == -1 ? "Rastgele" : themes[theme_index];
    edit_theme_icon();
}

let mood_index = -1;
let mood_random = true;
function set_mood(index) {
    mood_index = index;
    mood_random = mood_index == -1;
    var selected_mood = document.getElementById("selected-mood");
    selected_mood.innerHTML = mood_index == -1 ? "Rastgele" : moods[mood_index];
    edit_mood_icon();
}

let genre_index = -1;
let genre_random = true;
function set_genre(index) {
    genre_index = index;
    genre_random = genre_index == -1;
    var selected_genre = document.getElementById("selected-genre");
    selected_genre.innerHTML = genre_index == -1 ? "Rastgele" : genres[genre_index];
    edit_genre_icon();
}

let character_index = -1;
let character_random = true;
function set_character(index) {
    character_index = index;
    character_random = character_index == -1;
    var selected_character = document.getElementById("selected-character");
    selected_character.innerHTML = character_index == -1 ? "Rastgele" : characters[character_index];
    edit_character_icon();
}

let goal_index = -1;
let goal_random = true;
function set_goal(index) {
    goal_index = index;
    goal_random = goal_index == -1;
    var selected_goal = document.getElementById("selected-goal");
    selected_goal.innerHTML = goal_index == -1 ? "Rastgele" : goals[goal_index];
    edit_goal_icon();
}

let setting_index = -1;
let setting_random = true;
function set_setting(index) {
    setting_index = index;
    setting_random = setting_index == -1;
    var selected_setting = document.getElementById("selected-setting");
    selected_setting.innerHTML = setting_index == -1 ? "Rastgele" : settings[setting_index];
    edit_setting_icon();
}

let joker_index = -1;
let joker_random = true;
function set_joker(index) {
    joker_index = index;
    joker_random = joker_index == -1;
    var selected_joker = document.getElementById("selected-joker");
    selected_joker.innerHTML = joker_index == -1 ? "Rastgele" : jokers[joker_index];
    edit_joker_icon();
}
//#endregion

// generate a random number between [min] and [max]
function random_number(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}

// generate a random number between [0] and [max]
function random_number(max) {
	return Math.floor(Math.random() * (max));
}

document.addEventListener("keydown", function(event) {
    let generate_button = document.getElementById("generate-button");
    if (event.key == " ") {
        generate_button.click();
    }
});

// generate random game idea. Main click function
function generate_random_game_idea() {
    //write the idea with visual animation
    function write_idea(idea_template, total_time) {
        let idea_text = document.getElementById("idea-text");
        var total_lenght = get_complete_length(idea_template); // get the length of which the randomized value filled
        var template_length = idea_template.length;
        var wait_time = total_time * 600 / total_lenght; // calculate the wait time for each character
        let generate_button = document.getElementById("generate-button");
        let copy_button = document.getElementById("copy-button");
        let dropdowns = document.getElementsByClassName("selected");
        generate_button.disabled = true; // disable the button so the user cannot spam the generate function and jam it.
        generate_button.innerHTML = "Oluşturuluyor"
        copy_button.disabled = true;
        idea_text.innerHTML = "";
        for (const dropdown of dropdowns) {
            dropdown.classList.add("generating");
        }
        var result = ``;
        let index = 0;
        function generate_next_char() {
            if (index < template_length) {
                if (idea_template.charAt(index) == '<') {
                    while (idea_template.charAt(index) != '>') {
                        result += idea_template.charAt(index);
                        index ++;
                    }
                    generate_next_char();
                }
                else {
                    result += idea_template.charAt(index);
                    idea_text.innerHTML = result;
                    index++;
                    setTimeout(generate_next_char, wait_time);
                }
            }
            else {
                result = idea_template;
                idea_text.innerHTML = result;
                generate_button.disabled = false;
                generate_button.innerHTML = "Fikir Oluştur (Boşluk)";
                copy_button.disabled = false;
                for (const dropdown of dropdowns) {
                    dropdown.classList.remove("generating");
                }
            }
        }

        generate_next_char();
    }

    roll_random_numbers();
    edit_all_icons();

    // variables
    var theme = fill_theme_selections();
    var mood = fill_mood_selections();
    var genre = fill_genre_selections();
    var character = fill_character_selections();
    var goal = fill_goal_selections();
    var setting = fill_setting_selections();
    var joker = fill_joker_selections();

    let templates = [
        // `deneme <span class='theme'>${theme}</span> deneme <span class='mood'>${mood}</span> <span class='genre'>${genre}</span> deneme <span class='character'>${character}</span> deneme <span class='goal'>${goal}</span> <span class='setting'>${setting}</span> deneme <span class='joker'>${joker}</span>`,
        `<span class='genre'>${genre}</span> türünde <span class='mood'>${mood}</span> bir <span class='theme'>${theme}</span> oyunu. <span class='character'>${character}</span> <span class='setting'>${setting}</span> <span class='goal'>${goal}</span>. Joker: <span class='joker'>${joker}</span>`,
        // `Bir <span class='theme'>${theme}</span> oyunu <span class='mood'>${mood}</span> modunda. Oyuncu <span class='character'>${character}</span> karakterini kontrol edecek ve <span class='goal'>${goal}</span> için <span class='setting'>${setting}</span> ortamında macera yaşayacak.`,
        // `<span class='theme'>${theme}</span> temalı bir oyun, <span class='mood'>${mood}</span> atmosferiyle. <span class='goal'>${goal}</span> için <span class='character'>${character}</span> karakteriyle oynayacaksınız, <span class='setting'>${setting}</span> ortamında.`,
        // `<span class='theme'>${theme}</span> temasıyla bir oyun, <span class='mood'>${mood}</span> ve <span class='goal'>${goal}</span> ile. Oyuncu <span class='character'>${character}</span> karakterini yönlendirecek ve macerasını <span class='setting'>${setting}</span> yerinde yaşayacak.`,
        // `<span class='theme'>${theme}</span> temalı, <span class='mood'>${mood}</span> modunda bir oyun. Oyuncu <span class='character'>${character}</span> karakteriyle <span class='goal'>${goal}</span> için <span class='setting'>${setting}</span> ortamında mücadele edecek.`
    ]
    
    var random = random_number(templates.length);
    var selected_template = templates[random];

    // write_idea(selected_template, 10);
    write_idea(`<span class='theme'>Henüz</span> <span class='mood'>içeriğim</span> <span class='genre'>tamamlanmadığı</span> <span class='character'>için</span> <span class='goal'>oyun</span> <span class='setting'>fikri</span> <span class='joker'>oluşturamıyorum.</span>`, 10);
}

function copy_game_idea() {
    let idea_text = document.getElementById("idea-text");
    let button_icon = document.getElementById("button-icon");
    var clipboard = idea_text.innerText;
    navigator.clipboard.writeText(clipboard);
    button_icon.classList.replace("fa-copy", "fa-check");
    console.log("copied");
    setTimeout(reset_copy_button, 1200);
    button_icon.parentElement.disabled = true;
    button_icon.parentElement.classList.add("copied");
}

function reset_copy_button() {
    let button_icon = document.getElementById("button-icon");
    button_icon.parentElement.disabled = false;
    button_icon.parentElement.classList.remove("copied");
    button_icon.classList.replace("fa-check", "fa-copy");
    console.log("reset");
}

function roll_random_numbers() {
    theme_index = theme_random ? random_number(themes.length) : theme_index;
    mood_index = mood_random ? random_number(moods.length) : mood_index;
    genre_index = genre_random ? random_number(genres.length) : genre_index;
    character_index = character_random ? random_number(characters.length) : character_index;
    goal_index = goal_random ? random_number(goals.length) : goal_index;
    setting_index = setting_random ? random_number(settings.length) : setting_index;
    joker_index = joker_random ? random_number(jokers.length) : joker_index;
}

//#region Edit Random Icons
// hide or show the randomization icon.
function edit_all_icons() {
    edit_theme_icon();
    edit_mood_icon();
    edit_genre_icon();
    edit_character_icon();
    edit_goal_icon();
    edit_setting_icon();
    edit_joker_icon();
}

function edit_theme_icon() {
    var theme_icon = document.getElementById("theme-icon");
    if (theme_random) {
        if (theme_icon.classList.contains("hidden")) {
            theme_icon.classList.remove("hidden");
        }
    }
    else {
        if (!theme_icon.classList.contains("hidden")) {
            theme_icon.classList.add("hidden");
        }
    }
}

function edit_mood_icon() {
    var mood_icon = document.getElementById("mood-icon");
    if (mood_random) {
        if (mood_icon.classList.contains("hidden")) {
            mood_icon.classList.remove("hidden");
        }
    }
    else {
        if (!mood_icon.classList.contains("hidden")) {
            mood_icon.classList.add("hidden");
        }
    }
}

function edit_genre_icon() {
    var genre_icon = document.getElementById("genre-icon");
    if (genre_random) {
        if (genre_icon.classList.contains("hidden")) {
            genre_icon.classList.remove("hidden");
        }
    }
    else {
        if (!genre_icon.classList.contains("hidden")) {
            genre_icon.classList.add("hidden");
        }
    }
}

function edit_character_icon() {
    var character_icon = document.getElementById("character-icon");
    if (character_random) {
        if (character_icon.classList.contains("hidden")) {
            character_icon.classList.remove("hidden");
        }
    }
    else {
        if (!character_icon.classList.contains("hidden")) {
            character_icon.classList.add("hidden");
        }
    }
}

function edit_goal_icon() {
    var goal_icon = document.getElementById("goal-icon");
    if (goal_random) {
        if (goal_icon.classList.contains("hidden")) {
            goal_icon.classList.remove("hidden");
        }
    }
    else {
        if (!goal_icon.classList.contains("hidden")) {
            goal_icon.classList.add("hidden");
        }
    }
}

function edit_setting_icon() {
    var setting_icon = document.getElementById("setting-icon");
    if (setting_random) {
        if (setting_icon.classList.contains("hidden")) {
            setting_icon.classList.remove("hidden");
        }
    }
    else {
        if (!setting_icon.classList.contains("hidden")) {
            setting_icon.classList.add("hidden");
        }
    }
}

function edit_joker_icon() {
    var joker_icon = document.getElementById("joker-icon");
    if (joker_random) {
        if (joker_icon.classList.contains("hidden")) {
            joker_icon.classList.remove("hidden");
        }
    }
    else {
        if (!joker_icon.classList.contains("hidden")) {
            joker_icon.classList.add("hidden");
        }
    }
}
//#endregion

//#region Fill Selections
// set the dropdown selections accordingly
function fill_theme_selections() {
    var selected_theme = document.getElementById("selected-theme");
    theme = themes[theme_index];
    selected_theme.innerHTML = theme;
    return theme;
}

function fill_mood_selections() {
    var selected_mood = document.getElementById("selected-mood");
    mood = moods[mood_index];
    selected_mood.innerHTML = mood;
    return mood;
}

function fill_genre_selections() {
    var selected_genre = document.getElementById("selected-genre");
    genre = genres[genre_index];
    selected_genre.innerHTML = genre;
    return genre;
}

function fill_character_selections() {
    var selected_character = document.getElementById("selected-character");
    character = characters[character_index];
    selected_character.innerHTML = character;
    return character;
}

function fill_goal_selections() {
    var selected_goal = document.getElementById("selected-goal");
    goal = goals[goal_index];
    selected_goal.innerHTML = goal
    return goal;
}

function fill_setting_selections() {
    var selected_setting = document.getElementById("selected-setting");
    setting = settings[setting_index];
    selected_setting.innerHTML = setting;
    return setting;
}

function fill_joker_selections() {
    var selected_joker = document.getElementById("selected-joker");
    joker = jokers[joker_index];
    selected_joker.innerHTML = joker;
    return joker;
}

//#endregion

// calculates the total length of the template with variables filled
function get_complete_length(template) {
    total = template.length;
    if (template.includes("<span class='theme'>")) {
        total -= 27;
        total += theme.length;
    }
    if (template.includes("<span class='mood'>")) {
        total -= 26;
        total += mood.length;
    }
    if (template.includes("<span class='genre'>")) {
        total -= 27;
        total += genre.length;
    }
    if (template.includes("<span class='character'>")) {
        total -= 31;
        total += character.length;
    }
    if (template.includes("<span class='goal'>")) {
        total -= 27;
        total += goal.length;
    }
    if (template.includes("<span class='setting'>")) {
        total -= 29;
        total += setting.length;
    }
    if (template.includes("<span class='joker'>")) {
        total -= 27;
        total += joker.length;
    }
    return total;
}