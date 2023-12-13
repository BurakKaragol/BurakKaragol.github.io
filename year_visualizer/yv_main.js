window.onload = function() {
    enable_buttons();
}

function select(category, selected) {
    let button_l = document.getElementById(category + '-l');
    let button_m = document.getElementById(category + '-m');
    let button_r = document.getElementById(category + '-r');
    switch (selected) {
        case 'l':
            if (button_m.classList.contains("selected")) {
                button_m.classList.remove("selected");
                button_m.onclick = () => select(category, "m");
            }
            if (button_r.classList.contains("selected")) {
                button_r.classList.remove("selected");
                button_r.onclick = () => select(category, "r");
            }
            if (button_l.classList.contains("selected")) {
                button_l.classList.remove("selected");
                button_l.onclick = () => select(category, "l");
            }
            else {
                button_l.classList.add("selected");
                button_l.onclick = () => reset_button(category, "l");
            }
            button_l.disabled = true;
            setTimeout(() => activate_button(button_l), 500);
            break;
        case 'm':
            if (button_l.classList.contains("selected")) {
                button_l.classList.remove("selected");
                button_l.onclick = () => select(category, "l");
            }
            if (button_r.classList.contains("selected")) {
                button_r.classList.remove("selected");
                button_r.onclick = () => select(category, "r");
            }
            if (button_m.classList.contains("selected")) {
                button_m.classList.remove("selected");
                button_m.onclick = () => select(category, "m");
            }
            else {
                button_m.classList.add("selected");
                button_m.onclick = () => reset_button(category, "m");
            }
            button_m.disabled = true;
            setTimeout(() => activate_button(button_m), 500);
            break;
        case 'r':
            if (button_l.classList.contains("selected")) {
                button_l.classList.remove("selected");
                button_l.onclick = () => select(category, "l");
            }
            if (button_m.classList.contains("selected")) {
                button_m.classList.remove("selected");
                button_m.onclick = () => select(category, "m");
            }
            if (button_r.classList.contains("selected")) {
                button_r.classList.remove("selected");
                button_r.onclick = () => select(category, "r");
            }
            else {
                button_r.classList.add("selected");
                button_r.onclick = () => reset_button(category, "r");
            }
            button_r.disabled = true;
            setTimeout(() => activate_button(button_r), 500);
            break;
        default:
            break;
    }
    check(category);
    update_submit_button();
}

function check(category) {
    let button_l = document.getElementById(category + '-l');
    let button_m = document.getElementById(category + '-m');
    let button_r = document.getElementById(category + '-r');
    if (button_l.classList.contains("selected")) {
        mark(category, true, -1);
    } 
    else if (button_m.classList.contains("selected")) {
        mark(category, true, 0);
    }
    else if (button_r.classList.contains("selected")) {
        mark(category, true, 1);
    }
    else {
        mark(category, false, null);
    }
}

function mark(category, state, index) {
    switch (category) {
        case "mood-1":
            mood_1 = state;
            mood_1_selected = index;
            break;
        
        case "mood-2":
            mood_2 = state;
            mood_2_selected = index;
            break;
        
        case "productivity-1":
            productivity_1 = state;
            productivity_1_selected = index;
            break;
            
        case "productivity-2":
            productivity_2 = state;
            productivity_2_selected = index;
            break;
        
        case "activities-1":
            activities_1 = state;
            activities_1_selected = index;
            break;
            
        case "activities-2":
            activities_2 = state;
            activities_2_selected = index;
            break;
        
        case "weather-1":
            weather_1 = state;
            weather_1_selected = index;
            break;
        
        case "weather-2":
            weather_2 = state;
            weather_2_selected = index;
            break;
        
        case "health-1":
            health_1 = state;
            health_1_selected = index;
            break;
            
        case "health-2":
            health_2 = state;
            health_2_selected = index;
            break;
        
        case "hobbies-1":
            hobbies_1 = state;
            hobbies_1_selected = index;
            break;
            
        case "hobbies-2":
            hobbies_2 = state;
            hobbies_2_selected = index;
            break;

        case "achievements-1":
            achievements_1 = state;
            achievements_1_selected = index;
            break;
        
        case "achievements-2":
            achievements_2 = state;
            achievements_2_selected = index;
            break;
        
        case "learning-1":
            learning_1 = state;
            learning_1_selected = index;
            break;
            
        case "learning-2":
            learning_2 = state;
            learning_2_selected = index;
            break;
        
        case "relationships-1":
            relationships_1 = state;
            relationships_1_selected = index;
            break;
            
        case "relationships-2":
            relationships_2 = state;
            relationships_2_selected = index;
            break;
        
        case "travel-1":
            travel_1 = state;
            travel_1_selected = index;
            break;
        
        case "travel-2":
            travel_2 = state;
            travel_2_selected = index;
            break;
        
        case "money-1":
            money_1 = state;
            money_1_selected = index;
            break;
            
        case "money-2":
            money_2 = state;
            money_2_selected = index;
            break;
        
        case "social-1":
            social_1 = state;
            social_1_selected = index;
            break;
            
        case "social-2":
            social_2 = state;
            social_2_selected = index;
            break;
    }
    check_completed();
}

