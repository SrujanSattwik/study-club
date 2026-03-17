/**
 * loadSidebar.js
 * Dynamically loads sidebar and resolves paths based on current page location
 */

document.addEventListener('DOMContentLoaded', function () {

    var container = document.getElementById('sidebar-container');
    if (!container) return;

    var sidebarPath = container.getAttribute('data-sidebar-path') || 'components/sidebar.html';

    fetch(sidebarPath, { cache: 'force-cache' })
        .then(function (response) {
            if (!response.ok) {
                throw new Error('Sidebar fetch failed: ' + response.status);
            }
            return response.text();
        })
        .then(function (html) {
            container.innerHTML = html;
            resolveLinks();
            highlightActiveLink();
            initSidebarBehaviour();
        })
        .catch(function (err) {
            console.warn('[loadSidebar] Could not load sidebar.', err);
        });

    // Resolve all sidebar links based on current page depth
    function resolveLinks() {
        var currentPath = window.location.pathname;
        var depth = 0;
        
        // Detect folder depth (materials/, get-started/, etc.)
        if (currentPath.includes('/materials/') || currentPath.includes('/get-started/')) {
            depth = 1; // One level deep
        }
        
        var prefix = depth === 1 ? '../' : '';
        
        // Update all nav links
        var navItems = document.querySelectorAll('#sidebar-container .nav-item, #sidebar-container .sidebar-logo');
        navItems.forEach(function(item) {
            var link = item.getAttribute('data-link');
            if (link) {
                item.href = prefix + link;
            }
        });
    }

    function highlightActiveLink() {
        var path = window.location.pathname.toLowerCase();

        var pageMap = {
            'index-dashboard': ['index-dashboard'],
            'get-started': ['get-started'],
            'materials': ['materials', 'textbooks', 'video-lectures', 'audio-content', 'study-notes', 'infographics', 'practice-tests'],
            'resources': ['resources'],
            'community': ['community'],
            'about': ['about'],
            'study-bite': ['study-bite'],
            'cheat-note': ['cheat-note'],
            'KnowNook': ['knownook'],
            'syllabus-scheduler': ['syllabus-scheduler'],
            'subscription': ['subscription'],
            'studysync': ['studysync'],
            'timetable': ['timetable'],
            'mindmesh': ['mindmesh'],
            'settings': ['settings'],
        };

        var navItems = document.querySelectorAll('#sidebar-container .nav-item');
        navItems.forEach(function (item) {
            item.classList.remove('active');
            var dataPage = item.getAttribute('data-page');
            if (!dataPage || !pageMap[dataPage]) return;

            var keywords = pageMap[dataPage];
            var isActive = keywords.some(function (kw) {
                return path.includes(kw.toLowerCase());
            });
            if (isActive) {
                item.classList.add('active');
            }
        });
    }

    function initSidebarBehaviour() {
        var dashboardLayout = document.querySelector('.dashboard-layout');
        var sidebarToggle = document.querySelector('.sidebar-toggle');
        var sidebar = document.querySelector('.sidebar');
        var sidebarOverlay = document.querySelector('.sidebar-overlay');

        if (!dashboardLayout) return;

        var hideTimer = null;
        var isHovering = false;
        var isMobile = window.innerWidth <= 768;

        window.addEventListener('resize', function() {
            isMobile = window.innerWidth <= 768;
            if (!isMobile && sidebarOverlay) {
                sidebarOverlay.classList.remove('active');
            }
        });

        function showSidebar() {
            clearTimeout(hideTimer);
            hideTimer = null;
            dashboardLayout.classList.remove('sidebar-collapsed');
            if (isMobile && sidebarOverlay) {
                sidebarOverlay.classList.add('active');
            }
        }

        function hideSidebar() {
            if (isHovering && !isMobile) return;
            clearTimeout(hideTimer);
            hideTimer = null;
            dashboardLayout.classList.add('sidebar-collapsed');
            if (sidebarOverlay) {
                sidebarOverlay.classList.remove('active');
            }
        }

        function scheduleHide() {
            if (isMobile) return;
            clearTimeout(hideTimer);
            hideTimer = setTimeout(hideSidebar, 5000);
        }

        if (!isMobile) {
            scheduleHide();
        } else {
            dashboardLayout.classList.add('sidebar-collapsed');
        }

        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', function () {
                var isCollapsed = dashboardLayout.classList.contains('sidebar-collapsed');
                if (isCollapsed) { 
                    showSidebar(); 
                    if (!isMobile) scheduleHide(); 
                }
                else { 
                    hideSidebar(); 
                }
            });
        }

        if (sidebar && !isMobile) {
            sidebar.addEventListener('mouseenter', function () { 
                isHovering = true; 
                showSidebar(); 
            });
            sidebar.addEventListener('mouseleave', function () { 
                isHovering = false; 
                scheduleHide(); 
            });
        }

        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', function () { 
                isHovering = false; 
                hideSidebar(); 
            });
        }

        // Add ripple effect
        var navLinks = document.querySelectorAll('.nav-item');
        navLinks.forEach(function(link) {
            link.addEventListener('click', function(e) {
                var ripple = document.createElement('span');
                ripple.style.cssText = 'position:absolute;border-radius:50%;background:rgba(255,255,255,0.5);width:20px;height:20px;pointer-events:none;animation:ripple 0.6s ease-out;';
                this.style.position = 'relative';
                this.style.overflow = 'hidden';
                this.appendChild(ripple);
                setTimeout(function() { ripple.remove(); }, 600);
            });
        });

        if (!document.getElementById('ripple-animation')) {
            var style = document.createElement('style');
            style.id = 'ripple-animation';
            style.textContent = '@keyframes ripple { to { transform: scale(4); opacity: 0; } }';
            document.head.appendChild(style);
        }

        window.addEventListener('beforeunload', function () { clearTimeout(hideTimer); });
    }

});
