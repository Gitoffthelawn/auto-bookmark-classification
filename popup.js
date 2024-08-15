document.addEventListener("DOMContentLoaded", () => {
    loadFolders();
    const folderSelect = document.getElementById("folderSelect");
    const folderNameInput = document.getElementById("folderName");
    const darkModeToggle = document.getElementById("darkModeToggle");
    browser.storage.local.get("darkModeEnabled").then(data => {
        if (data.darkModeEnabled) {
            document.body.classList.add("dark-mode");
            darkModeToggle.checked = true;
        }
    });
    darkModeToggle.addEventListener("change", () => {
        if (darkModeToggle.checked) {
            document.body.classList.add("dark-mode");
            browser.storage.local.set({ darkModeEnabled: true });
        } else {
            document.body.classList.remove("dark-mode");
            browser.storage.local.set({ darkModeEnabled: false });
        }
    });
    browser.storage.local.get("savedTab").then(data => {
        const savedTab = data.savedTab;
        if (savedTab) {
            const url = savedTab.url;
            const title = savedTab.title;
            browser.runtime.sendMessage({
                action: "getFolderForDomain",
                url
            }).then((response) => {
                if (response.folderName) {
                    folderNameInput.value = response.folderName;
                    folderSelect.value = response.folderName;
                }
            });
            document.getElementById("saveButton").addEventListener("click", () => {
                const folderName = folderNameInput.value;
                browser.runtime.sendMessage({
                    action: "saveBookmark",
                    url,
                    title,
                    folderName
                }).then((response) => {
                    if (response.success) {
                        window.close();
                    }
                });
            });
        } else {
            console.error("No saved tab found.");
        }
    });
    folderSelect.addEventListener("change", () => {
        folderNameInput.value = folderSelect.value;
    });
});
function loadFolders() {
    browser.bookmarks.getTree().then((bookmarks) => {
        const folderSelect = document.getElementById("folderSelect");
        function addFolders(bookmarkNodes, depth = 0) {
            for (const node of bookmarkNodes) {
                if (node.type === "folder" && node.title) {
                    const option = document.createElement("option");
                    option.value = node.title;
                    option.textContent = ' '.repeat(depth * 2) + node.title;
                    folderSelect.appendChild(option);
                }
                if (node.children) {
                    addFolders(node.children, depth + 1);
                }
            }
        }
        addFolders(bookmarks);
    });
}
