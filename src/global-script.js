function showModal(id) {
    document.getElementById(id).showModal();
}

function closeDialog (event) {
    event.target.closest("dialog").close();
    event.target.closest("dialog").classList.remove("hide");

    document.querySelectorAll(".dialog_button").forEach( (d) => {
        d.blur();
    });
    
    event.target.closest("dialog").removeEventListener("transitionend", closeDialog);    
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

updateTheme();
function updateTheme() {
    let theme = Array.from(THEMES).find(t => t.checked);

    if (theme.id === "litlight") {

        ROOT.style.setProperty('--bgColor', '#FFF');
        ROOT.style.setProperty('--baseColor', '#000');
        ROOT.style.setProperty('--bracketColor', '#000');

        ROOT.style.setProperty('--card', '#F5F5F5');
        ROOT.style.setProperty('--alpha', '0.3');

        ROOT.style.setProperty('--lightestShade', 'hsl(50, 20%, 94%)');
        ROOT.style.setProperty('--lighterShade', 'hsl(50, 25%, 91%)');
        ROOT.style.setProperty('--darkShade', 'hsl(50, 25%, 50%)');
        ROOT.style.setProperty('--darkerShade', 'hsl(50, 30%, 35%)');
        ROOT.style.setProperty('--darkestShade', 'hsl(50, 35%, 25%)');

        ROOT.style.setProperty('--focusColor', 'hsl(50, 45%, 80%)');
        ROOT.style.setProperty('--emphasisColor', 'hsl(50, 40%, 45%)');
        ROOT.style.setProperty('--correctColor', 'hsl(130, 35%, 35%)');

        ROOT.style.setProperty('--hueShiftIcons', '');

    } else if (theme.id === "frostlight") {

        ROOT.style.setProperty('--bgColor', '#FFF');
        ROOT.style.setProperty('--baseColor', '#000');
        ROOT.style.setProperty('--bracketColor', '#000');

        ROOT.style.setProperty('--card', '#F5F5F5');
        ROOT.style.setProperty('--alpha', '0.3');

        ROOT.style.setProperty('--lightestShade', 'hsl(200, 20%, 94%)');
        ROOT.style.setProperty('--lighterShade', 'hsl(200, 25%, 91%)');
        ROOT.style.setProperty('--darkShade', 'hsl(200, 25%, 50%)');
        ROOT.style.setProperty('--darkerShade', 'hsl(200, 30%, 35%)');
        ROOT.style.setProperty('--darkestShade', 'hsl(200, 35%, 25%)');

        ROOT.style.setProperty('--focusColor', 'hsl(200, 45%, 80%)');
        ROOT.style.setProperty('--emphasisColor', 'hsl(200, 40%, 45%)');
        ROOT.style.setProperty('--correctColor', 'hsl(130, 35%, 35%)');

        ROOT.style.setProperty('--hueShiftIcons', '');


    } else if (theme.id === "litdark") {

        ROOT.style.setProperty('--bgColor', 'hsl(50, 18%, 6%)');
        ROOT.style.setProperty('--baseColor', '#E5E5E5');
        ROOT.style.setProperty('--bracketColor', 'hsl(50, 20%, 45%)');

        ROOT.style.setProperty('--card', '#4E4E4E');
        ROOT.style.setProperty('--alpha', '0.8');

        ROOT.style.setProperty('--lightestShade', 'hsl(50, 20%, 45%)');
        ROOT.style.setProperty('--lighterShade', 'hsl(50, 25%, 40%)');
        ROOT.style.setProperty('--darkShade', 'hsl(50, 25%, 35%)');
        ROOT.style.setProperty('--darkerShade', 'hsl(50, 30%, 30%)');
        ROOT.style.setProperty('--darkestShade', 'hsl(50, 30%, 20%)');

        ROOT.style.setProperty('--focusColor', 'hsl(50, 40%, 30%)');
        ROOT.style.setProperty('--emphasisColor', 'hsl(50, 60%, 20%)');
        ROOT.style.setProperty('--correctColor', 'hsl(130, 35%, 35%)');

        ROOT.style.setProperty('--hueShiftIcons', 'invert(95%) sepia(34%) saturate(66%) hue-rotate(195deg) brightness(111%) contrast(80%)');


    } else if (theme.id === "frostdark") {

        ROOT.style.setProperty('--bgColor', 'hsl(200, 18%, 6%)');
        ROOT.style.setProperty('--baseColor', '#E5E5E5');
        ROOT.style.setProperty('--bracketColor', 'hsl(200, 20%, 45%)');

        ROOT.style.setProperty('--card', '#4E4E4E');
        ROOT.style.setProperty('--alpha', '0.8');

        ROOT.style.setProperty('--lightestShade', 'hsl(200, 20%, 45%)');
        ROOT.style.setProperty('--lighterShade', 'hsl(200, 25%, 40%)');
        ROOT.style.setProperty('--darkShade', 'hsl(200, 25%, 35%)');
        ROOT.style.setProperty('--darkerShade', 'hsl(200, 30%, 30%)');
        ROOT.style.setProperty('--darkestShade', 'hsl(200, 30%, 20%)');

        ROOT.style.setProperty('--focusColor', 'hsl(200, 40%, 35%)');
        ROOT.style.setProperty('--emphasisColor', 'hsl(200, 60%, 20%)');
        ROOT.style.setProperty('--correctColor', 'hsl(130, 35%, 35%)');

        ROOT.style.setProperty('--hueShiftIcons', 'invert(95%) sepia(34%) saturate(66%) hue-rotate(195deg) brightness(111%) contrast(80%)');

    }
}
