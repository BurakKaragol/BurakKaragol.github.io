//#region variables
let mood_1 = false;
let mood_2 = false;
let productivity_1 = false;
let productivity_2 = false;
let activities_1 = false;
let activities_2 = false;
let weather_1 = false;
let weather_2 = false;
let health_1 = false;
let health_2 = false;
let hobbies_1 = false;
let hobbies_2 = false;
let achievements_1 = false;
let achievements_2 = false;
let learning_1 = false;
let learning_2 = false;
let relationships_1 = false;
let relationships_2 = false;
let travel_1 = false;
let travel_2 = false;
let money_1 = false;
let money_2 = false;
let social_1 = false;
let social_2 = false;

let mood_finished = false;
let productivity_finished = false;
let activities_finished = false;
let weather_finished = false;
let health_finished = false;
let hobbies_finished = false;
let achievements_finished = false;
let learning_finished = false;
let relationships_finished = false;
let travel_finished = false;
let money_finished = false;
let social_finished = false;

let mood_1_selected = null;
let mood_2_selected = null;
let productivity_1_selected = null;
let productivity_2_selected = null;
let activities_1_selected = null;
let activities_2_selected = null;
let weather_1_selected = null;
let weather_2_selected = null;
let health_1_selected = null;
let health_2_selected = null;
let hobbies_1_selected = null;
let hobbies_2_selected = null;
let achievements_1_selected = null;
let achievements_2_selected = null;
let learning_1_selected = null;
let learning_2_selected = null;
let relationships_1_selected = null;
let relationships_2_selected = null;
let travel_1_selected = null;
let travel_2_selected = null;
let money_1_selected = null;
let money_2_selected = null;
let social_1_selected = null;
let social_2_selected = null;

let category = "mood__emotion";

var category_icons = {
    "mood__emotion": 'fa-face-smile',
    "productivity": 'fa-chart-bar',
    "activities": 'fa-running',
    "weather" : 'fa-cloud-sun-rain',
    "health": 'fa-heartbeat',
    "hobbies" : 'fa-palette',
    "achievements": 'fa-trophy',
    "learning" : 'fa-brain',
    "relationships": 'fa-heart',
    "travel" : 'fa-plane',
    "money__spent": 'fa-money',
    "social__media" : 'fa-mobile-screen',
};

var category_first = {
    "mood__emotion": 'Feeling',
    "productivity": 'Progress',
    "activities": 'Type',
    "weather" : 'Climate',
    "health": 'Wellnes',
    "hobbies" : 'Interests',
    "achievements": 'Milestones',
    "learning" : 'Knowledge',
    "relationships": 'Connections',
    "travel" : 'Journeys',
    "money__spent": 'Expenses',
    "social__media" : 'Online',
};

var category_second = {
    "mood__emotion": 'Emotion',
    "productivity": 'Efficency',
    "activities": 'Duration',
    "weather" : 'Condition',
    "health": 'Energy',
    "hobbies" : 'Passtimes',
    "achievements": 'Success',
    "learning" : 'Education',
    "relationships": 'Bonds',
    "travel" : 'Adventures',
    "money__spent": 'Expenditure',
    "social__media" : 'Digital',
};
//#endregion

function reload_page() {
    get_category_page();
    show_loading();
    setTimeout(update_category_page(), 1000);
}

function open_category_page(new_category) {
    localStorage.setItem("category", new_category);
    window.location.href = 'category.html';
}

function set_category_page(new_category) {
    category = new_category;
    localStorage.setItem("category", new_category);
    reload_page();
}

function get_category_page() {
    category = localStorage.getItem("category");
    return category;
}

function show_loading() {
    var loading = document.getElementById("loading");
    if (loading) {
        loading.classList.add("show");
    } else {
        console.log("Loading element not found");
    }
}

function hide_loading() {
    var loading = document.getElementById("loading");
    loading.classList.remove("show");
}

function update_category_page() {
    update_sidebar();
    update_header();
    draw_graphics();
    // setTimeout(hide_loading, 2000);
}

function update_sidebar() {
    let sidebar_contents = document.getElementsByClassName("sidebar__content");
    for (let index = 0; index < sidebar_contents.length; index++) {
        if (sidebar_contents[index].classList.contains(category)) {
            if (!sidebar_contents[index].classList.contains("active")) {
                sidebar_contents[index].classList.add("active");
            }
        }
        else {
            if (sidebar_contents[index].classList.contains("active")) {
                sidebar_contents[index].classList.remove("active");
            }
        }
    }
}

let last_icon_class = "fa-face-smile";
function update_header() {
    let icons = document.getElementsByClassName("header__icon");
    if (last_icon_class != category_icons[category]) {
        for (let index = 0; index < icons.length; index++) {
            icons[index].classList.remove(last_icon_class);
            icons[index].classList.add(category_icons[category]);
        }
        last_icon_class = category_icons[category];
    }
    let header1 = document.getElementById("header-1");
    if (header1) {
        header1.innerText = category_first[category];
    }
    else {
        console.log("Header1 element not found");
    }
    let header2 = document.getElementById("header-2");
    if (header2) {
        header2.innerText = category_second[category];
    }
    else {
        console.log("Header2 element not found");
    }
}

function draw_graphics() {
    draw_graphic("1");
    draw_graphic("2");
    draw_graphic("3");
}

function draw_graphic(index) {
    let canvas = document.getElementById("canvas-" + index);
    if (canvas) {
        let ctx = canvas.getContext('2d');
    
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    
        const padding_x = 5;
        const padding_y = 5;
        const cell_size_x = 100;
        const cell_size_y = 100;
    
        ctx.fillRect(50, 50, 50, 50);
    }
    else {
        console.log("Canvas "  + index + " element not found")
    }
}

function share(index) {
    console.log("share " + index);
}

function download(index) {
    console.log("download " + index);
}
