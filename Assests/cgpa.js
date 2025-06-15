const gradeMap = {
    "O": 10,
    "A+": 9.5,
    "A": 9,
    "B+": 8,
    "B": 7,
    "C": 6,
    "P": 5
};
const addSubjectForm = document.getElementById('addSubjectForm');
const subjectList = document.getElementById('subjectList');
const cgpaDisplay = document.getElementById('cgpa');
const savedSemesters = document.getElementById('savedSemesters');

let subjects = [];
let semesters = [];
let editingSemesterId = null; // Used to detect if we're editing

addSubjectForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('subjectName').value.trim();
    const credits = parseInt(document.getElementById('credits').value);
    const grade = parseInt(document.getElementById('grade').value);

    if (name && credits > 0 && grade >= 0) {
        subjects.push({ name, credits, grade });
        renderSubject(name, credits, grade);
        updateCGPA();
        addSubjectForm.reset();
    } else {
        alert('Please fill all fields correctly.');
    }
});

function renderSubject(name, credits, grade) {
    const li = document.createElement('li');
    li.textContent = `${name}: ${credits} credits, Grade ${gradeToLetter(grade)}`;
    subjectList.appendChild(li);
}

function gradeToLetter(grade) {
    const grades = { 10: 'O', 9.5: 'A+', 9: 'A', 8: 'B+', 7: 'B', 6: 'C', 5: 'p', 0: 'F' };
    return grades[grade] || 'Unknown';
}

function updateCGPA() {
    let totalWeightedPoints = 0;
    let totalCredits = 0;

    subjects.forEach(sub => {
        // Convert grade to lowercase and trim spaces
        const gradeKey = String(sub.grade).toLowerCase().trim();
        const gradeValue = gradeMap[gradeKey];
        const credits = parseFloat(sub.credits);

        if (!isNaN(gradeValue) && !isNaN(credits)) {
            totalWeightedPoints += gradeValue * credits;
            totalCredits += credits;
        }
    });

    let sgpa = 0;
    if (totalCredits > 0) {
        sgpa = totalWeightedPoints / totalCredits;
    }

    cgpaDisplay.textContent = sgpa.toFixed(2);
}

function saveSemester() {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert('Please log in.');
        return;
    }
    if (subjects.length === 0) {
        alert('Add subjects before saving.');
        return;
    }

    const db = firebase.firestore();
    const semesterData = {
        userId: user.uid,
        semester: semesters.length + 1,
        subjects: [...subjects]
    };

    if (editingSemesterId) {
        // Update existing semester
        db.collection('cgpa').doc(editingSemesterId).set(semesterData)
            .then(() => {
                const index = semesters.findIndex(s => s.id === editingSemesterId);
                semesters[index] = { ...semesterData, id: editingSemesterId };
                resetForm();
                renderSemesters();
                alert('Semester updated!');
            })
            .catch(error => {
                console.error('Error updating CGPA:', error);
                alert('Error updating CGPA: ' + error.message);
            });
    } else {
        // Add new semester
        db.collection('cgpa').add(semesterData)
            .then(docRef => {
                semesters.push({ ...semesterData, id: docRef.id });
                resetForm();
                renderSemesters();
                alert('Semester saved!');
            })
            .catch(error => {
                console.error('Error saving CGPA:', error);
                alert('Error saving CGPA: ' + error.message);
            });
    }
}

async function loadSemestersFromBackend() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    try {
        const db = firebase.firestore();
        const querySnapshot = await db.collection('cgpa')
            .where('userId', '==', user.uid)
            .get();
        semesters = [];
        querySnapshot.forEach(doc => {
            const data = doc.data();
            semesters.push({ id: doc.id, ...data });
        });
        renderSemesters();
    } catch (error) {
        console.error('Error loading semesters:', error);
        alert('Error loading semesters: ' + error.message);
    }
}

