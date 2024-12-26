function setupHome() {
    const stages = document.querySelectorAll(".trainstage");

    function toggleDropped(e) {
        if (e.type == "keydown" && e.key != " " && e.key != "Enter") return;
        
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

    
    stages.forEach((s) => {
        s.onclick = toggleDropped;
        s.onkeydown = toggleDropped;
        s.tabIndex = 0;
    });

    document.querySelectorAll(".level-button:not(.locked)").forEach((b) => {
        
        b.onclick = function (e) {
            setTimeout(function () {
                Router(e.target.id);
                history.pushState({loc:e.target.id}, "");
            }, 50);
        };
        
        b.onkeydown = function (e) {
            if (e.key != " " && e.key != "Enter") return;
            
            setTimeout(function () {
                Router(e.target.id);
                history.pushState({loc:e.target.id}, "");
            }, 50);
        };

        
    });

    
    document.querySelectorAll(".level-button").forEach(l => {
        if (!l.classList.contains("locked")) l.tabIndex = 0;
        l.addEventListener("pointerdown", (e) => {
            l.classList.add("nudged");
        });
    });

    document.getElementById("main-header").onclick = function () {
        Router("index.html");
        history.pushState({loc:"index.html"}, "");
    }
    
}
