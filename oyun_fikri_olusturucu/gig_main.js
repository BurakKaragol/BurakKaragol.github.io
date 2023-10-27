//#region Variables
let themes = [
    "theme1",
    "theme2",
    "theme3",
    "theme4",
    "theme5",
    "theme6",
    "theme7",
    "theme8",
    "theme9"
]

let moods = [
    "mood1",
    "mood2",
    "mood3",
    "mood4",
    "mood5",
    "mood6",
    "mood7",
    "mood8",
    "mood9"
]

let genres = [
    "genre1",
    "genre2",
    "genre3",
    "genre4",
    "genre5",
    "genre6",
    "genre7",
    "genre8",
    "genre9"
]

let characters = [
    "character1",
    "character2",
    "character3",
    "character4",
    "character5",
    "character6",
    "character7",
    "character8",
    "character9"
]

let goals = [
    "goal1",
    "goal2",
    "goal3",
    "goal4",
    "goal5",
    "goal6",
    "goal7",
    "goal8",
    "goal9"
]

let settings = [
    "setting1",
    "setting2",
    "setting3",
    "setting4",
    "setting5",
    "setting6",
    "setting7",
    "setting8",
    "setting9"
]

let jokers = [
    "joker1",
    "joker2",
    "joker3",
    "joker4",
    "joker5",
    "joker6",
    "joker7",
    "joker8",
    "joker9"
]
//#endregion

let templates = [
    "template1 <span class='theme'>#theme#</span> <span class='mood'>#mood#</span> <span class='genre'>#genre#</span> <span class='character'>#character#</span> <span class='goal'>#goal#</span> <span class='setting'>#setting#</span> <span class='joker'>#joker#</span>",
    "template2 #theme# #mood# #genre# #character# #goal# #setting# #joker#"
]

window.onload = function() {
    fill_theme();
    fill_mood();
    fill_genre();
    fill_character();
    fill_goal();
    fill_setting();
    fill_joker();
}

//#region Fill Functions
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

function random_number(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}

function random_number(max) {
	return Math.floor(Math.random() * (max));
}

function generate_random_game_idea() {
    roll_random_numbers();
    edit_all_icons();
    fill_selections();
    var selected_template = select_random_template();
    console.log(selected_template);
    var result = fill_template(selected_template);
    console.log(result);
    // write_random_idea_overtime(result);
    write_random_idea_overtime("Altyapım henüz tamamlanmadığından oyun fikirlerini henüz oluşturamıyorum. Birkaç gün içinde yeniden deneyin :)");
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

function fill_selections() {
    var selected_theme = document.getElementById("selected-theme");
    selected_theme.innerHTML = themes[theme_index];
    var selected_mood = document.getElementById("selected-mood");
    selected_mood.innerHTML = moods[mood_index];
    var selected_genre = document.getElementById("selected-genre");
    selected_genre.innerHTML = genres[genre_index];
    var selected_character = document.getElementById("selected-character");
    selected_character.innerHTML = characters[character_index];
    var selected_goal = document.getElementById("selected-goal");
    selected_goal.innerHTML = goals[goal_index];
    var selected_setting = document.getElementById("selected-setting");
    selected_setting.innerHTML = settings[setting_index];
    var selected_joker = document.getElementById("selected-joker");
    selected_joker.innerHTML = jokers[joker_index];
}

function select_random_template() {
    var random = random_number(templates.length);
    return templates[random];
}

function fill_template(template) {
    var edited = template;
    if (template.includes("#theme#")) {
        edited = edited.replace("#theme#", themes[theme_index]);
    }
    if (template.includes("#mood#")) {
        edited = edited.replace("#mood#", moods[mood_index]);
    }
    if (template.includes("#genre#")) {
        edited = edited.replace("#genre#", genres[genre_index]);
    }
    if (template.includes("#character#")) {
        edited = edited.replace("#character#", characters[character_index]);
    }
    if (template.includes("#goal#")) {
        edited = edited.replace("#goal#", goals[goal_index]);
    }
    if (template.includes("#setting#")) {
        edited = edited.replace("#setting#", settings[setting_index]);
    }
    if (template.includes("#joker#")) {
        edited = edited.replace("#joker#", jokers[joker_index]);
    }
    return edited;
}

function write_random_idea_overtime(idea) {
    var idea_char_count = idea.length;
    let idea_text = document.getElementById("idea-text");
    let generate_button = document.getElementById("generate-button");
    idea_text.innerHTML = "";
    generate_button.disabled = true;
    generate_button.innerHTML = "Oluşturuluyor"
    let index = 0;
    function writeNextChar() {
        if (index < idea_char_count) {
            idea_text.innerHTML += idea.charAt(index);
            index++;
            setTimeout(writeNextChar, 50);
        }
        else {
            generate_button.disabled = false;
            generate_button.innerHTML = "Fikir Oluştur"
        }
    }

    writeNextChar();
}