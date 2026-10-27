
const $ = id => document.getElementById(id);

let classes = JSON.parse(localStorage.getItem('omniclass-missions') || '[]');
let countdownInterval = null;
let countdownTimeout = null;
let countdownEnd = 0;
let countdownDuration = 0;
let activeClassId = null;
let toastTimeout = null;

function saveClasses() {
    localStorage.setItem('omniclass-missions', JSON.stringify(classes));
}

function showToast(message) {
    const toast = $('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

function updateClock() {
    const clock = $('clock');
    if (clock) {
        clock.textContent = new Date().toLocaleTimeString('en-IN', {
            hour12: false
        });
    }
}

function formatTime(time) {
    const [hours, minutes] = time.split(':').map(Number);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function getStatus(item) {
    if (item.completed) return 'COMPLETED';

    const now = new Date();
    const [hours, minutes] = item.time.split(':').map(Number);
    const start = new Date();
    start.setHours(hours, minutes, 0, 0);

    const end = new Date(start.getTime() + item.duration * 60000);

    if (now >= start && now < end) return 'IN PROGRESS';
    if (now < start) return 'UPCOMING';
    return 'FINISHED';
}

function renderClasses() {
    const list = $('classList');
    if (!list) return;

    list.innerHTML = '';

    classes.sort((a, b) => a.time.localeCompare(b.time));

    if ($('emptyState')) {
        $('emptyState').style.display = classes.length ? 'none' : 'block';
    }

    if ($('totalClasses')) $('totalClasses').textContent = classes.length;

    if ($('completedClasses')) {
        $('completedClasses').textContent =
            classes.filter(item => item.completed).length;
    }

    if ($('scheduleCount')) {
        $('scheduleCount').textContent = `${classes.length} missions`;
    }

    classes.forEach(item => {
        const element = document.createElement('article');
        element.className = `class-item ${item.completed ? 'completed' : ''}`;

        const symbol = document.createElement('div');
        symbol.className = 'class-symbol';
        symbol.textContent = item.completed ? '✓' : '✦';

        const details = document.createElement('div');
        details.className = 'class-details';

        const title = document.createElement('h3');
        title.textContent = item.name;

        const description = document.createElement('p');
        description.textContent = `${item.duration} minutes · ${getStatus(item)}`;

        const actions = document.createElement('div');
        actions.className = 'class-actions';

        const start = document.createElement('button');
        start.textContent = 'Start timer';
        start.onclick = () => startCountdown(item.id);

        const complete = document.createElement('button');
        complete.textContent = item.completed ? 'Undo' : 'Complete';
        complete.onclick = () => {
            item.completed = !item.completed;
            saveClasses();
            renderClasses();
            showToast(item.completed ? 'Mission completed! +XP' : 'Mission reopened!');
        };

        const remove = document.createElement('button');
        remove.textContent = 'Delete';
        remove.onclick = () => {
            if (activeClassId === item.id) resetCountdown();
            classes = classes.filter(entry => entry.id !== item.id);
            saveClasses();
            renderClasses();
            showToast('Mission removed!');
        };

        actions.append(start, complete, remove);
        details.append(title, description, actions);

        const time = document.createElement('div');
        time.className = 'class-time';
        time.textContent = formatTime(item.time);

        const duration = document.createElement('small');
        duration.textContent = `${item.duration} min`;
        time.appendChild(duration);

        element.append(symbol, details, time);
        list.appendChild(element);
    });
}

function updateCountdown() {
    const remaining = Math.max(0, Math.ceil((countdownEnd - Date.now()) / 1000));

    $('hours').textContent = String(Math.floor(remaining / 3600)).padStart(2, '0');
    $('minutes').textContent = String(Math.floor((remaining % 3600) / 60)).padStart(2, '0');
    $('seconds').textContent = String(remaining % 60).padStart(2, '0');

    const elapsed = countdownDuration - remaining;
    const progress = countdownDuration ? elapsed / countdownDuration * 100 : 0;

    if ($('progressBar')) {
        $('progressBar').style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }

    if (remaining <= 0) {
        clearInterval(countdownInterval);
        clearTimeout(countdownTimeout);

        countdownInterval = null;
        countdownTimeout = null;
        activeClassId = null;

        $('countdownMessage').textContent = 'Mission complete! Time to celebrate!';
        $('startBtn').textContent = '▶ Start Countdown';

        showToast('Countdown finished! Mission accomplished!');
    }
}

function startCountdown(id = null) {
    clearInterval(countdownInterval);
    clearTimeout(countdownTimeout);

    const item = id ? classes.find(entry => entry.id === id) : null;
    countdownDuration = (item ? item.duration : 25) * 60;
    countdownEnd = Date.now() + countdownDuration * 1000;
    activeClassId = item ? item.id : null;

    $('countdownMessage').textContent = item
        ? `Mission active: ${item.name}`
        : 'Focus mode activated for 25 minutes!';

    $('startBtn').textContent = '↻ Restart Countdown';

    updateCountdown();

    countdownInterval = setInterval(updateCountdown, 250);

    countdownTimeout = setTimeout(() => {
        if (countdownInterval) updateCountdown();
    }, countdownDuration * 1000 + 100);
}

function resetCountdown() {
    clearInterval(countdownInterval);
    clearTimeout(countdownTimeout);

    countdownInterval = null;
    countdownTimeout = null;
    countdownEnd = 0;
    countdownDuration = 0;
    activeClassId = null;

    $('hours').textContent = '00';
    $('minutes').textContent = '00';
    $('seconds').textContent = '00';

    if ($('progressBar')) $('progressBar').style.width = '0%';

    $('countdownMessage').textContent = 'Choose a mission to begin!';
    $('startBtn').textContent = '▶ Start Countdown';
}

$('classForm').addEventListener('submit', event => {
    event.preventDefault();

    const name = $('className').value.trim();
    const time = $('classTime').value;
    const duration = Number($('classDuration').value);

    if (!name || !time) {
        showToast('Enter a class name and time!');
        return;
    }

    classes.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        time,
        duration,
        completed: false
    });

    saveClasses();
    renderClasses();
    event.target.reset();
    $('classDuration').value = '60';

    showToast('New mission added!');
});

$('startBtn').addEventListener('click', () => startCountdown());
$('resetBtn').addEventListener('click', resetCountdown);

updateClock();
renderClasses();

setInterval(updateClock, 1000);
setInterval(renderClasses, 30000);
