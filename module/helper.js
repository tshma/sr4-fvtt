import { ATTRIBUTE_TYPES } from "./constants.js";

export function EntitySheetHelper() {};

EntitySheetHelper.getAttributeData = function(data) {
    // Determine attribute type.
    for ( let attr of Object.values(data.data.attributes) ) {
      if ( attr.dtype ) {
        attr.isCheckbox = attr.dtype === "Boolean";
        attr.isResource = attr.dtype === "Resource";
        attr.isFormula = attr.dtype === "Formula";
      }
    }

    // Initialize ungrouped attributes for later.
    data.data.ungroupedAttributes = {};

    // Build an array of sorted group keys.
    const groups = data.data.groups || {};
    let groupKeys = Object.keys(groups).sort((a, b) => {
      let aSort = groups[a].label ?? a;
      let bSort = groups[b].label ?? b;
      return aSort.localeCompare(bSort);
    });

    // Iterate over the sorted groups to add their attributes.
    for ( let key of groupKeys ) {
      let group = data.data.attributes[key] || {};

      // Initialize the attributes container for this group.
      if ( !data.data.groups[key]['attributes'] ) data.data.groups[key]['attributes'] = {};

      // Sort the attributes within the group, and then iterate over them.
      Object.keys(group).sort((a, b) => a.localeCompare(b)).forEach(attr => {
        // Avoid errors if this is an invalid group.
        if ( typeof group[attr] != "object" || !group[attr]) return;
        // For each attribute, determine whether it's a checkbox or resource, and then add it to the group's attributes list.
        group[attr]['isCheckbox'] = group[attr]['dtype'] === 'Boolean';
        group[attr]['isResource'] = group[attr]['dtype'] === 'Resource';
        group[attr]['isFormula'] = group[attr]['dtype'] === 'Formula';
        data.data.groups[key]['attributes'][attr] = group[attr];
      });
    }

    // Sort the remaining attributes attributes.
    Object.keys(data.data.attributes).filter(a => !groupKeys.includes(a)).sort((a, b) => a.localeCompare(b)).forEach(key => {
      data.data.ungroupedAttributes[key] = data.data.attributes[key];
    });

    // Modify attributes on items.
    if ( data.items ) {
      data.items.forEach(item => {
        // Iterate over attributes.
        for ( let [k, v] of Object.entries(item.data.attributes) ) {
          // Grouped attributes.
          if ( !v.dtype ) {
            for ( let [gk, gv] of Object.entries(v) ) {
              if ( gv.dtype ) {
                // Add label fallback.
                if ( !gv.label ) gv.label = gk;
                // Add formula bool.
                if ( gv.dtype === "Formula" ) {
                  gv.isFormula = true;
                }
                else {
                  gv.isFormula = false;
                }
              }
            }
          }
          // Ungrouped attributes.
          else {
            // Add label fallback.
            if ( !v.label ) v.label = k;
            // Add formula bool.
            if ( v.dtype === "Formula" ) {
              v.isFormula = true;
            }
            else {
              v.isFormula = false;
            }
          }
        }
      });
    }
  }

  /* -------------------------------------------- */

  /** @override */
EntitySheetHelper.onSubmit = function(event) {
    // Closing the form/sheet will also trigger a submit, so only evaluate if this is an event.
    if ( event.currentTarget ) {
      // Exit early if this isn't a named attribute.
      if ( (event.currentTarget.tagName.toLowerCase() === 'input') && !event.currentTarget.hasAttribute('name')) {
        return false;
      }

      let attr = false;
      // If this is the attribute key, we need to make a note of it so that we can restore focus when its recreated.
      const el = event.currentTarget;
      if ( el.classList.contains("attribute-key") ) {
        let val = el.value;
        let oldVal = el.closest(".attribute").dataset.attribute;
        let attrError = false;
        // Prevent attributes that already exist as groups.
        let groups = document.querySelectorAll('.group-key');
        for ( let i = 0; i < groups.length; i++ ) {
          if (groups[i].value === val) {
            ui.notifications.error(game.i18n.localize("SIMPLE.NotifyAttrDuplicate") + ` (${val})`);
            el.value = oldVal;
            attrError = true;
            break;
          }
        }
        // Handle value and name replacement otherwise.
        if ( !attrError ) {
          oldVal = oldVal.includes('.') ? oldVal.split('.')[1] : oldVal;
          attr = $(el).attr('name').replace(oldVal, val);
        }
      }

      // Return the attribute key if set, or true to confirm the submission should be triggered.
      return attr ? attr : true;
    }
  }

  /* -------------------------------------------- */

  /**
   * Listen for click events on an attribute control to modify the composition of attributes in the sheet
   * @param {MouseEvent} event    The originating left click event
   */
