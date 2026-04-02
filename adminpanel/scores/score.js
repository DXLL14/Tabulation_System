const allSideMenu = document.querySelectorAll('#sidebar .side-menu.top li a');

// Function to set the active menu based on the current URL
function setActiveMenu() {
    const currentPage = window.location.pathname.split('/').pop(); // Get current file name

    allSideMenu.forEach(item => {
        const li = item.parentElement;
        const linkPage = item.getAttribute('href').split('/').pop(); // Get href file name

        if (linkPage === currentPage) {
            li.classList.add('active');
        } else {
            li.classList.remove('active');
        }
    });
}

// Run on page load
setActiveMenu();

// TOGGLE SIDEBAR
const menuBar = document.querySelector('#content nav .bx.bx-menu');
const sidebar = document.getElementById('sidebar');

menuBar.addEventListener('click', function () {
    sidebar.classList.toggle('hide');
});


const searchButton = document.querySelector('#content nav form .form-input button');
const searchButtonIcon = document.querySelector('#content nav form .form-input button .bx');
const searchForm = document.querySelector('#content nav form');

searchButton.addEventListener('click', function (e) {
		if(window.innerWidth < 576) {
			e.preventDefault();
			searchForm.classList.toggle('show');
			if(searchForm.classList.contains('show')) {
				searchButtonIcon.classList.replace('bx-search', 'bx-x');
			} else {
				searchButtonIcon.classList.replace('bx-x', 'bx-search');
			}
		}
	})


	if(window.innerWidth < 768) {
			sidebar.classList.add('hide');
		} else if(window.innerWidth > 576) {
			searchButtonIcon.classList.replace('bx-x', 'bx-search');
			searchForm.classList.remove('show');
		}


	window.addEventListener('resize', function () {
		if(this.innerWidth > 576) {
			searchButtonIcon.classList.replace('bx-x', 'bx-search');
			searchForm.classList.remove('show');
		}
	});