// Chapter navigation logic
function initChapterNavigation() {
    // Extract chapter number from current filename
    const currentChapterNumber = getCurrentChapterNumber();
    
    // Set up previous/next navigation
    setupNavigation(currentChapterNumber);
}

function getCurrentChapterNumber() {
    // Extract chapter number from current URL
    const path = window.location.pathname;
    const filename = path.split('/').pop();
    const match = filename.match(/(\d{4})\.html/);
    return match ? parseInt(match[1], 10) : 1;
}

function setupNavigation(currentChapterNumber) {
    // Setup previous chapter link
    const prevLink = document.getElementById('prev-chapter-link');
    if (currentChapterNumber === 1) {
        // First chapter - hide previous link entirely
        prevLink.style.display = 'none';
    } else {
        const prevChapterFile = formatChapterNumber(currentChapterNumber - 1);
        prevLink.href = prevChapterFile;
        prevLink.style.display = 'inline';
    }
    
    // Check if next chapter exists
    checkNextChapter(currentChapterNumber + 1);
}

async function checkNextChapter(nextNumber) {
    const nextChapterFile = formatChapterNumber(nextNumber);
    const nextLink = document.getElementById('next-chapter-link');
    
    try {
        const response = await fetch(nextChapterFile, { method: 'HEAD' });
        if (response.ok) {
            nextLink.href = nextChapterFile;
            nextLink.style.display = 'inline';
        } else {
            // Hide next button if no next chapter exists
            nextLink.style.display = 'none';
        }
    } catch (error) {
        // Hide next button if error checking
        nextLink.style.display = 'none';
    }
}

function formatChapterNumber(num) {
    return num.toString().padStart(4, '0') + '.html';
}

// Disqus integration
function initDisqus() {
    const currentChapterNumber = getCurrentChapterNumber();
    
    var disqus_config = function () {
        this.page.url = window.location.href;
        this.page.identifier = `chapter-${currentChapterNumber}`;
        this.page.title = document.querySelector('h1').textContent;
    };
    
    // Replace 'your-disqus-shortname' with your actual Disqus shortname
    var disqus_shortname = 'your-disqus-shortname';
    
    // Only load Disqus if shortname is configured
    if (disqus_shortname && disqus_shortname !== 'your-disqus-shortname') {
        var d = document, s = d.createElement('script');
        s.src = 'https://' + disqus_shortname + '.disqus.com/embed.js';
        s.setAttribute('data-timestamp', +new Date());
        
        // Hide the disabled message
        var disabledMessage = document.querySelector('.comments-disabled');
        if (disabledMessage) {
            disabledMessage.style.display = 'none';
        }
        
        (d.head || d.body).appendChild(s);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initChapterNavigation();
    initDisqus();
});

// Smooth scrolling for navigation links
document.addEventListener('click', function(e) {
    if (e.target.tagName === 'A' && e.target.getAttribute('href').startsWith('#')) {
        const targetId = e.target.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
            e.preventDefault();
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
});
