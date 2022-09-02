import { EntitySheetHelper } from "./helper.mjs";
import Constants from "./constants.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class SR4ActorSheet extends ActorSheet {

  /** @inheritdoc */
  static get defaultOptions() {
    console.log('setting default');
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["shadowrun4", "sheet", "actor"],
      template: "systems/shadowrun4/templates/actor-sheet.html",
      width: 800,
      height: 200,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "attributes"}],
      scrollY: [".base", ".items", ".attributes"],
      dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
    });
  }

  /** @override */
  get template() {
    return `systems/shadowrun4/templates/actor-${this.actor.data.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  getData() {
    const context = super.getData();
    const actorData = context.actor.data; //.toObject(false);
    context.data = actorData.data;
    context.flags = actorData.flags;
    context.dtype = Constants.ATTRIBUTE_TYPES;

    this._prepateItems(context);
    if(actorData.type === Constants.Types.Runner) {
      this._prepareRunnerData(context);
    }

    context.rollData = context.actor.getRollData();
    // context.effect = prepareActiveEffectsCategories(this.actor.effects);
    // EntitySheetHelper.getAttributeData(context.data);
    // context.shorthand = !!game.settings.get("shadowrun4", "macroShorthand");
    // context.systemData = context.data.data;
    // context.dtypes = ATTRIBUTE_TYPES;
    return context;
  }

  _prepateItems(context) {
    const weapons = [], implants = [], spells = [];

    for(let item of context.items) {
      item.img = item.img || DEFAULT_TOKEN;
      if(item.type === Constants.Types.RangedWeapon || item.type === Constants.Types.MeleeWeapon) {
        weapons.push(item);
      } else if(item.type === Constants.Types.Cyberware || item.type === Constants.Types.Bioware) {
        implants.push(item);
      } else if(item.type === Constants.Types.Spell) {
        spells.push(item);
      }
    }

    context.gear = weapons;
    context.implants = implants;
    context.spells = spells;    
  }

  _prepareRunnerData(context) {
    const atts = Object.entries(context.data.attributes);

    for(let [k, v] of atts) {
      v.label = game.i18n.localize(CONFIG.Constants.Attributes[k]) ?? k;
    }
    
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });
  
    // Everything below here is only needed if the sheet is editable
    if ( !this.isEditable ) {
      return;
    }

    // Attribute Management
    html.find(".attributes").on("click", ".attribute-control", EntitySheetHelper.onClickAttributeControl.bind(this));
    html.find(".attributes").on("click", "a.attribute-roll", EntitySheetHelper.onAttributeRoll.bind(this));

    // Item Controls
    html.find(".item-control").click(this._onItemControl.bind(this));
    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));
    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });
    // Item Roll
    html.find(".items .rollable").on("click", this._onItemRoll.bind(this));

    // Add draggable for Macro creation
    html.find(".attributes a.attribute-roll").each((i, a) => {
      a.setAttribute("draggable", true);
      a.addEventListener("dragstart", ev => {
        let dragData = ev.currentTarget.dataset;
        ev.dataTransfer.setData('text/plain', JSON.stringify(dragData));
      }, false);
    });
  }

  /* -------------------------------------------- */

  /**
   * Handle click events for Item control buttons within the Actor Sheet
   * @param event
   * @private
   */
  _onItemControl(event) {
    event.preventDefault();

    // Obtain event data
    const button = event.currentTarget;
    const li = button.closest(".item");
    const item = this.actor.items.get(li?.dataset.itemId);

    // Handle different actions
    switch ( button.dataset.action ) {
      case "create":
        const cls = getDocumentClass("Item");
        return cls.create({name: game.i18n.localize("SR4.ItemNew"), type: "item"}, {parent: this.actor});
      case "edit":
        return item.sheet.render(true);
      case "delete":
        return item.delete();
    }
  }

  /* -------------------------------------------- */

  /**
   * Listen for roll buttons on items.
   * @param {MouseEvent} event    The originating left click event
   */
  _onItemRoll(event) {
    let button = $(event.currentTarget);
    const li = button.parents(".item");
    const item = this.actor.items.get(li.data("itemId"));
    let r = new Roll(button.data('roll'), this.actor.getRollData());
    return r.toMessage({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `<h2>${item.name}</h2><h3>${button.text()}</h3>`
    });
  }

  /* -------------------------------------------- */

  async _onItemCreate(event) {    
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data["type"];

    // Finally, create the item!
    return await Item.create(itemData, {parent: this.actor});
  }

  /** @inheritdoc */
  _getSubmitData(updateData) {
    let formData = super._getSubmitData(updateData);
    formData = EntitySheetHelper.updateAttributes(formData, this.object);
    formData = EntitySheetHelper.updateGroups(formData, this.object);
    return formData;
  }
}
