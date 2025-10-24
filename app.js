const STORAGE_KEY = 'td5_stories';
const MAX_STORIES = 5;
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const NEWS_API_KEY = 'YOUR_NEWS_API_KEY_HERE'; // Replace with actual API key

// Clock Functions
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
    
    const istElement = document.getElementById('ist-clock');
    const estElement = document.getElementById('est-clock');
    
    if (istElement) istElement.textContent = `IST: ${istTime}`;
    if (estElement) estElement.textContent = `EST: ${estTime}`;
}

// Date Functions
function updateDate() {
    const now = new Date();
    const dateString = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(now);
    
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        dateElement.textContent = dateString;
    }
}

// Storage Functions
function getStories() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

function saveStories(stories) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
}

// Render Stories
function renderStories() {
    const stories = getStories();
    const grid = document.getElementById('stories-grid');
    
    if (!grid) return;
    
    if (stories.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12 text-gray-500">
                <p class="text-lg">No stories yet. Add your first story using the content management form below.</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = stories.map((story, index) => `
        <article class="story-card bg-white rounded-xl overflow-hidden shadow-md border border-gray-200 hover:shadow-xl transition-shadow">
            <img src="${story.image}" alt="Story ${index + 1}" class="story-image w-full h-48 object-cover" loading="lazy">
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

// Add Story
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

// Delete Story
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

// Event Listeners Setup
function setupEventListeners() {
    const imageInput = document.getElementById('story-image');
    const contentInput = document.getElementById('story-content');
    const addBtn = document.getElementById('add-story-btn');
    const clearBtn = document.getElementById('clear-all-btn');
    const charCount = document.getElementById('char-count');
    
    // Character counter
    if (contentInput && charCount) {
        contentInput.addEventListener('input', (e) => {
            charCount.textContent = `${e.target.value.length}/300 characters`;
        });
    }
    
    // Add Story Button
    if (addBtn) {
        addBtn.addEventListener('click', async () => {
            const file = imageInput?.files[0];
            const content = contentInput?.value.trim();
            
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
                charCount.textContent = '0/300 characters';
                
                alert('Story added successfully!');
            } catch (error) {
                alert('Error adding story: ' + error.message);
            } finally {
                addBtn.disabled = false;
                addBtn.textContent = 'Add Story';
            }
        });
    }
    
    // Clear All Stories Button
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (!confirm('Are you sure you want to delete ALL stories? This action cannot be undone.')) {
                return;
            }
            
            localStorage.removeItem(STORAGE_KEY);
            renderStories();
            alert('All stories have been cleared.');
        });
    }
}

// File Reader Helper
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

// Fetch News from API (Optional)
async function fetchLatestNews() {
    if (NEWS_API_KEY === 'YOUR_NEWS_API_KEY_HERE') {
        console.log('News API key not configured. Skipping automatic news fetch.');
        return;
    }
    
    try {
        const response = await fetch(
            `https://newsapi.org/v2/top-headlines?country=us&pageSize=5&apiKey=${NEWS_API_KEY}`
        );
        
        if (!response.ok) throw new Error('Failed to fetch news');
        
        const data = await response.json();
        
        if (data.articles && data.articles.length > 0) {
            // Process and add articles as stories
            data.articles.forEach(article => {
                if (article.urlToImage && article.description) {
                    addStory(article.urlToImage, article.description.substring(0, 300));
                }
            });
        }
    } catch (error) {
        console.error('Error fetching news:', error);
    }
}

// Midnight Check
function checkMidnight() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    
    if (hours === 0 && minutes === 0 && seconds === 0) {
        updateDate();
        // Optional: Fetch fresh news at midnight
        // fetchLatestNews();
    }
}

// Initialize
function init() {
    updateClocks();
    updateDate();
    renderStories();
    setupEventListeners();
    
    // Update clocks every second
    setInterval(updateClocks, 1000);
    // Check for midnight every second
    setInterval(checkMidnight, 1000);
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
