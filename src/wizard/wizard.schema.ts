import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IUserQuest, IWizard, IWizardHistoryItem, IWizardItem } from '@thefirstspine/types-arena';
import { Document } from 'mongoose';

export type WizardDocument = IWizard & Document;

@Schema()
export class Wizard implements IWizard {
  @Prop()
  id: number;

  @Prop()
  version: 1.0;

  @Prop()
  name: string;

  @Prop()
  items: IWizardItem[];

  @Prop()
  history: IWizardHistoryItem[];

  @Prop()
  purchases: string[];

  @Prop()
  avatar: string;

  @Prop()
  title: string;

  @Prop()
  triumphs: string[];

  @Prop()
  friends: number[];

  @Prop()
  publicRoom: null | 'fr' | 'en';

  @Prop()
  quests: string[];

  @Prop()
  questsProgress: IUserQuest[];
}

export const WizardSchema = SchemaFactory.createForClass(Wizard);
