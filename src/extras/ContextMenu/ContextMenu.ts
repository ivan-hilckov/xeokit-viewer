import {Map} from "../../viewer/utils/Map.js";
import {Events} from "../../viewer/Events";

// @ts-ignore
const idMap = new Map();

/**
 * Internal data class that represents the state of a menu or a submenu.
 * @private
 */
class Menu {

    public id: string;
    public parentItem: Item;
    public groups: any[];
    public menuElement: HTMLElement;
    public shown: boolean;
    public mouseOver: number;

    constructor(id: any) {
        this.id = id;
        this.parentItem = null; // Set to an Item when this Menu is a submenu
        this.groups = [];
        this.menuElement = null;
        this.shown = false;
        this.mouseOver = 0;
    }
}

/**
 * Internal data class that represents a group of Items in a Menu.
 * @private
 */
class Group {
    public items: any[];

    constructor() {
        this.items = [];
    }
}

/**
 * Internal data class that represents the state of a menu item.
 * @private
 */
class Item {

    public id: string;
    public getTitle: any;
    public getEnabled: any;
    public doAction: any;
    public getShown: any;
    public itemElement: null;
    public subMenu: Menu | undefined;
    public enabled: boolean;
    public parentMenu: Menu | undefined;

    constructor(id: string, getTitle: any, doAction: any, getEnabled: any, getShown: any) {
        this.id = id;
        this.getTitle = getTitle;
        this.doAction = doAction;
        this.getEnabled = getEnabled;
        this.getShown = getShown;
        this.itemElement = null;
        this.subMenu = null;
        this.enabled = true;
    }
}

