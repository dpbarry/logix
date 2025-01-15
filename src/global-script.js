function showModal(id) {
    document.getElementById(id).showModal();
}

function closeDialog (event) {
    event.target.close();
    event.target.classList.remove("hide");

    document.querySelectorAll(".dialog_button").forEach( (d) => {
        d.blur();
    });
    
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
                dialog.classList.add("hide");

                dialog.addEventListener("transitionend", closeDialog);
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
    });

    document.querySelectorAll(".dialog_button").forEach(li => {
        li.addEventListener("pointerdown", (event) => {
            event.target.classList.add("nudged");

            event.target.addEventListener("pointerup", (event) => {
                event.target.classList.remove("nudged");
            });
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
const THEMES = document.querySelectorAll(".theme");
const ROOT = document.documentElement;

THEMES.forEach( t => {
    t.addEventListener("change", () => {
        updateTheme();
    });
});

function updateTheme() {
    let theme = Array.from(THEMES).find(t => t.checked);

    if (theme.id === "litlight") {

        ROOT.style.setProperty('--bgColor', '#FFF');
        ROOT.style.setProperty('--baseColor', 'black');

        ROOT.style.setProperty('--lightestShade', 'hsl(50, 18%, 95%)');
        ROOT.style.setProperty('--lighterShade', 'hsl(50, 25%, 92%)');
        ROOT.style.setProperty('--darkShade', 'hsl(50, 20%, 50%)');
        ROOT.style.setProperty('--darkerShade', 'hsl(50, 18%, 35%)');
        ROOT.style.setProperty('--darkestShade', 'hsl(50, 18%, 25%)');

        ROOT.style.setProperty('--focusColor', 'hsl(50, 37%, 86%)');
        ROOT.style.setProperty('--emphasisColor', 'hsl(50, 37%, 45%)');
        ROOT.style.setProperty('--correctColor', 'hsl(130, 35%, 35%)');

    } else if (theme.id === "frostlight") {

        ROOT.style.setProperty('--bgColor', '#FFF');
        ROOT.style.setProperty('--baseColor', 'hsl(200, 15%, 20%)');

        ROOT.style.setProperty('--lightestShade', 'hsl(200, 10%, 98%)');
        ROOT.style.setProperty('--lighterShade', 'hsl(200, 12%, 94%)');
        ROOT.style.setProperty('--darkShade', 'hsl(200, 20%, 50%)');
        ROOT.style.setProperty('--darkerShade', 'hsl(200, 22%, 40%)');
        ROOT.style.setProperty('--darkestShade', 'hsl(200, 25%, 30%)');

        ROOT.style.setProperty('--focusColor', 'hsl(200, 30%, 85%)');
        ROOT.style.setProperty('--emphasisColor', 'hsl(200, 35%, 45%)');
        ROOT.style.setProperty('--correctColor', 'hsl(150, 40%, 35%)');
        ROOT.style.setProperty('--cellColor', 'hsl(200, 15%, 96%)');

    } else if (theme.id === "litdark") {

        ROOT.style.setProperty('--bgColor', 'hsl(50, 18%, 15%)');
        ROOT.style.setProperty('--baseColor', 'hsl(50, 18%, 70%)');

        ROOT.style.setProperty('--lightestShade', 'hsl(50, 18%, 25%)');
        ROOT.style.setProperty('--lighterShade', 'hsl(50, 20%, 35%)');
        ROOT.style.setProperty('--darkShade', 'hsl(50, 25%, 50%)');
        ROOT.style.setProperty('--darkerShade', 'hsl(50, 30%, 65%)');
        ROOT.style.setProperty('--darkestShade', 'hsl(50, 35%, 75%)');

        ROOT.style.setProperty('--focusColor', 'hsl(50, 37%, 65%)');
        ROOT.style.setProperty('--emphasisColor', 'hsl(50, 37%, 45%)');
        ROOT.style.setProperty('--correctColor', 'hsl(130, 35%, 50%)');

    } else if (theme.id === "frostdark") {

        ROOT.style.setProperty('--bgColor', 'hsl(200, 15%, 10%)');
        ROOT.style.setProperty('--baseColor', 'hsl(200, 15%, 70%)');

        ROOT.style.setProperty('--lightestShade', 'hsl(200, 15%, 20%)');
        ROOT.style.setProperty('--lighterShade', 'hsl(200, 18%, 30%)');
        ROOT.style.setProperty('--darkShade', 'hsl(200, 20%, 45%)');
        ROOT.style.setProperty('--darkerShade', 'hsl(200, 25%, 60%)');
        ROOT.style.setProperty('--darkestShade', 'hsl(200, 30%, 75%)');

        ROOT.style.setProperty('--focusColor', 'hsl(200, 40%, 70%)');
        ROOT.style.setProperty('--emphasisColor', 'hsl(200, 45%, 50%)');
        ROOT.style.setProperty('--correctColor', 'hsl(150, 50%, 45%)');
        ROOT.style.setProperty('--cellColor', 'hsl(200, 15%, 15%)');
    }
}
