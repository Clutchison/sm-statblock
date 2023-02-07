import mongoose from "mongoose";
import { SIZE, Size } from "../size";
import { ALIGNMENT, Alignment } from "../alignment/alignment.enum";
import { Stats } from '../stats/stats.model';
import { SKILL, Skill } from '../skill';
import { CHALLENGE_RATING, ChallengeRating } from './challenge-rating';
import { SenseRanges } from '../sense';
import { SpeedConfig } from '../speed';
import { ACProps } from '../ac';
import { HPProps } from '../hp';
import { MonsterRecord } from './monster.record';
import { InvalidMonsterError } from '../errs/invalid-monster-error';

// todo: Require appropriate properties
export type MonsterInterface = {
  name: string;
  description?: string;
  size?: Size;
  type?: string;
  alignment?: Alignment;
  ac?: number;
  hpMax: number;
  hpCurrent: number;
  hpTemp?: number;
  speed?: number;
  stats?: Stats;
  skills?: Skill[];
  vulnerablities?: string;
  resistances?: string;
  immunities?: string;
  senses?: SenseRanges;
  languages?: string[];
  cr?: ChallengeRating;
}

export interface MonsterDoc extends mongoose.Document, MonsterInterface {
  _doc: MonsterDoc;
}

interface MonsterModelInterface extends mongoose.Model<MonsterDoc> {
  record: typeof MonsterRecord;
  build(monster: MonsterInterface): MonsterDoc;
}

const monsterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: false,
  },
  size: {
    type: String,
    enum: Object.values(SIZE),
    required: false,
  },
  type: {
    type: String,
    required: false,
  },
  alignment: {
    type: String,
    enum: Object.values(ALIGNMENT),
    required: false,
  },
  ac: {
    type: Number,
    min: ACProps.min,
    max: ACProps.max,
    required: false,
  },
  hpMax: {
    type: Number,
    min: 0,
    max: HPProps.max,
    required: true,
  },
  // todo: validate current hp less than max hp
  hpCurrent: {
    type: Number,
    min: HPProps.min,
    max: HPProps.max,
    required: true,
  },
  hpTemp: {
    type: Number,
    min: 0,
    max: HPProps.max,
    required: false,
  },
  speed: {
    type: Number,
    min: SpeedConfig.min,
    max: SpeedConfig.max,
    required: false,
  },
  // todo: Stats
  skills: {
    type: [String],
    enum: Object.values(SKILL),
    required: false,
  },
  vulnerabilities: {
    type: String,
    required: false,
  },
  resistances: {
    type: String,
    required: false,
  },
  immunities: {
    type: String,
    required: false,
  },
  // todo: Senses
  languages: {
    type: [String],
    required: false,
  },
  cr: {
    type: String,
    enum: Object.values(CHALLENGE_RATING),
    required: false,
  },
}, { optimisticConcurrency: true });

monsterSchema.pre('save', function (next) {
  this.increment();
  return next();
});

monsterSchema.pre('validate', function (next) {
  if (this.hpCurrent > this.hpMax) {
    next(new InvalidMonsterError(
      'Current HP (' + this.hpCurrent + ')' +
      ' cannot be higher than Max HP (' + this.hpMax + ')'));
  } else {
    next();
  }
});

monsterSchema.statics.build = (attr: MonsterInterface) => { return new Monster(attr) };
export const Monster = mongoose.model<MonsterDoc, MonsterModelInterface>('monster', monsterSchema);
Monster.record = MonsterRecord;