/**
 * A customizable HTML context menu.
 *
 * [<img src="http://xeokit.io/img/docs/ContextMenu/ContextMenu.gif">](https://xeokit.github.io/xeokit-sdk/examples/#ContextMenu_Canvas_TreeViewPlugin_Custom)
 *
 * * [[Run this example](https://xeokit.github.io/xeokit-sdk/examples/#ContextMenu_Canvas_TreeViewPlugin_Custom)]
 *
 * ## Overview
 *
 * * A pure JavaScript, lightweight context menu
 * * Dynamically configure menu items
 * * Dynamically enable or disable items
 * * Dynamically show or hide items
 * * Supports cascading sub-menus
 * * Configure custom style with custom CSS (see examples above)
 *
 * ## Usage
 *
 * In the example below we'll create a ````ContextMenu```` that pops up whenever we right-click on an {@link Entity} within
 * our {@link Scene}.
 *
 * First, we'll create the ````ContextMenu````, configuring it with a list of menu items.
 *
 * Each item has:
 *
 * * a ````title```` for the item,
 * * a ````doAction()```` callback to fire when the item's title is clicked,
 * * an optional ````getShown()```` callback that indicates if the item should shown in the menu or not, and
 * * an optional ````getEnabled()```` callback that indicates if the item should be shown enabled in the menu or not.
 *
 * <br>
 *
 * The ````getShown()```` and ````getEnabled()```` callbacks are invoked whenever the menu is shown.
 *
 * When an item's ````getShown()```` callback
 * returns ````true````, then the item is shown. When it returns ````false````, then the item is hidden. An item without
 * a ````getShown()```` callback is always shown.
 *
 * When an item's ````getEnabled()```` callback returns ````true````, then the item is enabled and clickable (as long as it's also shown). When it
 * returns ````false````, then the item is disabled and cannot be clicked. An item without a ````getEnabled()````
 * callback is always enabled and clickable.
 *
 * Note how the ````doAction()````,  ````getShown()```` and ````getEnabled()```` callbacks accept a ````context````
 * object. That must be set on the ````ContextMenu```` before we're able to we show it. The context object can be anything. In this example,
 * we'll use the context object to provide the callbacks with the Entity that we right-clicked.
 *
 * We'll also initially enable the ````ContextMenu````.
 * <br><br>
 * [[Run this example](https://xeokit.github.io/xeokit-sdk/examples/#ContextMenu_Canvas_Custom)]
 *
 * ````javascript
 * const canvasContextMenu = new ContextMenu({
 *
 *    enabled: true,
 *
 *    items: [
 *       [
 *          {
 *             title: "Hide Object",
 *             getEnabled: (context) => {
 *                 return context.entity.visible; // Can't hide entity if already hidden
 *             },
 *             doAction: function (context) {
 *                 context.entity.visible = false;
 *             }
 *          }
 *       ],
 *       [
 *          {
 *             title: "Select Object",
 *             getEnabled: (context) => {
 *                 return (!context.entity.selected); // Can't select an entity that's already selected
 *             },
 *             doAction: function (context) {
 *                 context.entity.selected = true;
 *             }
 *          }
 *       ],
 *       [
 *          {
 *             title: "X-Ray Object",
 *             getEnabled: (context) => {
 *                 return (!context.entity.xrayed); // Can't X-ray an entity that's already X-rayed
 *             },
 *             doAction: (context) => {
 *                 context.entity.xrayed = true;
 *             }
 *          }
 *       ]
 *    ]
 * });
 * ````
 *
 * Next, we'll make the ````ContextMenu```` appear whenever we right-click on an Entity. Whenever we right-click
 * on the canvas, we'll attempt to pick the Entity at those mouse coordinates. If we succeed, we'll feed the
 * Entity into ````ContextMenu```` via the context object, then show the ````ContextMenu````.
 *
 * From there, each ````ContextMenu```` item's ````getEnabled()```` callback will be invoked (if provided), to determine if the item should
 * be enabled. If we click an item, its ````doAction()```` callback will be invoked with our context object.
 *
 * Remember that we must set the context on our ````ContextMenu```` before we show it, otherwise it will log an error to the console,
 * and ignore our attempt to show it.
 *
 * ````javascript
 * viewer.scene.canvas.canvas.oncontextmenu = (e) => { // Right-clicked on the canvas
 *
 *     if (!objectContextMenu.enabled) {
 *         return;
 *     }
 *
 *     var hit = viewer.scene.pick({ // Try to pick an Entity at the coordinates
 *         canvasPos: [e.pageX, e.pageY]
 *     });
 *
 *     if (hit) { // Picked an Entity
 *
 *         objectContextMenu.context = { // Feed entity to ContextMenu
 *             entity: hit.entity
 *         };
 *
 *         objectContextMenu.show(e.pageX, e.pageY); // Show the ContextMenu
 *     }
 *
 *     e.preventDefault();
 * });
 * ````
 *
 * Note how we only show the ````ContextMenu```` if it's enabled. We can use that mechanism to switch between multiple
 * ````ContextMenu```` instances depending on what we clicked.
 *
 * ## Dynamic Item Titles
 *
 * To make an item dynamically regenerate its title text whenever we show the ````ContextMenu````, provide its title with a
 * ````getTitle()```` callback. The callback will fire each time you show ````ContextMenu````, which will dynamically
 * set the item title text.
 *
 * In the example below, we'll create a simple ````ContextMenu```` that allows us to toggle the selection of an object
 * via its first item, which changes text depending on whether we are selecting or deselecting the object.
 * <br><br>
 * [[Run an example](https://xeokit.github.io/xeokit-sdk/examples/#ContextMenu_dynamicItemTitles)]
 *
 * ````javascript
 * const canvasContextMenu = new ContextMenu({
 *
 *    enabled: true,
 *
 *    items: [
 *       [
 *          {
 *              getTitle: (context) => {
 *                  return (!context.entity.selected) ? "Select" : "Undo Select";
 *              },
 *              doAction: function (context) {
 *                  context.entity.selected = !context.entity.selected;
 *              }
 *          },
 *          {
 *              title: "Clear Selection",
 *              getEnabled: function (context) {
 *                  return (context.viewer.scene.numSelectedObjects > 0);
 *              },
 *              doAction: function (context) {
 *                  context.viewer.scene.setObjectsSelected(context.viewer.scene.selectedObjectIds, false);
 *              }
 *          }
 *       ]
 *    ]
 * });
 * ````
 *
 * ## Sub-menus
 *
 * Each menu item can optionally have a sub-menu, which will appear when we hover over the item.
 *
 * In the example below, we'll create a much simpler ````ContextMenu```` that has only one item, called "Effects", which
 * will open a cascading sub-menu whenever we hover over that item.
 *
 * Note that our "Effects" item has no ````doAction```` callback, because an item with a sub-menu performs no
 * action of its own.
 * <br><br>
 * * [[Run this example](https://xeokit.github.io/xeokit-sdk/examples/#ContextMenu_subMenus)]
 *
 * ````javascript
 * const canvasContextMenu = new ContextMenu({
 *     items: [ // Top level items
 *         [
 *             {
 *                 getTitle: (context) => {
 *                     return "Effects";
 *                 },
 *
 *                 items: [ // Sub-menu
 *                     [
 *                         {
 *                             getTitle: (context) => {
 *                                 return (!context.entity.visible) ? "Show" : "Hide";
 *                             },
 *                             doAction: function (context) {
 *                                 context.entity.visible = !context.entity.visible;
 *                             }
 *                         },
 *                         {
 *                             getTitle: (context) => {
 *                                 return (!context.entity.selected) ? "Select" : "Undo Select";
 *                             },
 *                             doAction: function (context) {
 *                                 context.entity.selected = !context.entity.selected;
 *                             }
 *                         },
 *                         {
 *                             getTitle: (context) => {
 *                                 return (!context.entity.highlighted) ? "Highlight" : "Undo Highlight";
 *                             },
 *                             doAction: function (context) {
 *                                 context.entity.highlighted = !context.entity.highlighted;
 *                             }
 *                         }
 *                     ]
 *                 ]
 *             }
 *          ]
 *      ]
 * });
 * ````
 */