EntitySheetHelper.onClickAttributeControl = async function (event) {
    event.preventDefault();
    const a = event.currentTarget;
    const action = a.dataset.action;
    switch ( action ) {
      case "create":
        return EntitySheetHelper.createAttribute(event, this);
      case "delete":
        return EntitySheetHelper.deleteAttribute(event, this);
    }
  }

  /* -------------------------------------------- */

  /**
   * Listen for click events and modify attribute groups.
   * @param {MouseEvent} event    The originating left click event
   */
EntitySheetHelper.onClickAttributeGroupControl = async function (event) {
    event.preventDefault();
    const a = event.currentTarget;
    const action = a.dataset.action;
    switch ( action ) {
      case "create-group":
        return EntitySheetHelper.createAttributeGroup(event, this);
      case "delete-group":
        return EntitySheetHelper.deleteAttributeGroup(event, this);
    }
  }

  /* -------------------------------------------- */

  /**
   * Listen for the roll button on attributes.
   * @param {MouseEvent} event    The originating left click event
   */
EntitySheetHelper.onAttributeRoll = function(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const label = button.closest(".attribute").querySelector(".attribute-label")?.value;
    const chatLabel = label ?? button.parentElement.querySelector(".attribute-key").value;
    const shorthand = game.settings.get("shadowrun4", "macroShorthand");

    // Use the actor for rollData so that formulas are always in reference to the parent actor.
    const rollData = this.actor.getRollData();
    let formula = button.closest(".attribute").querySelector(".attribute-value")?.value;

    // If there's a formula, attempt to roll it.
    if ( formula ) {
      let replacement = null;
      if ( formula.includes('@item.') && this.item ) {
        let itemName = this.item.name.slugify({strict: true}); // Get the machine safe version of the item name.
        replacement = !!shorthand ? `@items.${itemName}.` : `@items.${itemName}.attributes.`;
        formula = formula.replace('@item.', replacement);
      }

      // Create the roll and the corresponding message
      let r = new Roll(formula, rollData);
      return r.toMessage({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `${chatLabel}`
      });
    }
  }

  /* -------------------------------------------- */

  /**
   * Return HTML for a new attribute to be applied to the form for submission.
   *
   * @param {Object} items  Keyed object where each item has a "type" and "value" property.
   * @param {string} index  Numeric index or key of the new attribute.
   * @param {string|boolean} group String key of the group, or false.
   *
   * @returns {string} Html string.
   */
EntitySheetHelper.getAttributeHtml = function (items, index, group = false) {
    // Initialize the HTML.
    let result = '<div style="display: none;">';
    // Iterate over the supplied keys and build their inputs (including whether or not they need a group key).
    for (let [key, item] of Object.entries(items)) {
      result = result + `<input type="${item.type}" name="data.attributes${group ? '.' + group : '' }.attr${index}.${key}" value="${item.value}"/>`;
    }
    // Close the HTML and return.
    return result + '</div>';
  }

  /* -------------------------------------------- */

  /**
   * Validate whether or not a group name can be used.
   * @param {string} groupName    The candidate group name to validate
   * @param {Document} document   The Actor or Item instance within which the group is being defined
   * @returns {boolean}
   */
