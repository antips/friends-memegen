tabs = document.getElementById("explorer").getElementsByTagName("input");
console.log(tabs)
for (let tab of tabs) {
    console.log(tab);
    tab.addEventListener("click", updateTabsSelection);
}

function updateTabsSelection(e) {
    selectedTab = e.target.labels[0].parentElement
    console.log(selectedTab)
    selectedTab.classList.add("checked");
    for (let tab of tabs) {
        if (e.target != tab) {
            tab.labels[0].parentElement.classList.remove("checked");
        }
    }
}