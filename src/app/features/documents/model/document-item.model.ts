import { ItemType } from "./item-type.model";
import { Item } from "./item.model";

export interface DocumentItem {
  documentItemId: number;
  itemType: ItemType;
  item: Item;
  itemQuantity: number;
  itemPrice: number;
  itemComment?: string;
  version: number;
}
