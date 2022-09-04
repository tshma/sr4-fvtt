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

const skills = {
    'automatics': 'SR4.SkillAutomatics',
    'computer': 'SR4.SkillComputer',
    'datasearch': 'SR4.SkillDataSearch',
    'hardware': 'SR4.SkillHardware',
    'longarms': 'SR4.SkillLongarms',
    'pistols': 'SR4.SkillPistols',
    'sniper': 'SR4.SkillSniper',
    'software': 'SR4.SkillSoftware',
};

export default {
    Attributes: attributes,
    ATTRIBUTE_TYPES,
    Skills: skills,
    Types: types,
};
