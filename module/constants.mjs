const ATTRIBUTE_TYPES = ["String", "Number", "Boolean", "Formula", "Resource"];
const types = {
    Runner: 'runner',
    NPC: 'npc',
    Critter: 'critter',
    Bioware: 'bioware',
    Cyberware: 'cyberware',
    BlastWeapon: 'blastWeapon',
    MeleeWeapon: 'meleeWeapon',
    RangedWeapon: 'rangedWeapon',
    Spell: 'spell'
};

const attributes = {
    'bod': 'SR4.AttributeBody',
    'agi': 'SR4.AttributeAgility',
    'rea': 'SR4.AttributeReaction',
    'str': 'SR4.AttributeStrength',
    'cha': 'SR4.AttributeCharisma',
    'log': 'SR4.AttributeLogic',
    'int': 'SR4.AttributeIntuition',
    'wil': '"SR4.AttributeWillpower',
    'mag': 'SR4.AttributeMagic',
    'res': 'SR4.AttributeResonance',
    'edg': 'SR4.AttributeEdge',
    'ess': 'SR4.AttributeEssence',
    'init': 'SR4.AttributeInitiative'
}

export default {
    Attributes: attributes,
    ATTRIBUTE_TYPES,
    Types: types,
};
