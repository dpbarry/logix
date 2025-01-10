function setupHome() {
    const stages = document.querySelectorAll(".trainstage");

    function toggleDropped(e) {
        if (e.type === "keydown" && e.key !== " " && e.key !== "Enter") return;
        
        let target = e.target.closest(".trainstage");

        if (target.classList.contains("dropped")) {
            target.classList.remove("dropped");
        } else {
            stages.forEach((s) => {
                s.classList.remove("dropped");
            })
            target.classList.add("dropped");
        }
        target.blur();
    }

    stages.forEach( (stage) => {
        stage.onclick = toggleDropped;
        stage.onkeydown = toggleDropped;
        stage.tabIndex = 0;
    });

    document.querySelectorAll(".level-button:not(.locked)").forEach((b) => {
        b.tabIndex = 0;
        
        b.onclick = function (e) {
            // e.target.classList.add("activated");

            setTimeout( () => {
                Router(e.target.id);
                history.pushState({loc:e.target.id}, "");
            }, 15);
        };
        
        b.onkeydown = function (e) {
            if (e.key !== " " && e.key !== "Enter") return;
            
            // e.target.classList.add("activated");
            
            setTimeout(function () {
                Router(e.target.id);
                history.pushState({loc:e.target.id}, "");
            }, 15);
        };
    });

    document.querySelectorAll(".level-button").forEach(b => {
        b.addEventListener("pointerdown", (e) => {
            b.classList.add("nudged");
        });
    });

    document.getElementById("main-header").onclick = function () {
        Router("index.html");
        history.pushState({loc:"index.html"}, "");
    }
}
