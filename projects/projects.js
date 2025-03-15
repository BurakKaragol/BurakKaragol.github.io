document.querySelectorAll(".project__item").forEach((item) => {
    item.addEventListener("mouseenter", () => {
        item.classList.add("hovered");
    });

    item.addEventListener("mouseleave", () => {
        item.classList.remove("hovered");
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const projects = document.querySelectorAll(".project__item");

    projects.forEach(project => {
        project.addEventListener("click", function () {
            const url = project.getAttribute("data-url");
            if (url) {
                window.location.href = url; // Open project page
            }
        });

        // Add hover effect to indicate clickability
        project.style.cursor = "pointer";
    });
});
