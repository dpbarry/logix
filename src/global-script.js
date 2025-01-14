function showModal(id) {
    document.getElementById(id).showModal();
}

function closeDialog (event) {
    event.target.close();
    event.target.classList.remove("hide");
    event.target.removeEventListener("transitionend", closeDialog);
}

function initDialogs() {
    const dialogList = document.querySelectorAll('dialog');

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
            if (e.key === "Escape") {

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
        toggle.addEventListener("pointerup", (e) => {
            e.target.focus();
            // i.e., the dialog
        });
        toggle.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                e.preventDefault();
                e.target.closest("dialog").classList.add("hide");
                e.target.closest("dialog").addEventListener("transitionend", closeDialog);
            }
        });
    });

    document.querySelectorAll(".dialog_button").forEach(li => {
        li.addEventListener("pointerdown", (event) => {
            event.target.classList.add("nudged");

            event.target.addEventListener("pointerup", (event) => {
                event.target.classList.remove("nudged");
            })
        });

        li.addEventListener("keydown", (e) => {
            if (e.key !== " " && e.key !== "Enter") return;
            showModal(li.id + "_dialog");
        });
    });

    document.body.addEventListener("pointerup", (e) => {
        document.querySelectorAll(".nudged").forEach((elem) => {
            elem.classList.remove("nudged");
            
        });
    });
}



const CROSSHAIRS_TOGGLE = document.querySelector("#crosshairs_toggle");
const STICKY_TOGGLE = document.querySelector("#sticky_toggle");
const CANCELOUT_TOGGLE = document.querySelector("#cancelout_toggle");

