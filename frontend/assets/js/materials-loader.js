/**
 * StudyHub Materials Loader - Unified Script for All Materials Pages
 * Handles fetching, rendering, filtering, and uploading materials
 */

// API Configuration
const API_BASE_URL = window.API_CONFIG ? API_CONFIG.BASE_URL : 'http://localhost:3001';
const MATERIALS_API = `${API_BASE_URL}/api/materials`;
const ACTIVITY_API = `${API_BASE_URL}/api/activity`;

// Global state
let currentMaterialType = 'textbook';
let allMaterials = [];
let isLoading = false;

/**
 * Initialize materials page with specific type
 * @param {string} type - Material type (textbook, video, audio, notes, practice, infographic)
 */
async function initMaterialsPage(type) {
    console.log(`🎯 Initializing ${type} materials page`);
    currentMaterialType = type;
    
    // Show loading state
    showLoadingState();
    
    try {
        // Fetch materials from backend
        await loadMaterials(type);
        
        // Setup event listeners
        setupEventListeners();
        
        // Setup upload form
        setupUploadForm();
        
        console.log(`✅ ${type} materials page initialized successfully`);
    } catch (error) {
        console.error(`❌ Failed to initialize ${type} materials page:`, error);
        showErrorState(error.message);
    }
}

/**
 * Load materials from backend API
 * @param {string} type - Material type to filter by
 */