class ContextMenu {

    private _id: any;
    private _context: any;
    private _enabled: boolean;
    private _itemsCfg: any;
    private _rootMenu: any;  // The root Menu in the tree
    private _menuList: any;    // List of Menus
    private _menuMap: any;     // Menus mapped to their IDs
    private _itemList: any;    // List of Items
    private _itemMap: any;     // Items mapped to their IDs
    private _shown: boolean;    // True when the ContextMenu is visible
    private _nextId: number;
    private _eventSubs: {};
    private _canvasTouchStartHandler: any;

    /**
     * Manages events on this Component.
     * @property events
     * @final
     * @type {Events}
     */
    public readonly events: Events;

    /**
     * Creates a ````ContextMenu````.
     *
     * The ````ContextMenu```` will be initially hidden.
     *
     * @param {Object} [cfg] ````ContextMenu```` configuration.
     * @param {Object} [cfg.items] The context menu items. These can also be dynamically set on {@link ContextMenu#items}. See the class documentation for an example.
     * @param {Object} [cfg.context] The context, which is passed into the item callbacks. This can also be dynamically set on {@link ContextMenu#context}. This must be set before calling {@link ContextMenu#show}.
     * @param [cfg.enabled=true] Whether this ````ContextMenu```` is initially enabled. {@link ContextMenu#show} does nothing while this is ````false````.
     * @param [cfg.hideOnMouseDown=true] Whether this ````ContextMenu```` automatically hides whenever we mouse-down or tap anywhere in the page.
     */
    constructor(cfg: {
        items: [],
        hideOnMouseDown: boolean,
        context: any,
        enabled: boolean
    } = {
        hideOnMouseDown: true,
        items: [],
        context: undefined,
        enabled: true
    }) {

        this._id = idMap.addItem();
        this._context = null;
        this._enabled = false;  // True when the ContextMenu is enabled
        this._itemsCfg = [];    // Items as given as configs
        this._rootMenu = null;  // The root Menu in the tree
        this._menuList = [];    // List of Menus
        this._menuMap = {};     // Menus mapped to their IDs
        this._itemList = [];    // List of Items
        this._itemMap = {};     // Items mapped to their IDs
        this._shown = false;    // True when the ContextMenu is visible
        this._nextId = 0;

        /**
         * Subscriptions to events fired at this ContextMenu.
         * @private
         */
        this._eventSubs = {};

        if (cfg.hideOnMouseDown !== false) {
            document.addEventListener("mousedown", (event) => {
                // @ts-ignore
                if (!event.target.classList.contains("xeokit-context-menu-item")) {
                    this.hide();
                }
            });
            // @ts-ignore
            document.addEventListener("touchstart", this._canvasTouchStartHandler = (event) => {
                if (!event.target.classList.contains("xeokit-context-menu-item")) {
                    this.hide();
                }
            });
        }

        if (cfg.items) {
            this.items = cfg.items;
        }

        this.context = cfg.context;
        this.enabled = cfg.enabled !== false;
        this.hide();
    }