function check_completed() {
    mood_finished = mood_1 && mood_2;
    productivity_finished = productivity_1 && productivity_2;
    activities_finished = activities_1 && activities_2;
    weather_finished = weather_1 && weather_2;
    health_finished = health_1 && health_2;
    hobbies_finished = hobbies_1 && hobbies_2;
    achievements_finished = achievements_1 && achievements_2;
    learning_finished = learning_1 && learning_2;
    relationships_finished = relationships_1 && relationships_2;
    travel_finished = travel_1 && travel_2;
    money_finished = money_1 && money_2;
    social_finished = social_1 && social_2;
    update_inputs();
}

function update_inputs() {
    if (mood_finished) {
        let mood = document.getElementById("mood-input");
        if (!mood.classList.contains("completed")) {
            mood.classList.add("completed");
        }
    }
    else {
        let mood = document.getElementById("mood-input");
        if (mood.classList.contains("completed")) {
            mood.classList.remove("completed");
        }
    }
    if (productivity_finished) {
        let productivity = document.getElementById("productivity-input");
        if (!productivity.classList.contains("completed")) {
            productivity.classList.add("completed");
        }
    } 
    else {
        let productivity = document.getElementById("productivity-input");
        if (productivity.classList.contains("completed")) {
            productivity.classList.remove("completed");
        }
    }
    if (activities_finished) {
        let activities = document.getElementById("activities-input");
        if (!activities.classList.contains("completed")) {
            activities.classList.add("completed");
        }
    }
    else {
        let activities = document.getElementById("activities-input");
        if (activities.classList.contains("completed")) {
            activities.classList.remove("completed");
        }
    }
    if (weather_finished) {
        let weather = document.getElementById("weather-input");
        if (!weather.classList.contains("completed")) {
            weather.classList.add("completed");
        }
    }
    else {
        let weather = document.getElementById("weather-input");
        if (weather.classList.contains("completed")) {
            weather.classList.remove("completed");
        }
    }
    if (health_finished) {
        let health = document.getElementById("health-input");
        if (!health.classList.contains("completed")) {
            health.classList.add("completed");
        }
    }
    else {
        let health = document.getElementById("health-input");
        if (health.classList.contains("completed")) {
            health.classList.remove("completed");
        }
    }
    if (hobbies_finished) {
        let hobbies = document.getElementById("hobbies-input");
        if (!hobbies.classList.contains("completed")) {
            hobbies.classList.add("completed");
        }
    }
    else {
        let hobbies = document.getElementById("hobbies-input");
        if (hobbies.classList.contains("completed")) {
            hobbies.classList.remove("completed");
        }
    }
    if (achievements_finished) {
        let achievements = document.getElementById("achievements-input");
        if (!achievements.classList.contains("completed")) {
            achievements.classList.add("completed");
        }
    }
    else {
        let achievements = document.getElementById("achievements-input");
        if (achievements.classList.contains("completed")) {
            achievements.classList.remove("completed");
        }
    }
    if (learning_finished) {
        let learning = document.getElementById("learning-input");
        if (!learning.classList.contains("completed")) {
            learning.classList.add("completed");
        }
    }
    else {
        let learning = document.getElementById("learning-input");
        if (learning.classList.contains("completed")) {
            learning.classList.remove("completed");
        }
    }
    if (relationships_finished) {
        let relationships = document.getElementById("relationships-input");
        if (!relationships.classList.contains("completed")) {
            relationships.classList.add("completed");
        }
    }
    else
    {
        let relationships = document.getElementById("relationships-input");
        if (relationships.classList.contains("completed")) {
            relationships.classList.remove("completed");
        }
    }
    if (travel_finished) {
        let travel = document.getElementById("travel-input");
        if (!travel.classList.contains("completed")) {
            travel.classList.add("completed");
        }
    }
    else {
        let travel = document.getElementById("travel-input");
        if (travel.classList.contains("completed")) {
            travel.classList.remove("completed");
        }
    }
    if (money_finished) {
        let money = document.getElementById("money-input");
        if (!money.classList.contains("completed")) {
            money.classList.add("completed");
        }
    }
    else {
        let money = document.getElementById("money-input");
        if (money.classList.contains("completed")) {
            money.classList.remove("completed");
        }
    }
    if (social_finished) {
        let social = document.getElementById("social-input");
        if (!social.classList.contains("completed")) {
            social.classList.add("completed");
        }
    }
    else {
        let social = document.getElementById("social-input");
        if (social.classList.contains("completed")) {
            social.classList.remove("completed");
        }
    }
}

