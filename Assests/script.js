const subjectContainer = document.getElementById('subjectContainer');
const addSubjectForm = document.getElementById('addSubjectForm');
const subjectNameInput = document.getElementById('subjectName');
const totalClassesInput = document.getElementById('totalClasses');

let subjects = {};

// Handle form submission for adding a subject
addSubjectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = subjectNameInput.value.trim();
    const total = parseInt(totalClassesInput.value) || null;

    // Only add if name is provided and unique
    if (name && !subjects[name]) {
        subjects[name] = { attended: 0, bunked: 0, total };
        await saveSubjectToBackend(name, subjects[name]);
        renderSubject(name);
        subjectNameInput.value = '';
        totalClassesInput.value = '';
    } else {
        alert('Please enter a unique subject name.');
    }
});

// Render a subject tile
function renderSubject(name) {
    const subject = subjects[name];

    const tile = document.createElement('div');
    tile.className = 'subject-tile';
    tile.innerHTML = `
      <h3>${name}</h3>
      <div class="attendance-bar-container">
        <div id="${name}-bar" class="attendance-bar"></div>
      </div>
      <p title="Total attended and bunked">📈 Ratio: <span id="${name}-percentage">0/0 (0%)</span></p>
      <p>✅ Attended: <span id="${name}-attended">${subject.attended}</span></p>
      <p>❌ Bunked: <span id="${name}-bunked">${subject.bunked}</span></p>
      ${subject.total ? `<p>🧮 Expected Total Classes: ${subject.total}</p>` : ''}
      <p id="${name}-bunkable" style="font-weight: bold;"></p>
      <div class="subject-actions">
        <button class="counter-btn" onclick="updateCount('${name}', 'attended')">+ Attended</button>
        <button class="counter-btn" onclick="updateCount('${name}', 'bunked')">+ Bunked</button>
        <button class="counter-btn delete" onclick="deleteSubject('${name}')">🗑️ Delete</button>
      </div>
    `;

    subjectContainer.appendChild(tile);
    updateDisplay(name);
}

// Update attendance counts and UI
function updateCount(name, type) {
    if (!subjects[name]) return;
    subjects[name][type]++;

    // Update total if attended + bunked exceeds current total
    const currentTotalDone = subjects[name].attended + subjects[name].bunked;
    if (subjects[name].total && currentTotalDone > subjects[name].total) {
        subjects[name].total = currentTotalDone;
        // Update total classes display if present
        const totalEl = document.getElementById(`${name}-total`);
        if (totalEl) totalEl.textContent = subjects[name].total;
    }

    saveSubjectToBackend(name, subjects[name]);
    updateDisplay(name);
}

// Update the display for a subject
function updateDisplay(name) {
    const subj = subjects[name];
    const totalDone = subj.attended + subj.bunked;
    const percent = totalDone === 0 ? 0 : Math.round((subj.attended / totalDone) * 100);

    document.getElementById(`${name}-attended`).textContent = subj.attended;
    document.getElementById(`${name}-bunked`).textContent = subj.bunked;
    document.getElementById(`${name}-percentage`).textContent = `${subj.attended}/${totalDone} (${percent}%)`;

    // Animate progress bar
    const bar = document.getElementById(`${name}-bar`);
    bar.style.width = `${percent}%`;
    bar.style.backgroundColor = percent < 75 ? "#e63946" : "#06d6a0";

    // Bunkable logic
    const bunkableEl = document.getElementById(`${name}-bunkable`);
    if (subj.total) {
        const maxBunks = Math.floor(subj.total * 0.25);
        const remainingBunks = maxBunks - subj.bunked;

        if (remainingBunks >= 0) {
            bunkableEl.textContent = `🟢 You can still bunk ${remainingBunks} class(es) to stay ≥ 75%.`;
            bunkableEl.style.color = "green";
        } else {
            const finalPercent = subj.attended / subj.total;
            if (finalPercent < 0.75) {
                bunkableEl.textContent = `⚠️ Attendance below 75%!`;
                bunkableEl.style.color = "red";
            } else {
                bunkableEl.textContent = '';
            }
        }
    } else {
        bunkableEl.textContent = '';
    }
}

// Save subject data to Firestore
async function saveSubjectToBackend(name, data) {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert('Please log in.');
        return;
    }
    try {
        const db = firebase.firestore();
        await db.collection('attendance').doc(`${user.uid}_${name}`).set({
            userId: user.uid,
            name,
            attended: data.attended,
            bunked: data.bunked,
            total: data.total
        });
    } catch (error) {
        console.error('Error saving attendance:', error);
        alert('Error saving attendance: ' + error.message);
    }
}

// Load all subjects for the current user from Firestore
async function loadSubjectsFromBackend() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    try {
        const db = firebase.firestore();
        const querySnapshot = await db.collection('attendance')
            .where('userId', '==', user.uid)
            .get();
        subjects = {};
        subjectContainer.innerHTML = '';
        querySnapshot.forEach(doc => {
            const data = doc.data();
            subjects[data.name] = {
                attended: data.attended,
                bunked: data.bunked,
                total: data.total
            };
            renderSubject(data.name);
        });
    } catch (error) {
        console.error('Error loading attendance:', error);
        alert('Error loading attendance: ' + error.message);
    }
}

// Only one auth state listener needed
firebase.auth().onAuthStateChanged(user => {
    if (!user) {
        window.location.href = "login.html";
    } else {
        loadSubjectsFromBackend();
    }
});

// Refresh all subject tiles
function refreshSubjectList() {
    subjectContainer.innerHTML = '';
    Object.keys(subjects).forEach(renderSubject);
}

// Delete a subject
function deleteSubject(name) {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
        const user = firebase.auth().currentUser;
        if (!user) {
            alert('Please log in.');
            return;
        }
        const db = firebase.firestore();
        db.collection('attendance').doc(`${user.uid}_${name}`).delete()
            .then(() => {
                delete subjects[name];
                refreshSubjectList();
            })
            .catch(error => {
                console.error('Error deleting subject:', error);
                alert('Error deleting subject: ' + error.message);
            });
    }
}