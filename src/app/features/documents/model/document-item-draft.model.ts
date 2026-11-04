import { ItemType } from "./item-type.model";
import { Item } from "./item.model";

export interface DocumentItemDraft {
  itemType?: ItemType;
  item?: Item;

  itemQuantity?: number;
  itemPrice?: number;

  itemComment?: string;
}