function reset_button(category, selected) {
    let button = document.getElementById(category + '-' + selected);
    if (button.classList.contains("selected")) {
        button.classList.remove("selected");
        let mood = document.getElementById("mood-input");
        let productivity = document.getElementById("productivity-input");
        let activities = document.getElementById("activities-input");
        let weather = document.getElementById("weather-input");
        let health = document.getElementById("health-input");
        let hobbies = document.getElementById("hobbies-input");
        let achievements = document.getElementById("achievements-input");
        let learning = document.getElementById("learning-input");
        let relationships = document.getElementById("relationships-input");
        let travel = document.getElementById("travel-input");
        let money = document.getElementById("money-input");
        let social = document.getElementById("social-input");
        switch (category) {
            case "mood-1":
                mood.classList.remove("completed");
                mood_1 = false;
                mood_finished = false;
                break;
            case "mood-2":
                mood.classList.remove("completed")
                mood_2 = false;
                mood_finished = false;
                break;
            case "productivity-1":
                productivity.classList.remove("completed");
                productivity_1 = false;
                productivity_finished = false;
            case "productivity-2":
                productivity.classList.remove("completed");
                productivity_2 = false;
                productivity_finished = false;
                break;
            case "activities-1":
                activities.classList.remove("completed");
                activities_1 = false;
                activities_finished = false;
            case "activities-2":
                activities.classList.remove("completed");
                activities_2 = false;
                activities_finished = false;
                break;
            case "weather-1":
                weather.classList.remove("completed");
                weather_1 = false;
                weather_finished = false;
            case "weather-2":
                weather.classList.remove("completed");
                weather_2 = false;
                weather_finished = false;
                break;
            case "health-1":
                health.classList.remove("completed");
                health_1 = false;
                health_finished = false;
            case "health-2":
                health.classList.remove("completed");
                health_2 = false;
                health_finished = false;
                break;
            case "hobbies-1":
                hobbies.classList.remove("completed");
                hobbies_1 = false;
                hobbies_finished = false;
            case "hobbies-2":
                hobbies.classList.remove("completed");
                hobbies_2 = false;
                hobbies_finished = false;
                break;
            case "achievements-1":
                achievements.classList.remove("completed");
                achievements_1 = false;
                achievements_finished = false;
            case "achievements-2":
                achievements.classList.remove("completed");
                achievements_2 = false;
                achievements_finished = false;
                break;
            case "learning-1":
                learning.classList.remove("completed");
                learning_1 = false;
                learning_finished = false;
            case "learning-2":
                learning.classList.remove("completed");
                learning_2 = false;
                learning_finished = false;
                break;
            case "relationships-1":
                relationships.classList.remove("completed");
                relationships_1 = false;
                relationships_finished = false;
            case "relationships-2":
                relationships.classList.remove("completed");
                relationships_2 = false;
                relationships_finished = false;
                break;
            case "travel-1":
                travel.classList.remove("completed");
                travel_1 = false;
                travel_finished = false;
            case "travel-2":
                travel.classList.remove("completed");
                travel_2 = false;
                travel_finished = false;
                break;
            case "money-1":
                money.classList.remove("completed");
                money_1 = false;
                money_finished = false;
            case "money-2":
                money.classList.remove("completed");
                money_2 = false;
                money_finished = false;
                break;
            case "social-1":
                social.classList.remove("completed");
                social_1 = false;
                social_finished = false;
            case "social-2":
                social.classList.remove("completed");
                social_2 = false;
                social_finished = false;
                break;
        }
    }
    button.onclick = () => select(category, selected);
    button.disabled = true;
    update_submit_button();
    setTimeout(() => activate_button(button), 500);
    update_inputs();
}

