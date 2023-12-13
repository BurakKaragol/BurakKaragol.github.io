// Your GitHub username
const username = 'BurakKaragol';

// Your repository name
const repo = 'BurakKaragol.github.io';

// Path to the text file within the repository
const filePath = 'year_visualizer/index.html';

// Your personal access token
const token = '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';

// Sample JSON data for initializationvar
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

async function updateData() {
    const fileContent = JSON.stringify(jsonData);

    try {
        const existingData = await fetch(`https://api.github.com/repos/${username}/${repo}/contents/${filePath}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const existingDataJson = await existingData.json();
        const sha = existingDataJson.sha;

        const response = await fetch(`https://api.github.com/repos/${username}/${repo}/contents/${filePath}`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'Update data',
                content: btoa(unescape(encodeURIComponent(fileContent))),
                sha: sha,
            }),
        });

        const updatedData = await response.json();
        console.log('Data updated:', updatedData);
    } catch (error) {
        console.error('Error updating data:', error);
    }
}