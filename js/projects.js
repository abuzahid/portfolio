// Load and render projects
async function loadProjects() {
    try {
        const response = await fetch('data/projects.json');
        const data = await response.json();
        renderFilterButtons(data.projects);
        renderProjects(data.projects);
    } catch (err) {
        console.error('Failed to load projects:', err);
    }
}

function renderFilterButtons(projects) {
    const container = document.getElementById('filter-buttons');
    const categories = ['All', ...new Set(projects.map(p => p.category))];

    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn' + (cat === 'All' ? ' active' : '');
        btn.textContent = cat;
        btn.addEventListener('click', () => {
            container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterProjects(projects, cat);
        });
        container.appendChild(btn);
    });
}

function filterProjects(projects, category) {
    const filtered = category === 'All' ? projects : projects.filter(p => p.category === category);
    renderProjects(filtered);
}

function renderProjects(projects) {
    const grid = document.getElementById('projects-grid');
    grid.innerHTML = '';

    projects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'project-card fade-in visible';

        const tagsHTML = project.tags.map(tag =>
            `<span class="project-tag">${tag}</span>`
        ).join('');

        const linkHTML = project.link
            ? `<a href="${project.link}" target="_blank" rel="noopener noreferrer" class="project-card-link">View Project &rarr;</a>`
            : '';

        card.innerHTML = `
            <div class="project-card-header">
                <h3 class="project-card-title">${project.title}</h3>
                <span class="project-card-category">${project.category}</span>
            </div>
            <p class="project-card-description">${project.description}</p>
            <div class="project-card-tags">${tagsHTML}</div>
            <span class="project-card-date">${project.date}</span>
            ${linkHTML}
        `;

        grid.appendChild(card);
    });
}

// Load and render blogs
async function loadBlogs() {
    try {
        const response = await fetch('data/blogs.json');
        const data = await response.json();
        renderBlogs(data.blogs);
    } catch (err) {
        console.error('Failed to load blogs:', err);
    }
}

function renderBlogs(blogs) {
    const grid = document.getElementById('blog-grid');
    grid.innerHTML = '';

    blogs.forEach(blog => {
        const tagsHTML = blog.tags.map(tag =>
            `<span class="blog-tag">${tag}</span>`
        ).join('');

        const card = document.createElement('a');
        card.className = 'blog-card fade-in visible';
        card.href = blog.url;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';

        card.innerHTML = `
            <span class="blog-card-date">${blog.date}</span>
            <h3 class="blog-card-title">${blog.title}</h3>
            <p class="blog-card-description">${blog.description}</p>
            <div class="blog-card-tags">${tagsHTML}</div>
            <span class="blog-card-link">Read More &rarr;</span>
        `;

        grid.appendChild(card);
    });
}

// Initialize
loadProjects();
loadBlogs();