function activate_button(button) {
    button.disabled = false;
}

function update_submit_button() {
    var answered = 0;
    answered += mood_1 ? 1 : 0;
    answered += mood_2 ? 1 : 0;
    answered += productivity_1 ? 1 : 0;
    answered += productivity_2 ? 1 : 0;
    answered += activities_1 ? 1 : 0;
    answered += activities_2 ? 1 : 0;
    answered += weather_1 ? 1 : 0;
    answered += weather_2 ? 1 : 0;
    answered += health_1 ? 1 : 0;
    answered += health_2 ? 1 : 0;
    answered += hobbies_1 ? 1 : 0;
    answered += hobbies_2 ? 1 : 0;
    answered += achievements_1 ? 1 : 0;
    answered += achievements_2 ? 1 : 0;
    answered += learning_1 ? 1 : 0;
    answered += learning_2 ? 1 : 0;
    answered += relationships_1 ? 1 : 0;
    answered += relationships_2 ? 1 : 0;
    answered += travel_1 ? 1 : 0;
    answered += travel_2 ? 1 : 0;
    answered += money_1 ? 1 : 0;
    answered += money_2 ? 1 : 0;
    answered += social_1 ? 1 : 0;
    answered += social_2 ? 1 : 0;

    let submit_button = document.getElementById("submit-button");
    let submit_button_fill = document.getElementById("submit-fill");
    let submit_button_text = document.getElementById("submit-button-text");
    if (answered <= 23) {
        if (submit_button.classList.contains("ready")) {
            submit_button.classList.remove("ready");
        }
        submit_button.style.width = "600px";
        submit_button_fill.style.width = (answered / 24) * 100 + "%";
        submit_button_text.innerText = "Fill All Areas For Saving";
    }
    else {
        if (!submit_button.classList.contains("ready")) {
            submit_button.classList.add("ready");
        }
        submit_button.style.width = "200px";
        submit_button_fill.style.width = "100%";
        submit_button_text.innerText = "Submit";
    }
}

function submit_pressed() {
    save_answers();
    let submit_button = document.getElementById("submit-button");
    let submit_button_text = document.getElementById("submit-button-text");
    submit_button.style.width = "1400px";
    if (!submit_button.classList.contains("submitted"))
    {
        submit_button.classList.add("submitted");
    }
    submit_button_text.innerText = "Submitted! Come back again tomorrow for filling the next day.";
    submit_button.disabled = true;
    disable_buttons();
}

function save_answers() {
    jsonData = 
    [[mood_1_selected, mood_2_selected],
    [productivity_1_selected, productivity_2_selected],
    [activities_1_selected, activities_2_selected],
    [weather_1_selected, weather_2_selected],
    [health_1_selected, health_2_selected],
    [hobbies_1_selected, hobbies_2_selected],
    [achievements_1_selected, achievements_2_selected],
    [learning_1_selected, learning_2_selected],
    [relationships_1_selected, relationships_2_selected],
    [travel_1_selected, travel_2_selected],
    [money_1_selected, money_2_selected],
    [social_1_selected, social_2_selected]];
    updateData();
}

function disable_buttons() {
    let buttons = document.getElementsByClassName("question__button");
    for (let index = 0; index < buttons.length; index++) {
        buttons[index].disabled = true;
    }
}

function enable_buttons() {
    let buttons = document.getElementsByClassName("question__button");
    for (let index = 0; index < buttons.length; index++) {
        buttons[index].disabled = false;
    }
}
