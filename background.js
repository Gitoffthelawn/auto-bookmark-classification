let domainToFolderMap = {};
browser.storage.local.get("domainToFolderMap").then(data => {
    if (data.domainToFolderMap) {
        domainToFolderMap = data.domainToFolderMap;
    }
});
function showNotification(message) {
    browser.notifications.create({
        type: "basic",
        title: "Auto Bookmark Classification",
        message: message,
        iconUrl: browser.runtime.getURL("icon16.png")
    });
}
function setIcon(iconPath) {
    browser.browserAction.setIcon({ path: iconPath });
}
function getDomain(url) {
    let a = document.createElement("a");
    a.href = url;
    return a.hostname.replace(/^www\./, '').split('.').slice(-2).join('.');
}
function saveBookmark(url, title, folderName) {
    const domain = getDomain(url);
    browser.bookmarks.search({ url }).then((results) => {
        if (results.length === 0) {
            browser.bookmarks.search({ title: folderName }).then((folders) => {
                let folderId = folders.find(folder => folder.title === folderName && !folder.url)?.id;

                if (!folderId) {
                    browser.bookmarks.create({ title: folderName }).then((newFolder) => {
                        folderId = newFolder.id;
                        browser.bookmarks.create({ parentId: folderId, title: title, url });
                    });
                } else {
                    browser.bookmarks.create({ parentId: folderId, title: title, url });
                }
            });
        }
    });
    domainToFolderMap[domain] = folderName;
    browser.storage.local.set({ domainToFolderMap });
}
browser.commands.onCommand.addListener((command) => {
    if (command === "save-or-open") {
        browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
            const url = tabs[0].url;
            const title = tabs[0].title;
            const domain = getDomain(url);
            const folderName = domainToFolderMap[domain];
            if (folderName) {
                saveBookmark(url, title, folderName);
                setIcon("icon16.png");
            } else {
                showNotification("No default folder selected. Please choose or create a folder.");
                setIcon("icon.gif");
                setTimeout(() => {
                    setIcon("icon16.png");
                }, 10000); //
            }
        }).catch(error => {
            console.error("Failed to query tabs:", error);
        });
    }
});
browser.browserAction.onClicked.addListener(() => {
    setIcon("icon16.png");
});
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "saveBookmark") {
        saveBookmark(message.url, message.title, message.folderName);
        sendResponse({ success: true });
    } else if (message.action === "getFolderForDomain") {
        const domain = getDomain(message.url);
        const folderName = domainToFolderMap[domain];
        sendResponse({ folderName });
    }
});