function renderSemesters() {
  savedSemesters.innerHTML = '';
  semesters.forEach(sem => {
    const div = document.createElement('div');
    div.className = 'tile';

    const cgpa = (sem.subjects.reduce((sum, subj) => sum + subj.credits * subj.grade, 0) /
                  sem.subjects.reduce((sum, subj) => sum + subj.credits, 0)).toFixed(2);

    const subjectsContainer = document.createElement('div');
    let isEditing = false;

    function renderSubjectsList() {
      subjectsContainer.innerHTML = '';
      const ul = document.createElement('ul');
      sem.subjects.forEach(subj => {
        const li = document.createElement('li');
        li.textContent = `${subj.name}: ${subj.credits} credits, Grade ${gradeToLetter(subj.grade)}`;
        ul.appendChild(li);
      });
      subjectsContainer.appendChild(ul);
    }

    function renderSubjectsEdit() {
      subjectsContainer.innerHTML = '';
      sem.subjects.forEach((subj) => {
        const subjDiv = document.createElement('div');
        subjDiv.style.marginBottom = '8px';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = subj.name + ': ';
        subjDiv.appendChild(nameSpan);

        const gradeSelect = document.createElement('select');
        [10, 9.5, 9, 8, 7, 6, 5, 0].forEach(g => {
          const option = document.createElement('option');
          option.value = g;
          option.textContent = `${gradeToLetter(g)} (${g})`;
          if (g === subj.grade) option.selected = true;
          gradeSelect.appendChild(option);
        });
        subjDiv.appendChild(gradeSelect);

        subjectsContainer.appendChild(subjDiv);
        subj._gradeSelect = gradeSelect;
      });
    }

    const buttonsDiv = document.createElement('div');
    buttonsDiv.style.marginTop = '10px';

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.className = 'auth-btn';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.className = 'auth-btn';
    saveBtn.style.display = 'none';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'auth-btn';
    cancelBtn.style.display = 'none';
    cancelBtn.style.marginLeft = '10px';

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'auth-btn';
    deleteBtn.style.marginLeft = '10px';

    buttonsDiv.appendChild(editBtn);
    buttonsDiv.appendChild(saveBtn);
    buttonsDiv.appendChild(cancelBtn);
    buttonsDiv.appendChild(deleteBtn);

    div.appendChild(document.createElement('h4')).textContent = `Semester ${sem.semester}`;
    div.appendChild(subjectsContainer);
    div.appendChild(document.createElement('p')).textContent = `CGPA: ${cgpa}`;
    div.appendChild(buttonsDiv);

    renderSubjectsList();

    editBtn.addEventListener('click', () => {
      isEditing = true;
      renderSubjectsEdit();
      editBtn.style.display = 'none';
      saveBtn.style.display = '';
      cancelBtn.style.display = '';
      deleteBtn.style.display = 'none'; // hide delete during edit
    });

    cancelBtn.addEventListener('click', () => {
      isEditing = false;
      renderSubjectsList();
      editBtn.style.display = '';
      saveBtn.style.display = 'none';
      cancelBtn.style.display = 'none';
      deleteBtn.style.display = ''; // show delete again
    });

    saveBtn.addEventListener('click', async () => {
      sem.subjects.forEach(subj => {
        subj.grade = parseInt(subj._gradeSelect.value);
        delete subj._gradeSelect;
      });

      const user = firebase.auth().currentUser;
      if (!user) {
        alert('Please log in.');
        return;
      }

      try {
        const db = firebase.firestore();
        const querySnapshot = await db.collection('cgpa')
          .where('userId', '==', user.uid)
          .where('semester', '==', sem.semester)
          .get();

        if (querySnapshot.empty) {
          alert('Semester document not found.');
          return;
        }

        const docId = querySnapshot.docs[0].id;

        await db.collection('cgpa').doc(docId).update({
          subjects: sem.subjects
        });

        alert('Semester updated successfully!');
        isEditing = false;
        renderSubjectsList();
        editBtn.style.display = '';
        saveBtn.style.display = 'none';
        cancelBtn.style.display = 'none';
        deleteBtn.style.display = '';

        loadSemestersFromBackend();

      } catch (error) {
        console.error('Error updating semester:', error);
        alert('Error updating semester: ' + error.message);
      }
    });

    deleteBtn.addEventListener('click', async () => {
      if (!confirm(`Are you sure you want to delete Semester ${sem.semester}?`)) return;

      const user = firebase.auth().currentUser;
      if (!user) {
        alert('Please log in.');
        return;
      }

      try {
        const db = firebase.firestore();
        const querySnapshot = await db.collection('cgpa')
          .where('userId', '==', user.uid)
          .where('semester', '==', sem.semester)
          .get();

        if (querySnapshot.empty) {
          alert('Semester document not found.');
          return;
        }

        const docId = querySnapshot.docs[0].id;

        await db.collection('cgpa').doc(docId).delete();

        // Remove semester from local array and re-render
        semesters = semesters.filter(s => s.semester !== sem.semester);
        renderSemesters();

        alert('Semester deleted successfully!');
      } catch (error) {
        console.error('Error deleting semester:', error);
        alert('Error deleting semester: ' + error.message);
      }
    });

    savedSemesters.appendChild(div);
  });
}


async function deleteSemester(id) {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert('Please log in.');
        return;
    }
    if (!confirm('Are you sure you want to delete this semester?')) return;

    try {
        const db = firebase.firestore();
        await db.collection('cgpa').doc(id).delete();
        semesters = semesters.filter(sem => sem.id !== id);
        renderSemesters();
        alert('Semester deleted!');
    } catch (error) {
        console.error('Error deleting semester:', error);
        alert('Error deleting semester: ' + error.message);
    }
}

function editSemester(id) {
    const sem = semesters.find(s => s.id === id);
    if (!sem) return;

    editingSemesterId = id;
    subjects = [...sem.subjects];
    subjectList.innerHTML = '';
    subjects.forEach(sub => renderSubject(sub.name, sub.credits, sub.grade));
    updateCGPA();

    alert(`You are now editing Semester ${sem.semester}. Click "Save" to update.`);
}

function resetForm() {
    editingSemesterId = null;
    subjects = [];
    subjectList.innerHTML = '';
    cgpaDisplay.textContent = '0.00';
    addSubjectForm.reset();
}

// Only one auth state listener needed
firebase.auth().onAuthStateChanged(user => {
    if (!user) {
        window.location.href = "login.html";
    } else {
        loadSemestersFromBackend();
    }
});

firebase.auth().onAuthStateChanged(user => {
    if (user) {
        loadSemestersFromBackend();
    }
});