    /**
     * Sets the ````ContextMenu```` items.
     *
     * These can be updated dynamically at any time.
     *
     * See class documentation for an example.
     *
     * @type {Object[]}
     */
    set items(itemsCfg) {
        this._clear();
        this._itemsCfg = itemsCfg || [];
        this._parseItems(itemsCfg);
        this._createUI();
    }

    /**
     * Gets the ````ContextMenu```` items.
     *
     * @type {Object[]}
     */
    get items() {
        return this._itemsCfg;
    }

    /**
     * Sets whether this ````ContextMenu```` is enabled.
     *
     * Hides the menu when disabling.
     *
     * @type {Boolean}
     */
    set enabled(enabled) {
        enabled = (!!enabled);
        if (enabled === this._enabled) {
            return;
        }
        this._enabled = enabled;
        if (!this._enabled) {
            this.hide();
        }
    }

    /**
     * Gets whether this ````ContextMenu```` is enabled.
     *
     * {@link ContextMenu#show} does nothing while this is ````false````.
     *
     * @type {Boolean}
     */
    get enabled() {
        return this._enabled;
    }

    /**
     * Sets the ````ContextMenu```` context.
     *
     * The context can be any object that you need to be provides to the callbacks configured on {@link ContextMenu#items}.
     *
     * This must be set before calling {@link ContextMenu#show}.
     *
     * @type {Object}
     */
    set context(context) {
        this._context = context;
    }

    /**
     * Gets the ````ContextMenu```` context.
     *
     * @type {Object}
     */
    get context() {
        return this._context;
    }

    /**
     * Shows this ````ContextMenu```` at the given page coordinates.
     *
     * Does nothing when {@link ContextMenu#enabled} is ````false````.
     *
     * Logs error to console and does nothing if {@link ContextMenu#context} has not been set.
     *
     * Fires a "shown" event when shown.
     *
     * @param pageX Page X-coordinate.
     * @param pageY Page Y-coordinate.
     */
    show(pageX: number, pageY: number) {
        if (!this._context) {
            console.error("ContextMenu cannot be shown without a context - set context first");
            return;
        }
        if (!this._enabled) {
            return;
        }
        if (this._shown) {
            return;
        }
        this._hideAllMenus();
        this.#updateItemsTitles();
        this.#updateItemsEnabledStatus();
        this._showMenu(this._rootMenu.id, pageX, pageY);
        this._shown = true;
        this.events.fire("shown", {});
    }

    /**
     * Gets whether this ````ContextMenu```` is currently shown or not.
     *
     * @returns {Boolean} Whether this ````ContextMenu```` is shown.
     */
    get shown(): boolean {
        return this._shown;
    }

    /**
     * Hides this ````ContextMenu````.
     *
     * Fires a "hidden" event when hidden.
     */
    hide() {
        if (!this._enabled) {
            return;
        }
        if (!this._shown) {
            return;
        }
        this._hideAllMenus();
        this._shown = false;
        this.events.fire("hidden", {});
    }

