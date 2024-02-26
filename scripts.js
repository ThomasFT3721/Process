class HttpRequest {
    static #baseURL = './';

    static async get(url) {
        const headers = new Headers();
        headers.append('Content-Type', 'text/plain; charset=UTF-8');
        const response = await fetch(`${this.#baseURL}${url}`, {
            method: 'GET',
            headers: headers
        });
        return await response.text();
    }
}

class Data {
    static tags = [];
    static process = {};
    static menu = [];

    static async load() {
        const data = await HttpRequest.get('data.json');
        const json = JSON.parse(data);
        this.tags = [];
        this.process = {};
        this.menu = [];

        Object.keys(json).forEach(key => {
            const process = json[key];
            let url = process.url;
            this.process[url] = new Process(url, process.title, process.tags);

            let path = key.split('/');
            let name = process.title;

            for (let i = 0; i < path.length - 1; i++) {

                let item = this.menu.find(item => item.name.toLowerCase() === path[i].toLowerCase() || foundSubGroup(item, path[i].toLowerCase()));
                if (!item) {
                    item = new MenuItem('group', path[i], path[i].toLowerCase(), []);
                    this.menu.push(item);
                }
                if (i === path.length - 2) {
                    let it = item
                    while (it.name.toLowerCase() !== path[i].toLowerCase()) {
                        it = it.items.find(subItem => subItem.name.toLowerCase() === path[i].toLowerCase());
                    }
                    it.items.push(new MenuItem('item', name, url, []));
                } else {
                    let subItem = item.items.find(subItem => subItem.name.toLowerCase() === path[i + 1].toLowerCase());
                    if (!subItem) {
                        subItem = new MenuItem('group', path[i + 1], path[i + 1].toLowerCase(), []);
                        item.items.push(subItem);
                    }
                    item = subItem;
                }
            }

            process.tags.forEach(tag => {
                if (!this.tags.includes(tag)) {
                    this.tags.push(tag);
                }
            });
        });


        //Sort menu and sub menu and items by name
        sortMenu(this.menu);

        //Sort tags
        this.tags.sort((a, b) => {
            return a.localeCompare(b);
        });
    }
}

class Process {
    url;
    title;
    tags;

    constructor(url, title, tags) {
        this.url = url;
        this.title = title;
        this.tags = tags;
    }
}


class MenuItem {
    type;
    name;
    url;
    items;

    constructor(type, name, url, items) {
        this.type = type;
        this.name = name;
        this.url = url;
        if (items) {
            this.items = [];
            for (const item of items) {
                this.items.push(new MenuItem(item.type, item.name, item.url, item.items));
            }
        }
    }

    isItem() {
        return this.type === 'item';
    }
}

window.currentItemActive = null;

window.buildItemOfMenu = function (item, withProcess = false) {
    if (item === null) {
        let items = '';
        for (const subItem of Data.menu) {
            items += buildItemOfMenu(subItem, withProcess);
        }
        return items;
    }
    if (!item.isItem()) {
        let items = '';
        for (const subItem of item.items) {
            items += buildItemOfMenu(subItem, withProcess);
        }
        return `<div class="item item-group">
                    <a href="#${item.url}" class="name ${window.currentItemActive === item.url ? "active" : ""}" link="close-menu">${item.name}</a>
                    ${items !== "" ? `<div class="items">` + items + "</div>" : ""}
               </div>`;
    } else {
        if (withProcess) {
            return `<div class="item item-process">
                        <a href="#${item.url}" class="name ${window.currentItemActive === item.url ? "active" : ""}" link="close-menu">${item.name}</a>
                    </div>`;
        }
    }
    return '';
}
window.buildMenu = function () {
    const menu = document.querySelector('#menu');
    let items = `
                        <div id="menu-handler">
                            <span id="line1"></span>
                            <span id="line2"></span>
                            <span id="line3"></span>
                        </div>
                        <div class="title">Menu</div>
                        <div class="elements">
                        <div class="item">
                            <a href="#" class="name ${window.currentItemActive === "" ? "active" : ""}" link="close-menu">Accueil</a>
                        </div>
                       `;
    for (const item of Data.menu) {
        items += buildItemOfMenu(item, false);
    }
    menu.innerHTML = items + "</div>";
}
window.getItemAndParent = function (url) {
    const getItemAndParentOfMenu = function (item, url) {
        if (item.url === url) {
            return item;
        }
        if (item.items) {
            for (const subItem of item.items) {
                const result = getItemAndParentOfMenu(subItem, url);
                if (result) {
                    if (result.parent) {
                        return result;
                    } else {
                        return {
                            item: subItem,
                            parent: item
                        };
                    }
                }
            }
        }
        return null;

    }

    for (const item of Data.menu) {
        const result = getItemAndParentOfMenu(item, url);
        if (result) {
            if (result.parent) {
                return result;
            } else {
                return {
                    item: result,
                    parent: null
                };
            }
        }
    }
    return null;
}

window.getBreadcrumb = function (itemAndParent, breadcrumb = []) {
    breadcrumb.push(itemAndParent.item);
    if (itemAndParent.parent) {
        return getBreadcrumb(getItemAndParent(itemAndParent.parent.url), breadcrumb);
    }
    breadcrumb.shift();
    breadcrumb.push({
        name: "Accueil",
        url: ""
    });
    breadcrumb = breadcrumb.reverse();
    return breadcrumb;
}

