document.addEventListener("DOMContentLoaded", () => {
    loadFolders();
    const folderSelect = document.getElementById("folderSelect");
    const folderNameInput = document.getElementById("folderName");
    const darkModeToggle = document.getElementById("darkModeToggle");
    const noFolderMessage = document.getElementById("noFolderMessage");
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
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        const url = tabs[0].url;
        const title = tabs[0].title;
        browser.runtime.sendMessage({
            action: "getFolderForDomain",
            url
        }).then((response) => {
            if (response.folderName) {
                folderNameInput.value = response.folderName;
                folderSelect.value = response.folderName;
            } else {
                noFolderMessage.style.display = 'block';
            }
        }).catch(error => {
            console.error("Failed to get folder for domain:", error);
        });
        document.getElementById("saveButton").addEventListener("click", () => {
            const folderName = folderNameInput.value || folderSelect.value;
            if (folderName) {
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
            } else {
                noFolderMessage.style.display = 'block';
            }
        });
    });
    folderSelect.addEventListener("change", () => {
        folderNameInput.value = folderSelect.value;
        noFolderMessage.style.display = 'none';
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