    /**
     * Destroys this ````ContextMenu````.
     */
    destroy() {
        this._context = null;
        this._clear();
        if (this._id !== null) {
            idMap.removeItem(this._id);
            this._id = null;
        }
    }

    /**
     * @private
     */
    _clear() { // Destroys DOM elements, clears menu data
        for (let i = 0, len = this._menuList.length; i < len; i++) {
            const menu = this._menuList[i];
            const menuElement = menu.menuElement;
            menuElement.parentElement.removeChild(menuElement);
        }
        this._itemsCfg = [];
        this._rootMenu = null;
        this._menuList = [];
        this._menuMap = {};
        this._itemList = [];
        this._itemMap = {};
    }

    /**
     * @private
     * @param itemsCfg
     */
    _parseItems(itemsCfg: any) { // Parses "items" config into menu data

        const visitItems = (itemsCfg: any) => {

            const menuId = this._getNextId();
            const menu = new Menu(menuId);

            for (let i = 0, len = itemsCfg.length; i < len; i++) {

                const itemsGroupCfg = itemsCfg[i];

                const group = new Group();

                menu.groups.push(group);

                for (let j = 0, lenj = itemsGroupCfg.length; j < lenj; j++) {

                    const itemCfg = itemsGroupCfg[j];
                    const subItemsCfg = itemCfg.items;
                    const hasSubItems = (subItemsCfg && (subItemsCfg.length > 0));
                    const itemId = this._getNextId();

                    const getTitle = itemCfg.getTitle || (() => {
                        return (itemCfg.title || "");
                    });

                    const doAction = itemCfg.doAction || itemCfg.callback || (() => {
                    });

                    const getEnabled = itemCfg.getEnabled || (() => {
                        return true;
                    });

                    const getShown = itemCfg.getShown || (() => {
                        return true;
                    });

                    const item = new Item(itemId, getTitle, doAction, getEnabled, getShown);

                    item.parentMenu = menu;

                    group.items.push(item);

                    if (hasSubItems) {
                        const subMenu = visitItems(subItemsCfg);
                        item.subMenu = subMenu;
                        subMenu.parentItem = item;
                    }

                    this._itemList.push(item);
                    this._itemMap[item.id] = item;
                }
            }

            this._menuList.push(menu);
            this._menuMap[menu.id] = menu;

            return menu;
        };

        this._rootMenu = visitItems(itemsCfg);
    }

    /**
     * @private
     */
    _getNextId(): string { // Returns a unique ID
        return "ContextMenu_" + this._id + "" + this._nextId++; // Start ID with alpha chars to make a valid DOM element selector
    }

    /**
     * @private
     */
    _createUI() { // Builds DOM elements for the entire menu tree

        const visitMenu = (menu: Menu) => {

            this._createMenuUI(menu);

            const groups = menu.groups;
            for (let i = 0, len = groups.length; i < len; i++) {
                const group = groups[i];
                const groupItems = group.items;
                for (let j = 0, lenj = groupItems.length; j < lenj; j++) {
                    const item = groupItems[j];
                    const subMenu = item.subMenu;
                    if (subMenu) {
                        visitMenu(subMenu);
                    }
                }
            }
        };

        visitMenu(this._rootMenu);
    }