async function loadMaterials(type) {
    if (isLoading) return;
    
    isLoading = true;
    console.log(`📡 Fetching ${type} materials from API...`);
    
    try {
        const response = await fetch(`${MATERIALS_API}?type=${type}&limit=100`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Handle different response formats
        allMaterials = data.materials || data.data || data || [];
        
        console.log(`✅ Loaded ${allMaterials.length} ${type} materials`);
        
        // Render materials
        renderMaterials(allMaterials);
        
    } catch (error) {
        console.error(`❌ Error loading materials:`, error);
        showErrorState(error.message);
        throw error;
    } finally {
        isLoading = false;
    }
}

/**
 * Render materials to the page
 * @param {Array} materials - Array of material objects
 */
function renderMaterials(materials) {
    const container = document.getElementById('materialsList') || document.getElementById('infographicsGrid');
    
    if (!container) {
        console.error('❌ Materials container not found');
        return;
    }
    
    // Clear loading state
    container.innerHTML = '';
    
    // Handle empty state
    if (!materials || materials.length === 0) {
        showEmptyState(container);
        return;
    }
    
    // Render each material
    const materialsHTML = materials.map(material => createMaterialCard(material)).join('');
    container.innerHTML = materialsHTML;
    
    console.log(`✅ Rendered ${materials.length} materials`);
}

/**
 * Create HTML for a single material card
 * @param {Object} material - Material object
 * @returns {string} HTML string
 */
function createMaterialCard(material) {
    const {
        id,
        title,
        description,
        type,
        format,
        author,
        downloadCount,
        createdAt,
        link,
        filePath,
        thumbnail,
        subject,
        level,
        duration,
        difficulty
    } = material;
    
    // Determine icon based on type
    const iconMap = {
        textbook: 'fa-book',
        video: 'fa-video',
        audio: 'fa-headphones',
        notes: 'fa-file-alt',
        practice: 'fa-clipboard-list',
        infographic: 'fa-chart-line'
    };
    const icon = iconMap[type] || 'fa-file';
    
    // Determine button text and icon based on type
    const buttonTextMap = {
        video: 'Watch',
        audio: 'Listen',
        practice: 'Start Test',
        infographic: 'View',
        default: 'Download'
    };
    const buttonText = buttonTextMap[type] || buttonTextMap.default;
    const buttonIcon = type === 'video' ? 'fa-play' : type === 'audio' ? 'fa-headphones' : type === 'practice' ? 'fa-arrow-right' : 'fa-download';
    
    // Format date
    const date = createdAt ? new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
    
    // Construct resource URL
    const resourceUrl = link || (filePath ? `${API_BASE_URL}${filePath}` : '#');
    
    // Escape HTML
    const safeTitle = escapeHtml(title || 'Untitled');
    const safeDescription = escapeHtml(description || 'No description available');
    const safeAuthor = escapeHtml(author || 'Anonymous');
    
    // Generate tags HTML
    const tags = [];
    if (subject) tags.push(`<span class="material-tag"><i class="fas fa-tag"></i> ${escapeHtml(subject)}</span>`);
    if (level) tags.push(`<span class="material-tag"><i class="fas fa-layer-group"></i> ${escapeHtml(level)}</span>`);
    if (difficulty) tags.push(`<span class="material-tag"><i class="fas fa-star"></i> ${escapeHtml(difficulty)}</span>`);
    if (duration) tags.push(`<span class="material-tag"><i class="fas fa-clock"></i> ${escapeHtml(duration)}</span>`);
    
    const tagsHTML = tags.length > 0 ? `<div class="material-tags">${tags.join('')}</div>` : '';
    
    // Format download count
    const formattedDownloads = downloadCount >= 1000 ? `${(downloadCount / 1000).toFixed(1)}k` : downloadCount || 0;
    
    return `
        <div class="material-item" 
             data-id="${id}"
             data-type="${type}"
             data-title="${safeTitle.toLowerCase()}"
             data-author="${safeAuthor.toLowerCase()}">
            <div class="material-thumbnail">
                ${thumbnail 
                    ? `<img src="${thumbnail}" alt="${safeTitle}">` 
                    : `<i class="fas ${icon}"></i>`
                }
            </div>
            <div class="material-content">
                <div class="material-info">
                    <h3>${safeTitle}</h3>
                    <p class="material-author"><i class="fas fa-user-circle"></i> ${safeAuthor}</p>
                    <p class="material-description">${safeDescription}</p>
                    ${tagsHTML}
                </div>
                <div class="material-meta">
                    <span><i class="fas fa-download"></i> <strong>${formattedDownloads}</strong></span>
                    <span><i class="fas fa-file"></i> ${(format || 'link').toUpperCase()}</span>
                    <span><i class="fas fa-calendar-alt"></i> ${date}</span>
                </div>
            </div>
            <div class="material-actions">
                <button class="btn btn-primary" onclick="handleMaterialAction('${id}', '${resourceUrl}', '${type}')" title="${buttonText} this material">
                    <i class="fas ${buttonIcon}"></i> ${buttonText}
                </button>
                <button class="btn btn-secondary" onclick="saveMaterial('${id}')" title="Save to your library">
                    <i class="fas fa-bookmark"></i> Save
                </button>
            </div>
        </div>
    `;
}

/**
 * Handle material action (view/download/watch/listen)
 * @param {string} materialId - Material ID
 * @param {string} resourceUrl - Resource URL
 * @param {string} type - Material type
 */
async function handleMaterialAction(materialId, resourceUrl, type) {
    console.log(`🎬 Action triggered for material ${materialId}`);
    
    try {
        // Track view activity
        await trackActivity(materialId, 'view');
        
        // Increment download count
        const response = await fetch(`${MATERIALS_API}/${materialId}/download`, {
            method: 'POST'
        });
        
        if (response.ok) {
            const data = await response.json();
            const countElement = document.getElementById(`download-count-${materialId}`);
            if (countElement) {
                countElement.innerHTML = `<i class="fas fa-download"></i> ${data.downloadCount}`;
            }
        }
        
        // Open resource
        if (resourceUrl && resourceUrl !== '#') {
            window.open(resourceUrl, '_blank');
        } else {
            alert('Resource URL not available');
        }
        
    } catch (error) {
        console.error('❌ Error handling material action:', error);
        // Still open the resource even if tracking fails
        if (resourceUrl && resourceUrl !== '#') {
            window.open(resourceUrl, '_blank');
        }
    }
}

/**
 * Track user activity
 * @param {string} materialId - Material ID
 * @param {string} activityType - Activity type (view, download, progress)
 */
async function trackActivity(materialId, activityType) {
    const token = localStorage.getItem('studyhub_token');
    if (!token) return; // Skip if not logged in
    
    try {
        await fetch(`${ACTIVITY_API}/${materialId}/${activityType}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.warn('⚠️ Failed to track activity:', error);
    }
}

/**
 * Save material to favorites
 * @param {string} materialId - Material ID
 */
function saveMaterial(materialId) {
    let savedMaterials = JSON.parse(localStorage.getItem('saved_materials') || '[]');
    
    if (savedMaterials.includes(materialId)) {
        alert('✅ Material already saved!');
        return;
    }
    
    savedMaterials.push(materialId);
    localStorage.setItem('saved_materials', JSON.stringify(savedMaterials));
    alert('✅ Material saved successfully!');
}

/**
 * Setup event listeners for filters and search
 */
function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    // Filter functionality
    const filterSelects = document.querySelectorAll('.filter-select');
    filterSelects.forEach(select => {
        select.addEventListener('change', handleFilter);
    });
}

/**
 * Handle search input
 */
function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    
    const filtered = allMaterials.filter(material => {
        const title = (material.title || '').toLowerCase();
        const author = (material.author || '').toLowerCase();
        const description = (material.description || '').toLowerCase();
        
        return title.includes(searchTerm) || 
               author.includes(searchTerm) || 
               description.includes(searchTerm);
    });
    
    renderMaterials(filtered);
}

/**
 * Handle filter changes
 */
function handleFilter() {
    const items = document.querySelectorAll('.material-item');
    const filterSelects = document.querySelectorAll('.filter-select');
    
    items.forEach(item => {
        let shouldShow = true;
        
        // Apply each filter
        filterSelects.forEach(select => {
            const value = select.value.toLowerCase();
            if (value && !value.includes('all')) {
                // Check if item matches filter
                const itemData = item.dataset;
                const matches = Object.values(itemData).some(val => 
                    val.toLowerCase().includes(value)
                );
                if (!matches) shouldShow = false;
            }
        });
        
        item.style.display = shouldShow ? 'grid' : 'none';
    });
}

/**
 * Setup upload form handler
 */
function setupUploadForm() {
    const form = document.getElementById('uploadForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleUpload(form);
    });
}

/**
 * Handle material upload
 * @param {HTMLFormElement} form - Upload form element
 */
async function handleUpload(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
        
        // Prepare form data
        const formData = new FormData();
        
        // Get form values
        const title = form.querySelector('[name="title"]').value;
        const author = form.querySelector('[name="author"]').value;
        const description = form.querySelector('[name="description"]')?.value || '';
        
        formData.append('title', title);
        formData.append('author', author);
        formData.append('description', description);
        formData.append('type', currentMaterialType);
        
        // Check upload mode
        const linkSection = document.getElementById('linkUploadSection');
        const isLinkMode = linkSection && linkSection.style.display !== 'none';
        
        if (isLinkMode) {
            // Link upload
            const linkInput = form.querySelector('[name="link"]');
            const link = linkInput ? linkInput.value : '';
            
            if (!link) {
                alert('❌ Please enter a resource link');
                return;
            }
            
            formData.append('link', link);
            
            // Add thumbnail if provided
            const thumbnailInput = document.getElementById('thumbnailInput');
            if (thumbnailInput && thumbnailInput.files[0]) {
                formData.append('thumbnail', thumbnailInput.files[0]);
            }
        } else {
            // File upload
            const fileInput = document.getElementById('fileInput');
            const file = fileInput ? fileInput.files[0] : null;
            
            if (!file) {
                alert('❌ Please select a file');
                return;
            }
            
            formData.append('file', file);
        }
        
        // Upload to backend
        const response = await fetch(MATERIALS_API, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Upload failed');
        }
        
        // Success
        alert('✅ Material uploaded successfully!');
        
        // Reset form
        form.reset();
        document.getElementById('fileName').textContent = '';
        const thumbnailName = document.getElementById('thumbnailName');
        if (thumbnailName) thumbnailName.textContent = '';
        
        // Close modal
        closeUploadModal();
        
        // Reload materials
        await loadMaterials(currentMaterialType);
        
    } catch (error) {
        console.error('❌ Upload error:', error);
        alert(`❌ Upload failed: ${error.message}`);
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

/**
 * Show loading state
 */
function showLoadingState() {
    const container = document.getElementById('materialsList') || document.getElementById('infographicsGrid');
    if (!container) return;
    
    container.innerHTML = `
        <div class="loading-spinner" style="text-align: center; padding: 4rem;">
            <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #6366f1;"></i>
            <p style="margin-top: 1rem; color: #6b7280; font-size: 1.125rem;">Loading materials...</p>
        </div>
    `;
}

/**
 * Show empty state
 * @param {HTMLElement} container - Container element
 */
function showEmptyState(container) {
    container.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 4rem 2rem;">
            <i class="fas fa-inbox" style="font-size: 4rem; color: #d1d5db; margin-bottom: 1rem;"></i>
            <h3 style="font-size: 1.5rem; color: #374151; margin-bottom: 0.5rem;">No materials found</h3>
            <p style="color: #6b7280; margin-bottom: 1.5rem;">Be the first to upload materials in this category!</p>
            <button class="btn btn-primary" onclick="openUploadModal()">
                <i class="fas fa-upload"></i> Upload Material
            </button>
        </div>
    `;
}

/**
 * Show error state
 * @param {string} message - Error message
 */
function showErrorState(message) {
    const container = document.getElementById('materialsList') || document.getElementById('infographicsGrid');
    if (!container) return;
    
    container.innerHTML = `
        <div class="error-state" style="text-align: center; padding: 4rem 2rem;">
            <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #f59e0b; margin-bottom: 1rem;"></i>
            <h3 style="font-size: 1.5rem; color: #374151; margin-bottom: 0.5rem;">Failed to load materials</h3>
            <p style="color: #6b7280; margin-bottom: 0.5rem;">${escapeHtml(message)}</p>
            <p style="color: #6b7280; margin-bottom: 1.5rem;">Please make sure the backend server is running on port 3001</p>
            <button class="btn btn-primary" onclick="location.reload()">
                <i class="fas fa-redo"></i> Retry
            </button>
        </div>
    `;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export functions for global use
window.initMaterialsPage = initMaterialsPage;
window.handleMaterialAction = handleMaterialAction;
window.saveMaterial = saveMaterial;

console.log('✅ Materials Loader initialized');
