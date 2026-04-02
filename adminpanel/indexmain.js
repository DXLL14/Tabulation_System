// TOGGLE SIDEBAR
const menuBar = document.querySelector('#content nav .bx.bx-menu');
const sidebar = document.getElementById('sidebar');

menuBar.addEventListener('click', function () {
    sidebar.classList.toggle('hide');
});

// Handle responsiveness
if(window.innerWidth < 768) {
    sidebar.classList.add('hide');
}

window.addEventListener('resize', function () {
    if(this.innerWidth > 576) {
        const searchForm = document.querySelector('#content nav form');
        const searchButtonIcon = document.querySelector('#content nav form .form-input button .bx');
        
        if (searchForm && searchButtonIcon) {
            searchButtonIcon.classList.replace('bx-x', 'bx-search');
            searchForm.classList.remove('show');
        }
    }
});

// Active menu highlighting
const allSideMenu = document.querySelectorAll('#sidebar .side-menu.top li a');

function setActiveMenu() {
    const currentPage = window.location.pathname.split('/').pop();

    allSideMenu.forEach(item => {
        const li = item.parentElement;
        const linkPage = item.getAttribute('href').split('/').pop();

        if (linkPage === currentPage) {
            li.classList.add('active');
        } else {
            li.classList.remove('active');
        }
    });
}