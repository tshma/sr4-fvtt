/**
 * A simple and flexible system for world-building using an arbitrary collection of character and item attributes
 * Author: Atropos
 */

// Import Modules
import { SR4Actor } from "./actor.mjs";
import { SR4Item } from "./item.mjs";
import { SR4ItemSheet } from "./item-sheet.mjs";
import { SR4ActorSheet } from "./actor-sheet.mjs";
import { preloadHandlebarsTemplates } from "./templates.mjs";
import { createShadowrun4Macro } from "./macro.mjs";
import { SR4Token, SR4TokenDocument } from "./token.mjs";
import Constants from "./constants.mjs";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

/**
 * Init hook.
 */
Hooks.once("init", async function() {
  console.log('Initializing Shadowrun4 System');

  game.shadowrun4 = {
    SR4Actor,
    SR4Item,
    useEntity: foundry.utils.isNewerVersion("9", game.version ?? game.data.version)
  };

  /**
   * Set an initiative formula for the system. This will be updated later.
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "(@initiative.ip)d6 + @initiative.score - (@monitors.physical.mod + @monitors.stun.mod)"
  };

  CONFIG.SHADOWRUN4 = Constants;


  // Define custom Document classes
  CONFIG.Actor.documentClass = SR4Actor;
  CONFIG.Item.documentClass = SR4Item;
  CONFIG.Token.documentClass = SR4TokenDocument;
  CONFIG.Token.objectClass = SR4Token;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("shadowrun4", SR4ActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("shadowrun4", SR4ItemSheet, { makeDefault: true });

  // Register system settings
  // game.settings.register("shadowrun4", "macroShorthand", {
  //   name: "SETTINGS.SR4MacroShorthandN",
  //   hint: "SETTINGS.SR4MacroShorthandL",
  //   scope: "world",
  //   type: Boolean,
  //   default: true,
  //   config: true
  // });

  // Register initiative setting.
  // game.settings.register("shadowrun4", "initFormula", {
  //   name: "SETTINGS.SR4InitFormulaN",
  //   hint: "SETTINGS.SR4InitFormulaL",
  //   scope: "world",
  //   type: String,
  //   default: "1d6+6",
  //   config: true,
  //   onChange: formula => _sr4UpdateInit(formula, true)
  // });

  // Retrieve and assign the initiative formula setting.
  // const initFormula = game.settings.get("shadowrun4", "initFormula");
  // _sr4UpdateInit(initFormula);

  /**
   * Update the initiative formula.
   * @param {string} formula - Dice formula to evaluate.
   * @param {boolean} notify - Whether or not to post nofications.
   */
  // function _sr4UpdateInit(formula, notify = false) {
  //   const isValid = Roll.validate(formula);
  //   if ( !isValid ) {
  //     if ( notify ) ui.notifications.error(`${game.i18n.localize("SR4.NotifyInitFormulaInvalid")}: ${formula}`);
  //     return;
  //   }
  //   CONFIG.Combat.initiative.formula = formula;
  // }

  /**
   * Slugify a string.
   */
  // Handlebars.registerHelper('slugify', function(value) {
  //   return value.slugify({strict: true});
  // });

  // Preload template partials
  await preloadHandlebarsTemplates();
});

/**
 * Macrobar hook.
 */
Hooks.on("hotbarDrop", (bar, data, slot) => createShadowrun4Macro(data, slot));

/**
 * Adds the actor template context menu.
 */
// Hooks.on("getActorDirectoryEntryContext", (html, options) => {
//   const idAttr = game.shadowrun4.useEntity ? "entityId" : "documentId";
//   // Define an actor as a template.
//   options.push({
//     name: game.i18n.localize("SR4.DefineTemplate"),
//     icon: '<i class="fas fa-stamp"></i>',
//     condition: li => {
//       const actor = game.actors.get(li.data(idAttr));
//       return !actor.isTemplate;
//     },
//     callback: li => {
//       const actor = game.actors.get(li.data(idAttr));
//       actor.setFlag("shadowrun4", "isTemplate", true);
//     }
//   });

//   // Undefine an actor as a template.
//   options.push({
//     name: game.i18n.localize("SR4.UnsetTemplate"),
//     icon: '<i class="fas fa-times"></i>',
//     condition: li => {
//       const actor = game.actors.get(li.data(idAttr));
//       return actor.isTemplate;
//     },
//     callback: li => {
//       const actor = game.actors.get(li.data(idAttr));
//       actor.setFlag("shadowrun4", "isTemplate", false);
//     }
//   });
// });

/**
 * Adds the item template context menu.
 */
// Hooks.on("getItemDirectoryEntryContext", (html, options) => {
//   const idAttr = game.shadowrun4.useEntity ? "entityId" : "documentId";
//   // Define an item as a template.
//   options.push({
//     name: game.i18n.localize("SR4.DefineTemplate"),
//     icon: '<i class="fas fa-stamp"></i>',
//     condition: li => {
//       const item = game.items.get(li.data(idAttr));
//       return !item.isTemplate;
//     },
//     callback: li => {
//       const item = game.items.get(li.data(idAttr));
//       item.setFlag("shadowrun4", "isTemplate", true);
//     }
//   });

//   // Undefine an item as a template.
//   options.push({
//     name: game.i18n.localize("SR4.UnsetTemplate"),
//     icon: '<i class="fas fa-times"></i>',
//     condition: li => {
//       const item = game.items.get(li.data(idAttr));
//       return item.isTemplate;
//     },
//     callback: li => {
//       const item = game.items.get(li.data(idAttr));
//       item.setFlag("shadowrun4", "isTemplate", false);
//     }
//   });
// });
