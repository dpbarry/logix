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
    });

    document.querySelectorAll(".level-button").forEach((b) => {
        
        b.onclick = function (e) {
            e.target.classList.add("activated");
            setTimeout(function () {
                Router(e.target.id);
                history.pushState({loc:e.target.id}, "");
            }, 150);
        };
        
        b.onkeydown = function (e) {
            if (e.key != " " && e.key != "Enter") return;
            
            e.target.classList.add("activated");
            setTimeout(function () {
                Router(e.target.id);
                history.pushState({loc:e.target.id}, "");
            }, 150);
        };

        b.addEventListener("pointerdown", (e) => {
            b.classList.add("nudged");
        });
       
        document.querySelectorAll("li").forEach(l => {l.tabIndex = 0;});
    });
                                                      
}
