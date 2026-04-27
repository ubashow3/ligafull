/* script.js */
document.addEventListener('DOMContentLoaded', () => {
    console.log('LigaFull Digital - PHP Version Loaded');
    
    // Sidebar toggle
    const menuBtn = document.getElementById('menuBtn');
    const closeSidebar = document.getElementById('closeSidebar');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (menuBtn && sidebar && sidebarOverlay) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.remove('-translate-x-full');
            sidebarOverlay.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Prevent scroll when menu open
        });
        
        const closeFn = () => {
            sidebar.classList.add('-translate-x-full');
            sidebarOverlay.style.display = 'none';
            document.body.style.overflow = ''; // Restore scroll
        };
        
        if (closeSidebar) closeSidebar.addEventListener('click', closeFn);
        sidebarOverlay.addEventListener('click', closeFn);
    }
});