EntitySheetHelper.validateGroup = function (groupName, document) {
    let groups = Object.keys(document.data.data.groups || {});
    let attributes = Object.keys(document.data.data.attributes).filter(a => !groups.includes(a));

    // Check for duplicate group keys.
    if ( groups.includes(groupName) ) {
      ui.notifications.error(game.i18n.localize("SIMPLE.NotifyGroupDuplicate") + ` (${groupName})`);
      return false;
    }

    // Check for group keys that match attribute keys.
    if ( attributes.includes(groupName) ) {
      ui.notifications.error(game.i18n.localize("SIMPLE.NotifyGroupAttrDuplicate") + ` (${groupName})`);
      return false;
    }

    // Check for reserved group names.
    if ( ["attr", "attributes"].includes(groupName) ) {
      ui.notifications.error(game.i18n.format("SIMPLE.NotifyGroupReserved", {key: groupName}));
      return false;
    }

    // Check for whitespace or periods.
    if ( groupName.match(/[\s|\.]/i) ) {
      ui.notifications.error(game.i18n.localize("SIMPLE.NotifyGroupAlphanumeric"));
      return false;
    }
    return true;
  }

  /* -------------------------------------------- */

  /**
   * Create new attributes.
   * @param {MouseEvent} event    The originating left click event
   * @param {Object} app          The form application object.
   * @private
   */
EntitySheetHelper.createAttribute = async function (event, app) {
    const a = event.currentTarget;
    const group = a.dataset.group;
    let dtype = a.dataset.dtype;
    const attrs = app.object.data.data.attributes;
    const groups = app.object.data.data.groups;
    const form = app.form;

    // Determine the new attribute key for ungrouped attributes.
    let objKeys = Object.keys(attrs).filter(k => !Object.keys(groups).includes(k));
    let nk = Object.keys(attrs).length + 1;
    let newValue = `attr${nk}`;
    let newKey = document.createElement("div");
    while ( objKeys.includes(newValue) ) {
      ++nk;
      newValue = `attr${nk}`;
    }

    // Build options for construction HTML inputs.
    let htmlItems = {
      key: {
        type: "text",
        value: newValue
      }
    };

    // Grouped attributes.
    if ( group ) {
      objKeys = attrs[group] ? Object.keys(attrs[group]) : [];
      nk = objKeys.length + 1;
      newValue = `attr${nk}`;
      while ( objKeys.includes(newValue) ) {
        ++nk;
        newValue =  `attr${nk}`;
      }

      // Update the HTML options used to build the new input.
      htmlItems.key.value = newValue;
      htmlItems.group = {
        type: "hidden",
        value: group
      };
      htmlItems.dtype = {
        type: "hidden",
        value: dtype
      };
    }
    // Ungrouped attributes.
    else {
      // Choose a default dtype based on the last attribute, fall back to "String".
      if (!dtype) {
        let lastAttr = document.querySelector('.attributes > .attributes-group .attribute:last-child .attribute-dtype')?.value;
        dtype = lastAttr ? lastAttr : "String";
        htmlItems.dtype = {
          type: "hidden",
          value: dtype
        };
      }
    }

    // Build the form elements used to create the new grouped attribute.
    newKey.innerHTML = EntitySheetHelper.getAttributeHtml(htmlItems, nk, group);

    // Append the form element and submit the form.
    newKey = newKey.children[0];
    form.appendChild(newKey);
    await app._onSubmit(event);
  }

  /**
   * Delete an attribute.
   * @param {MouseEvent} event    The originating left click event
   * @param {Object} app          The form application object.
   * @private
   */
EntitySheetHelper.deleteAttribute = async function (event, app) {
    const a = event.currentTarget;
    const li = a.closest(".attribute");
    if ( li ) {
      li.parentElement.removeChild(li);
      await app._onSubmit(event);
    }
  }

  /* -------------------------------------------- */

  /**
   * Create new attribute groups.
   * @param {MouseEvent} event    The originating left click event
   * @param {Object} app          The form application object.
   * @private
   */
