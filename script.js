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

// Aufgaben aus localStorage laden und anzeigen
function loadTasks() {
    const savedTasks = localStorage.getItem('todoTasks');
    
    if (savedTasks) {
        const tasks = JSON.parse(savedTasks); // JSON-Text → JavaScript Array
        
        tasks.forEach(task => {
            createTaskElement(task.text, task.checked);
        });
    }
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

// Alle aktuellen Aufgaben in localStorage speichern
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
    
    localStorage.setItem('todoTasks', JSON.stringify(tasks)); // JavaScript Array → JSON-Text
}

function addTask() {
    const taskText = taskInput.value;
    
    if (taskText.trim() === '') return; // Leere Eingaben ignorieren
    
    createTaskElement(taskText, false);
    taskInput.value = ""; // Input-Feld leeren
    
    saveTasks(); // Nach dem Hinzufügen speichern
}

async function deleteAllTask() {
    const deleteAll = await customPrompt(
        "Geben Sie 'DELETE ALL' ein, um alle Aufgaben zu löschen:",
        "Alle Aufgaben löschen",
        "DELETE ALL"
    );
    
    if (deleteAll === "DELETE ALL") {
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