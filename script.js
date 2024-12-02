const dialogList = document.querySelectorAll('dialog');


     function showModal(id) {
       document.getElementById(id).showModal();
     }

function closeDialog (event) {
    event.target.close();
    event.target.classList.remove("hide");
    event.target.removeEventListener("transitionend", closeDialog);
}

dialogList.forEach((dialog) => {
    dialog.addEventListener('click', (e) => {
        if (e.target.tagName !== 'DIALOG')
            return;

        const rect = e.target.getBoundingClientRect();

        const clickedInDialog = (
            rect.top <= e.clientY &&
                e.clientY <= rect.top + rect.height &&
                rect.left <= e.clientX &&
                e.clientX <= rect.left + rect.width
        );

        if (clickedInDialog === false) {
            e.target.classList.add("hide");
            
            e.target.addEventListener("transitionend", closeDialog);
        }});

    dialog.addEventListener('keydown', (e) => {
        if (e.key == "Escape") {

            e.preventDefault();
            e.target.classList.add("hide");

            e.target.addEventListener("transitionend", closeDialog);
        }
    });
});

document.querySelectorAll(".close").forEach( (closeButton) => {
    closeButton.addEventListener("click", (e) => {
        closeButton.parentNode.classList.add("hide");
        closeButton.parentNode.addEventListener("transitionend", closeDialog);
    });
});

document.querySelectorAll("dialog input").forEach((toggle) => {
    toggle.addEventListener("keydown", (e) => {
        if (e.key == "Escape") {
            e.preventDefault();
            e.target.closest("dialog").classList.add("hide");
            e.target.closest("dialog").addEventListener("transitionend", closeDialog);
        }
    });
});
