const STORAGE_KEY = 'td5_stories';
const MAX_STORIES = 5;
const MAX_FILE_SIZE = 20 * 1024 * 1024;

function updateClocks() {
    const now = new Date();

    const istTime = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).format(now);

    const estTime = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).format(now);

    document.getElementById('ist-clock').textContent = `IST: ${istTime}`;
    document.getElementById('est-clock').textContent = `EST: ${estTime}`;
}

function updateDate() {
    const now = new Date();
    const dateString = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(now);

    document.getElementById('current-date').textContent = dateString;
}

function getStories() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

function saveStories(stories) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
}

function renderStories() {
    const stories = getStories();
    const grid = document.getElementById('stories-grid');

    if (stories.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12 text-gray-500">
                <p class="text-lg">No stories yet. Add your first story using the content management form below.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = stories.map((story, index) => `
        <article class="story-card bg-white rounded-xl overflow-hidden shadow-md border border-gray-200">
            <img src="${story.image}" alt="Story ${index + 1}" class="story-image" loading="lazy">
            <div class="p-4">
                <p class="text-gray-800 text-sm leading-relaxed">${escapeHtml(story.content)}</p>
                <button
                    onclick="deleteStory(${index})"
                    class="mt-4 text-xs text-red-600 hover:text-red-700 font-medium transition-colors"
                >
                    Delete Story
                </button>
            </div>
        </article>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function addStory(imageData, content) {
    const stories = getStories();

    const newStory = {
        image: imageData,
        content: content.trim(),
        timestamp: Date.now()
    };

    stories.unshift(newStory);

    if (stories.length > MAX_STORIES) {
        stories.pop();
    }

    saveStories(stories);
    renderStories();
}

function deleteStory(index) {
    if (!confirm('Are you sure you want to delete this story?')) {
        return;
    }

    const stories = getStories();
    stories.splice(index, 1);
    saveStories(stories);
    renderStories();
}

window.deleteStory = deleteStory;

function setupEventListeners() {
    const imageInput = document.getElementById('story-image');
    const contentInput = document.getElementById('story-content');
    const addBtn = document.getElementById('add-story-btn');
    const clearBtn = document.getElementById('clear-all-btn');
    const charCount = document.getElementById('char-count');

    contentInput.addEventListener('input', (e) => {
        charCount.textContent = e.target.value.length;
    });

    addBtn.addEventListener('click', async () => {
        const file = imageInput.files[0];
        const content = contentInput.value.trim();

        if (!file) {
            alert('Please select an image file.');
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            alert('Image size exceeds 20MB limit. Please choose a smaller file.');
            return;
        }

        if (!content) {
            alert('Please enter story content.');
            return;
        }

        try {
            addBtn.disabled = true;
            addBtn.textContent = 'Adding Story...';

            const imageData = await readFileAsDataURL(file);

            addStory(imageData, content);

            imageInput.value = '';
            contentInput.value = '';
            charCount.textContent = '0';

            alert('Story added successfully!');
        } catch (error) {
            alert('Error adding story: ' + error.message);
        } finally {
            addBtn.disabled = false;
            addBtn.textContent = 'Add Story';
        }
    });

    clearBtn.addEventListener('click', () => {
        if (!confirm('Are you sure you want to delete ALL stories? This action cannot be undone.')) {
            return;
        }

        localStorage.removeItem(STORAGE_KEY);
        renderStories();
        alert('All stories have been cleared.');
    });
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

function checkMidnight() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    if (hours === 0 && minutes === 0 && seconds === 0) {
        updateDate();
    }
}

function init() {
    updateClocks();
    updateDate();
    renderStories();
    setupEventListeners();

    setInterval(updateClocks, 1000);
    setInterval(checkMidnight, 1000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
