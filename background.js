let domainToFolderMap = {};
browser.storage.local.get("domainToFolderMap").then(data => {
    if (data.domainToFolderMap) {
        domainToFolderMap = data.domainToFolderMap;
    }
});
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