EntitySheetHelper.createAttributeGroup = async function (event, app) {
    const a = event.currentTarget;
    const form = app.form;
    let newValue = $(a).siblings('.group-prefix').val();
    // Verify the new group key is valid, and use it to create the group.
    if ( newValue.length > 0 && EntitySheetHelper.validateGroup(newValue, app.object) ) {
      let newKey = document.createElement("div");
      newKey.innerHTML = `<input type="text" name="data.groups.${newValue}.key" value="${newValue}"/>`;
      // Append the form element and submit the form.
      newKey = newKey.children[0];
      form.appendChild(newKey);
      await app._onSubmit(event);
    }
  }

  /* -------------------------------------------- */

  /**
   * Delete an attribute group.
   * @param {MouseEvent} event    The originating left click event
   * @param {Object} app          The form application object.
   * @private
   */
EntitySheetHelper.deleteAttributeGroup = async function (event, app) {
    const a = event.currentTarget;
    let groupHeader = a.closest(".group-header");
    let groupContainer = groupHeader.closest(".group");
    let group = $(groupHeader).find('.group-key');
    // Create a dialog to confirm group deletion.
    new Dialog({
      title: game.i18n.localize("SIMPLE.DeleteGroup"),
      content: `${game.i18n.localize("SIMPLE.DeleteGroupContent")} <strong>${group.val()}</strong>`,
      buttons: {
        confirm: {
          icon: '<i class="fas fa-trash"></i>',
          label: game.i18n.localize("Yes"),
          callback: async () => {
            groupContainer.parentElement.removeChild(groupContainer);
            await app._onSubmit(event);
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize("No"),
        }
      }
    }).render(true);
  }

  /* -------------------------------------------- */

  /**
   * Update attributes when updating an actor object.
   * @param {object} formData       The form data object to modify keys and values for.
   * @param {Document} document     The Actor or Item document within which attributes are being updated
   * @returns {object}              The updated formData object.
   */
EntitySheetHelper.updateAttributes = function (formData, document) {
    let groupKeys = [];

    // Handle the free-form attributes list
    const formAttrs = foundry.utils.expandObject(formData)?.data?.attributes || {};
    const attributes = Object.values(formAttrs).reduce((obj, v) => {
      let attrs = [];
      let group = null;
      // Handle attribute keys for grouped attributes.
      if ( !v["key"] ) {
        attrs = Object.keys(v);
        attrs.forEach(attrKey => {
          group = v[attrKey]['group'];
          groupKeys.push(group);
          let attr = v[attrKey];
          let k = v[attrKey]["key"] ? v[attrKey]["key"].trim() : attrKey.trim();
          if ( /[\s\.]/.test(k) )  return ui.notifications.error("Attribute keys may not contain spaces or periods");
          delete attr["key"];
          // Add the new attribute if it's grouped, but we need to build the nested structure first.
          if ( !obj[group] ) {
            obj[group] = {};
          }
          obj[group][k] = attr;
        });
      }
      // Handle attribute keys for ungrouped attributes.
      else {
        let k = v["key"].trim();
        if ( /[\s\.]/.test(k) )  return ui.notifications.error("Attribute keys may not contain spaces or periods");
        delete v["key"];
        // Add the new attribute only if it's ungrouped.
        if ( !group ) {
          obj[k] = v;
        }
      }
      return obj;
    }, {});

    // Remove attributes which are no longer used
    for ( let k of Object.keys(document.data.data.attributes) ) {
      if ( !attributes.hasOwnProperty(k) ) attributes[`-=${k}`] = null;
    }

    // Remove grouped attributes which are no longer used.
    for ( let group of groupKeys) {
      if ( document.data.data.attributes[group] ) {
        for ( let k of Object.keys(document.data.data.attributes[group]) ) {
          if ( !attributes[group].hasOwnProperty(k) ) attributes[group][`-=${k}`] = null;
        }
      }
    }

    // Re-combine formData
    formData = Object.entries(formData).filter(e => !e[0].startsWith("data.attributes")).reduce((obj, e) => {
      obj[e[0]] = e[1];
      return obj;
    }, {_id: document.id, "data.attributes": attributes});

    return formData;
  }

  /* -------------------------------------------- */

  /**
   * Update attribute groups when updating an actor object.
   * @param {object} formData       The form data object to modify keys and values for.
   * @param {Document} document     The Actor or Item document within which attributes are being updated
   * @returns {object}              The updated formData object.
   */
EntitySheetHelper.updateGroups = function(formData, document) {
    // Handle the free-form groups list
    const formGroups = expandObject(formData).data.groups || {};
    const documentGroups = Object.keys(document.data.data.groups || {});
    const groups = Object.values(formGroups).reduce((obj, v) => {
      // If there are duplicate groups, collapse them.
      if ( Array.isArray(v["key"]) ) {
        v["key"] = v["key"][0];
      }
      // Trim and clean up.
      let k = v["key"].trim();
      // Validate groups.
      let isValidGroup = true;
      // Skip validation for existing/duplicate groups since they're collapsed above.
      if ( !documentGroups.includes(k) ) {
        isValidGroup = this.validateGroup(k, document);
      }
      // Delete the key and add the group to the reducer if valid.
      delete v["key"];
      if (isValidGroup)  obj[k] = v;
      return obj;
    }, {});

    // Remove groups which are no longer used
    if (groups) {
      for ( let k of Object.keys(document.data.data.groups)) {
        if ( !groups.hasOwnProperty(k) ) groups[`-=${k}`] = null;
      }
    }

    // Re-combine formData
    formData = Object.entries(formData).filter(e => !e[0].startsWith("data.groups")).reduce((obj, e) => {
      obj[e[0]] = e[1];
      return obj;
    }, {_id: document.id, "data.groups": groups});
    return formData;
  }

  /* -------------------------------------------- */

  /**
   * @see ClientDocumentMixin.createDialog
   */
EntitySheetHelper.createDialog = async function(data={}, options={}) {

    // Collect data
    const documentName = this.metadata.name;
    const folders = game.folders.filter(f => (f.data.type === documentName) && f.displayed);
    const label = game.i18n.localize(this.metadata.label);
    const title = game.i18n.format("DOCUMENT.Create", {type: label});

    // Identify the template Actor types
    const collection = game.collections.get(this.documentName);
    const templates = collection.filter(a => a.getFlag("shadowrun4", "isTemplate"));
    const defaultType = this.metadata.types[0];
    const types = {
      [defaultType]: game.i18n.localize("SIMPLE.NoTemplate")
    }
    for ( let a of templates ) {
      types[a.id] = a.name;
    }

    // Render the document creation form
    const useEntity = game.shadowrun4.useEntity;
    const template = `templates/sidebar/${useEntity ? "entity" : "document" }-create.html`;
    const html = await renderTemplate(template, {
      name: data.name || game.i18n.format("DOCUMENT.New", {type: label}),
      folder: data.folder,
      folders: folders,
      hasFolders: folders.length > 1,
      type: data.type || templates[0]?.id || "",
      types: types,
      hasTypes: true
    });

    // Render the confirmation dialog window
    return Dialog.prompt({
      title: title,
      content: html,
      label: title,
      callback: html => {

        // Get the form data
        const form = html[0].querySelector("form");
        const fd = new FormDataExtended(form);
        let createData = fd.toObject();

        // Merge with template data
        const template = collection.get(form.type.value);
        if ( template ) {
          createData = foundry.utils.mergeObject(template.toObject(), createData);
          createData.type = template.data.type;
          delete createData.flags.shadowrun4.isTemplate;
        }

        // Merge provided override data
        createData = foundry.utils.mergeObject(createData, data);
        return this.create(createData, {renderSheet: true});
      },
      rejectClose: false,
      options: options
    });
  }

  /* -------------------------------------------- */

  /**
   * Ensure the resource values are within the specified min and max.
   * @param {object} attrs  The Document's attributes.
   */
EntitySheetHelper.clampResourceValues = function (attrs) {
    const flat = foundry.utils.flattenObject(attrs);
    for ( const [attr, value] of Object.entries(flat) ) {
      const parts = attr.split(".");
      if ( parts.pop() !== "value" ) continue;
      const current = foundry.utils.getProperty(attrs, parts.join("."));
      if ( current?.dtype !== "Resource" ) continue;
      foundry.utils.setProperty(attrs, attr, Math.clamped(value, current.min || 0, current.max || 0));
    }
  }
