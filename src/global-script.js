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
            if (e.key === "Escape" || e.key === "Enter") {

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
        if (t.checked) {
            localStorage.setItem("theme", t.id);

        }
    });
});

[CROSSHAIRS_TOGGLE, STICKY_TOGGLE, CANCELOUT_TOGGLE].forEach(t => {
    t.addEventListener("change", () => {
        localStorage.setItem(t.id.split("_")[0], t.checked);
    });
});

updateTheme();

let cacheCrosshairs = localStorage.getItem("crosshairs");
let cacheSticky = localStorage.getItem("sticky");
let cacheCancelout = localStorage.getItem("cancelout");
let cacheTheme = localStorage.getItem("theme");

if (cacheCrosshairs !== null) {
    if (cacheCrosshairs === "true") {
        CROSSHAIRS_TOGGLE.checked = true;
    } else {
        CROSSHAIRS_TOGGLE.removeAttribute("checked");
    }
}

if (cacheSticky !== null) {
    if (cacheSticky === "true") {
        STICKY_TOGGLE.checked = true;
    } else {
        STICKY_TOGGLE.removeAttribute("checked");
    }
}

if (cacheCancelout !== null) {
    if (cacheCancelout === "true") {
        CANCELOUT_TOGGLE.checked = true;
    } else {
        CANCELOUT_TOGGLE.removeAttribute("checked");
    }
}

if (cacheTheme !== null) {
    THEMES.forEach( t => {
        if (t.id === cacheTheme) {
            t.checked = true;
            updateTheme();
        } else {
            t.removeAttribute("checked");
        }
    });
}


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

        ROOT.style.colorScheme = "light";
        ROOT.classList.remove("dark");



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

        ROOT.style.colorScheme = "light";
        ROOT.classList.remove("dark");


    } else if (theme.id === "litdark") {

        ROOT.style.setProperty('--bgColor', 'hsl(50, 18%, 6%)');
        ROOT.style.setProperty('--baseColor', 'hsl(50, 0%, 88%)');
        ROOT.style.setProperty('--bracketColor', 'hsl(50, 20%, 45%)');

        ROOT.style.setProperty('--card', 'hsl(50, 12%, 11%)');
        ROOT.style.setProperty('--alpha', '1');

        ROOT.style.setProperty('--lightestShade', 'hsl(50, 20%, 45%)');
        ROOT.style.setProperty('--lighterShade', 'hsl(50, 25%, 37.5%)');
        ROOT.style.setProperty('--darkShade', 'hsl(50, 25%, 35%)');
        ROOT.style.setProperty('--darkerShade', 'hsl(50, 30%, 30%)');
        ROOT.style.setProperty('--darkestShade', 'hsl(50, 30%, 20%)');

        ROOT.style.setProperty('--focusColor', 'hsl(50, 40%, 30%)');
        ROOT.style.setProperty('--emphasisColor', 'hsl(50, 60%, 20%)');
        ROOT.style.setProperty('--correctColor', 'hsl(130, 35%, 35%)');

        ROOT.style.setProperty('--hueShiftIcons', 'brightness(0) invert(0.9)');
        
        ROOT.style.colorScheme = "dark";
        ROOT.classList.add("dark");


    } else if (theme.id === "frostdark") {

        ROOT.style.setProperty('--bgColor', 'hsl(200, 18%, 6%)');
        ROOT.style.setProperty('--baseColor', 'hsl(200, 0%, 88%)');
        ROOT.style.setProperty('--bracketColor', 'hsl(200, 20%, 45%)');

        ROOT.style.setProperty('--card', 'hsl(200, 12%, 11%)');
        ROOT.style.setProperty('--alpha', '1');

        ROOT.style.setProperty('--lightestShade', 'hsl(200, 20%, 45%)');
        ROOT.style.setProperty('--lighterShade', 'hsl(200, 25%, 37.5%)');
        ROOT.style.setProperty('--darkShade', 'hsl(200, 25%, 35%)');
        ROOT.style.setProperty('--darkerShade', 'hsl(200, 30%, 30%)');
        ROOT.style.setProperty('--darkestShade', 'hsl(200, 30%, 20%)');

        ROOT.style.setProperty('--focusColor', 'hsl(200, 40%, 35%)');
        ROOT.style.setProperty('--emphasisColor', 'hsl(200, 60%, 20%)');
        ROOT.style.setProperty('--correctColor', 'hsl(130, 35%, 35%)');

        ROOT.style.setProperty('--hueShiftIcons', 'brightness(0) invert(0.9)');

        ROOT.style.colorScheme = "dark";
        ROOT.classList.add("dark");

    }
}


function killOpenDialog () {
    let openDialog = document.querySelector("dialog[open]");
    if (openDialog) {
        openDialog.classList.add("hide");
        openDialog.addEventListener("transitionend", closeDialog);
    }
}
document.addEventListener('keydown', (e) => {

    if (e.key === "u") {
        try {
            undo();
        } catch {}
    }

    if (e.key === "r") {
        try {
            redo();
        } catch {}
    }

    if (e.key === "c") {
        try {
            candidateToggle();
        } catch {}
    }

    if (e.key === "m") {
        try {
            MENU_TOGGLE.checked = !MENU_TOGGLE.checked;
            changed = new AnimationEvent("change");
            MENU_TOGGLE.dispatchEvent(changed);
        } catch {}
    }

    if (e.key === "h") {
        Router("index.html");
        history.pushState({loc:"index.html"}, "");
    }

    if (e.key === "Tab") {
        tabbed = true;
        setTimeout(() => { tabbed = false }, 10);
    }

    if (e.key === "i") {
        killOpenDialog();
        try {
            document.querySelector("#info").click();
        } catch {
            document.querySelector("#about").click();
        }
    }

    if (e.key === "s") {
        killOpenDialog();
        document.querySelector("#settings").click();
    }

    if (e.key === "d") {
        if (document.querySelector("#dictionary")) {
            killOpenDialog();
            document.querySelector("#dictionary").click();
        }
    }
    if (e.key === "n") {
        if (document.querySelector("#notes")) {
            killOpenDialog();
            document.querySelector("#notes").click();
        }
    }
});