    /**
     * @private
     * @param menu
     */
    _createMenuUI(menu: Menu) { // Builds DOM elements for a menu

        const groups = menu.groups;
        const html = [];

        html.push('<div class="xeokit-context-menu ' + menu.id + '" style="z-index:300000; position: absolute;">');

        html.push('<ul>');

        if (groups) {

            for (let i = 0, len = groups.length; i < len; i++) {

                const group = groups[i];
                const groupIdx = i;
                const groupLen = len;
                const groupItems = group.items;

                if (groupItems) {

                    for (let j = 0, lenj = groupItems.length; j < lenj; j++) {

                        const item = groupItems[j];
                        const itemSubMenu = item.subMenu;
                        const actionTitle = item.title || "";

                        if (itemSubMenu) {

                            html.push(
                                '<li id="' + item.id + '" class="xeokit-context-menu-item" style="' +
                                ((groupIdx === groupLen - 1) || ((j < lenj - 1)) ? 'border-bottom: 0' : 'border-bottom: 1px solid black') +
                                '">' +
                                actionTitle +
                                ' [MORE]' +
                                '</li>');

                        } else {

                            html.push(
                                '<li id="' + item.id + '" class="xeokit-context-menu-item" style="' +
                                ((groupIdx === groupLen - 1) || ((j < lenj - 1)) ? 'border-bottom: 0' : 'border-bottom: 1px solid black') +
                                '">' +
                                actionTitle +
                                '</li>');
                        }
                    }
                }
            }
        }

        html.push('</ul>');
        html.push('</div>');

        const htmlString = html.join("");

        document.body.insertAdjacentHTML('beforeend', htmlString);

        const menuElement = document.querySelector("." + menu.id);

        // @ts-ignore
        menu.menuElement = menuElement;

        // @ts-ignore
        menuElement.style["border-radius"] = 4 + "px";
        // @ts-ignore
        menuElement.style.display = 'none';
        // @ts-ignore
        menuElement.style["z-index"] = 300000;
        // @ts-ignore
        menuElement.style.background = "white";
        // @ts-ignore
        menuElement.style.border = "1px solid black";
        // @ts-ignore
        menuElement.style["box-shadow"] = "0 4px 5px 0 gray";
        // @ts-ignore
        menuElement.oncontextmenu = (e) => {
            e.preventDefault();
        };

        // Bind event handlers

        const self = this;

        let lastSubMenu: Menu | null = null;

        if (groups) {

            for (let i = 0, len = groups.length; i < len; i++) {

                const group = groups[i];
                const groupItems = group.items;

                if (groupItems) {

                    for (let j = 0, lenj = groupItems.length; j < lenj; j++) {

                        const item = groupItems[j];
                        const itemSubMenu = item.subMenu;

                        item.itemElement = document.getElementById(item.id);

                        if (!item.itemElement) {
                            console.error("ContextMenu item element not found: " + item.id);
                            continue;
                        }

                        item.itemElement.addEventListener("mouseenter", (event:MouseEvent) => {
                            event.preventDefault();
                            if (item.enabled === false) {
                                return;
                            }
                            const subMenu = item.subMenu;
                            if (!subMenu) {
                                if (lastSubMenu) {
                                    self._hideMenu(lastSubMenu.id);
                                    lastSubMenu = null;
                                }
                                return;
                            }
                            if (lastSubMenu && (lastSubMenu.id !== subMenu.id)) {
                                self._hideMenu(lastSubMenu.id);
                                lastSubMenu = null;
                            }

                            const itemElement = item.itemElement;
                            const subMenuElement = subMenu.menuElement;

                            const itemRect = itemElement.getBoundingClientRect();
                            const menuRect = subMenuElement.getBoundingClientRect();

                            const subMenuWidth = 200; // TODO
                            const showOnLeft = ((itemRect.right + subMenuWidth) > window.innerWidth);

                            if (showOnLeft) {
                                self._showMenu(subMenu.id, itemRect.left - subMenuWidth, itemRect.top - 1);
                            } else {
                                self._showMenu(subMenu.id, itemRect.right - 5, itemRect.top - 1);
                            }

                            lastSubMenu = subMenu;
                        });

                        if (!itemSubMenu) {

                            // Item without sub-menu
                            // clicking item fires the item's action callback

                            item.itemElement.addEventListener("click", (event:MouseEvent) => {
                                event.preventDefault();
                                self.hide();
                                if (!self._context) {
                                    return;
                                }
                                if (item.enabled === false) {
                                    return;
                                }
                                if (item.doAction) {
                                    item.doAction(self._context);
                                }
                            });


                            item.itemElement.addEventListener("mouseenter", (event:MouseEvent) => {
                                event.preventDefault();
                                if (item.enabled === false) {
                                    return;
                                }
                                if (item.doHover) {
                                    item.doHover(self._context);
                                }
                            });

                        }
                    }
                }
            }
        }
    }

