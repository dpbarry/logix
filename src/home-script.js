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
    
    document.getElementById("t1.1").onclick = function () {
        e.target.classList.add("activated");
        setTimeout(function () {
            Router("level");
            history.pushState({loc:"level"}, "");
        }, 150);
    };
    document.getElementById("t1.1").onkeydown = function (e) {
        if (e.key != " " && e.key != "Enter") return;
        
        e.target.classList.add("activated");
        setTimeout(function () {
            Router("level");
            history.pushState({loc:"level"}, "");
        }, 150);
    };

    document.querySelectorAll("li").forEach(l => {l.tabIndex = 0;});
}


