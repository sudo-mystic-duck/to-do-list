// Persistente Speicher-Lösung für GitHub Pages
let storageMethod = 'none';

// Verschiedene Speichermethoden testen
function initStorage() {
    // 1. localStorage testen
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        storageMethod = 'localStorage';
        console.log('✅ localStorage verfügbar');
        return;
    } catch (e) {
        console.warn('⚠️ localStorage nicht verfügbar');
    }
    
    // 2. sessionStorage testen
    try {
        sessionStorage.setItem('test', 'test');
        sessionStorage.removeItem('test');
        storageMethod = 'sessionStorage';
        console.log('✅ sessionStorage verfügbar (Session-basiert)');
        return;
    } catch (e) {
        console.warn('⚠️ sessionStorage nicht verfügbar');
    }
    
    // 3. Cookie-Fallback
    if (navigator.cookieEnabled) {
        storageMethod = 'cookies';
        console.log('✅ Cookies verfügbar (persistente Speicherung)');
        return;
    }
    
    // 4. Letzter Fallback: URL-Parameter (sehr begrenzt)
    storageMethod = 'url';
    console.log('⚠️ Verwende URL-Parameter (begrenzte Funktionalität)');
}

// Cookie-Hilfsfunktionen
function setCookie(name, value, days = 365) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    const cookieString = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
    document.cookie = cookieString;
    console.log(`🍪 Cookie gesetzt: ${name} (${value.length} Zeichen)`);
    
    // Prüfen ob Cookie wirklich gesetzt wurde
    const testValue = getCookie(name);
    if (testValue) {
        console.log(`✅ Cookie erfolgreich gesetzt und lesbar`);
    } else {
        console.error(`❌ Cookie konnte nicht gesetzt werden!`);
    }
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    
    console.log(`🔍 Suche Cookie: ${name}`);
    console.log(`📜 Alle Cookies: ${document.cookie}`);
    
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) {
            const value = decodeURIComponent(c.substring(nameEQ.length, c.length));
            console.log(`✅ Cookie gefunden: ${name} = ${value.substring(0, 50)}...`);
            return value;
        }
    }
    console.log(`❌ Cookie nicht gefunden: ${name}`);
    return null;
}

function deleteCookie(name) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

// Universelle Speicher-Funktionen
function setStorageItem(key, value) {
    const jsonValue = JSON.stringify(value);
    
    switch (storageMethod) {
        case 'localStorage':
            try {
                localStorage.setItem(key, jsonValue);
                return true;
            } catch (e) {
                console.warn('localStorage Fehler, versuche Cookie-Fallback');
                setCookie(key, jsonValue);
                return true;
            }
            
        case 'sessionStorage':
            try {
                sessionStorage.setItem(key, jsonValue);
                return true;
            } catch (e) {
                setCookie(key, jsonValue);
                return true;
            }
            
        case 'cookies':
            setCookie(key, jsonValue);
            return true;
            
        case 'url':
            // Sehr begrenzt - nur für Demo
            window.location.hash = encodeURIComponent(jsonValue);
            return true;
            
        default:
            return false;
    }
}

function getStorageItem(key) {
    let value = null;
    
    switch (storageMethod) {
        case 'localStorage':
            try {
                value = localStorage.getItem(key);
            } catch (e) {
                value = getCookie(key);
            }
            break;
            
        case 'sessionStorage':
            try {
                value = sessionStorage.getItem(key);
            } catch (e) {
                value = getCookie(key);
            }
            break;
            
        case 'cookies':
            value = getCookie(key);
            break;
            
        case 'url':
            try {
                value = decodeURIComponent(window.location.hash.substring(1));
                if (!value) value = null;
            } catch (e) {
                value = null;
            }
            break;
    }
    
    if (value) {
        try {
            return JSON.parse(value);
        } catch (e) {
            return null;
        }
    }
    return null;
}

// Storage initialisieren
initStorage();

// Beim Laden der Seite: Gespeicherte Aufgaben laden
window.onload = function() {
    loadTasks();
    setupModalEventListeners();
};

// Custom Modal System
function createModal(title, message, buttons) {
    // Modal HTML erstellen
    const modalHTML = `
        <div class="modal-overlay" id="customModal">
            <div class="modal">
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="modal-buttons">
                    ${buttons.map(btn => 
                        `<button class="modal-button ${btn.class || ''}" data-action="${btn.action}">${btn.text}</button>`
                    ).join('')}
                </div>
            </div>
        </div>
    `;
    
    // Modal zum Body hinzufügen
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modal = document.getElementById('customModal');
    
    // Modal anzeigen
    setTimeout(() => modal.classList.add('show'), 10);
    
    return new Promise((resolve) => {
        // Event Listener für Buttons
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-button')) {
                const action = e.target.getAttribute('data-action');
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.remove();
                    resolve(action);
                }, 300);
            }
            // Schließen beim Klick auf Overlay
            if (e.target === modal) {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.remove();
                    resolve('cancel');
                }, 300);
            }
        });
    });
}