    /**
     * @private
     */
    #updateItemsTitles() { // Dynamically updates the title of each Item to the result of Item#getTitle()
        if (!this._context) {
            return;
        }
        for (let i = 0, len = this._itemList.length; i < len; i++) {
            const item = this._itemList[i];
            const itemElement = item.itemElement;
            if (!itemElement) {
                continue;
            }
            const getShown = item.getShown;
            if (!getShown || !getShown(this._context)) {
                continue;
            }
            const title = item.getTitle(this._context);
            if (item.subMenu) {
                itemElement.innerText = title;
            } else {
                itemElement.innerText = title;
            }
        }
    }

    /**
     * @private
     */
    #updateItemsEnabledStatus() { // Enables or disables each Item, depending on the result of Item#getEnabled()
        if (!this._context) {
            return;
        }
        for (let i = 0, len = this._itemList.length; i < len; i++) {
            const item = this._itemList[i];
            const itemElement = item.itemElement;
            if (!itemElement) {
                continue;
            }
            const getEnabled = item.getEnabled;
            if (!getEnabled) {
                continue;
            }
            const getShown = item.getShown;
            if (!getShown) {
                continue;
            }
            const shown = getShown(this._context);
            item.shown = shown;
            if (!shown) {
                itemElement.style.visibility = "hidden";
                itemElement.style.height = "0";
                itemElement.style.padding = "0";
                continue;
            } else {
                itemElement.style.visibility = "visible";
                itemElement.style.height = "auto";
                itemElement.style.padding = null;
            }
            const enabled = getEnabled(this._context);
            item.enabled = enabled;
            if (!enabled) {
                itemElement.classList.add("disabled");
            } else {
                itemElement.classList.remove("disabled");
            }
        }
    }

    /**
     * @private
     */
    _showMenu(menuId: string, pageX: number, pageY: number) { // Shows the given menu, at the specified page coordinates
        const menu = this._menuMap[menuId];
        if (!menu) {
            console.error("Menu not found: " + menuId);
            return;
        }
        if (menu.shown) {
            return;
        }
        const menuElement = menu.menuElement;
        if (menuElement) {
            this._showMenuElement(menuElement, pageX, pageY);
            menu.shown = true;
        }
    }

    /**
     * @private
     */
    _hideMenu(menuId: string) { // Hides the given menu
        const menu = this._menuMap[menuId];
        if (!menu) {
            console.error("Menu not found: " + menuId);
            return;
        }
        if (!menu.shown) {
            return;
        }
        const menuElement = menu.menuElement;
        if (menuElement) {
            this._hideMenuElement(menuElement);
            menu.shown = false;
        }
    }

    /**
     * @private
     */
    _hideAllMenus() {
        for (let i = 0, len = this._menuList.length; i < len; i++) {
            const menu = this._menuList[i];
            this._hideMenu(menu.id);
        }
    }

    /**
     * @private
     */
    _showMenuElement(menuElement: HTMLElement, pageX: number, pageY: number) { // Shows the given menu element, at the specified page coordinates
        menuElement.style.display = 'block';
        const menuHeight = menuElement.offsetHeight;
        const menuWidth = menuElement.offsetWidth;
        if ((pageY + menuHeight) > window.innerHeight) {
            pageY = window.innerHeight - menuHeight;
        }
        if ((pageX + menuWidth) > window.innerWidth) {
            pageX = window.innerWidth - menuWidth;
        }
        // @ts-ignore
        menuElement.style.left = pageX + 'px';
        // @ts-ignore
        menuElement.style.top = pageY + 'px';
    }

    /**
     * @private
     */
    _hideMenuElement(menuElement:HTMLElement) {
        menuElement.style.display = 'none';
    }
}

export {ContextMenu};