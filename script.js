// Simple page navigation system
class BlogNavigation {
    constructor() {
        this.currentPage = 'home';
        this.pages = ['home', 'chapters', 'chapter', 'post', 'about', 'contact', 'error'];
        this.availableChapters = [];
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadChapters();
        this.showPage('home');
    }

    // Discover available chapters by testing for their existence
    async loadChapters() {
        this.availableChapters = [];
        let chapterNumber = 1;
        let consecutiveMisses = 0;
        const maxConsecutiveMisses = 10; // Stop after 10 consecutive missing chapters

        while (consecutiveMisses < maxConsecutiveMisses && chapterNumber <= 9999) {
            const chapterFile = this.formatChapterNumber(chapterNumber);
            const exists = await this.checkChapterExists(chapterFile);
            
            if (exists) {
                this.availableChapters.push({
                    number: chapterNumber,
                    file: chapterFile,
                    title: `Chapter ${chapterNumber}`,
                    date: await this.getChapterDate(chapterFile) || this.formatDate(new Date())
                });
                consecutiveMisses = 0;
            } else {
                consecutiveMisses++;
            }
            
            chapterNumber++;
        }

        this.updateHomePage();
    }

    formatChapterNumber(num) {
        return num.toString().padStart(4, '0') + '.html';
    }