function createPromptModal(title, message, placeholder = '') {
    const modalHTML = `
        <div class="modal-overlay" id="customModal">
            <div class="modal">
                <h3>${title}</h3>
                <p>${message}</p>
                <input type="text" class="modal-input" id="modalInput" placeholder="${placeholder}" value="">
                <div class="modal-buttons">
                    <button class="modal-button" data-action="cancel">Abbrechen</button>
                    <button class="modal-button primary" data-action="confirm">OK</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('customModal');
    const input = document.getElementById('modalInput');
    
    setTimeout(() => {
        modal.classList.add('show');
        input.focus();
    }, 10);
    
    return new Promise((resolve) => {
        const handleAction = (action) => {
            const value = action === 'confirm' ? input.value : null;
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
                resolve(value);
            }, 300);
        };
        
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-button')) {
                handleAction(e.target.getAttribute('data-action'));
            }
            if (e.target === modal) {
                handleAction('cancel');
            }
        });
        
        // Enter-Taste für OK
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleAction('confirm');
            }
        });
    });
}

// Custom Alert
async function customAlert(message, title = 'Hinweis') {
    await createModal(title, message, [
        { text: 'OK', action: 'ok', class: 'primary' }
    ]);
}

// Custom Confirm
async function customConfirm(message, title = 'Bestätigung') {
    const result = await createModal(title, message, [
        { text: 'Abbrechen', action: 'cancel' },
        { text: 'OK', action: 'confirm', class: 'primary' }
    ]);
    return result === 'confirm';
}

// Custom Prompt
async function customPrompt(message, title = 'Eingabe', placeholder = '') {
    return await createPromptModal(title, message, placeholder);
}

function setupModalEventListeners() {
    // ESC-Taste zum Schließen von Modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('customModal');
            if (modal) {
                modal.classList.remove('show');
                setTimeout(() => modal.remove(), 300);
            }
        }
    });
}

// Aufgaben aus dem universellen Speichersystem laden
function loadTasks() {
    const tasks = getStorageItem('todoTasks') || [];
    
    console.log(`📂 ${tasks.length} Aufgaben geladen mit ${storageMethod}`);
    
    tasks.forEach(task => {
        createTaskElement(task.text, task.checked);
    });
}

// Hilfsfunktion: Ein Aufgaben-Element erstellen
function createTaskElement(taskText, isChecked = false) {
    const listItem = document.createElement('li');
    
    listItem.innerHTML = `
        <label>
            <input type="checkbox" class="task-checkbox" ${isChecked ? 'checked' : ''}>
            <span>${taskText}</span>
        </label>
    `;
    
    todoList.appendChild(listItem);
}

// Alle aktuellen Aufgaben im universellen Speichersystem speichern
function saveTasks() {
    const tasks = [];
    const taskItems = document.querySelectorAll('#todoList li');
    
    taskItems.forEach(item => {
        const checkbox = item.querySelector('.task-checkbox');
        const text = item.querySelector('span').textContent;
        
        tasks.push({
            text: text,
            checked: checkbox.checked
        });
    });
    
    const success = setStorageItem('todoTasks', tasks);
    
    if (success) {
        console.log(`💾 ${tasks.length} Aufgaben gespeichert mit ${storageMethod}`);
    } else {
        console.error('❌ Fehler beim Speichern der Aufgaben');
    }
}

function addTask() {
    const taskText = taskInput.value;
    
    if (taskText.trim() === '') return; // Leere Eingaben ignorieren
    
    createTaskElement(taskText, false);
    taskInput.value = ""; // Input-Feld leeren
    
    saveTasks(); // Nach dem Hinzufügen speichern
}

async function deleteAllTask() {
    const deleteAll = await customConfirm(
        "Möchten Sie wirklich alle Aufgaben löschen?",
        "Alle Aufgaben löschen"
    );
    
    if (deleteAll) {
        todoList.innerHTML = "";
        saveTasks(); // Nach dem Löschen speichern
        await customAlert("Alle Aufgaben wurden gelöscht!", "Erfolgreich");
    }
}

async function deleteCheckedTasks() {
    const checkboxes = document.querySelectorAll('.task-checkbox:checked');
    
    if (checkboxes.length === 0) {
        await customAlert("Keine Aufgaben markiert!", "Hinweis");
        return;
    }
    
    const confirmDelete = await customConfirm(
        `Möchten Sie ${checkboxes.length} markierte Aufgabe(n) wirklich löschen?`,
        "Markierte Aufgaben löschen"
    );
    
    if (confirmDelete) {
        checkboxes.forEach(checkbox => {
            checkbox.closest('li').remove();
        });
        saveTasks(); // Nach dem Löschen speichern
        await customAlert(`${checkboxes.length} Aufgabe(n) erfolgreich gelöscht!`, "Erfolgreich");
    }
}