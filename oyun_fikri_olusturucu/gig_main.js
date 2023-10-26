//#region Variables
let themes = [
    "Hayatta Kalma",
    "Fantazi",
    "Gizem",
    "Aşk",
    "Korku",
    "Macera",
    "Savaş",
    "Barış",
    "Dostluk",
    "İntikam",
    "Büyüme",
    "Ölümsüzlük",
    "Teknoloji",
    "Totaliterlik",
    "Din",
    "Gelenek",
    "Zihinsel Hastalık",
    "Uzay Seyahati",
    "Keşif",
    "Hırs",
    "Adalet",
    "Vatanseverlik",
    "Yolsuzluk",
    "Sömürü",
    "Dünyanın Sonu",
    "Haksızlık",
    "Bilgisayar Korsanlığı",
    "Yapay Zeka",
    "Robot Hakları",
    "Dünya Dışı Yaşam",
    "Hastalık",
    "Ölüm Sonrası Hayat",
    "Dans",
    "Şarkı Söyleme",
    "Arıcılık",
    "Mühendislik",
    "Dikiş",
    "Moda",
    "Fırıncılık",
    "Pullarla Uğraşma",
    "Sanat",
    "Bahçecilik",
    "Mutluluk",
    "Üzüntü",
    "Eğlence Kavramı",
    "Soğukkanlılık",
    "Stereotipler",
    "Aile",
    "İlişkiler",
    "Gerçek",
    "Yalan",
    "Cesaret",
    "Korkaklık",
    "Matematik"
]

let moods = [
    'mood1',
    'mood2',
    'mood3'
]

let genres = [
    'genre1',
    'genre2',
    'genre3'
]

let characters = [
    'character1',
    'character2',
    'character3'
]

let goals = [
    'goal1',
    'goal2',
    'goal3'
]

let settings = [
    'setting1',
    'setting2',
    'setting3'
]

let jokers = [
    'joke1',
    'joke2',
    'joke3'
]
//#endregion

let templates = [
    'template1',
    'template2',
    'template3',
    'template4',
    'template5',
    'template6',
    'template7'
]

let theme_index = -1;
let theme_random = true;
function set_theme(index) {
    theme_index = index;
    theme_random = theme_index == -1;
    var selected_theme = document.getElementById("selected-theme");
    selected_theme.innerHTML = theme_index == -1 ? "Rastgele" : themes[theme_index];
}

let mood_index = -1;
let mood_random = true;
function set_mood(index) {
    mood_index = index;
    mood_random = mood_index == -1;
    var selected_mood = document.getElementById("selected-mood");
    selected_mood.innerHTML = mood_index == -1 ? "Rastgele" : moods[mood_index];
}

let genre_index = -1;
let genre_random = true;
function set_genre(index) {
    genre_index = index;
    genre_random = genre_index == -1;
    var selected_genre = document.getElementById("selected-genre");
    selected_genre.innerHTML = genre_index == -1 ? "Rastgele" : genres[genre_index];
}

let character_index = -1;
let character_random = true;
function set_character(index) {
    character_index = index;
    character_random = character_index == -1;
    var selected_character = document.getElementById("selected-character");
    selected_character.innerHTML = character_index == -1 ? "Rastgele" : characters[character_index];
}

let goal_index = -1;
let goal_random = true;
function set_goal(index) {
    goal_index = index;
    goal_random = goal_index == -1;
    var selected_goal = document.getElementById("selected-goal");
    selected_goal.innerHTML = goal_index == -1 ? "Rastgele" : goals[goal_index];
}

let setting_index = -1;
let setting_random = true;
function set_setting(index) {
    setting_index = index;
    setting_random = setting_index == -1;
    var selected_setting = document.getElementById("selected-setting");
    selected_setting.innerHTML = setting_index == -1 ? "Rastgele" : settings[setting_index];
}

let joker_index = -1;
let joker_random = true;
function set_joker(index) {
    joker_index = index;
    joker_random = joker_index == -1;
    var selected_joker = document.getElementById("selected-joker");
    selected_joker.innerHTML = joker_index == -1 ? "Rastgele" : jokers[joker_index];
}

function random_number(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}

function random_number(max) {
	return Math.floor(Math.random() * (max));
}

function generate_random_game_idea() {
    roll_random_numbers();
    fill_selections();
    write_random_idea_overtime("Altyapı henüz tamamlanmadığından oyun fikirlerini henüz oluşturamıyorum. Birkaç gün içinde yeniden deneyin.");
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

function fill_selections() {
    var selected_theme = document.getElementById("selected-theme");
    selected_theme.innerHTML = themes[theme_index];
    var selected_mood = document.getElementById("selected-mood");
    selected_mood.innerHTML =moods[mood_index];
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
            setTimeout(writeNextChar, 25);
        }
        else {
            generate_button.disabled = false;
            generate_button.innerHTML = "Fikir Oluştur"
        }
    }

    writeNextChar();
}