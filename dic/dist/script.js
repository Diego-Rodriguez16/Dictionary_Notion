document.getElementById("search-btn").addEventListener("click", fetchWordData);

async function fetchWordData() {
    const word = document.getElementById("inp-word").value.trim();
    if (!word) {
        alert("Please enter a word!");
        return;
    }

    const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Word not found");

        const data = await response.json();
        const wordData = processWordData(data);
        displayWordData(wordData);
    } catch (error) {
        alert(error.message);
    }
}

function processWordData(data) {
    // Procesar múltiples objetos para la misma palabra
    const meanings = [];
    const phonetics = [];
    const audioUrls = new Set(); // Para evitar duplicados

    data.forEach(entry => {
        // Recoger fonética y audios
        entry.phonetics.forEach(phonetic => {
            if (phonetic.text) phonetics.push(phonetic.text);
            if (phonetic.audio && (phonetic.audio.includes("-us-") || phonetic.audio.endsWith("us.mp3"))) {
                audioUrls.add(phonetic.audio);
            }
        });

        // Recoger significados
        entry.meanings.forEach(meaning => {
            const partOfSpeech = meaning.partOfSpeech;
            meaning.definitions.forEach(definition => {
                meanings.push({
                    partOfSpeech,
                    definition: definition.definition,
                    example: definition.example || "No example available"
                });
            });
        });
    });

    return {
        word: data[0].word,
        meanings,
        phonetics: [...new Set(phonetics)], // Eliminar duplicados
        audioUrls: [...audioUrls] // Convertir Set a array
    };
}

function displayWordData({ word, meanings, phonetics, audioUrls }) {
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = `
        <h3>${word}</h3>
        <div class="details">
            <div class="phonetics">
                ${phonetics.map(phonetic => `<span>${phonetic}</span>`).join(", ")}
            </div>
            ${audioUrls.length > 0 
                ? audioUrls.map(url => `<button onclick="playAudio('${url}')">🔊</button>`).join("") 
                : ""}
        </div>
        <select id="meaning-select" class="select-box">
            ${meanings.map((m, i) => `<option value="${i}">${m.partOfSpeech}: ${m.definition.slice(0, 30)}...</option>`).join("")}
        </select>
        <div id="meaning-details">
            <p id="current-definition" class="word-meaning">${meanings[0]?.definition || "No definition available"}</p>
            <p id="current-example" class="word-example">${meanings[0]?.example || "No example available"}</p>
        </div>
        <button class="copy-btn" onclick="copyText('${word}')">Copy Word</button>
        <button class="copy-btn" onclick="copyText('${phonetics}')">Copy Phonetic</button>
        <button class="copy-btn" onclick="copyText('${audioUrls || "No audio available"}')">Copy Audio Link</button>
        <button class="copy-btn" onclick="copyText(document.getElementById('current-definition').innerText)">Copy Current Definition</button>
        <button class="copy-btn" onclick="copyText(document.getElementById('current-example').innerText)">Copy Current Example</button>
    `;

    const selectBox = document.getElementById("meaning-select");
    selectBox.addEventListener("change", () => {
        const selectedIndex = selectBox.value;
        const selectedMeaning = meanings[selectedIndex];
        document.getElementById("meaning-details").innerHTML = `
            <p id="current-definition" class="word-meaning">${selectedMeaning.definition}</p>
            <p id="current-example" class="word-example">${selectedMeaning.example}</p>
        `;
    });
}

function playAudio(url) {
    const audio = new Audio(url);
    audio.play();
}

function copyText(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert("Copied to clipboard!");
    }).catch(() => {
        alert("Failed to copy text.");
    });
}