    async checkChapterExists(filename) {
        try {
            const response = await fetch(`vol1/${filename}`, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    async getChapterDate(filename) {
        try {
            const response = await fetch(`vol1/${filename}`, { method: 'HEAD' });
            if (response.ok) {
                const lastModified = response.headers.get('Last-Modified');
                if (lastModified) {
                    return this.formatDate(new Date(lastModified));
                }
            }
        } catch (error) {
            // Fall back to current date
        }
        return null;
    }

    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    updateHomePage() {
        const latestChaptersContainer = document.getElementById('latest-chapters');
        const seeMoreButton = document.getElementById('see-more-button');
        const comingSoonMessage = document.getElementById('coming-soon-message');

        if (this.availableChapters.length === 0) {
            // Show coming soon message
            comingSoonMessage.style.display = 'block';
            seeMoreButton.style.display = 'none';
            
            // Clear any existing chapters
            const existingChapters = latestChaptersContainer.querySelectorAll('.post-item');
            existingChapters.forEach(item => item.remove());
        } else {
            // Hide coming soon message
            comingSoonMessage.style.display = 'none';
            
            // Show see more button if there are chapters
            seeMoreButton.style.display = 'block';
            
            // Get latest 9 chapters (reverse order - newest first)
            const latestChapters = this.availableChapters
                .slice(-9)
                .reverse();
            
            // Clear existing content except coming soon message
            const existingChapters = latestChaptersContainer.querySelectorAll('.post-item');
            existingChapters.forEach(item => item.remove());
            
            // Add latest chapters
            latestChapters.forEach(chapter => {
                const chapterElement = this.createChapterElement(chapter);
                latestChaptersContainer.appendChild(chapterElement);
            });
        }
    }

    createChapterElement(chapter, isGrid = false) {
        if (isGrid) {
            const cardElement = document.createElement('div');
            cardElement.className = 'chapter-card';
            cardElement.innerHTML = `
                <div class="chapter-number">Chapter ${chapter.number}</div>
                <div class="chapter-title">${chapter.title}</div>
                <a href="vol1/${chapter.file}" class="chapter-link">
                    Read Chapter
                </a>
            `;
            return cardElement;
        } else {
            const articleElement = document.createElement('article');
            articleElement.className = 'post-item';
            articleElement.innerHTML = `
                <h2 class="post-title">
                    <a href="vol1/${chapter.file}">${chapter.title}</a>
                </h2>
                <time class="post-date" datetime="${chapter.date}">${chapter.date}</time>
            `;
            return articleElement;
        }
    }

    updateChaptersPage() {
        const allChaptersContainer = document.getElementById('all-chapters');
        allChaptersContainer.innerHTML = '';
        
        // Change container to use post-list style instead of grid
        allChaptersContainer.className = 'post-list';
        
        // Show all chapters in ascending order (1, 2, 3, ...)
        this.availableChapters.forEach(chapter => {
            const chapterElement = this.createChapterElement(chapter, false); // Use list format, not grid
            allChaptersContainer.appendChild(chapterElement);
        });
    }

    async loadChapter(chapterNumber) {
        try {
            const filename = this.formatChapterNumber(chapterNumber);
            const response = await fetch(`vol1/${filename}`);
            
            if (!response.ok) {
                throw new Error('Chapter not found');
            }
            
            const content = await response.text();
            return this.extractChapterContent(content, chapterNumber);
        } catch (error) {
            console.error('Error loading chapter:', error);
            return {
                title: `Chapter ${chapterNumber}`,
                content: '<p>Sorry, this chapter could not be loaded.</p>',
                date: this.formatDate(new Date())
            };
        }
    }

    extractChapterContent(html, chapterNumber) {
        // Create a temporary DOM parser
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Try to extract title from various possible locations
        let title = `Chapter ${chapterNumber}`;
        const h1 = doc.querySelector('h1');
        const titleMeta = doc.querySelector('title');
        
        if (h1 && h1.textContent.trim()) {
            title = h1.textContent.trim();
        } else if (titleMeta && titleMeta.textContent.trim()) {
            title = titleMeta.textContent.trim();
        }
        
        // Extract main content
        let content = '';
        const mainContent = doc.querySelector('main') || 
                         doc.querySelector('.content') || 
                         doc.querySelector('.chapter') ||
                         doc.querySelector('body');
        
        if (mainContent) {
            // Remove script tags and other unwanted elements
            const scripts = mainContent.querySelectorAll('script, style, nav, header, footer');
            scripts.forEach(el => el.remove());
            
            content = mainContent.innerHTML;
        } else {
            content = '<p>Chapter content could not be extracted.</p>';
        }
        
        return {
            title: title,
            content: content,
            date: this.formatDate(new Date())
        };
    }

    bindEvents() {
        // Navigation links
        document.addEventListener('click', (e) => {
            const element = e.target.closest('[data-page]');
            if (element) {
                // If it's a chapter link, don't intercept - let it navigate to the actual file
                if (element.dataset.page === 'chapter') {
                    return; // Don't prevent default, allow normal navigation
                }
                
                // For other pages, use SPA navigation
                e.preventDefault();
                const page = element.dataset.page;
                const title = element.dataset.title;
                this.showPage(page, title, true);
            }
        });

        // Home link
        document.getElementById('home-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.showPage('home');
        });

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.page) {
                this.showPage(e.state.page, e.state.title, false, e.state.chapter);
            }
        });
    }

    async showPage(page, title = null, updateHistory = true, chapterNumber = null) {
        // Hide all pages
        this.pages.forEach(p => {
            const element = document.getElementById(`${p}-page`);
            if (element) {
                element.style.display = 'none';
                element.classList.remove('fade-in');
            }
        });

        // Show target page
        let targetPage = document.getElementById(`${page}-page`);
        
        // Handle chapter page specially
        if (page === 'chapter' && chapterNumber) {
            await this.showChapter(chapterNumber, updateHistory);
            return;
        } else if (page === 'chapters') {
            this.updateChaptersPage();
        }

        if (targetPage) {
            targetPage.style.display = 'block';
            
            // Use setTimeout to ensure display change is processed before adding animation
            setTimeout(() => {
                targetPage.classList.add('fade-in');
            }, 10);
            
            // Update post content if needed
            if (page === 'post' && title) {
                this.updatePostContent(title);
            }

            // Update history
            if (updateHistory) {
                const state = { page, title };
                if (chapterNumber) state.chapter = chapterNumber;
                history.pushState(state, '', `#${page}`);
            }

            this.currentPage = page;
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    async showChapter(chapterNumber, updateHistory = true) {
        // Create or update chapter page dynamically
        let chapterPage = document.getElementById('chapter-page');
        if (!chapterPage) {
            chapterPage = document.createElement('section');
            chapterPage.id = 'chapter-page';
            chapterPage.className = 'page-content post-content';
            chapterPage.style.display = 'none';
            document.querySelector('.container').appendChild(chapterPage);
        }

        // Load chapter content
        const chapterData = await this.loadChapter(chapterNumber);
        
        // Find previous and next chapters
        const currentIndex = this.availableChapters.findIndex(ch => ch.number == chapterNumber);
        const prevChapter = currentIndex > 0 ? this.availableChapters[currentIndex - 1] : null;
        const nextChapter = currentIndex < this.availableChapters.length - 1 ? this.availableChapters[currentIndex + 1] : null;

        // Update chapter page content
        chapterPage.innerHTML = `
            <article class="chapter-content">
                <div class="chapter-header">
                    <h1>${chapterData.title}</h1>
                    <p class="post-meta">${chapterData.date}</p>
                </div>
                
                <div class="chapter-body">
                    ${chapterData.content}
                </div>
                
                <nav class="chapter-navigation">
                    <div class="chapter-nav-item">
                        ${prevChapter ? `<a href="#" data-page="chapter" data-chapter="${prevChapter.number}">← Previous Chapter</a>` : '<span></span>'}
                    </div>
                    <div class="chapter-nav-item center">
                        <a href="#" data-page="chapters">All Chapters</a>
                    </div>
                    <div class="chapter-nav-item right">
                        ${nextChapter ? `<a href="#" data-page="chapter" data-chapter="${nextChapter.number}">Next Chapter →</a>` : '<span></span>'}
                    </div>
                </nav>
            </article>
        `;

        // Show the page
        chapterPage.style.display = 'block';
        setTimeout(() => {
            chapterPage.classList.add('fade-in');
        }, 10);

        // Update history
        if (updateHistory) {
            history.pushState({ 
                page: 'chapter', 
                chapter: chapterNumber,
                title: chapterData.title 
            }, '', `#chapter-${chapterNumber}`);
        }

        this.currentPage = 'chapter';
        
        // Update document title
        document.title = `${chapterData.title} - Read`;
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    updatePostContent(title) {
        const postTitle = document.getElementById('post-title');
        if (postTitle) {
            postTitle.textContent = title;
        }
        
        // Update document title
        document.title = `${title} - Read`;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BlogNavigation();
});

// Add smooth scrolling for internal links
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

// Lazy loading for images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Add keyboard navigation support
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        // Close any modals or return to home
        const navigation = window.blogNavigation;
        if (navigation && navigation.currentPage !== 'home') {
            navigation.showPage('home');
        }
    }
});