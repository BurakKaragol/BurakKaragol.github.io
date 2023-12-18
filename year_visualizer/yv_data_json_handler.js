jsonData = 
[["mood_emotion_feeling", "mood_emotion_emotion"],
["productivity_progress", "productivity_efficecncy"],
["activities_type", "activities_duration"],
["weather_climate", "weather_condition"],
["health_wellness", "health_energy"],
["hobbies_interest", "hobbies_passtimes"],
["achievements_milestone", "achievements_success"],
["learning_knowledge", "learning_education"],
["relationships_connections", "relationships_bonds"],
["travel_journeys", "travel_adventures"],
["money_spent_expenses", "money_spent_expenditure"],
["social_media_online", "social_media_digital"]];

function show_result_page() {
    let result_window = document.getElementById("result-box");
    result_window.classList.remove("hide");
    let result_window_textarea = document.getElementById("result-textarea");
    result_window_textarea.innerText = jsonData;
}

function close_result_page() {
    let result_window = document.getElementById("result-box");
    result_window.classList.add("hide");
    window.location.href = 'index.html';
}