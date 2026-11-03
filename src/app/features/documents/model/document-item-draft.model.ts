import { Item } from "./item.model";

export interface DocumentItemDraft {
  itemType?: string;
  item?: Item;

  itemQuantity?: number;
  itemPrice?: number;

  itemComment?: string;
}