window.buildContent = async function (withHeader = true) {
    const app = document.querySelector('#app');
    const header = document.querySelector('#header');
    const content = document.querySelector('#content');
    let htmlHeader = '';
    let htmlContent = '';
    if (window.currentItemActive) {
        const itemAndParent = getItemAndParent(window.currentItemActive);
        if (itemAndParent.item.isItem()) {
            app.setAttribute('type', 'process');
            console.log(itemAndParent.item.url)
            const process = Data.process[itemAndParent.item.url];
            if (process) {
                htmlHeader = `
                            <div class="title">${process.title}</div>
                            <div class="line">
                                <div class="breadcrumb">${getBreadcrumb(itemAndParent).map(item => `<a class="item" href="#${item.url}" link>${item.name}</a>`).join(`<span>/</span>`)}</div>
                                <div class="tags">${process.tags.map(tag => `<div class="tag">${tag}</div>`).join('')}</div>
                            </div>
                           `;
                htmlContent = `<div class="process">${await HttpRequest.get(process.url)}</div>`;
            } else {
                htmlHeader = `
                        <div class="title">Process not found</div>
                        <div class="breadcrumb">${getBreadcrumb(itemAndParent).map(item => `<a class="item" href="#${item.url}" link>${item.name}</a>`).join(`<span>/</span>`)}</div>
                       `;
            }
        } else {
            app.setAttribute('type', 'group');
            htmlHeader = `
                    <div class="line" id="search-container">
                        <div class="title">${itemAndParent.item.name}</div>
                    </div>
                    <div class="breadcrumb">${getBreadcrumb(itemAndParent).map(item => `<a class="item" href="#${item.url}" link>${item.name}</a>`).join(`<span>/</span>`)}</div>
                   `;
            htmlContent = `<div class="menu delete-first">${buildItemOfMenu(itemAndParent.item, true)}</div>`;
        }
    } else {
        app.setAttribute('type', 'group');
        htmlHeader = `
                <div class="line" id="search-container">
                    <div class="title">Accueil</div>
                </div>
               `;
        htmlContent = `<div class="menu main">${buildItemOfMenu(null, true)}</div>`;
    }
    content.innerHTML = htmlContent;
    if (withHeader) {
        header.innerHTML = htmlHeader;
        buildSearch();
    }
}

window.buildSearch = function () {
    const search = document.querySelector('#search');
    if (search !== null) {
        search.remove();
    }
    if (document.querySelector('#app').getAttribute('type') === 'group') {
        let searchValue = '';
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const index = cookie.indexOf('=');
            if (index !== -1) {
                const key = cookie.substring(0, index).trim();
                const value = cookie.substring(index + 1).trim();
                if (key === 'search') {
                    searchValue = value;
                }
            }
        }

        document.querySelector("#search-container").insertAdjacentHTML('beforeend', `<input id="search" type="text" placeholder="Rechercher" value="${searchValue}"/>`);

        const search = document.querySelector('#search');
        search.addEventListener('keyup', () => {
            const value = search.value;
            document.cookie = `search=${value}`;
            applySearch();
        });
    }
}

window.applySearch = function () {
    buildContent(false);
    if (document.querySelector('#app').getAttribute('type') === 'group') {
        let searchValue = '';
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const index = cookie.indexOf('=');
            if (index !== -1) {
                const key = cookie.substring(0, index).trim();
                const value = cookie.substring(index + 1).trim();
                if (key === 'search') {
                    searchValue = value;
                }
            }
        }
        searchValue = searchValue.toLowerCase();

        if (searchValue !== '') {
            document.querySelectorAll('.item-process').forEach(item => {
                const name = item.querySelector('a').innerText.toLowerCase();
                if (name) {
                    if (name.indexOf(searchValue) === -1) {
                        item.remove();
                    }
                }
            });

            document.querySelectorAll('.item-group').forEach(item => {
                const notHide = item.querySelector('.item-process:not(.hide)');
                if (notHide === null) {
                    item.remove();
                }
            });
        }
    }
    document.querySelectorAll('*[link]').forEach(item => {
        item.addEventListener('click', () => {
            window.currentItemActive = item.getAttribute('href').substring(1);
            document.querySelector('#menu').classList.remove('open');
            init();
        });
    });
}

window.init = function () {
    buildMenu();
    buildContent();
    applySearch();
    setTimeout(() => {
        document.querySelectorAll('*[link]').forEach(item => {
            item.addEventListener('click', () => {
                window.currentItemActive = item.getAttribute('href').substring(1);
                document.querySelector('#menu').classList.remove('open');
                init();
            });
        });
        document.querySelector('#menu-handler').addEventListener('click', () => {
            document.querySelector('#menu').classList.toggle('open');
        });
    }, 100);
}

window.foundSubGroup = function (item, url) {
    for (const subItem of item.items) {
        if (subItem.url.toLowerCase() === url.toLowerCase()) {
            return true;
        }
        if (subItem.items) {
            if (foundSubGroup(subItem, url)) {
                return true;
            }
        }
    }
    return false;
}

window.sortMenu = function (items) {
    items.sort((a, b) => {
        return a.name.localeCompare(b.name);
    });
    items.forEach(item => {
        if (item.items) {
            sortMenu(item.items);
        }
    });
}

window.addEventListener('DOMContentLoaded', async () => {
    //Get current item active
    const url = window.location.href;
    const index = url.indexOf('#');
    if (index !== -1) {
        window.currentItemActive = url.substring(index + 1);
    } else {
        window.currentItemActive = '';
    }
    //Load data
    await Data.load();
    init();
});